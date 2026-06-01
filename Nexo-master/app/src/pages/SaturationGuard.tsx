import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import {
  Activity,
  AlertCircle,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { useTrendStore } from '@/stores';
import { getSaturationDecision } from '@/lib/utils';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';
import type { SaturationDetail, Trend } from '@/types';

const phases = ['Emerging', 'Growing', 'Peak', 'Decay'] as const;
type PhaseTerm = 'emerging' | 'growing' | 'peak' | 'decay';
type CompetitorPoint = { day: string; count: number };

const GAUGE_START_ANGLE = 155;
const GAUGE_END_ANGLE = 385;
const GAUGE_PATH = describeArc(180, 178, 128, GAUGE_START_ANGLE, GAUGE_END_ANGLE);
const rollingMetricTiming = {
  duration: 800,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};
const rollingMetricFormat = {
  useGrouping: true,
} satisfies Intl.NumberFormatOptions;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(' ');
}

function RollingMetricNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const formattedValue = new Intl.NumberFormat('id-ID', rollingMetricFormat).format(value);

  return (
    <p
      className="inline-flex max-w-full items-baseline whitespace-nowrap text-lg font-black leading-tight text-navy-900 tabular-nums"
      aria-label={`${prefix}${formattedValue}${suffix}`}
    >
      {prefix && <span className="shrink-0">{prefix}</span>}
      <NumberFlow
        value={value}
        locales="id-ID"
        format={rollingMetricFormat}
        transformTiming={rollingMetricTiming}
        spinTiming={rollingMetricTiming}
        opacityTiming={{ duration: 200, easing: 'ease-out' }}
      />
      {suffix && <span className="shrink-0">{suffix}</span>}
    </p>
  );
}

