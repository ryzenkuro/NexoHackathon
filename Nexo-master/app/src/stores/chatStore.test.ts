import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_CONFIG } from '@/lib/constants';
import { useAuthStore } from './authStore';
import { useChatStore } from './chatStore';

function getJakartaDateKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function createSseResponse(events: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      events.forEach((event) => controller.enqueue(encoder.encode(event)));
      controller.close();
    },
  });

  return {
    ok: true,
    status: 200,
    body,
    json: async () => ({}),
  } as Response;
}

function createErrorResponse(status: number, error: string) {
  return {
    ok: false,
    status,
    body: null,
    json: async () => ({ error }),
  } as unknown as Response;
}

describe('chatStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Demo User',
        phone: '081234567890',
      },
      isAuthenticated: true,
      isLoading: false,
      token: 'test-token',
    });
    useChatStore.setState({
      sessions: {},
      welcomes: {},
      welcomeLoading: {},
      welcomeErrors: {},
      requests: {},
      dailyCount: 0,
      activeUserId: 'user-1',
      usageDate: getJakartaDateKey(),
    });
  });

  it('moves from analyzing to a completed streamed answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(createSseResponse([
      'data: {"chunk":"Jawaban "}\n\n',
      'data: {"chunk":"Nexo"}\n\n',
      'data: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const requestPromise = useChatStore.getState().streamChat('trend-1', 'Apa peluangnya?');
    expect(useChatStore.getState().requests['trend-1']?.phase).toBe('analyzing');
    expect(useChatStore.getState().sessions['trend-1']?.messages).toHaveLength(1);

    await requestPromise;

    const state = useChatStore.getState();
    expect(state.requests['trend-1']?.phase).toBe('idle');
    expect(state.sessions['trend-1']?.messages).toHaveLength(2);
    expect(state.sessions['trend-1']?.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Jawaban Nexo',
      status: 'complete',
    });
    expect(state.dailyCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/chat'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('retries a failed request without duplicating the user message', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createErrorResponse(503, 'Layanan AI sibuk'))
      .mockResolvedValueOnce(createSseResponse([
        'data: {"chunk":"Berhasil setelah retry"}\n\n',
        'data: [DONE]\n\n',
      ]));
    vi.stubGlobal('fetch', fetchMock);

    await useChatStore.getState().streamChat('trend-2', 'Coba analisis');
    expect(useChatStore.getState().requests['trend-2']).toMatchObject({
      phase: 'failed',
      retryable: true,
    });

    await useChatStore.getState().retryFailedChat('trend-2');

    const messages = useChatStore.getState().sessions['trend-2']?.messages ?? [];
    expect(messages.filter((message) => message.role === 'user')).toHaveLength(1);
    expect(messages.filter((message) => message.role === 'assistant')).toHaveLength(1);
    expect(messages[1]?.content).toBe('Berhasil setelah retry');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('marks a partial answer as failed when SSE returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createSseResponse([
      'data: {"chunk":"Jawaban parsial"}\n\n',
      'data: {"error":"Stream terputus","code":"AI_STREAM_FAILED"}\n\n',
      'data: [DONE]\n\n',
    ])));

    await useChatStore.getState().streamChat('trend-3', 'Lanjutkan');

    const state = useChatStore.getState();
    expect(state.requests['trend-3']).toMatchObject({
      phase: 'failed',
      retryable: true,
      error: 'Stream terputus',
    });
    expect(state.sessions['trend-3']?.messages[1]).toMatchObject({
      content: 'Jawaban parsial',
      status: 'failed',
    });
    expect(state.dailyCount).toBe(0);
  });

  it('keeps chatting after the visual counter reaches zero', async () => {
    useChatStore.setState({ dailyCount: APP_CONFIG.maxChatsPerDay });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createSseResponse([
      'data: {"chunk":"Chat tetap berjalan"}\n\n',
      'data: [DONE]\n\n',
    ])));

    await useChatStore.getState().streamChat('trend-4', 'Pertanyaan setelah nol');

    const state = useChatStore.getState();
    expect(state.requests['trend-4']).toMatchObject({
      phase: 'idle',
    });
    expect(state.sessions['trend-4']?.messages[1]?.content).toBe('Chat tetap berjalan');
    expect(state.dailyCount).toBe(APP_CONFIG.maxChatsPerDay);
  });

  it('starts a different account with a fresh visual counter', () => {
    useChatStore.setState({ dailyCount: APP_CONFIG.maxChatsPerDay });

    useChatStore.getState().syncUser('user-2');

    expect(useChatStore.getState()).toMatchObject({
      activeUserId: 'user-2',
      dailyCount: 0,
      sessions: {},
      requests: {},
    });
  });

  it('resets the visual counter on a new Jakarta date without clearing the session', () => {
    useChatStore.setState({
      dailyCount: APP_CONFIG.maxChatsPerDay,
      usageDate: '2020-01-01',
      sessions: {
        'trend-1': {
          trendId: 'trend-1',
          messages: [],
        },
      },
    });

    useChatStore.getState().syncUser('user-1');

    expect(useChatStore.getState().dailyCount).toBe(0);
    expect(useChatStore.getState().sessions['trend-1']).toBeDefined();
  });

  it('retries a failed welcome request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createErrorResponse(503, 'Pembuka gagal'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            welcome: {
              title: 'Halo',
              subtitle: 'Mari membahas tren.',
              suggestions: ['Apa risikonya?'],
            },
          },
        }),
      } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await useChatStore.getState().fetchWelcome('trend-5');
    expect(useChatStore.getState().welcomeErrors['trend-5']).toBe('Pembuka gagal');

    await useChatStore.getState().retryWelcome('trend-5');
    expect(useChatStore.getState().welcomes['trend-5']?.title).toBe('Halo');
    expect(useChatStore.getState().welcomeErrors['trend-5']).toBeNull();
  });
});
