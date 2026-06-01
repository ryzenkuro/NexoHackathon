import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { mapTrendRow } from './trendController.js';

function getDecision(saturation) {
  if (saturation <= 30) return 'Aman masuk';
  if (saturation <= 60) return 'Waspada';
  return 'Jenuh';
}

function toSaturationDetail(row) {
  const trend = mapTrendRow(row);
  const opportunityScore = Math.max(0, Math.min(100, Math.round(100 - trend.saturation)));

  return {
    ...trend,
    trendId: trend.id,
    opportunityScore,
    decision: getDecision(trend.saturation),
    competitorDensity: [
      { day: 'Sen', count: Math.round(trend.competitorCount * 0.6) },
      { day: 'Sel', count: Math.round(trend.competitorCount * 0.7) },
      { day: 'Rab', count: Math.round(trend.competitorCount * 0.75) },
      { day: 'Kam', count: Math.round(trend.competitorCount * 0.85) },
      { day: 'Jum', count: Math.round(trend.competitorCount * 0.9) },
      { day: 'Sab', count: Math.round(trend.competitorCount * 0.95) },
      { day: 'Min', count: trend.competitorCount },
    ],
  };
}

async function getTrendRow(id) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is required for saturation data.');
  }

  const query = id
    ? supabase.from('trends').select('*').eq('id', id).maybeSingle()
    : supabase.from('trends').select('*').order('saturation', { ascending: true }).limit(1).maybeSingle();

  const { data, error } = await query;
  if (error) throw error;
  return { row: data ?? null, sourceStatus: 'database' };
}

export async function getSaturationSummary(_req, res) {
  try {
    const { row, sourceStatus } = await getTrendRow();
    if (!row) return res.status(404).json({ error: 'Trend not found' });
    return res.json({ data: toSaturationDetail(row), sourceStatus });
  } catch (error) {
    console.error('[saturation] summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch saturation summary' });
  }
}

export async function getSaturationTrend(req, res) {
  try {
    const { row, sourceStatus } = await getTrendRow(req.params.id);
    if (!row) return res.status(404).json({ error: 'Trend not found' });
    return res.json({ data: toSaturationDetail(row), sourceStatus });
  } catch (error) {
    console.error('[saturation] detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch saturation detail' });
  }
}

export function streamSaturationTrend(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = async () => {
    try {
      const { row, sourceStatus } = await getTrendRow(req.params.id);
      if (!row) {
        res.write(`event: saturation.error\n`);
        res.write(`data: ${JSON.stringify({ message: 'Trend not found' })}\n\n`);
        return;
      }
      res.write(`event: saturation.snapshot\n`);
      res.write(`data: ${JSON.stringify({ ...toSaturationDetail(row), sourceStatus })}\n\n`);
    } catch (error) {
      res.write(`event: saturation.error\n`);
      res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
    }
  };

  send();
  const timer = setInterval(send, Number(process.env.SATURATION_REFRESH_INTERVAL_MS || 10000));
  timer.unref?.();

  req.on('close', () => {
    clearInterval(timer);
  });
}
