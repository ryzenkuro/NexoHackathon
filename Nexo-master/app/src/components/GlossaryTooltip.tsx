import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GLOSSARY, type GlossaryTerm } from '@/lib/glossary';

interface GlossaryTooltipProps {
  /** Term di lib/glossary */
  term: GlossaryTerm;
  /** Override label yang ditampilkan. Default pakai GLOSSARY[term].label */
  children?: React.ReactNode;
  /** Tampilkan ikon info kecil di samping label. Default true. */
  showIcon?: boolean;
  /** Tooltip side. Default 'top'. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/**
 * Render label + tooltip helper untuk istilah teknis.
 * Pakai bahasa UMKM-friendly dari `GLOSSARY`.
 *
 * @example
 *   <GlossaryTooltip term="saturation" />
 *   <GlossaryTooltip term="window">Window Tersisa</GlossaryTooltip>
 */
export function GlossaryTooltip({
  term,
  children,
  showIcon = true,
  side = 'top',
  className = '',
}: GlossaryTooltipProps) {
  const entry = GLOSSARY[term];
  const label = children ?? entry.label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded ${className}`}
          tabIndex={0}
          aria-label={`${typeof label === 'string' ? label : entry.label}: ${entry.description}`}
        >
          <span>{label}</span>
          {showIcon && (
            <Info
              size={12}
              className="text-secondary-gray-400 hover:text-primary transition-colors flex-shrink-0"
              aria-hidden="true"
            />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[260px] text-pretty">
        <p className="font-semibold mb-1">{entry.label}</p>
        <p className="text-pretty">{entry.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
