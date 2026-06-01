import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { saveMediaBuffer, saveResearchJson } from '../storage/mediaStore.js';
import { buildRecommendation, scoreResearchProduct } from './scoring.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0 Safari/537.36 NexoResearch/1.0';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function canonicalKey(product) {
  return `${slugify(product.platform)}:${slugify(product.name)}:${hashValue(product.sourceUrl || product.name)}`;
}

function extractMeta(html) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
  const description =
    html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    null;
  const image =
    html.match(/<meta[^>]+(?:name|property)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    null;

  return { title, description, image };
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 16000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSourceSnapshot(sourceUrl) {
  if (!sourceUrl) return null;

  try {
    const response = await fetchWithTimeout(sourceUrl);
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();
    const meta = contentType.includes('html') ? extractMeta(body) : {};

    return {
      ok: response.ok,
      status: response.status,
      final_url: response.url,
      content_type: contentType,
      title: meta.title || null,
      description: meta.description || null,
      image: meta.image || null,
      body_size: body.length,
      text_sample: stripHtml(body).slice(0, 2200),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      final_url: sourceUrl,
      error: error.cause?.message || error.message,
    };
  }
}

function getImageExtension(contentType) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

async function findWikimediaImage(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '8',
    gsrsearch: query,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '900',
    format: 'json',
    origin: '*',
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'user-agent': 'NexoResearchBot/1.0 (research ingestion)' },
  });

  if (!response.ok) return null;
  const json = await response.json();
  const pages = Object.values(json.query?.pages || {});
  const image = pages
    .map((page) => page.imageinfo?.[0])
    .find((info) => info?.mime?.startsWith('image/') && (info.thumburl || info.url));

  if (!image) return null;
  return {
    url: image.thumburl || image.url,
    contentType: image.mime,
  };
}

function getCategoryImageQuery(product) {
  return {
    'rumah-tangga': 'Stanley Quencher H2.0 Tumbler',
    elektronik: 'galaxy projector lamp product',
    fashion: 'canvas tote bag product',
    kecantikan: 'serum bottle skincare product',
    makanan: 'gift snack bouquet',
  }[product.category] || 'consumer product photo';
}

const categoryImageFallbacks = {
  'rumah-tangga': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Stanley_Quencher_in_a_shop.jpg',
    contentType: 'image/jpeg',
  },
  elektronik: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/LED_Projector_machine.jpg/960px-LED_Projector_machine.jpg',
    contentType: 'image/jpeg',
  },
  fashion: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Reusable_Bag_3.jpg',
    contentType: 'image/jpeg',
  },
  kecantikan: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Optical_caustic_Cosmetic_oil_bottle_in_the_sun_mj.jpg/960px-Optical_caustic_Cosmetic_oil_bottle_in_the_sun_mj.jpg',
    contentType: 'image/jpeg',
  },
  makanan: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Exotic_Fruit_Gift_Basket_%284461109309%29.jpg/960px-Exotic_Fruit_Gift_Basket_%284461109309%29.jpg',
    contentType: 'image/jpeg',
  },
};

async function uploadRemoteImage(product, image, cacheKey, imageCache) {
  if (!image?.url) return null;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  try {
    const response = await fetch(image.url, {
      headers: { 'user-agent': 'NexoResearchBot/1.0 (research ingestion)' },
    });
    if (!response.ok) {
      imageCache.set(cacheKey, null);
      return null;
    }

    const contentType = response.headers.get('content-type') || image.contentType || 'image/jpeg';
    const bytes = Buffer.from(await response.arrayBuffer());
    const uploaded = await saveMediaBuffer({
      platform: product.platform,
      label: product.name,
      bytes,
      contentType,
      extension: getImageExtension(contentType),
    });

    imageCache.set(cacheKey, uploaded.url);
    return uploaded.url;
  } catch {
    imageCache.set(cacheKey, null);
    return null;
  }
}

async function uploadWikimediaImage(product, query, imageCache) {
  if (!query) return null;
  if (imageCache.has(query)) return imageCache.get(query);

  try {
    const image = await findWikimediaImage(query);
    if (!image) {
      imageCache.set(query, null);
      return null;
    }

    return uploadRemoteImage(product, image, query, imageCache);
  } catch {
    imageCache.set(query, null);
    return null;
  }
}

async function enrichImage(product, imageCache) {
  const queries = [
    product.imageQuery,
    product.name,
    getCategoryImageQuery(product),
  ].filter(Boolean);

  for (const query of queries) {
    const uploadedUrl = await uploadWikimediaImage(product, query, imageCache);
    if (uploadedUrl) return uploadedUrl;
  }

  const fallback = categoryImageFallbacks[product.category];
  return uploadRemoteImage(product, fallback, `category:${product.category}`, imageCache);
}

