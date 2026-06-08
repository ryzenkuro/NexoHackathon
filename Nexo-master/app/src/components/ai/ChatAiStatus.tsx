import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import NexoDataRunner from '@/components/ai/NexoDataRunner';

interface ChatAiStatusProps {
  message: string;
  delayMs?: number;
}

export default function ChatAiStatus({ message, delayMs = 180 }: ChatAiStatusProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return undefined;

    const timer = window.setTimeout(() => setIsVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="max-w-[88%] rounded-3xl rounded-bl-md bg-white/80 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <motion.span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.07, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <Sparkles size={16} />
        </motion.span>
        <p className="text-xs font-bold leading-relaxed text-navy-900">
          {message}
          <span className="chat-ai-ellipsis" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </div>
      <NexoDataRunner label={message} size="compact" className="mt-3" />
    </motion.div>
  );
}
