import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Activity,
  ShoppingBag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore, useDashboardRealtimeStore, useTrendStore } from '@/stores';
import { getSaturationStyle, getPhaseColor, computeDashboardStats, onActivateKey, formatGrowth, getGrowthColor, hideBrokenImage } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import type { GlossaryTerm } from '@/lib/glossary';
import type { DashboardGrowthItem, InsightId, Trend } from '@/types';

interface DashboardProps {
  onOpenChat: () => void;
  onOpenProduct: () => void;
  onOpenInsight: (insightId: InsightId) => void;
}

const insightCards: Array<{
  id: InsightId;
  icon: LucideIcon;
  title: string;
  body: string;
  color: string;
}> = [
  {
    id: 'emerging',
    icon: Sparkles,
    title: 'Emerging signals',
    body: 'Produk dengan growth tajam dan saturation rendah sedang lebih mudah dimasuki.',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'risk',
    icon: ShieldCheck,
    title: 'Risk alerts',
    body: 'Kategori Peak dan Decay perlu dicek ulang sebelum tambah stok.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'growth',
    icon: Activity,
    title: 'Growth suggestions',
    body: 'Prioritaskan konten pendek untuk tren yang window-nya masih panjang.',
    color: 'bg-green-50 text-green-600',
  },
];

