import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import NumberFlow from '@number-flow/react';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';
import type { GlossaryTerm } from '@/lib/glossary';

interface StatCardProps {
  icon: LucideIcon;
  iconTone?: 'primary' | 'green' | 'orange' | 'red' | 'blue';
  label: string;
  term?: GlossaryTerm;
  value: number;
  displayValue?: ReactNode;
  valueClassName?: string;
  suffix?: string;
  prefix?: string;
  delta?: number;
  deltaSuffix?: string;
  onView?: () => void;
  className?: string;
}

const TONE_CARD: Record<NonNullable<StatCardProps['iconTone']>, string> = {
  primary: 'metric-pastel-lilac',
  green: 'metric-pastel-mint',
  orange: 'metric-pastel-cream',
  red: 'bg-red-50',
  blue: 'metric-pastel-blue',
};

const TONE_ICON: Record<NonNullable<StatCardProps['iconTone']>, string> = {
  primary: 'bg-navy-900 text-white',
  green: 'bg-green-600 text-white',
  orange: 'bg-orange-500 text-white',
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-600 text-white',
};

export default function StatCard({
  icon: Icon,
  iconTone = 'primary',
  label,
  term,
  value,
  displayValue,
  valueClassName,
  suffix = '',
  prefix = '',
  delta,
  deltaSuffix = '%',
  onView,
  className = '',
}: StatCardProps) {
  const showDelta = typeof delta === 'number';
  const isUp = (delta ?? 0) >= 0;
  const deltaColor = isUp ? 'text-green-700 bg-white/60' : 'text-red-700 bg-white/60';
  const DeltaArrow = isUp ? ArrowUp : ArrowDown;
  const hasDisplayValue = displayValue !== undefined && displayValue !== null;
  const valueStyle = hasDisplayValue
    ? (valueClassName ?? 'text-2xl')
    : `text-3xl leading-none tracking-tight ${valueClassName ?? ''}`;

  const labelEl = term ? (
    <GlossaryTooltip term={term} showIcon={false}>{label}</GlossaryTooltip>
  ) : (
    label
  );

  return (
    <div className={`metric-light-card relative min-h-[150px] overflow-hidden rounded-3xl p-4 shadow-card ${TONE_CARD[iconTone]} ${className}`}>
      <div className="relative z-10 flex h-full min-h-[118px] flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy-900">{labelEl}</p>
            <p className="mt-1 text-xs font-medium text-navy-700">Real-time trend signal</p>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ${TONE_ICON[iconTone]}`}>
            <Icon size={18} strokeWidth={2.3} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`font-black leading-tight text-navy-900 tabular-nums ${valueStyle}`}>
                {hasDisplayValue ? (
                  displayValue
                ) : (
                  <>
                    {prefix}
                    <NumberFlow
                      value={value}
                      locales="id-ID"
                      format={{ useGrouping: true }}
                      transformTiming={{ duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                      spinTiming={{ duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                      opacityTiming={{ duration: 250, easing: 'ease-out' }}
                    />
                    {suffix}
                  </>
                )}
              </span>
            </div>
            {showDelta && (
              <span
                className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${deltaColor}`}
                aria-label={`${isUp ? 'naik' : 'turun'} ${Math.abs(delta!)}${deltaSuffix} dari sebelumnya`}
              >
                <DeltaArrow size={12} strokeWidth={3} />
                {Math.abs(delta!)}{deltaSuffix}
              </span>
            )}
          </div>

          {onView && (
            <button
              onClick={onView}
              aria-label={`Lihat detail ${label}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-white transition-colors hover:bg-primary btn-press"
            >
              <ArrowUpRight size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
