import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Send, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { useChatStore, useTrendStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { APP_CONFIG } from '@/lib/constants';

interface ChatbotPanelProps {
  onClose: () => void;
}

function MessageContent({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, idx) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={idx} className={line.startsWith('•') ? 'ml-2' : idx > 0 ? 'mt-1' : ''}>
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
            )}
          </p>
        );
      })}
    </>
  );
}

function WelcomeSkeleton() {
  return (
    <div className="flex justify-start fade-in">
      <div className="max-w-[88%] rounded-3xl rounded-bl-md bg-white/75 px-4 py-3 shadow-sm">
        <div className="mb-3 h-4 w-40 animate-pulse rounded-full bg-secondary-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-64 animate-pulse rounded-full bg-secondary-gray-100" />
          <div className="h-3 w-52 animate-pulse rounded-full bg-secondary-gray-100" />
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-secondary-gray-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-secondary-gray-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-secondary-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default function ChatbotPanel({ onClose }: ChatbotPanelProps) {
  const { selectedTrend } = useTrendStore();
  const { isAuthenticated } = useAuthStore();
  const {
    isStreaming,
    streamError,
    dailyCount,
    welcomes,
    welcomeLoading,
    welcomeErrors,
    addMessage,
    fetchWelcome,
    streamChat,
    clearSession,
  } = useChatStore();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trend = selectedTrend;

  const session = useChatStore((state) => trend ? state.sessions[trend.id] : undefined);
  const messages = useMemo(() => session?.messages ?? [], [session]);
  const welcome = trend ? welcomes[trend.id] : undefined;
  const isWelcomeLoading = Boolean(trend && welcomeLoading[trend.id]);
  const welcomeError = trend ? welcomeErrors[trend.id] : undefined;

  useEffect(() => {
    if (trend && messages.length === 0) {
      fetchWelcome(trend.id);
    }
  }, [fetchWelcome, messages.length, trend]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = useCallback((preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isStreaming || !trend) return;

    if (!isAuthenticated) {
      addMessage(trend.id, 'assistant', 'Silakan login terlebih dahulu untuk menggunakan fitur chat.');
      setInput('');
      return;
    }

    if (dailyCount >= APP_CONFIG.maxChatsPerDay) {
      addMessage(trend.id, 'assistant', 'Batas 20 chat per hari tercapai. Coba lagi besok ya.');
      setInput('');
      return;
    }

    setInput('');
    streamChat(trend.id, text, trend.name);
  }, [input, isStreaming, trend, dailyCount, isAuthenticated, addMessage, streamChat]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (!trend) return;
    clearSession(trend.id);
  };

  const remainingChats = Math.max(0, APP_CONFIG.maxChatsPerDay - dailyCount);
  const welcomeSuggestions = welcome?.suggestions ?? [];

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="flex shrink-0 items-center justify-between border-b border-secondary-gray-200 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Tutup chat"
            className="chat-close-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-navy-700 transition-colors hover:bg-white/75 dark:text-white btn-press"
          >
            <X size={20} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-navy-900">{trend?.name ?? 'Pilih tren'}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-secondary-gray-500">
              <Lock size={10} />
              <span className="truncate">
                {trend ? `Nexo membahas: ${trend.name}` : 'Buka detail produk untuk mulai bertanya'}
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            aria-label="Hapus riwayat chat"
            title="Hapus riwayat chat"
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-secondary-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 btn-press"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-secondary-gray-100 bg-white/45 px-5 py-3">
        <span className="text-xs text-secondary-gray-500">
          Sisa chat hari ini: <strong className={remainingChats <= 5 ? 'text-red-500' : 'text-primary'}>{remainingChats}</strong>/20
        </span>
        {remainingChats <= 5 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-600">
            <AlertTriangle size={12} />
            Hampir habis
          </span>
        )}
      </div>

      <div ref={scrollRef} className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {!trend ? (
          <div className="flex justify-start fade-in-up">
            <div className="max-w-[88%] rounded-3xl rounded-bl-md bg-white/75 px-4 py-3 text-sm leading-relaxed text-navy-900 shadow-sm">
              <p className="font-bold">Pilih tren terlebih dahulu.</p>
              <p className="mt-2 text-secondary-gray-600">
                Buka produk viral atau konten terkait, lalu tekan Tanya Nexo agar analisis memakai data Supabase yang tepat.
              </p>
            </div>
          </div>
        ) : messages.length === 0 && !isStreaming && (
          <div className="space-y-3">
            {isWelcomeLoading && !welcome ? (
              <WelcomeSkeleton />
            ) : (
              <div className="flex justify-start fade-in-up">
                <div className="max-w-[88%] rounded-3xl rounded-bl-md bg-white/75 px-4 py-3 text-sm leading-relaxed text-navy-900 shadow-sm">
                  <p className="font-bold">Halo, selamat datang.</p>
                  <p className="mt-2 text-secondary-gray-600">
                    {welcome?.subtitle || welcomeError || `Saya sudah membaca data tren ${trend.name}.`}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-secondary-gray-400">
                    Hal yang bisa langsung kamu tanyakan
                  </p>
                  <div className="mt-2 space-y-2">
                    {welcomeSuggestions.map((prompt, idx) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="list-item-enter block w-full rounded-2xl bg-secondary-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-navy-700 transition-colors hover:bg-primary/10 hover:text-primary btn-press"
                        style={{ animationDelay: `${idx * 0.08}s` }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-start pl-4 fade-in">
              <div className="flex items-center gap-2 text-secondary-gray-400">
                <button aria-label="Salin pembuka" className="rounded-lg p-1 hover:bg-white/70">□</button>
                <button aria-label="Respons membantu" className="rounded-lg p-1 hover:bg-white/70">♡</button>
                <button aria-label="Respons kurang membantu" className="rounded-lg p-1 hover:bg-white/70">♢</button>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} list-item-enter`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-3xl rounded-br-md bg-primary text-white'
                  : 'rounded-3xl rounded-bl-md bg-white/75 text-navy-900'
              }`}
            >
              <MessageContent text={msg.content} />
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start fade-in">
            <div className="rounded-3xl rounded-bl-md bg-white/75 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot h-2 w-2 rounded-full bg-secondary-gray-400" />
                <span className="typing-dot h-2 w-2 rounded-full bg-secondary-gray-400" />
                <span className="typing-dot h-2 w-2 rounded-full bg-secondary-gray-400" />
              </div>
            </div>
          </div>
        )}

        {streamError && (
          <div className="flex justify-center fade-in">
            <div className="rounded-2xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
              {streamError}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-secondary-gray-200 p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={trend ? `Tanya tentang ${trend.name}...` : 'Pilih tren untuk mulai bertanya...'}
            rows={1}
            aria-label="Pesan ke Nexo"
            className="soft-input scrollbar-hide min-h-[44px] max-h-[120px] flex-1 resize-none overflow-y-auto rounded-2xl px-4 py-3 text-sm"
          />
          <button
            onClick={() => handleSend()}
            disabled={!trend || !input.trim() || isStreaming || dailyCount >= APP_CONFIG.maxChatsPerDay}
            aria-label="Kirim pesan"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors btn-press ${
              trend && input.trim() && !isStreaming && dailyCount < APP_CONFIG.maxChatsPerDay
                ? 'bg-navy-900 text-white hover:bg-primary'
                : 'bg-secondary-gray-200 text-secondary-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-secondary-gray-500">
          Enter untuk kirim / Shift+Enter untuk baris baru / Maks 20 per hari
        </p>
      </div>
    </div>
  );
}
