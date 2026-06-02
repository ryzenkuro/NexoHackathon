import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { formatRelativeTimeID } from '../lib/time.js';
import { parsePositiveInt } from '../lib/runtime.js';

function ensureDatabaseReady(res) {
  if (isSupabaseConfigured && supabase) return true;
  res.status(503).json({
    error: 'Database is not configured',
    sourceStatus: 'database-unavailable',
  });
  return false;
}

function cleanExtractedUrl(value) {
  return value ? String(value).trim().replace(/[),.]+$/g, '') : null;
}

function parseLegacyDescription(description) {
  const text = String(description || '').trim();
  const sourceTitle = text.match(/Source title:\s*(.*?)(?:\.\s+Source:|\.\s+R2 raw:|$)/i)?.[1]?.trim() || null;
  const sourceUrl = cleanExtractedUrl(text.match(/Source:\s*(https?:\/\/.*?)(?:\.\s+R2 raw:|$)/i)?.[1]);
  const rawPayloadUrl = cleanExtractedUrl(text.match(/R2 raw:\s*(https?:\/\/\S+)/i)?.[1]);
  const markerIndexes = [' Source title:', ' Source:', ' R2 raw:']
    .map((marker) => text.indexOf(marker))
    .filter((index) => index >= 0);
  const firstMarker = markerIndexes.length ? Math.min(...markerIndexes) : -1;
  const cleanDescription = firstMarker >= 0 ? text.slice(0, firstMarker).trim() : text;

  return {
    description: sanitizeDisplayDescription(cleanDescription || text),
    sourceTitle,
    sourceUrl,
    rawPayloadUrl,
  };
}

function sanitizeDisplayDescription(description) {
  return String(description || '')
    .replace(/\s*Snapshot halaman disimpan ke R2 sebagai audit trail;?\s*/gi, ' ')
    .replace(/\s*metrik live detail membutuhkan akses resmi atau sesi terotorisasi\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim();
}

function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function getSearchRank(row, query) {
  const normalizedQuery = normalizeSearchValue(query);
  const name = normalizeSearchValue(row.name);
  const category = normalizeSearchValue(row.category);
  const platform = normalizeSearchValue(row.platform);
  const description = normalizeSearchValue(row.description);
  const words = name.split(/\s+/);

  if (name.startsWith(normalizedQuery)) return 0;
  if (words.some((word) => word.startsWith(normalizedQuery))) return 1;
  if (normalizedQuery.length <= 2) {
    if (category.startsWith(normalizedQuery) || platform.startsWith(normalizedQuery)) return 3;
    return null;
  }
  if (name.includes(normalizedQuery)) return 2;
  if (category.includes(normalizedQuery) || platform.includes(normalizedQuery)) return 3;
  if (description.includes(normalizedQuery)) return 4;
  return null;
}

// Map a DB row to the API shape used by the frontend (Trend type)
export function mapTrendRow(row) {
  const rawWindowSeconds = row.window_seconds ?? (row.window_hours == null ? 0 : row.window_hours * 3600);
  const windowSeconds = Number.isFinite(Number(rawWindowSeconds)) ? Number(rawWindowSeconds) : 0;
  const parsed = parseLegacyDescription(row.description);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    growth: row.growth,
    saturation: row.saturation,
    phase: row.phase,
    platform: row.platform,
    timeDetected: row.detected_at ? formatRelativeTimeID(row.detected_at) : 'Baru saja',
    windowHours: Math.max(0, Math.ceil(windowSeconds / 3600)),
    windowSeconds,
    thumbnail: row.thumbnail,
    competitorCount: row.competitor_count,
    avgPrice: row.avg_price,
    reviewVelocity: row.review_velocity,
    description: parsed.description,
    recommendation: row.recommendation,
    sourceUrl: row.source_url ?? parsed.sourceUrl,
    sourceTitle: row.source_title ?? parsed.sourceTitle,
    rawPayloadUrl: row.raw_payload_url ?? parsed.rawPayloadUrl,
    evidence: row.evidence ?? parsed.description,
    confidenceScore: row.confidence_score ?? null,
    updatedAt: row.updated_at ?? row.last_metric_at ?? row.detected_at ?? new Date().toISOString(),
    freshness: 'live',
  };
}

export async function getTrends(req, res) {
  try {
    const { category, phase, platform, sort } = req.query;
    const limit = Math.min(parsePositiveInt(req.query.limit, 12), 100);
    const page = parsePositiveInt(req.query.page, 1);

    if (!ensureDatabaseReady(res)) return;

    let query = supabase.from('trends').select('*', { count: 'exact' });

    if (category && category !== 'all') query = query.eq('category', category);
    if (phase) query = query.eq('phase', phase);
    if (platform) query = query.eq('platform', platform);

    switch (sort) {
      case 'saturation':
        query = query.order('saturation', { ascending: true });
        break;
      case 'growth':
        query = query.order('growth', { ascending: false });
        break;
      case 'window':
      default:
        query = query.order('window_hours', { ascending: false });
        break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Get trends error:', error);
      return res.status(500).json({ error: 'Failed to fetch trends', sourceStatus: 'database-error' });
    }

    const total = count ?? 0;
    return res.json({
      data: (data ?? []).map(mapTrendRow),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      sourceStatus: 'database',
    });
  } catch (error) {
    console.error('Get trends error:', error);
    return res.status(500).json({ error: 'Failed to fetch trends', sourceStatus: 'database-error' });
  }
}

export async function getTrendById(req, res) {
  try {
    if (!ensureDatabaseReady(res)) return;

    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      console.error('Get trend error:', error);
      return res.status(500).json({ error: 'Failed to fetch trend' });
    }
    if (!data) return res.status(404).json({ error: 'Trend not found' });

    return res.json({ data: mapTrendRow(data), sourceStatus: 'database' });
  } catch (error) {
    console.error('Get trend error:', error);
    return res.status(500).json({ error: 'Failed to fetch trend', sourceStatus: 'database-error' });
  }
}

export async function searchTrends(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    if (!ensureDatabaseReady(res)) return;

    // ilike on multiple columns. Escape % and _ to avoid wildcard injection.
    const escaped = String(q).replace(/[%_]/g, (m) => `\\${m}`);
    const pattern = `%${escaped}%`;

    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .or(
        [
          `name.ilike.${pattern}`,
          `category.ilike.${pattern}`,
          `platform.ilike.${pattern}`,
          `description.ilike.${pattern}`,
        ].join(',')
      )
      .limit(50);

    if (error) {
      console.error('Search trends error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    const ranked = (data ?? [])
      .map((row) => ({ row, rank: getSearchRank(row, q) }))
      .filter((result) => result.rank !== null)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        if (Number(b.row.growth || 0) !== Number(a.row.growth || 0)) {
          return Number(b.row.growth || 0) - Number(a.row.growth || 0);
        }
        return String(a.row.name || '').localeCompare(String(b.row.name || ''), 'id', { sensitivity: 'base' });
      })
      .slice(0, 20)
      .map(({ row }) => mapTrendRow(row));

    return res.json({ data: ranked, sourceStatus: 'database' });
  } catch (error) {
    console.error('Search trends error:', error);
    return res.status(500).json({ error: 'Search failed', sourceStatus: 'database-error' });
  }
}
