import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { parsePositiveInt } from '../lib/runtime.js';

function ensureDatabaseReady(res) {
  if (isSupabaseConfigured && supabase) return true;
  res.status(503).json({
    error: 'Database is not configured',
    sourceStatus: 'database-unavailable',
  });
  return false;
}

function mapContentRow(row) {
  const views = formatCompactNumber(row.views);
  const likes = formatCompactNumber(row.likes);
  const comments = formatCompactNumber(row.comments);
  const engagement = formatEngagement(row.engagement);
  const duration = formatDuration(row.duration);

  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    platform: row.platform,
    views,
    likes,
    comments,
    engagement,
    thumbnail: row.thumbnail,
    productRelevance: Boolean(row.product_relevance),
    duration,
    url: row.url,
    videoUrl: row.video_url,
    relatedTrendId: row.related_trend_id,
    updatedAt: row.updated_at ?? row.scraped_at ?? new Date().toISOString(),
  };
}

function formatCompactNumber(value) {
  if (typeof value === 'string' && /[KM]/i.test(value)) return value;
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return String(value ?? '0');
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(numeric >= 10_000_000 ? 0 : 1)}M`;
  if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(numeric >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(numeric));
}

function formatEngagement(value) {
  if (typeof value === 'string' && value.includes('%')) return value;
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '0%';
  return `${numeric.toFixed(numeric >= 10 ? 1 : 2)}%`;
}

function formatDuration(value) {
  if (typeof value === 'string' && value.includes(':')) return value;
  const seconds = Math.max(0, Math.round(Number(value || 0)));
  const minutes = Math.floor(seconds / 60);
  const remaining = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function parseBoolean(value) {
  if (value === undefined) return undefined;
  return String(value).toLowerCase() === 'true';
}

export async function getTrendingContents(req, res) {
  try {
    const limit = Math.min(parsePositiveInt(req.query.limit, 12), 100);
    const page = parsePositiveInt(req.query.page, 1);
    const platform = req.query.platform && req.query.platform !== 'Semua' ? req.query.platform : undefined;
    const productRelevance = parseBoolean(req.query.productRelevance);
    const sort = req.query.sort || 'engagement';
    const q = req.query.q;

    if (!ensureDatabaseReady(res)) return;

    let query = supabase.from('trending_contents').select('*', { count: 'exact' });
    if (platform && platform !== 'all') query = query.eq('platform', platform);
    if (productRelevance !== undefined) query = query.eq('product_relevance', productRelevance);
    if (q) {
      const escaped = String(q).replace(/[%_]/g, (m) => `\\${m}`);
      const pattern = `%${escaped}%`;
      query = query.or([`title.ilike.${pattern}`, `creator.ilike.${pattern}`, `platform.ilike.${pattern}`].join(','));
    }

    switch (sort) {
      case 'views':
        query = query.order('views', { ascending: false });
        break;
      case 'recent':
        query = query.order('scraped_at', { ascending: false });
        break;
      case 'engagement':
      default:
        query = query.order('engagement', { ascending: false });
        break;
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);

    if (error) {
      console.error('[trending-content] database error:', error);
      return res.status(500).json({ error: 'Failed to fetch content', sourceStatus: 'database-error' });
    }

    return res.json({
      data: (data ?? []).map(mapContentRow),
      total: count ?? 0,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      sourceStatus: 'database',
    });
  } catch (error) {
    console.error('[trending-content] list error:', error);
    return res.status(500).json({ error: 'Failed to fetch content', sourceStatus: 'database-error' });
  }
}

export async function getTrendingContentById(req, res) {
  try {
    if (!ensureDatabaseReady(res)) return;

    const { data, error } = await supabase
      .from('trending_contents')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      console.error('[trending-content] detail error:', error);
      return res.status(500).json({ error: 'Failed to fetch content' });
    }
    if (!data) return res.status(404).json({ error: 'Content not found' });

    return res.json({ data: mapContentRow(data), sourceStatus: 'database' });
  } catch (error) {
    console.error('[trending-content] detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch content', sourceStatus: 'database-error' });
  }
}
