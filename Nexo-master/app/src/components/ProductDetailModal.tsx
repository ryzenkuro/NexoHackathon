import { useEffect, useState } from 'react';
import { X, TrendingUp, Users, DollarSign, Star, MessageCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTrendStore } from '@/stores';
import { API_URL } from '@/lib/constants';
import { getSaturationDecision, getCategoryLabel, formatRupiah, formatGrowth, hideBrokenImage } from '@/lib/utils';
import AiInsightState, { type AiInsightStatus } from '@/components/ai/AiInsightState';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';
import type { AiTrendRecommendationResponse } from '@/types';

interface ProductDetailModalProps {
  onClose: () => void;
  onOpenChat: () => void;
}

const AI_RECOMMENDATION_CACHE_TTL_MS = 10 * 60 * 1000;
const aiRecommendationCache = new Map<string, { data: AiTrendRecommendationResponse; expiresAt: number }>();

function getCachedAiRecommendation(trendId: string) {
  const cached = aiRecommendationCache.get(trendId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    aiRecommendationCache.delete(trendId);
    return null;
  }
  return cached.data;
}

export default function ProductDetailModal({ onClose, onOpenChat }: ProductDetailModalProps) {
  const { selectedTrend, setSelectedTrend, trends } = useTrendStore();
  const trendList = trends;
  const trend = selectedTrend;
  const [aiRecommendation, setAiRecommendation] = useState<AiTrendRecommendationResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTrendId, setAiTrendId] = useState<string | null>(null);
  const [aiRetryAttempt, setAiRetryAttempt] = useState(0);

  useEffect(() => {
    if (!trend?.id) return undefined;
    const trendId = trend.id;

    const cached = getCachedAiRecommendation(trendId);
    if (cached) {
      setAiTrendId(trendId);
      setAiRecommendation(cached);
      setAiError(null);
      setIsAiLoading(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    setAiTrendId(trendId);
    setAiRecommendation(null);
    setAiError(null);
    setIsAiLoading(true);

    async function loadAiRecommendation() {
      try {
        const res = await fetch(`${API_URL}/ai/trends/${trendId}/recommendation`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal membuat ringkasan AI');
        const data = json.data as AiTrendRecommendationResponse;
        if (!data) throw new Error('Ringkasan AI kosong');
        aiRecommendationCache.set(trendId, {
          data,
          expiresAt: Date.now() + AI_RECOMMENDATION_CACHE_TTL_MS,
        });
        if (!cancelled) setAiRecommendation(data);
      } catch (error) {
        if (!cancelled && (error as Error).name !== 'AbortError') {
          const message = (error as Error).message || 'Gagal membuat analisis Nexo';
          setAiRecommendation(null);
          setAiError(message);
          toast.error('Analisis Nexo gagal dimuat');
        }
      } finally {
        if (!cancelled) setIsAiLoading(false);
      }
    }

    void loadAiRecommendation();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [aiRetryAttempt, trend?.id]);

  if (!trend) {
    return (
      <div
        className="premium-shell w-full max-w-md rounded-3xl p-6 text-center shadow-2xl fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Detail produk"
      >
        <button
          onClick={onClose}
          aria-label="Tutup modal"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-navy-900 shadow-sm transition-colors hover:bg-white btn-press"
        >
          <X size={18} />
        </button>
        <p className="mt-3 text-lg font-black text-navy-900">Pilih tren terlebih dahulu</p>
        <p className="mt-2 text-sm leading-relaxed text-secondary-gray-500">
          Detail produk akan muncul setelah data tren dipilih dari daftar atau hasil pencarian.
        </p>
      </div>
    );
  }

  const satStyle = getSaturationDecision(trend.saturation);
  const aiStatus: AiInsightStatus = aiTrendId !== trend.id || isAiLoading
    ? 'loading'
    : aiError
      ? 'error'
      : 'success';

  const foundIndex = trendList.findIndex((t) => t.id === trend.id);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const hasPrev = foundIndex > 0;
  const hasNext = foundIndex >= 0 && currentIndex < trendList.length - 1;

  const navigate = (dir: 'prev' | 'next') => {
    const nextIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < trendList.length) {
      setSelectedTrend(trendList[nextIndex]);
    }
  };

  return (
    <div
      className="premium-shell w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl fade-in-up"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={`Detail produk: ${trend.name}`}
    >
      <div className="grid max-h-[90vh] overflow-y-auto lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="relative min-h-[260px] overflow-hidden lg:min-h-full">
          <img
            src={trend.thumbnail}
            alt={trend.name}
            loading="lazy"
            onError={hideBrokenImage}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-navy-900 shadow-sm transition-colors hover:bg-white btn-press"
          >
            <X size={18} />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <span className="mb-3 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy-900">
              {getCategoryLabel(trend.category)}
            </span>
            <h2 className="text-2xl font-black leading-tight text-white">{trend.name}</h2>
            <p className="mt-2 text-sm font-medium text-white/75">{trend.platform} / {trend.timeDetected}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-secondary-gray-500">Trend detail</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-700">{trend.description}</p>
            </div>
            <div className={`flex shrink-0 items-center gap-1 rounded-2xl px-3 py-2 ${
              trend.growth > 5 ? 'bg-green-50 text-green-600'
                : trend.growth < -5 ? 'bg-red-50 text-red-600'
                : 'bg-secondary-gray-100 text-secondary-gray-700'
            }`}>
              <TrendingUp size={16} className={trend.growth < 0 ? 'rotate-180' : ''} />
              <span className="text-sm font-black">{formatGrowth(trend.growth)}</span>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              { icon: Users, term: 'competitorCount' as const, label: 'Kompetitor', value: String(trend.competitorCount) },
              { icon: DollarSign, term: 'avgPrice' as const, label: 'Harga Rata-rata', value: formatRupiah(trend.avgPrice) },
              { icon: Star, term: 'reviewVelocity' as const, label: 'Review/hari', value: String(trend.reviewVelocity) },
              { icon: Clock, term: 'window' as const, label: 'Window Tersisa', value: `~${trend.windowHours} jam` },
            ].map(({ icon: Icon, term, label, value }) => (
              <div key={label} className="rounded-3xl bg-white/65 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={15} />
                  </span>
                  <span className="text-xs font-semibold text-secondary-gray-500">
                    <GlossaryTooltip term={term} showIcon={false}>{label}</GlossaryTooltip>
                  </span>
                </div>
                <p className="text-lg font-black text-navy-900">{value}</p>
              </div>
            ))}
          </div>

          <div className={`mb-5 rounded-3xl border p-4 ${satStyle.bg} ${satStyle.border}`}>
            <AiInsightState
              status={aiStatus}
              message="Mengolah data tren produk..."
              errorMessage={aiError || undefined}
              onRetry={() => setAiRetryAttempt((attempt) => attempt + 1)}
              fallback={(
                <p className="whitespace-pre-line text-sm leading-relaxed text-navy-700">
                  {trend.recommendation}
                </p>
              )}
            >
              {aiRecommendation?.structured ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-black ${satStyle.color}`}>{satStyle.label}</span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-navy-900">
                      {aiRecommendation.structured.decision}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-navy-700">
                    {aiRecommendation.structured.summary}
                  </p>
                  {aiRecommendation.structured.reasons.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Alasan</p>
                      <ul className="space-y-1">
                        {aiRecommendation.structured.reasons.slice(0, 2).map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiRecommendation.structured.risks && aiRecommendation.structured.risks.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Risiko</p>
                      <ul className="space-y-1">
                        {aiRecommendation.structured.risks.slice(0, 2).map((risk, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiRecommendation.structured.actions.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Aksi Cepat</p>
                      <ul className="space-y-1">
                        {aiRecommendation.structured.actions.slice(0, 2).map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy-700">
                            <span className="mt-0.5 shrink-0 font-black text-primary">{i + 1}.</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    <span className={`text-sm font-black ${satStyle.color}`}>{satStyle.label}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-navy-700">
                    {aiRecommendation?.text || trend.recommendation}
                  </p>
                </div>
              )}
            </AiInsightState>
          </div>

          <div className="mb-4 flex gap-3">
            <button
              onClick={() => {
                setSelectedTrend(trend);
                onOpenChat();
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3 text-sm font-bold text-white transition-colors hover:bg-primary btn-press"
            >
              <MessageCircle size={18} />
              Tanya Nexo
            </button>
            <button
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/70 py-3 text-sm font-bold text-navy-700 transition-colors hover:bg-white btn-press"
            >
              Tutup
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
              disabled={!hasPrev}
              aria-label="Produk sebelumnya"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-navy-700 transition-colors hover:bg-white disabled:opacity-40 btn-press"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-center text-xs font-bold text-secondary-gray-500">
              {currentIndex + 1} / {trendList.length}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('next'); }}
              disabled={!hasNext}
              aria-label="Produk berikutnya"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-navy-700 transition-colors hover:bg-white disabled:opacity-40 btn-press"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
