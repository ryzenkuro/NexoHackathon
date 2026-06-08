import { create } from 'zustand';
import { APP_CONFIG } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

export type ChatMessageStatus = 'streaming' | 'complete' | 'failed';
export type ChatRequestPhase = 'idle' | 'analyzing' | 'streaming' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: ChatMessageStatus;
}

export interface ChatSession {
  trendId: string;
  messages: ChatMessage[];
}

export interface ChatWelcome {
  title: string;
  subtitle: string;
  suggestions: string[];
  provider?: string;
  model?: string;
  runId?: string;
}

export interface ChatRequestState {
  phase: ChatRequestPhase;
  trendId: string;
  userMessageId?: string;
  assistantMessageId?: string;
  originalMessage?: string;
  error?: string;
  errorCode?: string;
  retryable: boolean;
}

interface ChatState {
  sessions: Record<string, ChatSession>;
  welcomes: Record<string, ChatWelcome>;
  welcomeLoading: Record<string, boolean>;
  welcomeErrors: Record<string, string | null>;
  requests: Record<string, ChatRequestState>;
  dailyCount: number;
  activeUserId: string | null;
  usageDate: string;

  addMessage: (trendId: string, role: 'user' | 'assistant', content: string) => void;
  fetchWelcome: (trendId: string) => Promise<void>;
  retryWelcome: (trendId: string) => Promise<void>;
  streamChat: (trendId: string, message: string) => Promise<void>;
  retryFailedChat: (trendId: string) => Promise<void>;
  clearSession: (trendId: string) => void;
  getSession: (trendId: string) => ChatSession;
  syncUser: (userId: string | null) => void;
}

interface ChatFailureOptions {
  status?: number;
  code?: string;
  retryable?: boolean;
}

class ChatRequestFailure extends Error {
  status?: number;
  code?: string;
  retryable: boolean;

  constructor(message: string, options: ChatFailureOptions = {}) {
    super(message);
    this.name = 'ChatRequestFailure';
    this.status = options.status;
    this.code = options.code;
    this.retryable = options.retryable ?? true;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const CHAT_USAGE_STORAGE_KEY = 'nexo_chat_usage_v1';

interface StoredChatUsage {
  date: string;
  count: number;
}

function getJakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function readStoredUsage(userId: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_USAGE_STORAGE_KEY) || '{}') as Record<string, StoredChatUsage>;
    const usage = stored[userId];
    if (!usage || usage.date !== getJakartaDateKey()) return 0;
    return Math.min(APP_CONFIG.maxChatsPerDay, Math.max(0, Number(usage.count) || 0));
  } catch {
    return 0;
  }
}

function writeStoredUsage(userId: string, count: number) {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_USAGE_STORAGE_KEY) || '{}') as Record<string, StoredChatUsage>;
    stored[userId] = {
      date: getJakartaDateKey(),
      count: Math.min(APP_CONFIG.maxChatsPerDay, Math.max(0, count)),
    };
    localStorage.setItem(CHAT_USAGE_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // The visual counter can remain in memory when browser storage is unavailable.
  }
}

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRequestActive(request?: ChatRequestState) {
  return request?.phase === 'analyzing' || request?.phase === 'streaming';
}

function isRetryableHttpStatus(status: number) {
  return status >= 500 || status === 408 || status === 425 || status === 429;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Nexo AI belum berhasil menjawab. Silakan coba lagi.';
}

