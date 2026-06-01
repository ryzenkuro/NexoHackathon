import { X, TrendingUp, Users, DollarSign, Star, MessageCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrendStore } from '@/stores';
import { mockTrends } from '@/mockData';
import { getSaturationDecision, getCategoryLabel, formatRupiah, formatGrowth } from '@/lib/utils';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';

interface ProductDetailModalProps {
  onClose: () => void;
  onOpenChat: () => void;
}

export default function ProductDetailModal({ onClose, onOpenChat }: ProductDetailModalProps) {
  const { selectedTrend, setSelectedTrend, trends } = useTrendStore();
  const trendList = trends.length > 0 ? trends : mockTrends;
  const trend = selectedTrend ?? trendList[0];
  const satStyle = getSaturationDecision(trend.saturation);

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
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${trend.id}/400/300`; }}
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
            <div className="mb-2">
              <span className={`text-sm font-black ${satStyle.color}`}>{satStyle.label}</span>
            </div>
            <p className="text-sm leading-relaxed text-navy-700">{trend.recommendation}</p>
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