export default function SaturationGuard() {
  // Sync dengan global trend store supaya search bar Navbar bisa update gauge.
  const { selectedTrend: globalSelected } = useTrendStore();
  const [apiTrend, setApiTrend] = useState<SaturationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selectedTrend: Trend | SaturationDetail | null = apiTrend ?? globalSelected;

  useEffect(() => {
    let cancelled = false;

    async function loadSaturation() {
      try {
        const endpoint = globalSelected?.id
          ? `${API_URL}/saturation/trends/${globalSelected.id}`
          : `${API_URL}/saturation/summary`;
        const res = await fetch(endpoint);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal mengambil saturation detail');
        if (!cancelled) {
          setApiTrend(json.data);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) setLoadError((error as Error).message);
      }
    }

    void loadSaturation();
    const timer = window.setInterval(loadSaturation, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [globalSelected?.id]);

  const opportunityScore = clampScore(
    selectedTrend && 'opportunityScore' in selectedTrend
      ? (selectedTrend as SaturationDetail).opportunityScore
      : selectedTrend
        ? 100 - selectedTrend.saturation
        : 0
  );
  const [gaugeValue, setGaugeValue] = useState(0);
  const gaugeValueRef = useRef(gaugeValue);
  const gaugeAnimRef = useRef<number | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  // linePos: 0..3 float, tracks animated position of the progress line.
  const [linePos, setLinePos] = useState<number>(
    phases.indexOf((selectedTrend?.phase ?? 'Emerging') as typeof phases[number])
  );
  const linePosRef = useRef(linePos);
  const lineAnimRef = useRef<number | null>(null);

  const currentPhaseIndex = phases.indexOf((selectedTrend?.phase ?? 'Emerging') as typeof phases[number]);
  const satLabel = getSaturationDecision(selectedTrend?.saturation ?? 0);

  useEffect(() => {
    if (!selectedTrend) return undefined;

    setShowRecommendation(false);
    if (gaugeAnimRef.current) cancelAnimationFrame(gaugeAnimRef.current);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gaugeValueRef.current = opportunityScore;
      setGaugeValue(opportunityScore);
      setShowRecommendation(true);
      return;
    }

    const startValue = gaugeValueRef.current;
    const startTime = Date.now();
    const duration = 900;
    let recommendationTimer: number | undefined;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(startValue + (opportunityScore - startValue) * eased);

      gaugeValueRef.current = nextValue;
      setGaugeValue(nextValue);

      if (progress < 1) {
        gaugeAnimRef.current = requestAnimationFrame(animate);
      } else {
        recommendationTimer = window.setTimeout(() => setShowRecommendation(true), 180);
      }
    };

    gaugeAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (gaugeAnimRef.current) cancelAnimationFrame(gaugeAnimRef.current);
      if (recommendationTimer) window.clearTimeout(recommendationTimer);
    };
  }, [opportunityScore, selectedTrend?.id]);

  useEffect(() => {
    if (!selectedTrend) return undefined;

    if (lineAnimRef.current) cancelAnimationFrame(lineAnimRef.current);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      linePosRef.current = currentPhaseIndex;
      setLinePos(currentPhaseIndex);
      return;
    }

    const from = linePosRef.current;
    const to = currentPhaseIndex;
    const start = Date.now();
    const duration = 600;

    const animate = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (to - from) * eased;

      linePosRef.current = next;
      setLinePos(next);

      if (progress < 1) {
        lineAnimRef.current = requestAnimationFrame(animate);
      }
    };

    lineAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (lineAnimRef.current) cancelAnimationFrame(lineAnimRef.current);
    };
  }, [currentPhaseIndex, selectedTrend?.id]);

  if (!selectedTrend) {
    return (
      <div className="space-y-6 fade-in-up">
        <section className="premium-card rounded-3xl p-5 sm:p-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-navy-900">Saturation Guard</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-gray-500">
              {loadError ?? 'Mengambil data saturation terbaru...'}
            </p>
          </div>
        </section>
      </div>
    );
  }

  const detailCompetitorDensity = (selectedTrend as SaturationDetail).competitorDensity;
  const competitorData: CompetitorPoint[] = Array.isArray(detailCompetitorDensity)
    ? detailCompetitorDensity
    : [
        { day: 'Sen', count: Math.round(selectedTrend.competitorCount * 0.6) },
        { day: 'Sel', count: Math.round(selectedTrend.competitorCount * 0.7) },
        { day: 'Rab', count: Math.round(selectedTrend.competitorCount * 0.75) },
        { day: 'Kam', count: Math.round(selectedTrend.competitorCount * 0.85) },
        { day: 'Jum', count: Math.round(selectedTrend.competitorCount * 0.9) },
        { day: 'Sab', count: Math.round(selectedTrend.competitorCount * 0.95) },
        { day: 'Min', count: selectedTrend.competitorCount },
      ];
  const maxCompetitors = Math.max(...competitorData.map((d) => d.count));

  return (
    <div className="space-y-6 fade-in-up">
      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-navy-900">Saturation Guard</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-gray-500">
            Indeks <GlossaryTooltip term="saturation">kejenuhan pasar</GlossaryTooltip> real-time per kategori untuk menentukan aman masuk, waspada, atau hindari.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="premium-card rounded-3xl p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-navy-900">{selectedTrend.name}</h3>
              <p className="mt-1 text-sm text-secondary-gray-500">
                Skor peluang dihitung dari rendahnya saturation pasar.
              </p>
            </div>
            <div className={`inline-flex w-fit items-center rounded-2xl px-3 py-1.5 text-sm font-black ${satLabel.bg} ${satLabel.color}`}>
              <GlossaryTooltip term="saturation" showIcon={false}>{satLabel.label}</GlossaryTooltip>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="relative mx-auto aspect-[360/270] w-full max-w-[460px]"
              role="img"
              aria-label={`Opportunity score ${gaugeValue} persen. Saturation asli ${selectedTrend.saturation} dari 100. Kategori ${satLabel.label}.`}
            >
              <svg
                className="h-full w-full overflow-visible"
                viewBox="0 0 360 270"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="opportunityGaugeGradient" x1="40" y1="210" x2="320" y2="76" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F15B7D" />
                    <stop offset="52%" stopColor="#6D5BFF" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                  <filter id="opportunityGaugeShadow" x="-20%" y="-30%" width="140%" height="160%">
                    <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#2563EB" floodOpacity="0.16" />
                  </filter>
                </defs>

                <path
                  d={GAUGE_PATH}
                  className="opportunity-gauge-track"
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth="30"
                />
                <path
                  d={GAUGE_PATH}
                  fill="none"
                  filter="url(#opportunityGaugeShadow)"
                  pathLength={100}
                  stroke="url(#opportunityGaugeGradient)"
                  strokeDasharray={`${gaugeValue} 100`}
                  strokeLinecap="round"
                  strokeWidth="30"
                />
              </svg>

              <div className="pointer-events-none absolute inset-x-0 top-[40%] flex flex-col items-center text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary-gray-500">
                  Opportunity Score
                </p>
                <p className="mt-1 text-6xl font-black leading-none tracking-tight text-navy-900 sm:text-7xl">
                  {gaugeValue}%
                </p>
                <p className="mt-3 text-sm font-semibold text-secondary-gray-500">
                  Saturation {selectedTrend.saturation}/100
                </p>
              </div>

              <div className="absolute bottom-4 left-6 text-sm font-bold text-secondary-gray-400 sm:left-9">
                0%
              </div>
              <div className="absolute bottom-4 right-6 text-sm font-bold text-secondary-gray-400 sm:right-9">
                100%
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/75 bg-white/55 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-navy-900">Phase timeline</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                ~{selectedTrend.windowHours} jam
              </span>
            </div>

            <div className="relative mt-5 flex items-start justify-between">
              <div className="absolute left-[12.5%] right-[12.5%] top-4 z-0 grid h-0.5 grid-cols-3" aria-hidden="true">
                {phases.slice(0, -1).map((phase, i) => (
                  <div key={`${phase}-segment`} className="phase-track overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${clampUnit(linePos - i) * 100}%`,
                        transition: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
              {phases.map((phase, i) => {
                const passed = linePos >= i + 0.5;
                const active = linePos >= i - 0.5 && linePos < i + 0.5;
                const isTarget = i === currentPhaseIndex;
                const isCurrent = active || (isTarget && linePos >= i - 0.01);
                return (
                  <div key={phase} className="relative z-10 flex min-w-0 flex-1 flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                        passed
                          ? 'border-primary bg-primary'
                          : isCurrent
                          ? 'border-primary bg-primary'
                          : 'phase-dot-empty'
                      }`}
                    >
                      {passed ? (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <span className="phase-dot-inner h-2.5 w-2.5 rounded-full" aria-hidden="true" />
                      ) : null}
                    </div>
                    <div className="mt-2 flex h-10 flex-col items-center">
                      <span className={`max-w-[72px] truncate text-xs font-bold transition-colors duration-150 ${passed || isCurrent ? 'text-navy-900' : 'text-secondary-gray-500'}`}>
                        <GlossaryTooltip term={phase.toLowerCase() as PhaseTerm} showIcon={false}>
                          {phase}
                        </GlossaryTooltip>
                      </span>
                      <span className="mt-0.5 text-xs font-black text-primary">
                        {isTarget ? `~${selectedTrend.windowHours} jam` : '\u00A0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`mt-5 rounded-3xl border p-5 ${satLabel.bg} ${satLabel.border} fade-in-up ${showRecommendation ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`mt-0.5 flex-shrink-0 ${satLabel.color}`} size={20} />
              <div>
                <p className="mb-1 text-sm font-black text-navy-900">Rekomendasi</p>
                <p className="text-sm leading-relaxed text-navy-700">{selectedTrend.recommendation}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="premium-card rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="section-heading">Key Metrics</h4>
              <TrendingUp size={18} className="text-secondary-gray-500" />
            </div>
            <div className="space-y-3">
              {[
                { icon: Users, term: 'competitorCount' as const, label: 'Kompetitor', value: selectedTrend.competitorCount, prefix: '', suffix: '', color: 'bg-primary/10 text-primary' },
                { icon: DollarSign, term: 'avgPrice' as const, label: 'Harga Rata-rata', value: selectedTrend.avgPrice, prefix: 'Rp ', suffix: '', color: 'bg-green-50 text-green-600' },
                { icon: Star, term: 'reviewVelocity' as const, label: 'Review/hari', value: selectedTrend.reviewVelocity, prefix: '', suffix: '', color: 'bg-orange-50 text-orange-600' },
                { icon: Clock, term: 'window' as const, label: 'Window Tersisa', value: selectedTrend.windowHours, prefix: '~', suffix: ' jam', color: 'bg-red-50 text-red-600' },
              ].map(({ icon: Icon, term, label, value, prefix, suffix, color }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 p-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-secondary-gray-500">
                      <GlossaryTooltip term={term} showIcon={false}>{label}</GlossaryTooltip>
                    </p>
                    <RollingMetricNumber value={value} prefix={prefix} suffix={suffix} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="section-heading">Kompetitor Density</h4>
              <Activity size={18} className="text-secondary-gray-500" />
            </div>
            <div className="flex h-32 items-end justify-between gap-2">
              {competitorData.map((data, i) => (
                <div key={data.day} className="group/bar flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-col items-center">
                    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
                      {data.count}
                    </div>
                    <div
                      style={{
                        height: `${(data.count / maxCompetitors) * 112}px`,
                        transformOrigin: 'bottom',
                        animation: `scaleYUp 0.4s ease-out ${0.5 + i * 0.08}s forwards`,
                      }}
                      className="w-full scale-y-0 cursor-default rounded-t-md bg-gradient-to-t from-primary/25 to-primary/70 transition-opacity hover:opacity-80"
                    />
                  </div>
                  <span className="text-xs font-semibold text-secondary-gray-500">{data.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
