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

// Map a DB row to the API shape used by the frontend (Trend type)
export function mapTrendRow(row) {
  const rawWindowSeconds = row.window_seconds ?? (row.window_hours == null ? 0 : row.window_hours * 3600);
  const windowSeconds = Number.isFinite(Number(rawWindowSeconds)) ? Number(rawWindowSeconds) : 0;

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
    description: row.description,
    recommendation: row.recommendation,
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

    return res.json({ data: (data ?? []).map(mapTrendRow), sourceStatus: 'database' });
  } catch (error) {
    console.error('Search trends error:', error);
    return res.status(500).json({ error: 'Search failed', sourceStatus: 'database-error' });
  }
}
