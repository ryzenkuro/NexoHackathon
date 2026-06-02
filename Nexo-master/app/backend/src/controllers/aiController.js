import { completeText, getAiRuntimeStatus } from '../services/ai/aiGateway.js';
import { listAiRuns } from '../services/ai/traceStore.js';
import { getResearchLakeSummary } from '../services/research/researchLakeStore.js';
import {
  loadContentAiContext,
  loadDashboardAiContext,
  loadTrendAiContext,
} from '../services/ai/nexoContext.js';
import {
  buildContentStructuredInsight,
  buildTrendStructuredInsight,
  contentInsightToText,
  trendInsightToText,
} from '../services/ai/insightGenerator.js';

const recommendationCache = new Map();
const contentAnalysisCache = new Map();

function getRecommendationCacheTtlMs() {
  const configured = Number(process.env.AI_RECOMMENDATION_CACHE_TTL_MS || 10 * 60 * 1000);
  return Number.isFinite(configured) && configured >= 0 ? configured : 10 * 60 * 1000;
}

function getRecommendationMode(value) {
  return String(value || '').toLowerCase() === 'saturation' ? 'saturation' : 'trend';
}

function getCachedRecommendation(cacheKey) {
  const ttlMs = getRecommendationCacheTtlMs();
  if (ttlMs <= 0) return null;

  const cached = recommendationCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > ttlMs) {
    recommendationCache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

function setCachedRecommendation(cacheKey, payload) {
  const ttlMs = getRecommendationCacheTtlMs();
  if (ttlMs <= 0) return;
  recommendationCache.set(cacheKey, { createdAt: Date.now(), payload });
}

function getCachedContentAnalysis(cacheKey) {
  const ttlMs = getRecommendationCacheTtlMs();
  if (ttlMs <= 0) return null;

  const cached = contentAnalysisCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > ttlMs) {
    contentAnalysisCache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

function setCachedContentAnalysis(cacheKey, payload) {
  const ttlMs = getRecommendationCacheTtlMs();
  if (ttlMs <= 0) return;
  contentAnalysisCache.set(cacheKey, { createdAt: Date.now(), payload });
}

function sendAiResult(res, result, extra = {}) {
  return res.json({
    data: {
      text: result.text,
      promptId: result.promptId,
      provider: result.provider,
      model: result.model,
      runId: result.runId,
      evaluation: result.evaluation,
      usage: result.usage,
      finishReason: result.finishReason,
      fallbackReason: result.fallbackReason,
      ...extra,
    },
  });
}

function sendAiError(res, error, fallbackMessage) {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const safeStatusCode = statusCode >= 400 && statusCode < 600 ? statusCode : 500;

  return res.status(safeStatusCode).json({
    error: fallbackMessage,
    code: error?.code || 'AI_REQUEST_FAILED',
    detail: error?.message || fallbackMessage,
    fallbackReason: error?.fallbackReason,
    runtime: getAiRuntimeStatus(),
  });
}

function parseJsonObject(text) {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || raw.match(/\{[\s\S]*\}/)?.[0] || raw;
  return JSON.parse(candidate);
}

function normalizeRecommendation(payload, mode) {
  const decision = String(payload.decision || '').trim().slice(0, 50);
  const summary = String(payload.summary || '').trim().slice(0, 180);
  
  const reasons = Array.isArray(payload.reasons)
    ? payload.reasons.map((r) => String(r || '').trim().slice(0, 120)).filter(Boolean).slice(0, 2)
    : [];
  
  const actions = Array.isArray(payload.actions)
    ? payload.actions.map((a) => String(a || '').trim().slice(0, 120)).filter(Boolean).slice(0, 2)
    : [];
  
  const risks = Array.isArray(payload.risks)
    ? payload.risks.map((r) => String(r || '').trim().slice(0, 120)).filter(Boolean).slice(0, 2)
    : [];

  return {
    decision: decision || (mode === 'saturation' ? 'Pantau dulu' : 'Aman masuk'),
    summary: summary || 'Produk ini memerlukan analisis lebih lanjut.',
    reasons: reasons.length > 0 ? reasons : ['Data terbatas untuk analisis mendalam'],
    actions: actions.length > 0 ? actions : ['Pantau perkembangan tren'],
    ...(risks.length > 0 && { risks }),
    ...(mode === 'saturation' && risks.length === 0 && { risks: ['Risiko perlu evaluasi manual'] }),
  };
}

function fallbackRecommendationFromText(text, mode) {
  const cleaned = String(text || '').trim();
  
  const decisionMatch = cleaned.match(/(?:keputusan|decision)\s*:?\s*([^\n.]+)/i);
  const decision = decisionMatch?.[1]?.trim() || (mode === 'saturation' ? 'Pantau dulu' : 'Aman masuk');
  
  const summaryMatch = cleaned.match(/(?:ringkasan|summary)\s*:?\s*([^\n]+)/i);
  const summary = summaryMatch?.[1]?.trim() || cleaned.split('\n')[0] || 'Produk ini memerlukan analisis lebih lanjut.';
  
  const reasonsBlock = cleaned.match(/(?:alasan|reasons?)\s*:?\s*([\s\S]*?)(?=(?:risiko|aksi|actions?|$))/i)?.[1] || '';
  const reasons = reasonsBlock
    .split(/\n|[12]\)|[-•]/)
    .map((line) => line.trim())
    .filter((line) => line && line.length > 10)
    .slice(0, 2);
  
  const actionsBlock = cleaned.match(/(?:aksi|actions?)\s*(?:24 jam|cepat)?\s*:?\s*([\s\S]*?)$/i)?.[1] || '';
  const actions = actionsBlock
    .split(/\n|[12]\)|[-•]/)
    .map((line) => line.trim())
    .filter((line) => line && line.length > 5)
    .slice(0, 2);
  
  const risksBlock = mode === 'saturation' 
    ? cleaned.match(/(?:risiko)\s*(?:utama)?\s*:?\s*([\s\S]*?)(?=(?:aksi|actions?|$))/i)?.[1] || ''
    : '';
  const risks = risksBlock
    .split(/\n|[12]\)|[-•]/)
    .map((line) => line.trim())
    .filter((line) => line && line.length > 10)
    .slice(0, 2);

  return normalizeRecommendation({
    decision,
    summary,
    reasons: reasons.length > 0 ? reasons : undefined,
    actions: actions.length > 0 ? actions : undefined,
    risks: risks.length > 0 ? risks : undefined,
  }, mode);
}

