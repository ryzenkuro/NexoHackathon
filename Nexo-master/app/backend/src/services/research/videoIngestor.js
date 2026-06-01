import { execFile } from 'child_process';
import { promisify } from 'util';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { saveMediaBuffer, saveResearchJson } from '../storage/mediaStore.js';
import { instagramVideoSources } from '../../data/instagramVideoSources.js';

const execFileAsync = promisify(execFile);
const HF_ROWS_URL =
  'https://datasets-server.huggingface.co/rows?dataset=liangyuch/ttcc-smoke-100&config=default&split=train';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeTitle(value, fallback = 'Untitled video') {
  return String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, 180) || fallback;
}

function sanitizeText(value, fallback, maxLength = 180) {
  return String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, maxLength) || fallback;
}

function getContentLength(headers) {
  const value = headers.get('content-length');
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchBuffer(url, { headers = {}, maxBytes }) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} saat download media`);
  }

  const length = getContentLength(response.headers);
  if (maxBytes && length && length > maxBytes) {
    throw new Error(`media terlalu besar (${length} bytes)`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (maxBytes && bytes.length > maxBytes) {
    throw new Error(`media terlalu besar (${bytes.length} bytes)`);
  }

  return {
    bytes,
    contentType: response.headers.get('content-type') || 'application/octet-stream',
  };
}

async function uploadRemoteMedia({
  url,
  headers,
  platform,
  label,
  contentType,
  extension,
  maxBytes,
}) {
  const downloaded = await fetchBuffer(url, { headers, maxBytes });
  return saveMediaBuffer({
    platform,
    label,
    bytes: downloaded.bytes,
    contentType: contentType || downloaded.contentType,
    extension,
  });
}

async function upsertTrendingContent(row) {
  const { data: existing, error: selectError } = await supabase
    .from('trending_contents')
    .select('id')
    .eq('url', row.url)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { data, error } = await supabase
      .from('trending_contents')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return { action: 'updated', id: data.id };
  }

  const { data, error } = await supabase
    .from('trending_contents')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;
  return { action: 'inserted', id: data.id };
}

async function getRelatedTrends(platform) {
  const trendPlatform = platform === 'TikTok' ? 'TikTok Shop' : platform;
  const { data, error } = await supabase
    .from('trends')
    .select('id,name,category,platform')
    .eq('platform', trendPlatform)
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return data || [];
}

function pickRelatedTrend(trends, index) {
  if (!trends.length) return null;
  return trends[index % trends.length]?.id || null;
}

function compactEngagement({ likes, comments, shares, views }) {
  const denominator = Math.max(views, 1);
  const score = ((likes + comments + shares) / denominator) * 100;
  return Number(score.toFixed(2));
}

function estimateViews({ likes, comments, shares }) {
  return Math.max(
    likes * 18,
    comments * 120,
    shares * 22,
    likes + comments + shares,
    1000
  );
}

async function fetchTikTokCreativeRows(limit) {
  const response = await fetch(`${HF_ROWS_URL}&offset=0&length=${limit}`, {
    headers: { 'user-agent': 'NexoResearchBot/1.0' },
  });
  if (!response.ok) throw new Error(`HF dataset gagal: HTTP ${response.status}`);
  const json = await response.json();
  return (json.rows || []).map((item) => item.row).filter(Boolean);
}

function getTikTokSourceUrl(row) {
  if (row.landing_page && row.landing_page.length <= 500) return row.landing_page;
  if (row.vid) return `https://ads.tiktok.com/business/creativecenter/topads/${row.vid}`;
  if (row.ad_id) return `https://ads.tiktok.com/business/creativecenter/topads/${row.ad_id}`;
  return row.video_url_720p;
}

