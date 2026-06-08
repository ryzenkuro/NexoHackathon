import { completeText } from '../services/ai/aiGateway.js';
import { loadTrendAiContext } from '../services/ai/nexoContext.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

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
  const { message, trendId } = req.body;
  const userId = req.user?.id;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  if (!isSupabaseConfigured || !supabase) {
    return res.status(503).json({ error: 'Database is not configured' });
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const history = await loadChatHistory({ userId, trendId });
    const { trend } = trendId
      ? await loadTrendAiContext(trendId)
      : { trend: null };

    const result = await completeText({
      promptId: 'chat',
      variables: { message, trend },
      history,
      metadata: { feature: 'chat-stream', trendId, userId },
    });

    await streamTextAsChunks(res, result.text);
    await saveChatTurn({ userId, trendId, message, answer: result.text });

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