function normalizeWelcome(payload, trend) {
  const suggestions = Array.isArray(payload.suggestions)
    ? payload.suggestions
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 3)
    : [];

  return {
    title: String(payload.title || 'Halo, saya Nexo').trim().slice(0, 80),
    subtitle: String(
      payload.subtitle ||
      `Tanya apa saja seputar tren ${trend?.name || 'produk'}, mulai dari modal sampai strategi marketing.`
    ).trim().slice(0, 180),
    suggestions: suggestions.length === 3
      ? suggestions
      : [
        'Berapa modal awal yang aman?',
        'Apa risiko utama tren ini?',
        'Strategi konten apa yang cocok?',
      ],
  };
}

function fallbackWelcomeFromAiText(text, trend) {
  const cleaned = String(text || '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const title = cleaned.match(/"title"\s*:\s*"([^"]+)/i)?.[1];
  const subtitle = cleaned.match(/"subtitle"\s*:\s*"([^"]+)/i)?.[1];
  const suggestionBlock = cleaned.match(/"suggestions"\s*:\s*\[([\s\S]*?)\]/i)?.[1] || '';
  const quotedSuggestions = [...suggestionBlock.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .slice(0, 3);

  const lines = cleaned
    .split('\n')
    .map((line) => line
      .replace(/"?(title|subtitle|suggestions)"?\s*:\s*/i, '')
      .replace(/^[-*"'\s,[\]]+|["'\s,[\]]+$/g, '')
      .trim())
    .filter((line) => line && !/[{}]/.test(line) && !line.includes(':'))
    .slice(0, 3);

  return normalizeWelcome({
    title: title || trend?.name || 'Halo, saya Nexo',
    subtitle: subtitle || `Tanya apa saja seputar tren ${trend?.name || 'produk'}.`,
    suggestions: quotedSuggestions.length === 3 ? quotedSuggestions : lines,
  }, trend);
}

export function getAiHealth(_req, res) {
  return res.json({
    status: 'ok',
    runtime: getAiRuntimeStatus(),
    endpoints: [
      'POST /api/ai/insights/dashboard',
      'GET /api/ai/trends/:id/recommendation',
      'GET /api/ai/trends/:id/recommendation?mode=saturation',
      'GET /api/ai/content/:id/analysis',
      'GET /api/ai/trends/:id/welcome',
      'POST /api/ai/chat',
      'GET /api/ai/runs',
      'GET /api/ai/lakehouse/summary',
    ],
  });
}

export async function generateChatWelcome(req, res) {
  try {
    const { trend, sourceStatus } = await loadTrendAiContext(req.params.id);
    if (!trend) return res.status(404).json({ error: 'Trend not found' });

    const result = await completeText({
      promptId: 'chat_welcome',
      variables: { trend },
      metadata: { feature: 'chat-welcome', trendId: trend.id },
    });

    let welcome;
    try {
      welcome = normalizeWelcome(parseJsonObject(result.text), trend);
    } catch {
      welcome = fallbackWelcomeFromAiText(result.text, trend);
    }

    return sendAiResult(res, result, { welcome, trend, sourceStatus });
  } catch (error) {
    console.error('[ai] chat welcome error:', error);
    return sendAiError(res, error, 'Failed to generate chat welcome');
  }
}

export async function generateDashboardInsight(_req, res) {
  try {
    const snapshot = await loadDashboardAiContext();
    const result = await completeText({
      promptId: 'dashboard_insight',
      variables: { snapshot },
      metadata: { feature: 'dashboard-insight' },
    });

    return sendAiResult(res, result, {
      snapshotUpdatedAt: snapshot.updatedAt,
      sourceStatus: snapshot.sourceStatus,
    });
  } catch (error) {
    console.error('[ai] dashboard insight error:', error);
    return sendAiError(res, error, 'Failed to generate dashboard insight');
  }
}

export async function generateTrendRecommendation(req, res) {
  try {
    const { trend, sourceStatus } = await loadTrendAiContext(req.params.id);
    if (!trend) return res.status(404).json({ error: 'Trend not found' });
    const mode = getRecommendationMode(req.query.mode);
    const promptId = mode === 'saturation' ? 'saturation_recommendation' : 'trend_recommendation';
    const cacheKey = `${promptId}:${trend.id}`;
    const cached = getCachedRecommendation(cacheKey);
    if (cached) {
      return res.json({ data: { ...cached, cached: true } });
    }

    const result = await completeText({
      promptId,
      variables: { trend },
      metadata: { feature: mode === 'saturation' ? 'saturation-recommendation' : 'trend-recommendation', trendId: trend.id },
    });

    const deterministicStructured = buildTrendStructuredInsight(trend, { mode });
    let structured = deterministicStructured;
    try {
      structured = normalizeRecommendation({
        ...deterministicStructured,
        ...parseJsonObject(result.text),
        decision: deterministicStructured.decision,
      }, mode);
    } catch {
      structured = normalizeRecommendation(deterministicStructured, mode);
    }

    const payload = {
      text: trendInsightToText(structured),
      structured,
      promptId: result.promptId,
      provider: result.provider,
      model: result.model,
      runId: result.runId,
      evaluation: result.evaluation,
      usage: result.usage,
      finishReason: result.finishReason,
      fallbackReason: result.fallbackReason,
      mode,
      trend,
      sourceStatus,
      cached: false,
    };
    setCachedRecommendation(cacheKey, payload);
    return res.json({ data: payload });
  } catch (error) {
    console.error('[ai] trend recommendation error:', error);
    return sendAiError(res, error, 'Failed to generate trend recommendation');
  }
}

export async function generateContentAnalysis(req, res) {
  try {
    const { content, trend, sourceStatus } = await loadContentAiContext(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });
    const cacheKey = `content_analysis:${content.id}:${trend?.id || 'no-trend'}`;
    const cached = getCachedContentAnalysis(cacheKey);
    if (cached) {
      return res.json({ data: { ...cached, cached: true } });
    }

    const result = await completeText({
      promptId: 'content_analysis',
      variables: { content, trend },
      metadata: { feature: 'content-analysis', contentId: content.id, trendId: trend?.id },
    });

    const structured = buildContentStructuredInsight(content, trend);
    const payload = {
      text: contentInsightToText(structured),
      structured,
      promptId: result.promptId,
      provider: result.provider,
      model: result.model,
      runId: result.runId,
      evaluation: result.evaluation,
      usage: result.usage,
      finishReason: result.finishReason,
      fallbackReason: result.fallbackReason,
      mode: 'content',
      content,
      trend,
      sourceStatus,
      cached: false,
    };
    setCachedContentAnalysis(cacheKey, payload);
    return res.json({ data: payload });
  } catch (error) {
    console.error('[ai] content analysis error:', error);
    return sendAiError(res, error, 'Failed to generate content analysis');
  }
}

export async function chatWithNexo(req, res) {
  try {
    const { message, trendId, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { trend, sourceStatus } = trendId
      ? await loadTrendAiContext(trendId)
      : { trend: null, sourceStatus: 'none' };

    const result = await completeText({
      promptId: 'chat',
      variables: { message, trend },
      history,
      metadata: { feature: 'ai-chat-json', trendId },
    });

    return sendAiResult(res, result, { trend, sourceStatus });
  } catch (error) {
    console.error('[ai] chat error:', error);
    return sendAiError(res, error, 'Failed to chat with Nexo AI');
  }
}

export async function getAiRuns(req, res) {
  return res.json({
    data: await listAiRuns(req.query.limit),
    runtime: getAiRuntimeStatus(),
  });
}

export async function getAiLakehouseSummary(_req, res) {
  return res.json({
    data: await getResearchLakeSummary(),
  });
}
