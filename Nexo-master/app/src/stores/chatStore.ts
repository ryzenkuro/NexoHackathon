import { create } from 'zustand';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
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

interface ChatState {
  sessions: Record<string, ChatSession>;
  welcomes: Record<string, ChatWelcome>;
  welcomeLoading: Record<string, boolean>;
  welcomeErrors: Record<string, string | null>;
  isStreaming: boolean;
  streamError: string | null;
  dailyCount: number;

  addMessage: (trendId: string, role: 'user' | 'assistant', content: string) => void;
  fetchWelcome: (trendId: string) => Promise<void>;
  streamChat: (trendId: string, message: string, trendName: string) => Promise<void>;
  clearSession: (trendId: string) => void;
  getSession: (trendId: string) => ChatSession;
  setDailyCount: (count: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: {},
  welcomes: {},
  welcomeLoading: {},
  welcomeErrors: {},
  isStreaming: false,
  streamError: null,
  dailyCount: 0,

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
              { role, content, timestamp: new Date().toISOString() },
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
      }));
    } catch (err) {
      set((current) => ({
        welcomeLoading: { ...current.welcomeLoading, [trendId]: false },
        welcomeErrors: {
          ...current.welcomeErrors,
          [trendId]: (err as Error).message,
        },
      }));
    }
  },

  streamChat: async (trendId, message, _trendName) => {
    get().addMessage(trendId, 'user', message);
    set({ isStreaming: true, streamError: null });

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, trendId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          set({
            isStreaming: false,
            streamError: data.error || 'Batas harian tercapai',
            dailyCount: 20,
          });
          get().addMessage(trendId, 'assistant', data.error || 'Batas 20 chat per hari tercapai. Coba lagi besok ya.');
          return;
        }
        throw new Error(data.error);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      set((state) => {
        const sess = state.sessions[trendId] ?? { trendId, messages: [] };
        return {
          sessions: {
            ...state.sessions,
            [trendId]: {
              ...sess,
              messages: [
                ...sess.messages,
                { role: 'assistant', content: '', timestamp: new Date().toISOString(), isStreaming: true },
              ],
            },
          },
        };
      });

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                fullContent += parsed.chunk;
                set((state) => {
                  const sess = state.sessions[trendId];
                  if (!sess) return state;
                  const messages = [...sess.messages];
                  const lastMsg = messages[messages.length - 1];
                  if (lastMsg && lastMsg.isStreaming) {
                    lastMsg.content = fullContent;
                  }
                  return {
                    sessions: {
                      ...state.sessions,
                      [trendId]: { ...sess, messages },
                    },
                  };
                });
              }
              if (parsed.error) {
                set({ streamError: parsed.error });
              }
            } catch {
              // Ignore parse errors for non-JSON data.
            }
          }
        }
      }

      set((state) => {
        const sess = state.sessions[trendId];
        if (!sess) return state;
        const messages = [...sess.messages];
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.isStreaming) {
          lastMsg.isStreaming = false;
        }
        return {
          sessions: {
            ...state.sessions,
            [trendId]: { ...sess, messages },
          },
          isStreaming: false,
          dailyCount: state.dailyCount + 1,
        };
      });
    } catch (err) {
      set({ isStreaming: false, streamError: (err as Error).message });
      get().addMessage(trendId, 'assistant', 'Maaf, terjadi kesalahan. Silakan coba lagi ya.');
    }
  },

  clearSession: (trendId) =>
    set((state) => {
      const sessions = { ...state.sessions };
      delete sessions[trendId];
      return { sessions };
    }),

  getSession: (trendId) => {
    return get().sessions[trendId] ?? { trendId, messages: [] };
  },

  setDailyCount: (count) => set({ dailyCount: count }),
}));
