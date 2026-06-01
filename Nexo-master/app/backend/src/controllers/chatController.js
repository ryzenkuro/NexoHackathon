import crypto from 'crypto';
import { completeText } from '../services/ai/aiGateway.js';
import { loadTrendAiContext } from '../services/ai/nexoContext.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const CHAT_DAILY_LIMIT = 20;

function writeEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function streamTextAsChunks(res, text) {
  const chunks = String(text || '').match(/\S+\s*/g) || [''];
  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, 22));
    writeEvent(res, { chunk });
  }
}

function startOfTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function toStorageUserId(value) {
  const raw = String(value || 'anonymous');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }

  const hex = crypto.createHash('sha256').update(raw).digest('hex');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

async function getDailyUserMessageCount(userId) {
  const { count, error } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', startOfTodayIso());

  if (error) throw error;
  return count ?? 0;
}

async function ensureChatUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return;

  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    phone: `chat-${userId.slice(0, 18)}`,
    name: 'Nexo Chat User',
    password_hash: 'chat-session-managed',
    business_category: 'Umum',
    verified: true,
  });

  if (insertError) throw insertError;
}

async function loadChatHistory({ userId, trendId }) {
  let query = supabase
    .from('chat_messages')
    .select('role,content,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12);

  query = trendId ? query.eq('trend_id', trendId) : query.is('trend_id', null);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .reverse()
    .map((item) => ({ role: item.role, content: item.content }));
}

async function saveChatTurn({ userId, trendId, message, answer }) {
  const rows = [
    { user_id: userId, trend_id: trendId || null, role: 'user', content: message },
    { user_id: userId, trend_id: trendId || null, role: 'assistant', content: answer },
  ];
  const { error } = await supabase.from('chat_messages').insert(rows);
  if (error) throw error;
}

export async function streamChat(req, res) {
  const { message, trendId, userId = 'anonymous' } = req.body;
  const storageUserId = toStorageUserId(userId);

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!isSupabaseConfigured || !supabase) {
    return res.status(503).json({ error: 'Database is not configured' });
  }

  try {
    await ensureChatUser(storageUserId);
    const userCount = await getDailyUserMessageCount(storageUserId);
    if (userCount >= CHAT_DAILY_LIMIT) {
      return res.status(429).json({
        error: 'Batas 20 chat per hari tercapai. Coba lagi besok.',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const history = await loadChatHistory({ userId: storageUserId, trendId });
    const { trend } = trendId
      ? await loadTrendAiContext(trendId)
      : { trend: null };

    const result = await completeText({
      promptId: 'chat',
      variables: { message, trend },
      history,
      metadata: { feature: 'chat-stream', trendId, userId, storageUserId },
    });

    await streamTextAsChunks(res, result.text);
    await saveChatTurn({ userId: storageUserId, trendId, message, answer: result.text });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[chat] stream error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Terjadi kesalahan. Silakan coba lagi.',
        code: error?.code || 'AI_STREAM_FAILED',
        detail: error?.message,
      });
    }
    writeEvent(res, {
      error: 'Terjadi kesalahan. Silakan coba lagi.',
      code: error?.code || 'AI_STREAM_FAILED',
      detail: error?.message,
    });
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