function normalizeTrendRow(product, { sourceSnapshot, rawObjectUrl, thumbnail }) {
  const now = new Date();
  const score = scoreResearchProduct(product);
  const avgPrice = Number(product.avgPrice || product.price || 0);
  const sourceTitle = sourceSnapshot?.title ? ` Source title: ${sourceSnapshot.title}.` : '';
  const rawAudit = rawObjectUrl ? ` R2 raw: ${rawObjectUrl}` : '';
  const evidence = product.evidence || product.notes || 'Riset produk dari source publik.';

  return {
    name: product.name,
    category: product.category,
    growth: score.growth,
    saturation: score.saturation,
    phase: score.phase,
    platform: product.platform,
    window_hours: score.windowHours,
    competitor_count: score.competitorCount,
    avg_price: avgPrice,
    review_velocity: score.reviewVelocity,
    description: `${evidence}${sourceTitle} Source: ${product.sourceUrl}.${rawAudit}`,
    recommendation: buildRecommendation({
      phase: score.phase,
      saturation: score.saturation,
      avgPrice,
    }),
    thumbnail,
    detected_at: product.detectedAt || now.toISOString(),
    updated_at: now.toISOString(),
    source_platform: product.platform,
    is_active: true,
    canonical_key: canonicalKey(product),
    window_ends_at: new Date(now.getTime() + score.windowHours * 60 * 60 * 1000).toISOString(),
    last_metric_at: now.toISOString(),
  };
}

async function findExistingTrend(row) {
  const { data, error } = await supabase
    .from('trends')
    .select('id')
    .eq('canonical_key', row.canonical_key)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const fallback = await supabase
    .from('trends')
    .select('id')
    .eq('name', row.name)
    .eq('platform', row.platform)
    .maybeSingle();

  if (fallback.error) throw fallback.error;
  return fallback.data;
}

async function upsertTrend(row) {
  const existing = await findExistingTrend(row);
  if (existing) {
    const { data, error } = await supabase
      .from('trends')
      .update(row)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return { action: 'updated', id: data.id };
  }

  const { data, error } = await supabase.from('trends').insert(row).select('id').single();
  if (error) throw error;
  return { action: 'inserted', id: data.id };
}

export async function ingestResearchProducts(products, options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase belum siap. SUPABASE_URL dan SUPABASE_SERVICE_KEY wajib ada.');
  }

  const limit = Number(options.limit || products.length);
  const selected = products.slice(0, limit);
  const sourceCache = new Map();
  const imageCache = new Map();
  const results = [];
  let mediaCount = 0;
  const mediaLimit = Number(options.mediaLimit ?? selected.length);
  const delayMs = Number(options.delayMs || 0);

  for (const [index, product] of selected.entries()) {
    const sourceUrl = product.sourceUrl;
    let sourceSnapshot = sourceCache.get(sourceUrl);
    if (!sourceSnapshot) {
      const snapshot = await fetchSourceSnapshot(sourceUrl);
      const stored = await saveResearchJson({
        platform: product.platform,
        type: 'raw',
        label: `${product.platform}-${product.category}`,
        payload: snapshot,
        sourceUrl,
      });
      sourceSnapshot = { snapshot, r2: stored };
      sourceCache.set(sourceUrl, sourceSnapshot);
    }

    let thumbnail = product.thumbnailUrl || sourceSnapshot.snapshot?.image || null;
    if (!thumbnail && mediaCount < mediaLimit) {
      thumbnail = await enrichImage(product, imageCache);
      if (thumbnail) mediaCount += 1;
    }

    const rawObject = await saveResearchJson({
      platform: product.platform,
      type: 'research-products',
      label: product.name,
      payload: {
        product,
        source_snapshot_r2_url: sourceSnapshot.r2.url,
        source_snapshot: sourceSnapshot.snapshot,
      },
      sourceUrl,
    });

    const row = normalizeTrendRow(product, {
      sourceSnapshot: sourceSnapshot.snapshot,
      rawObjectUrl: rawObject.url,
      thumbnail,
    });
    const db = await upsertTrend(row);

    results.push({
      ...db,
      name: row.name,
      platform: row.platform,
      raw_url: rawObject.url,
      thumbnail,
    });

    if (delayMs > 0 && index < selected.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    requested: limit,
    processed: results.length,
    inserted: results.filter((item) => item.action === 'inserted').length,
    updated: results.filter((item) => item.action === 'updated').length,
    mediaUploaded: mediaCount,
    results,
  };
}