export const useChatStore = create<ChatState>((set, get) => {
  async function executeChatRequest(
    trendId: string,
    message: string,
    userMessageId: string,
    previousAssistantMessageId?: string,
  ) {
    let assistantMessageId = previousAssistantMessageId;
    let fullContent = '';
    let receivedChunk = false;

    try {
      const { token, user } = useAuthStore.getState();
      if (!token || !user?.id) {
        throw new ChatRequestFailure('Sesi login berakhir. Silakan login kembali.', {
          status: 401,
          code: 'UNAUTHORIZED',
          retryable: false,
        });
      }
      const requestUserId = user.id;

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, trendId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage = data.error || 'Nexo AI belum berhasil menjawab.';
        throw new ChatRequestFailure(errorMessage, {
          status: res.status,
          code: data.code,
          retryable: isRetryableHttpStatus(res.status),
        });
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new ChatRequestFailure('Respons Nexo AI tidak dapat dibaca.');
      }

      const decoder = new TextDecoder();
      let eventBuffer = '';
      let streamDone = false;

      const processEvent = (event: string) => {
        for (const rawLine of event.split('\n')) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();

          if (data === '[DONE]') {
            streamDone = true;
            continue;
          }

          let parsed: { chunk?: string; error?: string; code?: string };
          try {
            parsed = JSON.parse(data) as { chunk?: string; error?: string; code?: string };
          } catch {
            continue;
          }

          if (parsed.error) {
            throw new ChatRequestFailure(parsed.error, {
              code: parsed.code || 'AI_STREAM_FAILED',
              retryable: true,
            });
          }

          if (!parsed.chunk) continue;

          fullContent += parsed.chunk;
          receivedChunk = true;
          const currentAssistantId = assistantMessageId || createMessageId();
          assistantMessageId = currentAssistantId;
          set((state) => {
            const session = state.sessions[trendId] ?? { trendId, messages: [] };
            const existingIndex = session.messages.findIndex((item) => item.id === currentAssistantId);
            const nextMessage: ChatMessage = {
              id: currentAssistantId,
              role: 'assistant',
              content: fullContent,
              timestamp: new Date().toISOString(),
              status: 'streaming',
            };
            const messages = existingIndex >= 0
              ? session.messages.map((item, index) => index === existingIndex ? nextMessage : item)
              : [...session.messages, nextMessage];

            return {
              sessions: {
                ...state.sessions,
                [trendId]: { ...session, messages },
              },
              requests: {
                ...state.requests,
                [trendId]: {
                  phase: 'streaming',
                  trendId,
                  userMessageId,
                  assistantMessageId: currentAssistantId,
                  originalMessage: message,
                  retryable: false,
                },
              },
            };
          });
        }
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        eventBuffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        const events = eventBuffer.split('\n\n');
        eventBuffer = events.pop() || '';
        events.forEach(processEvent);
      }

      eventBuffer += decoder.decode().replace(/\r\n/g, '\n');
      if (eventBuffer.trim()) processEvent(eventBuffer);

      if (!receivedChunk || !assistantMessageId) {
        throw new ChatRequestFailure('Nexo AI belum menghasilkan jawaban.');
      }

      const completedAssistantId = assistantMessageId;
      set((state) => {
        const session = state.sessions[trendId];
        const messages = session
          ? session.messages.map((item) => item.id === completedAssistantId
            ? { ...item, status: 'complete' as const }
            : item)
          : [];

        return {
          sessions: session
            ? { ...state.sessions, [trendId]: { ...session, messages } }
            : state.sessions,
          requests: {
            ...state.requests,
            [trendId]: {
              phase: 'idle',
              trendId,
              retryable: false,
            },
          },
          dailyCount: state.activeUserId === requestUserId
            ? Math.min(APP_CONFIG.maxChatsPerDay, state.dailyCount + 1)
            : state.dailyCount,
        };
      });
      const nextDailyCount = get().activeUserId === requestUserId
        ? get().dailyCount
        : Math.min(APP_CONFIG.maxChatsPerDay, readStoredUsage(requestUserId) + 1);
      writeStoredUsage(requestUserId, nextDailyCount);
    } catch (error) {
      const failure = error instanceof ChatRequestFailure
        ? error
        : new ChatRequestFailure(getErrorMessage(error));
      const failedAssistantId = assistantMessageId;

      set((state) => {
        const session = state.sessions[trendId];
        const messages = session && failedAssistantId
          ? session.messages.map((item) => item.id === failedAssistantId
            ? { ...item, status: 'failed' as const }
            : item)
          : session?.messages;

        return {
          sessions: session && messages
            ? { ...state.sessions, [trendId]: { ...session, messages } }
            : state.sessions,
          requests: {
            ...state.requests,
            [trendId]: {
              phase: 'failed',
              trendId,
              userMessageId,
              assistantMessageId: failedAssistantId,
              originalMessage: message,
              error: failure.message,
              errorCode: failure.code,
              retryable: failure.retryable,
            },
          },
        };
      });
    }
  }

  return {
    sessions: {},
    welcomes: {},
    welcomeLoading: {},
    welcomeErrors: {},
    requests: {},
    dailyCount: 0,
    activeUserId: null,
    usageDate: getJakartaDateKey(),

    addMessage: (trendId, role, content) =>
      set((state) => {
        const session = state.sessions[trendId] ?? { trendId, messages: [] };
        return {
          sessions: {
            ...state.sessions,
            [trendId]: {
              ...session,
              messages: [
                ...session.messages,
                {
                  id: createMessageId(),
                  role,
                  content,
                  timestamp: new Date().toISOString(),
                  status: 'complete',
                },
              ],
            },
          },
        };
      }),

    fetchWelcome: async (trendId) => {
      const state = get();
      if (state.welcomes[trendId] || state.welcomeLoading[trendId]) return;

      set((current) => ({
        welcomeLoading: { ...current.welcomeLoading, [trendId]: true },
        welcomeErrors: { ...current.welcomeErrors, [trendId]: null },
      }));

      try {
        const res = await fetch(`${API_URL}/ai/trends/${encodeURIComponent(trendId)}/welcome`);
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Gagal memuat pembuka chat');

        const welcome = payload.data?.welcome;
        if (!welcome) throw new Error('Respons pembuka chat tidak valid');

        set((current) => ({
          welcomes: {
            ...current.welcomes,
            [trendId]: {
              title: welcome.title,
              subtitle: welcome.subtitle,
              suggestions: welcome.suggestions,
              provider: payload.data.provider,
              model: payload.data.model,
              runId: payload.data.runId,
            },
          },
          welcomeLoading: { ...current.welcomeLoading, [trendId]: false },
          welcomeErrors: { ...current.welcomeErrors, [trendId]: null },
        }));
      } catch (error) {
        set((current) => ({
          welcomeLoading: { ...current.welcomeLoading, [trendId]: false },
          welcomeErrors: {
            ...current.welcomeErrors,
            [trendId]: getErrorMessage(error),
          },
        }));
      }
    },

    retryWelcome: async (trendId) => {
      set((state) => ({
        welcomeErrors: { ...state.welcomeErrors, [trendId]: null },
      }));
      await get().fetchWelcome(trendId);
    },

    streamChat: async (trendId, message) => {
      const userId = useAuthStore.getState().user?.id ?? null;
      get().syncUser(userId);

      const currentRequest = get().requests[trendId];
      if (isRequestActive(currentRequest)) return;

      const userMessageId = createMessageId();
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        status: 'complete',
      };

      set((state) => {
        const session = state.sessions[trendId] ?? { trendId, messages: [] };
        return {
          sessions: {
            ...state.sessions,
            [trendId]: {
              ...session,
              messages: [...session.messages, userMessage],
            },
          },
          requests: {
            ...state.requests,
            [trendId]: {
              phase: 'analyzing',
              trendId,
              userMessageId,
              originalMessage: message,
              retryable: false,
            },
          },
        };
      });

      await executeChatRequest(trendId, message, userMessageId);
    },

    retryFailedChat: async (trendId) => {
      const request = get().requests[trendId];
      if (request?.phase !== 'failed' || !request.retryable || !request.originalMessage || !request.userMessageId) {
        return;
      }

      set((state) => {
        const session = state.sessions[trendId];
        const messages = session && request.assistantMessageId
          ? session.messages.filter((item) => item.id !== request.assistantMessageId)
          : session?.messages;

        return {
          sessions: session && messages
            ? { ...state.sessions, [trendId]: { ...session, messages } }
            : state.sessions,
          requests: {
            ...state.requests,
            [trendId]: {
              phase: 'analyzing',
              trendId,
              userMessageId: request.userMessageId,
              assistantMessageId: request.assistantMessageId,
              originalMessage: request.originalMessage,
              retryable: false,
            },
          },
        };
      });

      await executeChatRequest(
        trendId,
        request.originalMessage,
        request.userMessageId,
        request.assistantMessageId,
      );
    },

    clearSession: (trendId) =>
      set((state) => {
        if (isRequestActive(state.requests[trendId])) return state;
        const sessions = { ...state.sessions };
        const requests = { ...state.requests };
        delete sessions[trendId];
        delete requests[trendId];
        return { sessions, requests };
      }),

    getSession: (trendId) => {
      return get().sessions[trendId] ?? { trendId, messages: [] };
    },

    syncUser: (userId) =>
      set((state) => {
        const usageDate = getJakartaDateKey();
        if (state.activeUserId === userId && state.usageDate === usageDate) return state;
        if (state.activeUserId === userId) {
          return {
            usageDate,
            dailyCount: userId ? readStoredUsage(userId) : 0,
          };
        }
        return {
          activeUserId: userId,
          usageDate,
          dailyCount: userId ? readStoredUsage(userId) : 0,
          sessions: {},
          requests: {},
        };
      }),
  };
});
