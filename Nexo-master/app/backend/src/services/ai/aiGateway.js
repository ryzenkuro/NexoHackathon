import { buildPromptMessages, listPromptIds } from './promptRegistry.js';
import { evaluateAiOutput } from './qualityEvaluator.js';
import { failAiRun, finishAiRun, startAiRun } from './traceStore.js';
import { completeWithRules } from './providers/rulesProvider.js';
import { getAiTraceProvider, getResearchLakeProvider } from '../../lib/runtime.js';
import {
  AzureOpenAiError,
  completeWithAzureOpenAi,
  getAzureOpenAiConfigStatus,
} from './providers/azureOpenAiProvider.js';
import {
  OpenAiError,
  completeWithOpenAi,
  getOpenAiConfigStatus,
} from './providers/openAiProvider.js';

class AiRuntimeError extends Error {
  constructor(code, message, { statusCode = 500, details = {} } = {}) {
    super(message);
    this.name = 'AiRuntimeError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getRequestedProvider() {
  return (process.env.AI_PROVIDER || 'rules').toLowerCase();
}

function isStrict() {
  return process.env.AI_PROVIDER_STRICT === 'true';
}

export function getAiRuntimeStatus() {
  const requestedProvider = getRequestedProvider();
  const azure = getAzureOpenAiConfigStatus();
  const openai = getOpenAiConfigStatus();
  const strict = isStrict();
  const activeProvider = (() => {
    if (requestedProvider === 'azure_openai') {
      return azure.configured ? 'azure_openai' : strict ? 'unavailable' : 'rules';
    }
    if (requestedProvider === 'openai') {
      return openai.configured ? 'openai' : strict ? 'unavailable' : 'rules';
    }
    return 'rules';
  })();

  return {
    requestedProvider,
    activeProvider,
    azureConfigured: azure.configured,
    openAiConfigured: openai.configured,
    strict,
    aiTraceProvider: getAiTraceProvider(),
    researchLakeProvider: getResearchLakeProvider(),
    azure,
    openai,
    prompts: listPromptIds(),
  };
}

function getRunModel(runtime) {
  if (runtime.requestedProvider === 'azure_openai') {
    return runtime.azure.deployment || 'azure-openai-unconfigured';
  }

  if (runtime.requestedProvider === 'openai') {
    return runtime.openai.model || 'openai-unconfigured';
  }

  return 'nexo-rules';
}

function toProviderError(error) {
  if (error?.code) return error;
  return new AiRuntimeError(
    'AI_PROVIDER_ERROR',
    error?.message || 'AI provider failed',
    { statusCode: 500 }
  );
}

async function runProvider(request) {
  const status = getAiRuntimeStatus();
  if (status.requestedProvider === 'azure_openai') {
    if (status.azure.configured) {
      try {
        return await completeWithAzureOpenAi(request);
      } catch (error) {
        if (status.strict) {
          const providerError = error instanceof AzureOpenAiError ? error : toProviderError(error);
          providerError.fallbackReason = providerError.fallbackReason || 'AI_PROVIDER_STRICT=true, rules provider disabled';
          throw providerError;
        }

        const result = await completeWithRules(request);
        return {
          ...result,
          fallbackReason: `Azure OpenAI failed, using rules provider: ${error.message}`,
        };
      }
    }

    if (status.strict) {
      throw new AiRuntimeError(
        'AZURE_OPENAI_CONFIG_INCOMPLETE',
        `AI_PROVIDER=azure_openai but Azure OpenAI env is incomplete: ${status.azure.missing.join(', ')}`,
        { statusCode: 503, details: { missing: status.azure.missing } }
      );
    }

    const result = await completeWithRules(request);
    return {
      ...result,
      fallbackReason: 'Azure OpenAI env incomplete, using rules provider',
    };
  }

  if (status.requestedProvider === 'openai') {
    if (status.openai.configured) {
      try {
        return await completeWithOpenAi(request);
      } catch (error) {
        if (status.strict) {
          const providerError = error instanceof OpenAiError ? error : toProviderError(error);
          providerError.fallbackReason = providerError.fallbackReason || 'AI_PROVIDER_STRICT=true, rules provider disabled';
          throw providerError;
        }

        const result = await completeWithRules(request);
        return {
          ...result,
          fallbackReason: `OpenAI failed, using rules provider: ${error.message}`,
        };
      }
    }

    if (status.strict) {
      throw new AiRuntimeError(
        'OPENAI_CONFIG_INCOMPLETE',
        `AI_PROVIDER=openai but OpenAI env is incomplete: ${status.openai.missing.join(', ')}`,
        { statusCode: 503, details: { missing: status.openai.missing } }
      );
    }

    const result = await completeWithRules(request);
    return {
      ...result,
      fallbackReason: 'OpenAI env incomplete, using rules provider',
    };
  }

  return completeWithRules(request);
}

export async function completeText({ promptId, variables = {}, history = [], metadata = {} }) {
  const messages = buildPromptMessages(promptId, variables, history);
  const runtime = getAiRuntimeStatus();
  const startedRun = startAiRun({
    promptId,
    provider: runtime.activeProvider,
    model: getRunModel(runtime),
    input: { variables, messageCount: messages.length },
    metadata,
  });

  try {
    const result = await runProvider({ promptId, variables, messages, metadata });
    const evaluation = evaluateAiOutput(result.text, promptId);
    const completedRun = await finishAiRun(startedRun, {
      output: result.text,
      usage: result.usage,
      evaluation,
      provider: result.provider,
      model: result.model,
      fallbackReason: result.fallbackReason,
    });

    return {
      ...result,
      promptId,
      runId: startedRun.id,
      evaluation,
      trace: completedRun,
    };
  } catch (error) {
    await failAiRun(startedRun, error);
    throw toProviderError(error);
  }
}
