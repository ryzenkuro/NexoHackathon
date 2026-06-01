import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { saveResearchJson } from '../storage/mediaStore.js';

const MAX_RUNS = 100;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createRunId() {
  return `ai-run-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function toSnakeRun(run, payloadUrl) {
  return {
    id: run.id,
    prompt_id: run.promptId,
    provider: run.provider,
    model: run.model,
    status: run.status,
    input: run.input,
    output: run.output ?? null,
    usage: run.usage ?? null,
    evaluation: run.evaluation ?? null,
    metadata: run.metadata ?? {},
    payload_url: payloadUrl ?? run.payloadUrl ?? null,
    fallback_reason: run.fallbackReason ?? null,
    error: run.error ?? null,
    duration_ms: run.durationMs ?? null,
    created_at: run.createdAt,
    completed_at: run.completedAt ?? null,
  };
}

function fromSnakeRun(row) {
  return {
    id: row.id,
    promptId: row.prompt_id,
    provider: row.provider,
    model: row.model,
    status: row.status,
    input: row.input,
    output: row.output,
    usage: row.usage,
    evaluation: row.evaluation,
    metadata: row.metadata,
    payloadUrl: row.payload_url,
    fallbackReason: row.fallback_reason,
    error: row.error,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function persistAiRun(run) {
  let payloadUrl = null;

  try {
    const payload = await saveResearchJson({
      platform: 'ai',
      type: 'ai-runs',
      label: run.promptId || run.id,
      payload: run,
      sourceUrl: `nexo-ai:${run.id}`,
    });
    payloadUrl = payload.url;
  } catch (error) {
    console.error('[ai-trace] R2 write failed:', error.message);
  }

  if (!isSupabaseConfigured || !supabase) return { ...run, payloadUrl };

  const { error } = await supabase
    .from('ai_runs')
    .upsert(toSnakeRun(run, payloadUrl), { onConflict: 'id' });

  if (error) {
    console.error('[ai-trace] Supabase write failed:', error.message);
  }

  return { ...run, payloadUrl };
}

export function startAiRun({ promptId, provider, model, input, metadata = {} }) {
  return {
    id: createRunId(),
    promptId,
    provider,
    model,
    status: 'running',
    input,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export async function finishAiRun(run, { output, usage, evaluation, provider, model, fallbackReason }) {
  const completedAt = new Date().toISOString();
  const completed = {
    ...run,
    status: 'completed',
    output,
    usage,
    evaluation,
    provider: provider || run.provider,
    model: model || run.model,
    fallbackReason,
    completedAt,
    durationMs: new Date(completedAt).getTime() - new Date(run.createdAt).getTime(),
  };

  return clone(await persistAiRun(completed));
}

export async function failAiRun(run, error) {
  const completedAt = new Date().toISOString();
  const failed = {
    ...run,
    status: 'failed',
    error: error?.message || String(error),
    completedAt,
    durationMs: new Date(completedAt).getTime() - new Date(run.createdAt).getTime(),
  };

  return clone(await persistAiRun(failed));
}

export async function listAiRuns(limit = 20) {
  if (!isSupabaseConfigured || !supabase) return [];

  const safeLimit = Math.min(Number(limit) || 20, MAX_RUNS);
  const { data, error } = await supabase
    .from('ai_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error('[ai-trace] Supabase read failed:', error.message);
    return [];
  }

  return clone((data ?? []).map(fromSnakeRun));
}
