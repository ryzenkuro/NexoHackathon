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

export function shouldShowDevOtp() {
  // Show OTP in response if:
  // 1. Explicitly enabled via SHOW_DEV_OTP=true, OR
  // 2. NODE_ENV is not production
  const showDevOtp = (process.env.SHOW_DEV_OTP || '').toLowerCase();
  if (showDevOtp === 'true' || showDevOtp === '1') return true;
  if (showDevOtp === 'false' || showDevOtp === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

export function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
