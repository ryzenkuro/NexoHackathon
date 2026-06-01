import './env.js';
import { getAiRuntimeStatus } from '../services/ai/aiGateway.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import {
  getDataProvider,
  getMediaProvider,
  getAiTraceProvider,
  getResearchLakeProvider,
} from '../lib/runtime.js';
import { getR2Config } from '../lib/r2.js';

function isStrictAzureOpenAi(status) {
  return status.requestedProvider === 'azure_openai' && status.strict;
}

function isStrictOpenAi(status) {
  return status.requestedProvider === 'openai' && status.strict;
}

export function validateBackendConfig() {
  const status = getAiRuntimeStatus();
  const errors = [];
  const dataProvider = getDataProvider();
  const mediaProvider = getMediaProvider();
  const aiTraceProvider = getAiTraceProvider();
  const researchLakeProvider = getResearchLakeProvider();
  const r2 = getR2Config();

  if (dataProvider === 'supabase' && !isSupabaseConfigured) {
    errors.push('DATA_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  if (mediaProvider === 'r2' && !r2.configured) {
    errors.push(`MEDIA_PROVIDER=r2 requires: ${r2.missing.join(', ')}.`);
  }

  if (['supabase', 'supabase-ai-trace'].includes(aiTraceProvider) && !isSupabaseConfigured) {
    errors.push('AI_TRACE_PROVIDER=supabase requires Supabase configuration.');
  }

  if (researchLakeProvider === 'r2-research-lake' && !r2.configured) {
    errors.push(`RESEARCH_LAKE_PROVIDER=r2-research-lake requires: ${r2.missing.join(', ')}.`);
  }

  if (isStrictAzureOpenAi(status) && !status.azureConfigured) {
    const missing = status.azure.missing.length
      ? status.azure.missing.join(', ')
      : 'valid Azure OpenAI configuration';

    errors.push(
      `AI_PROVIDER=azure_openai and AI_PROVIDER_STRICT=true, but Azure OpenAI is not ready: ${missing}.`
    );
  }

  if (isStrictOpenAi(status) && !status.openAiConfigured) {
    const missing = status.openai.missing.length
      ? status.openai.missing.join(', ')
      : 'valid OpenAI configuration';

    errors.push(
      `AI_PROVIDER=openai and AI_PROVIDER_STRICT=true, but OpenAI is not ready: ${missing}.`
    );
  }

  if (errors.length) {
    const error = new Error(`[startup] Backend configuration invalid:\n- ${errors.join('\n- ')}`);
    error.code = 'BACKEND_CONFIG_INVALID';
    error.status = status;
    throw error;
  }

  return {
    ...status,
    dataProvider,
    mediaProvider,
    aiTraceProvider,
    researchLakeProvider,
  };
}
