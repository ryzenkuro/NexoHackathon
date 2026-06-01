const DEFAULT_API_VERSION = '2024-10-21';

export class AzureOpenAiError extends Error {
  constructor(code, message, { statusCode = 502, details = {} } = {}) {
    super(message);
    this.name = 'AzureOpenAiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getAzureConfig() {
  const maxOutputTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 0);

  return {
    endpoint: stripTrailingSlash(process.env.AZURE_OPENAI_ENDPOINT),
    apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_MODEL || 'gpt-4o-mini',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION,
    timeoutMs: Number(process.env.AI_PROVIDER_TIMEOUT_MS || 20000),
    maxOutputTokens: Number.isFinite(maxOutputTokens) && maxOutputTokens > 0 ? maxOutputTokens : null,
  };
}

function isPlaceholderEndpoint(endpoint) {
  return !endpoint || /your-resource|example/i.test(endpoint);
}

export function getAzureOpenAiConfigStatus() {
  const endpoint = stripTrailingSlash(process.env.AZURE_OPENAI_ENDPOINT);
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_MODEL;
  const missing = [];

  if (isPlaceholderEndpoint(endpoint)) missing.push('AZURE_OPENAI_ENDPOINT');
  if (!apiKey) missing.push('AZURE_OPENAI_API_KEY');
  if (!deployment) missing.push('AZURE_OPENAI_DEPLOYMENT');

  let endpointHost = null;
  try {
    endpointHost = endpoint && !isPlaceholderEndpoint(endpoint) ? new URL(endpoint).host : null;
  } catch {
    missing.push('AZURE_OPENAI_ENDPOINT_VALID_URL');
  }

  return {
    configured: missing.length === 0,
    endpointConfigured: Boolean(endpoint && !isPlaceholderEndpoint(endpoint)),
    endpointHost,
    apiKeyConfigured: Boolean(apiKey),
    deploymentConfigured: Boolean(deployment),
    deployment: deployment || null,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || DEFAULT_API_VERSION,
    missing: [...new Set(missing)],
  };
}

export function isAzureOpenAiConfigured() {
  return getAzureOpenAiConfigStatus().configured;
}

function getResponsesUrl(endpoint) {
  const base = stripTrailingSlash(endpoint)
    .replace(/\/openai\/v1$/i, '')
    .replace(/\/openai$/i, '');
  return `${base}/openai/v1/responses`;
}

function getChatCompletionsUrl(endpoint, deployment, apiVersion) {
  const base = stripTrailingSlash(endpoint)
    .replace(/\/openai\/v1$/i, '')
    .replace(/\/openai$/i, '');
  return `${base}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
}

async function postJson(url, body, config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = json.error?.message || json.message || response.statusText;
      throw new AzureOpenAiError(
        'AZURE_OPENAI_REQUEST_FAILED',
        `Azure OpenAI request failed (${response.status}): ${message}`,
        {
          statusCode: response.status >= 500 ? 502 : response.status,
          details: { azureStatus: response.status },
        }
      );
    }

    return json;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new AzureOpenAiError(
        'AZURE_OPENAI_TIMEOUT',
        `Azure OpenAI request timed out after ${config.timeoutMs}ms`,
        { statusCode: 504 }
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function splitMessages(messages) {
  const system = messages.find((message) => message.role === 'system')?.content || '';
  const conversation = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role, content: message.content }));

  return { system, conversation };
}

function extractResponsesText(payload) {
  if (payload.output_text) return payload.output_text;

  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
      if (content.type === 'output_text' && content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function normalizeUsage(usage = {}) {
  return {
    inputTokens: usage.input_tokens ?? usage.prompt_tokens ?? 0,
    outputTokens: usage.output_tokens ?? usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
}

async function completeWithResponsesApi(messages, config) {
  const { system, conversation } = splitMessages(messages);
  const payload = await postJson(
    getResponsesUrl(config.endpoint),
    {
      model: config.deployment,
      instructions: system,
      input: conversation,
      ...(config.maxOutputTokens ? { max_output_tokens: config.maxOutputTokens } : {}),
    },
    config
  );

  return {
    text: extractResponsesText(payload),
    provider: 'azure_openai',
    model: payload.model || config.deployment,
    usage: normalizeUsage(payload.usage),
    finishReason: payload.status,
  };
}

async function completeWithChatCompletions(messages, config) {
  const payload = await postJson(
    getChatCompletionsUrl(config.endpoint, config.deployment, config.apiVersion),
    {
      messages,
      temperature: 0.4,
      ...(config.maxOutputTokens ? { max_tokens: config.maxOutputTokens } : {}),
    },
    config
  );

  return {
    text: payload.choices?.[0]?.message?.content || '',
    provider: 'azure_openai',
    model: payload.model || config.deployment,
    usage: normalizeUsage(payload.usage),
    finishReason: payload.choices?.[0]?.finish_reason,
  };
}

export async function completeWithAzureOpenAi({ messages }) {
  const config = getAzureConfig();
  if (!isAzureOpenAiConfigured()) {
    const status = getAzureOpenAiConfigStatus();
    throw new AzureOpenAiError(
      'AZURE_OPENAI_CONFIG_INCOMPLETE',
      `Azure OpenAI is not configured. Missing: ${status.missing.join(', ') || 'unknown'}`,
      { statusCode: 503, details: { missing: status.missing } }
    );
  }

  try {
    return await completeWithResponsesApi(messages, config);
  } catch (responsesError) {
    try {
      const chatResult = await completeWithChatCompletions(messages, config);
      return {
        ...chatResult,
        fallbackReason: `responses-api: ${responsesError.message}`,
      };
    } catch (chatError) {
      chatError.fallbackReason = `responses-api: ${responsesError.message}`;
      throw chatError;
    }
  }
}