const formatCountdown = (secondsRemaining: number) => {
  const totalSeconds = Math.max(0, Math.floor(secondsRemaining));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const getCountdownParts = (secondsRemaining: number) => {
  const totalSeconds = Math.max(0, Math.floor(secondsRemaining));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const countdownNumberFormat = {
  minimumIntegerDigits: 2,
  useGrouping: false,
} satisfies Intl.NumberFormatOptions;

const countdownTiming = {
  duration: 700,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

const chartMotion = {
  duration: 360,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

const chartMinHeight = 30;
const chartMaxHeight = 132;

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getFallbackMomentumScore = (item: DashboardGrowthItem) => {
  const growthScore = clampNumber(((item.growth + 45) / 405) * 100, 0, 100);
  const saturationPenalty = Math.max(0, item.saturation - 35) * 0.55;
  const windowPenalty = item.windowSeconds <= 6 * 3600
    ? 22
    : item.windowSeconds <= 18 * 3600
      ? 12
      : item.windowSeconds <= 30 * 3600
        ? 5
        : 0;
  const phaseModifier = {
    Emerging: 12,
    Growing: 5,
    Peak: -10,
    Decay: -26,
  }[item.phase] ?? 0;

  return Math.round(clampNumber(growthScore + phaseModifier - saturationPenalty - windowPenalty, 4, 100));
};

const getChartBarHeight = (item: DashboardGrowthItem) => {
  const score = clampNumber(item.momentumScore ?? getFallbackMomentumScore(item), 0, 100);
  return chartMinHeight + (score / 100) * (chartMaxHeight - chartMinHeight);
};

function CountdownValue({ secondsRemaining }: { secondsRemaining: number }) {
  const { hours, minutes, seconds } = getCountdownParts(secondsRemaining);

  return (
    <span className="inline-flex items-baseline whitespace-nowrap" aria-label={formatCountdown(secondsRemaining)}>
      <NumberFlow
        value={hours}
        locales="id-ID"
        format={countdownNumberFormat}
        transformTiming={countdownTiming}
        spinTiming={countdownTiming}
        opacityTiming={{ duration: 180, easing: 'ease-out' }}
      />
      <span className="metric-countdown-separator px-1 text-navy-900/75">:</span>
      <NumberFlow
        value={minutes}
        locales="id-ID"
        format={countdownNumberFormat}
        transformTiming={countdownTiming}
        spinTiming={countdownTiming}
        opacityTiming={{ duration: 180, easing: 'ease-out' }}
      />
      <span className="metric-countdown-separator px-1 text-navy-900/75">:</span>
      <NumberFlow
        value={seconds}
        locales="id-ID"
        format={countdownNumberFormat}
        transformTiming={countdownTiming}
        spinTiming={countdownTiming}
        opacityTiming={{ duration: 180, easing: 'ease-out' }}
      />
    </span>
  );
}

export default function Dashboard({ onOpenChat, onOpenProduct, onOpenInsight }: DashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trends, setSelectedTrend, fetchTrends, isLoading } = useTrendStore();
  const {
    snapshot,
    fetchSnapshot,
    connect,
    disconnect,
  } = useDashboardRealtimeStore();
  const [animateTrigger, setAnimateTrigger] = useState(false);
  const chartItemRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousChartRectsRef = useRef(new Map<string, DOMRect>());
  const previousRankRef = useRef(new Map<string, number>());
  const highlightTimerRef = useRef<number | null>(null);
  const [movedTrendIds, setMovedTrendIds] = useState<Set<string>>(() => new Set());
  const fallbackStats = useMemo(() => computeDashboardStats(trends), [trends]);
  const dashboardStats = useMemo(() => {
    if (!snapshot) return fallbackStats;
    return {
      active: snapshot.metrics.activeTrends,
      emerging: snapshot.metrics.emergingTrends,
      avgSaturation: snapshot.metrics.avgSaturation,
      minWindow: snapshot.metrics.nearestWindowSeconds / 3600,
    };
  }, [fallbackStats, snapshot]);
  const windowStartSeconds = useMemo(
    () => Math.max(0, Math.round(snapshot?.metrics.nearestWindowSeconds ?? dashboardStats.minWindow * 60 * 60)),
    [dashboardStats.minWindow, snapshot]
  );
  const [windowSecondsRemaining, setWindowSecondsRemaining] = useState(0);

  useEffect(() => {
    fetchTrends();
    void fetchSnapshot();
    connect();

    return () => disconnect();
  }, [connect, disconnect, fetchSnapshot, fetchTrends]);

  useEffect(() => {
    const t = setTimeout(() => setAnimateTrigger(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!animateTrigger) return;
    setWindowSecondsRemaining(windowStartSeconds);
  }, [animateTrigger, windowStartSeconds]);

  useEffect(() => {
    if (!animateTrigger || windowStartSeconds <= 0) return undefined;

    const interval = window.setInterval(() => {
      setWindowSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [animateTrigger, windowStartSeconds]);

  const stats = useMemo(() => {
    const { active, emerging, avgSaturation, minWindow } = dashboardStats;
    const safe = (n: number) => (animateTrigger ? n : 0);
    return [
      {
        label: 'Total Tren Aktif',
        term: undefined,
        value: safe(active),
        suffix: '',
        delta: snapshot?.deltas.activeTrends ?? 2,
        deltaSuffix: '',
        icon: TrendingUp,
        iconTone: 'orange' as const,
        onView: () => navigate('/viral-products'),
      },
      {
        label: 'Tren Emerging',
        term: 'emerging' as GlossaryTerm,
        value: safe(emerging),
        suffix: '',
        delta: snapshot?.deltas.emergingTrends ?? 1,
        deltaSuffix: '',
        icon: Zap,
        iconTone: 'blue' as const,
        onView: () => navigate('/viral-products?phase=Emerging'),
      },
      {
        label: 'Avg Saturation',
        term: 'saturation' as GlossaryTerm,
        value: safe(avgSaturation),
        suffix: '%',
        delta: snapshot?.deltas.avgSaturation ?? -3.2,
        deltaSuffix: '%',
        icon: AlertTriangle,
        iconTone: 'primary' as const,
        onView: () => navigate('/saturation-guard'),
      },
      {
        label: 'Window Terdekat',
        term: 'window' as GlossaryTerm,
        value: safe(minWindow),
        displayValue: <CountdownValue secondsRemaining={animateTrigger ? windowSecondsRemaining : 0} />,
        valueClassName: 'whitespace-nowrap font-mono text-4xl tracking-normal sm:text-4xl xl:text-3xl 2xl:text-4xl',
        suffix: '',
        delta: undefined,
        deltaSuffix: '',
        icon: Clock,
        iconTone: 'green' as const,
      },
    ];
  }, [dashboardStats, animateTrigger, navigate, snapshot, windowSecondsRemaining]);

  const featuredTrend = useMemo(
    () => trends.length > 0
      ? trends.reduce((prev, curr) => (prev.saturation < curr.saturation ? prev : curr), trends[0])
      : null,
    [trends]
  );

  const recentTrends = useMemo(() => trends.slice(0, 6), [trends]);
  const chartItems = useMemo<DashboardGrowthItem[]>(
    () =>
      snapshot?.growthMomentum.items ??
      trends.slice(0, 7).map((trend) => ({
        trendId: trend.id,
        name: trend.name,
        growth: trend.growth,
        saturation: trend.saturation,
        windowSeconds: trend.windowSeconds ?? trend.windowHours * 3600,
        phase: trend.phase,
      })),
    [snapshot, trends]
  );
  const chartOrderSignature = useMemo(
    () => chartItems.map((item) => item.trendId).join('|'),
    [chartItems]
  );

  useLayoutEffect(() => {
    const currentRects = new Map<string, DOMRect>();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    chartItems.forEach((item) => {
      const element = chartItemRefs.current.get(item.trendId);
      if (!element) return;

      const nextRect = element.getBoundingClientRect();
      currentRects.set(item.trendId, nextRect);

      const previousRect = previousChartRectsRef.current.get(item.trendId);
      if (!previousRect || prefersReducedMotion) return;

      const deltaX = previousRect.left - nextRect.left;
      if (Math.abs(deltaX) < 1) return;

      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [
          { transform: `translateX(${deltaX}px)`, zIndex: 2 },
          { transform: 'translate(0, 0)', zIndex: 2 },
        ],
        {
          duration: chartMotion.duration,
          easing: chartMotion.easing,
        }
      );
    });

    previousChartRectsRef.current = currentRects;
  }, [chartItems, chartOrderSignature]);

  useEffect(() => {
    const previousRanks = previousRankRef.current;
    const changedIds = new Set<string>();

    chartItems.forEach((item, index) => {
      const previousIndex = previousRanks.get(item.trendId);
      if (previousIndex !== undefined && previousIndex !== index) {
        changedIds.add(item.trendId);
      }
    });

    previousRankRef.current = new Map(chartItems.map((item, index) => [item.trendId, index]));

    if (changedIds.size === 0) return;

    setMovedTrendIds(changedIds);
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => {
      setMovedTrendIds(new Set());
      highlightTimerRef.current = null;
    }, 820);
  }, [chartItems, chartOrderSignature]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const openTrend = (trend: Trend) => {
    setSelectedTrend(trend);
    onOpenProduct();
  };

  const askNexo = (trend: Trend) => {
    setSelectedTrend(trend);
    onOpenChat();
  };

  const openMomentumItem = (item: DashboardGrowthItem) => {
    const trend = trends.find((candidate) => candidate.id === item.trendId);
    if (trend) openTrend(trend);
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section data-tour="welcome" className="premium-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Halo, {user?.name?.split(' ')[0] ?? 'Seller'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary-gray-500">
              Ada <span className="font-bold text-primary">{dashboardStats.emerging} tren emerging</span> aktif dari snapshot terbaru. Pantau peluang, risiko saturation, dan window masuk dari satu layar.
            </p>
          </div>

          <div className="grid min-w-full gap-3 sm:min-w-[320px] sm:grid-cols-2 lg:min-w-[360px]">
            <div className="rounded-3xl bg-navy-900 p-4 text-white shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="text-2xl font-black leading-none">{featuredTrend ? `${featuredTrend.windowHours} jam` : '0 jam'}</p>
                  <p className="mt-1 text-xs text-white/65">window terbaik</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => featuredTrend && askNexo(featuredTrend)}
              disabled={!featuredTrend}
              className="flex items-center justify-between rounded-3xl bg-white/75 p-4 text-left shadow-sm transition-colors hover:bg-white disabled:opacity-60 btn-press"
            >
              <div>
                <p className="text-sm font-black text-navy-900">Tanya Nexo</p>
                <p className="mt-1 text-xs text-secondary-gray-500">Strategi cepat</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-white">
                <ArrowRight size={17} />
              </span>
            </button>
          </div>
        </div>
      </section>

      <div data-tour="stats-row" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`fade-in-up fade-in-up-${Math.min(i + 1, 4)}`}>
            <StatCard
              icon={stat.icon}
              iconTone={stat.iconTone}
              label={stat.label}
              term={stat.term}
              value={stat.value}
              displayValue={'displayValue' in stat ? stat.displayValue : undefined}
              valueClassName={'valueClassName' in stat ? stat.valueClassName : undefined}
              suffix={stat.suffix}
              delta={stat.delta}
              deltaSuffix={stat.deltaSuffix}
              onView={stat.onView}
              subtitle={stat.label === 'Window Terdekat' ? 'Countdown aktif' : 'Snapshot tren 5 menit'}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          <section className="premium-card rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="section-heading">Growth Momentum</h3>
                <p className="muted-copy">Produk dengan lonjakan demand tertinggi</p>
              </div>
              <span className="rounded-full border border-secondary-gray-200 bg-white/70 px-3 py-1 text-xs font-bold text-navy-700">{chartItems.length} tren</span>
            </div>
            <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-4xl font-black text-navy-900">{snapshot?.growthMomentum.totalWatched ?? trends.length}</p>
                <p className="mt-1 text-sm text-secondary-gray-500">tren aktif dipantau</p>
                <span className="mt-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">+{snapshot?.growthMomentum.weeklyDeltaPct ?? 15}% vs minggu lalu</span>
              </div>
              <div className="flex h-52 items-end justify-between gap-2 overflow-visible px-1 pt-8">
                {chartItems.map((trend, i) => {
                  const height = getChartBarHeight(trend);
                  const isTop = trend.trendId === featuredTrend?.id;
                  const didMove = movedTrendIds.has(trend.trendId);
                  const tooltipPosition = i === 0
                    ? 'left-0 translate-x-0'
                    : i === chartItems.length - 1
                      ? 'right-0 translate-x-0'
                      : 'left-1/2 -translate-x-1/2';
                  return (
                    <button
                      key={trend.trendId}
                      ref={(element) => {
                        if (element) chartItemRefs.current.set(trend.trendId, element);
                        else chartItemRefs.current.delete(trend.trendId);
                      }}
                      onClick={() => openMomentumItem(trend)}
                      className={`growth-momentum-item group flex min-w-0 flex-1 flex-col items-center gap-2 focus:outline-none ${didMove ? 'growth-momentum-item-moved' : ''}`}
                      aria-label={`Buka ${trend.name}`}
                    >
                      <span className="relative flex w-full justify-center">
                        <span
                          className={`growth-momentum-tooltip pointer-events-none absolute -top-8 z-20 whitespace-nowrap rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 shadow-sm group-hover:opacity-100 ${tooltipPosition}`}
                        >
                          {formatGrowth(trend.growth)}
                        </span>
                        <span
                          className={`growth-momentum-bar w-full max-w-[44px] rounded-full group-hover:opacity-85 ${isTop ? 'bg-primary' : i % 2 ? 'bg-primary/45' : 'bg-primary/70'}`}
                          style={{ height }}
                        />
                      </span>
                      <span className="w-full truncate text-center text-xs font-semibold text-secondary-gray-500">{trend.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="premium-card rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="section-heading">Tren Real-time</h3>
                <p className="muted-copy">{trends.length} tren aktif dimuat dari TikTok Shop, Shopee, Tokopedia, dan Instagram</p>
              </div>
              <ShoppingBag size={20} className="text-secondary-gray-500" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-3xl bg-white/75">
                    <div className="h-36 shimmer" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 shimmer rounded w-3/4" />
                      <div className="h-3 shimmer rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div data-tour="trend-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {recentTrends.map((trend, i) => {
                  const satStyle = getSaturationStyle(trend.saturation);
                  return (
                    <div
                      key={trend.id}
                      className={`dashboard-realtime-card group overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-sm transition-all hover:bg-white hover:shadow-card cursor-pointer fade-in-up fade-in-up-${Math.min(i + 1, 4)}`}
                      onClick={() => openTrend(trend)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={onActivateKey(() => openTrend(trend))}
                      aria-label={`Lihat detail ${trend.name}`}
                    >
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={trend.thumbnail}
                          alt={trend.name}
                          loading="lazy"
                          onError={hideBrokenImage}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                        <div className="absolute left-3 top-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPhaseColor(trend.phase)}`}>
                            {trend.phase}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                          <p className="line-clamp-1 text-sm font-black text-white">{trend.name}</p>
                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-navy-900">
                            {formatGrowth(trend.growth)}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-bold uppercase tracking-wide text-secondary-gray-500">{trend.platform}</span>
                          <span className="text-xs font-semibold text-secondary-gray-500">~{trend.windowHours} jam</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary-gray-100">
                            <div className={`h-full rounded-full ${satStyle.bar}`} style={{ width: `${trend.saturation}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${satStyle.text}`}>{satStyle.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="premium-card rounded-3xl p-5">
            <div className="mb-5">
              <h3 className="section-heading">Performance Analytics</h3>
              <p className="muted-copy">Ringkasan risiko dan peluang dari tren teratas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-secondary-gray-200 text-xs uppercase tracking-wide text-secondary-gray-500">
                    <th className="pb-3 font-bold">Produk</th>
                    <th className="pb-3 font-bold">Growth</th>
                    <th className="pb-3 font-bold">Saturation</th>
                    <th className="pb-3 font-bold">Window</th>
                    <th className="pb-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.slice(0, 5).map((trend) => {
                    const satStyle = getSaturationStyle(trend.saturation);
                    return (
                      <tr key={trend.id} className="border-b border-secondary-gray-100 last:border-0">
                        <td className="py-3 font-bold text-navy-900">{trend.name}</td>
                        <td className={`py-3 font-bold ${getGrowthColor(trend.growth)}`}>{formatGrowth(trend.growth)}</td>
                        <td className="py-3 text-navy-700">{trend.saturation}%</td>
                        <td className="py-3 text-navy-700">{trend.windowHours} jam</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${satStyle.bg} ${satStyle.text}`}>
                            {satStyle.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {featuredTrend && (
            <section className="premium-card rounded-3xl p-5">
              <div className="mb-4">
                <h4 className="section-heading">Peluang Terbaik</h4>
                <p className="muted-copy">Saturation terendah dan window panjang</p>
              </div>
              <button
                className="group relative mb-4 h-44 w-full overflow-hidden rounded-3xl text-left btn-press"
                onClick={() => openTrend(featuredTrend)}
              >
                <img
                  src={featuredTrend.thumbnail}
                  alt={featuredTrend.name}
                  loading="lazy"
                  onError={hideBrokenImage}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-black text-white">{featuredTrend.name}</p>
                  <p className="mt-1 text-xs font-medium text-white/75">Saturation {featuredTrend.saturation}/100 / {featuredTrend.platform}</p>
                </div>
              </button>
              <button
                onClick={() => askNexo(featuredTrend)}
                data-tour="chat-cta"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3 text-sm font-bold text-white transition-colors hover:bg-primary btn-press"
              >
                <MessageCircle size={17} />
                Tanya Nexo
              </button>
            </section>
          )}

          <section className="premium-card rounded-3xl p-5">
            <h4 className="section-heading mb-4">AI Insights</h4>
            <div className="space-y-3">
              {insightCards.map(({ id, icon: Icon, title, body, color }) => (
                <div key={title} className="rounded-3xl border border-secondary-gray-200/80 bg-white/65 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
                      <Icon size={16} />
                    </span>
                    <p className="text-sm font-black text-navy-900">{title}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-secondary-gray-500">{body}</p>
                  <button
                    type="button"
                    onClick={() => onOpenInsight(id)}
                    className="mt-3 text-xs font-bold text-primary hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-card rounded-3xl p-5">
            <h4 className="section-heading mb-4">Aksi Cepat</h4>
            <div className="space-y-2">
              {trends.slice(0, 3).map((trend) => (
                <button
                  key={trend.id}
                  onClick={() => openTrend(trend)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/80 btn-press"
                >
                  <img
                    src={trend.thumbnail}
                    alt={trend.name}
                    loading="lazy"
                    onError={hideBrokenImage}
                    className="h-11 w-11 flex-shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy-900">{trend.name}</p>
                    <p className="text-xs text-secondary-gray-500">{formatGrowth(trend.growth)}</p>
                  </div>
                  <ArrowRight size={16} className="flex-shrink-0 text-secondary-gray-500" />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
