export function getDataProvider() {
  return (process.env.DATA_PROVIDER || 'supabase').toLowerCase();
}

export function getMediaProvider() {
  return (process.env.MEDIA_PROVIDER || 'r2').toLowerCase();
}

export function getResearchLakeProvider() {
  return (process.env.RESEARCH_LAKE_PROVIDER || 'r2-research-lake').toLowerCase();
}

export function getAiTraceProvider() {
  return (process.env.AI_TRACE_PROVIDER || 'supabase-ai-trace').toLowerCase();
}

export function shouldUseDevAuth() {
  return (process.env.AUTH_DATA_MODE || 'database').toLowerCase() === 'dev';
}

export function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
