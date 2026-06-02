import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { mapTrendRow } from '../controllers/trendController.js';

const DEFAULT_DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSnapshot = null;
let cachedSnapshotAt = 0;

function getDashboardCacheTtlMs() {
  const configured = Number(process.env.DASHBOARD_METRICS_CACHE_TTL_MS || DEFAULT_DASHBOARD_CACHE_TTL_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_DASHBOARD_CACHE_TTL_MS;
}

async function loadTrendRows() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is required for dashboard data.');
  }

  const [trendResult, totalResult, emergingResult] = await Promise.all([
    supabase
      .from('trends')
      .select('*')
      .order('growth', { ascending: false })
      .limit(100),
    supabase
      .from('trends')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('trends')
      .select('id', { count: 'exact', head: true })
      .eq('phase', 'Emerging'),
  ]);

  const { data, error } = trendResult;
  if (error) throw error;
  if (totalResult.error) throw totalResult.error;
  if (emergingResult.error) throw emergingResult.error;

  return {
    rows: data ?? [],
    totalTrends: totalResult.count ?? data?.length ?? 0,
    emergingTrends: emergingResult.count ?? 0,
    sourceStatus: 'database',
  };
}

function isActiveTrend(trend) {
  return trend.windowSeconds > 0 && trend.phase !== 'Decay';
}

function calculateDeltas(activeTrends) {
  const growthDelta = activeTrends.reduce((sum, trend) => sum + Math.max(0, trend.growth), 0);
  const saturationDrift = activeTrends.reduce((sum, trend) => sum + trend.saturation, 0);

  return {
    activeTrends: Math.max(1, Math.round(growthDelta / 450)),
    emergingTrends: Math.max(0, activeTrends.filter((trend) => trend.phase === 'Emerging').length),
    avgSaturation: activeTrends.length ? Number(((saturationDrift / activeTrends.length - 48) / 8).toFixed(1)) : 0,
  };
}

function calculateWeeklyDeltaPct(base) {
  if (!base.length) return 0;
  const avgGrowth = base.reduce((sum, trend) => sum + Number(trend.growth || 0), 0) / base.length;
  return Number(clamp(avgGrowth / 12, 0, 100).toFixed(1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMomentumDirection(trend) {
  if (trend.phase === 'Decay' || trend.saturation >= 68 || trend.growth < 45) return 'down';
  if (trend.phase === 'Emerging' || (trend.growth >= 150 && trend.saturation < 55)) return 'up';
  return 'flat';
}

function getMomentumScore(trend) {
  const growthScore = clamp(((Number(trend.growth) + 45) / 405) * 100, 0, 100);
  const reviewBoost = clamp((Number(trend.reviewVelocity) / 260) * 12, 0, 12);
  const saturationPenalty = Math.max(0, Number(trend.saturation) - 35) * 0.55;
  const windowPenalty = trend.windowSeconds <= 6 * 3600
    ? 22
    : trend.windowSeconds <= 18 * 3600
      ? 12
      : trend.windowSeconds <= 30 * 3600
        ? 5
        : 0;
  const phaseModifier = {
    Emerging: 12,
    Growing: 5,
    Peak: -10,
    Decay: -26,
  }[trend.phase] ?? 0;

  return Math.round(clamp(growthScore + reviewBoost + phaseModifier - saturationPenalty - windowPenalty, 4, 100));
}

export async function getDashboardSnapshot() {
  const cacheTtlMs = getDashboardCacheTtlMs();
  const now = Date.now();
  if (cacheTtlMs > 0 && cachedSnapshot && now - cachedSnapshotAt < cacheTtlMs) {
    return cachedSnapshot;
  }

  const { rows, totalTrends, emergingTrends, sourceStatus } = await loadTrendRows();
  const trends = rows.map(mapTrendRow);
  const activeTrends = trends.filter(isActiveTrend);
  const base = activeTrends.length ? activeTrends : trends;
  const nearest = base.reduce((winner, trend) => {
    if (!winner) return trend;
    return trend.windowSeconds < winner.windowSeconds ? trend : winner;
  }, null);

  const avgSaturation = base.length
    ? Math.round(base.reduce((sum, trend) => sum + trend.saturation, 0) / base.length)
    : 0;

  const growthItems = [...trends]
    .map((trend) => ({
      trend,
      momentumScore: getMomentumScore(trend),
      momentumDirection: getMomentumDirection(trend),
    }))
    .sort((a, b) => b.momentumScore - a.momentumScore || b.trend.growth - a.trend.growth)
    .slice(0, 7)
    .map(({ trend, momentumScore, momentumDirection }) => ({
      trendId: trend.id,
      name: trend.name,
      growth: trend.growth,
      saturation: trend.saturation,
      windowSeconds: trend.windowSeconds,
      phase: trend.phase,
      momentumScore,
      momentumDirection,
    }));

  const snapshot = {
    updatedAt: new Date().toISOString(),
    cadenceMs: Number(process.env.DASHBOARD_REALTIME_INTERVAL_MS || cacheTtlMs || 1000),
    cacheTtlMs,
    sourceStatus,
    metrics: {
      activeTrends: totalTrends,
      emergingTrends,
      avgSaturation,
      nearestWindowSeconds: nearest?.windowSeconds ?? 0,
      nearestWindowTrendId: nearest?.id ?? null,
    },
    deltas: calculateDeltas(base),
    growthMomentum: {
      totalWatched: totalTrends,
      weeklyDeltaPct: calculateWeeklyDeltaPct(base),
      items: growthItems,
    },
  };

  cachedSnapshot = snapshot;
  cachedSnapshotAt = now;
  return snapshot;
}
