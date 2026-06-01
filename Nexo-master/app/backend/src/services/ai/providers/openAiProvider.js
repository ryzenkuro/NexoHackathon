const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

export class OpenAiError extends Error {
  constructor(code, message, { statusCode = 502, details = {} } = {}) {
    super(message);
    this.name = 'OpenAiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getOpenAiConfig() {
  const maxOutputTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS || 0);

  return {
    baseUrl: stripTrailingSlash(process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL),
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    timeoutMs: Number(process.env.AI_PROVIDER_TIMEOUT_MS || 20000),
    maxOutputTokens: Number.isFinite(maxOutputTokens) && maxOutputTokens > 0 ? maxOutputTokens : null,
  };
}

export function getOpenAiConfigStatus() {
  const config = getOpenAiConfig();
  const missing = [];

  if (!config.apiKey) missing.push('OPENAI_API_KEY');
  if (!config.model) missing.push('OPENAI_MODEL');

  let baseUrlHost = null;
  try {
    baseUrlHost = new URL(config.baseUrl).host;
  } catch {
    missing.push('OPENAI_BASE_URL_VALID_URL');
  }

  return {
    configured: missing.length === 0,
    apiKeyConfigured: Boolean(config.apiKey),
    modelConfigured: Boolean(config.model),
    model: config.model || null,
    baseUrlHost,
    missing: [...new Set(missing)],
  };
}

function getResponsesUrl(baseUrl) {
  return `${stripTrailingSlash(baseUrl)}/responses`;
}

function getChatCompletionsUrl(baseUrl) {
  return `${stripTrailingSlash(baseUrl)}/chat/completions`;
}

async function postJson(url, body, config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = json.error?.message || json.message || response.statusText;
      throw new OpenAiError(
        'OPENAI_REQUEST_FAILED',
        `OpenAI request failed (${response.status}): ${message}`,
        {
          statusCode: response.status >= 500 ? 502 : response.status,
          details: { openAiStatus: response.status },
        }
      );
    }

    return json;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new OpenAiError(
        'OPENAI_TIMEOUT',
        `OpenAI request timed out after ${config.timeoutMs}ms`,
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
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
}

export async function completeWithOpenAi({ messages }) {
  const config = getOpenAiConfig();
  if (!getOpenAiConfigStatus().configured) {
    const status = getOpenAiConfigStatus();
    throw new OpenAiError(
      'OPENAI_CONFIG_INCOMPLETE',
      `OpenAI is not configured. Missing: ${status.missing.join(', ') || 'unknown'}`,
      { statusCode: 503, details: { missing: status.missing } }
    );
  }

  const { system, conversation } = splitMessages(messages);
  const chatMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...conversation,
  ];

  try {
    const payload = await postJson(
      getChatCompletionsUrl(config.baseUrl),
      {
        model: config.model,
        messages: chatMessages,
        temperature: 0.4,
        ...(config.maxOutputTokens ? { max_tokens: config.maxOutputTokens } : {}),
      },
      config
    );

    return {
      text: payload.choices?.[0]?.message?.content || '',
      provider: 'openai',
      model: payload.model || config.model,
      usage: normalizeUsage(payload.usage),
      finishReason: payload.choices?.[0]?.finish_reason,
    };
  } catch (chatError) {
    const payload = await postJson(
      getResponsesUrl(config.baseUrl),
      {
        model: config.model,
        instructions: system,
        input: conversation,
        ...(config.maxOutputTokens ? { max_output_tokens: config.maxOutputTokens } : {}),
      },
      config
    );

    return {
      text: extractResponsesText(payload),
      provider: 'openai',
      model: payload.model || config.model,
      usage: normalizeUsage(payload.usage),
      finishReason: payload.status,
      fallbackReason: `chat-completions: ${chatError.message}`,
    };
  }
}
