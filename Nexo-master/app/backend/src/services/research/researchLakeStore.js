import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { getResearchLakeProvider } from '../../lib/runtime.js';
import { getR2Config } from '../../lib/r2.js';

export async function getResearchLakeSummary() {
  const provider = getResearchLakeProvider();
  const r2 = getR2Config();

  if (!isSupabaseConfigured || !supabase) {
    return {
      provider,
      storage: { r2Configured: r2.configured, bucket: r2.bucket || null },
      layers: {
        bronze: { description: 'Raw research and AI payloads stored in R2.', count: 0 },
        silver: { description: 'Normalized records indexed in Supabase.', count: 0 },
        gold: { description: 'Dashboard-ready audit metrics.', metrics: { aiRuns: 0, successRuns: 0, failedRuns: 0, avgQualityScore: 0, promptUsage: {} } },
      },
      tableReady: false,
    };
  }

  const { data, error } = await supabase
    .from('ai_runs')
    .select('prompt_id,status,evaluation,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return {
      provider,
      storage: { r2Configured: r2.configured, bucket: r2.bucket || null },
      layers: {
        bronze: { description: 'Raw research and AI payloads stored in R2.', count: 0 },
        silver: { description: 'Normalized records indexed in Supabase.', count: 0 },
        gold: { description: 'Dashboard-ready audit metrics.', metrics: { aiRuns: 0, successRuns: 0, failedRuns: 0, avgQualityScore: 0, promptUsage: {} } },
      },
      tableReady: false,
      error: error.message,
    };
  }

  const rows = data ?? [];
  const scored = rows.filter((row) => Number.isFinite(Number(row.evaluation?.score)));
  const totalScore = scored.reduce((sum, row) => sum + Number(row.evaluation.score), 0);
  const metrics = {
    aiRuns: rows.length,
    successRuns: rows.filter((row) => row.status === 'completed').length,
    failedRuns: rows.filter((row) => row.status === 'failed').length,
    avgQualityScore: scored.length ? Math.round(totalScore / scored.length) : 0,
    promptUsage: rows.reduce((usage, row) => {
      const key = row.prompt_id || 'unknown';
      usage[key] = (usage[key] || 0) + 1;
      return usage;
    }, {}),
  };

  return {
    provider,
    storage: { r2Configured: r2.configured, bucket: r2.bucket || null },
    layers: {
      bronze: { description: 'Raw research and AI payloads stored in R2.', count: rows.length },
      silver: { description: 'Normalized records indexed in Supabase.', count: rows.length },
      gold: { description: 'Dashboard-ready audit metrics.', metrics },
    },
    tableReady: true,
  };
}