async function ingestTikTokCreativeCenter({ limit = 50, maxVideoBytes }) {
  const rows = await fetchTikTokCreativeRows(limit);
  const trends = await getRelatedTrends('TikTok');
  const results = [];

  for (const [index, row] of rows.entries()) {
    try {
      const title = sanitizeTitle(row.ad_title, `TikTok Creative Center video ${index + 1}`);
      const sourceUrl = getTikTokSourceUrl(row);
      const videoSourceUrl = row.video_local_path?.src || row.video_url_720p;
      const coverSourceUrl = row.cover_local_path?.src || row.cover_url;

      if (!videoSourceUrl || !coverSourceUrl) {
        results.push({ action: 'skipped', platform: 'TikTok', title, reason: 'video/cover kosong' });
        continue;
      }

      const [video, thumbnail, raw] = await Promise.all([
        uploadRemoteMedia({
          url: videoSourceUrl,
          platform: 'TikTok',
          label: title,
          contentType: 'video/mp4',
          extension: 'mp4',
          maxBytes: maxVideoBytes,
        }),
        uploadRemoteMedia({
          url: coverSourceUrl,
          platform: 'TikTok',
          label: `${title}-cover`,
          contentType: 'image/jpeg',
          extension: 'jpg',
          maxBytes: 8 * 1024 * 1024,
        }),
        saveResearchJson({
          platform: 'TikTok',
          type: 'raw-video',
          label: title,
          payload: row,
          sourceUrl,
        }),
      ]);

      const likes = toNumber(row.like_cnt);
      const comments = toNumber(row.comments_cnt);
      const shares = toNumber(row.shares_cnt);
      const views = estimateViews({ likes, comments, shares });
      const db = await upsertTrendingContent({
        title,
        creator: sanitizeText(row.brand_name || row.source, 'TikTok Creative Center'),
        platform: 'TikTok',
        views,
        likes,
        comments,
        engagement: compactEngagement({ likes, comments, shares, views }),
        thumbnail: thumbnail.url,
        product_relevance: true,
        duration: Math.round(toNumber(row.duration, 0)),
        url: sourceUrl,
        video_url: video.url,
        related_trend_id: pickRelatedTrend(trends, index),
        raw_payload: {
          source: 'huggingface:liangyuch/ttcc-smoke-100',
          raw_r2_url: raw.url,
          original_landing_page: row.landing_page || null,
          original_video_url: row.video_url_720p || null,
          original_cover_url: row.cover_url || null,
          keyword_list: row.keyword_list || [],
          countries_delivered: row.countries_delivered || [],
        },
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      results.push({ ...db, platform: 'TikTok', title, video_url: video.url });
    } catch (error) {
      results.push({
        action: 'skipped',
        platform: 'TikTok',
        title: row.ad_title || `row-${index}`,
        reason: error.message,
      });
    }
  }

  return results;
}

async function getInstagramInfo(url, timeoutMs = 45000) {
  const { stdout } = await execFileAsync(
    'python',
    ['-m', 'yt_dlp', '--dump-json', '--skip-download', url],
    {
      timeout: timeoutMs,
      maxBuffer: 25 * 1024 * 1024,
    }
  );
  return JSON.parse(stdout);
}

function pickInstagramVideo(info) {
  if (info.url && info.ext === 'mp4') {
    return {
      url: info.url,
      headers: info.http_headers || {},
      width: info.width,
      height: info.height,
    };
  }

  const formats = (info.formats || [])
    .filter((format) => format.ext === 'mp4' && format.vcodec !== 'none' && format.url)
    .sort((a, b) => toNumber(b.height) - toNumber(a.height));
  const picked = formats[0];
  if (!picked) return null;

  return {
    url: picked.url,
    headers: picked.http_headers || info.http_headers || {},
    width: picked.width,
    height: picked.height,
  };
}

async function ingestInstagramReels({ limit = 50, maxVideoBytes }) {
  const sources = instagramVideoSources.slice(0, limit);
  const trends = await getRelatedTrends('Instagram');
  const results = [];

  for (const [index, source] of sources.entries()) {
    try {
      if (source.videoUrl) {
        const title = sanitizeTitle(source.title || source.productHint, source.productHint);
        const [video, thumbnail, raw] = await Promise.all([
          uploadRemoteMedia({
            url: source.videoUrl,
            platform: 'Instagram',
            label: title,
            contentType: 'video/mp4',
            extension: 'mp4',
            maxBytes: maxVideoBytes,
          }),
          source.thumbnailUrl
            ? uploadRemoteMedia({
                url: source.thumbnailUrl,
                platform: 'Instagram',
                label: `${title}-cover`,
                contentType: 'image/jpeg',
                extension: 'jpg',
                maxBytes: 8 * 1024 * 1024,
              })
            : Promise.resolve({ url: null }),
          saveResearchJson({
            platform: 'Instagram',
            type: 'raw-video',
            label: title,
            payload: source,
            sourceUrl: source.url,
          }),
        ]);

        const likes = toNumber(source.likes);
        const comments = toNumber(source.comments);
        const views = toNumber(source.views, estimateViews({ likes, comments, shares: 0 }));
        const db = await upsertTrendingContent({
          title,
          creator: sanitizeText(source.creator, 'Instagram creator'),
          platform: 'Instagram',
          views,
          likes,
          comments,
          engagement: compactEngagement({ likes, comments, shares: 0, views }),
          thumbnail: thumbnail.url,
          product_relevance: true,
          duration: Math.round(toNumber(source.duration, 0)),
          url: source.url,
          video_url: video.url,
          related_trend_id: pickRelatedTrend(trends, index),
          raw_payload: {
            source: 'instagram-downloader-embed',
            raw_r2_url: raw.url,
            product_hint: source.productHint,
            category: source.category,
            source_page: source.sourcePage || null,
            provider_video_id: source.providerVideoId || null,
          },
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        results.push({ ...db, platform: 'Instagram', title, video_url: video.url });
        continue;
      }

      const info = await getInstagramInfo(source.url);
      const duration = toNumber(info.duration);
      if (duration > 180) {
        results.push({
          action: 'skipped',
          platform: 'Instagram',
          title: source.url,
          reason: `durasi terlalu panjang (${Math.round(duration)}s)`,
        });
        continue;
      }

      const videoSource = pickInstagramVideo(info);
      if (!videoSource) {
        results.push({
          action: 'skipped',
          platform: 'Instagram',
          title: source.url,
          reason: 'format mp4 tidak tersedia',
        });
        continue;
      }

      const title = sanitizeTitle(info.title || info.description || source.productHint, source.productHint);
      const [video, thumbnail, raw] = await Promise.all([
        uploadRemoteMedia({
          url: videoSource.url,
          headers: videoSource.headers,
          platform: 'Instagram',
          label: title,
          contentType: 'video/mp4',
          extension: 'mp4',
          maxBytes: maxVideoBytes,
        }),
        info.thumbnail
          ? uploadRemoteMedia({
              url: info.thumbnail,
              headers: info.http_headers || {},
              platform: 'Instagram',
              label: `${title}-cover`,
              contentType: 'image/jpeg',
              extension: 'jpg',
              maxBytes: 8 * 1024 * 1024,
            })
          : Promise.resolve({ url: null }),
        saveResearchJson({
          platform: 'Instagram',
          type: 'raw-video',
          label: title,
          payload: info,
          sourceUrl: source.url,
        }),
      ]);

      const likes = toNumber(info.like_count);
      const comments = toNumber(info.comment_count);
      const views = toNumber(info.view_count, estimateViews({ likes, comments, shares: 0 }));
      const db = await upsertTrendingContent({
        title,
        creator: info.uploader || info.channel || 'Instagram creator',
        platform: 'Instagram',
        views,
        likes,
        comments,
        engagement: compactEngagement({ likes, comments, shares: 0, views }),
        thumbnail: thumbnail.url,
        product_relevance: true,
        duration: Math.round(duration),
        url: source.url,
        video_url: video.url,
        related_trend_id: pickRelatedTrend(trends, index),
        raw_payload: {
          source: 'instagram-public-reel',
          raw_r2_url: raw.url,
          product_hint: source.productHint,
          category: source.category,
          display_id: info.display_id || info.id,
        },
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      results.push({ ...db, platform: 'Instagram', title, video_url: video.url });
    } catch (error) {
      results.push({
        action: 'skipped',
        platform: 'Instagram',
        title: source.url,
        reason: error.stderr?.slice(0, 240) || error.message,
      });
    }
  }

  return results;
}

export async function ingestTrendingVideos(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase belum siap.');
  }

  const maxVideoBytes = Number(options.maxVideoMb || 35) * 1024 * 1024;
  const source = options.source || 'all';
  const results = [];

  if (source === 'all' || source === 'tiktok') {
    results.push(
      ...(await ingestTikTokCreativeCenter({
        limit: Number(options.tiktokLimit || 50),
        maxVideoBytes,
      }))
    );
  }

  if (source === 'all' || source === 'instagram') {
    results.push(
      ...(await ingestInstagramReels({
        limit: Number(options.instagramLimit || 50),
        maxVideoBytes,
      }))
    );
  }

  return {
    processed: results.length,
    inserted: results.filter((item) => item.action === 'inserted').length,
    updated: results.filter((item) => item.action === 'updated').length,
    skipped: results.filter((item) => item.action === 'skipped').length,
    results,
  };
}
