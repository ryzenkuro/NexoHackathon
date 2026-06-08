import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import NexoDataRunner from '@/components/ai/NexoDataRunner';

export type AiInsightStatus = 'loading' | 'error' | 'success';

interface AiInsightStateProps {
  status: AiInsightStatus;
  message: string;
  title?: string | null;
  errorMessage?: string;
  onRetry?: () => void;
  fallback?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function AiInsightState({
  status,
  message,
  title = 'Analisis Nexo',
  errorMessage = 'Analisis Nexo belum berhasil dimuat.',
  onRetry,
  fallback,
  className,
  children,
}: AiInsightStateProps) {
  const shouldReduceMotion = useReducedMotion();
  const enterTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <motion.div
      layout={!shouldReduceMotion}
      transition={shouldReduceMotion ? { duration: 0 } : { layout: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } }}
      className={className}
      aria-busy={status === 'loading'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === 'loading' ? (
          <motion.div
            key="loading"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={enterTransition}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <motion.span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-primary shadow-sm"
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              >
                <Sparkles size={18} />
              </motion.span>
              <div>
                {title && <p className="text-sm font-black text-navy-900">{title}</p>}
                <p className="text-xs leading-relaxed text-secondary-gray-500">{message}</p>
              </div>
            </div>

            <NexoDataRunner label={message} />
          </motion.div>
        ) : status === 'error' ? (
          <motion.div
            key="error"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={enterTransition}
            role="alert"
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-navy-900">Analisis belum tersedia</p>
                <p className="mt-0.5 text-xs leading-relaxed text-red-600">{errorMessage}</p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-black text-navy-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <RefreshCw size={13} />
                  Coba lagi
                </button>
              )}
            </div>
            {fallback && (
              <div className="rounded-2xl bg-white/55 p-3">
                <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-secondary-gray-500">
                  Insight sementara
                </p>
                {fallback}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={enterTransition}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
