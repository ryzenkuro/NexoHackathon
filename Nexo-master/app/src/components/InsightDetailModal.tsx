import {
  Activity,
  ArrowRight,
  BarChart3,
  MessageCircle,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatGrowth, getPhaseColor, getSaturationStyle, hideBrokenImage } from '@/lib/utils';
import type { InsightId, Trend } from '@/types';

type InsightConfig = {
  icon: LucideIcon;
  title: string;
  eyebrow: string;
  summary: string;
  recommendation: string;
  primaryLabel: string;
  primaryPath: string;
  tone: string;
  chatSaturation: number;
  chatPhase: Trend['phase'];
};

const insightConfig: Record<InsightId, InsightConfig> = {
  emerging: {
    icon: Sparkles,
    title: 'Emerging signals',
    eyebrow: 'Peluang masuk awal',
    summary: 'Produk dengan growth tajam dan saturation rendah sedang lebih mudah dites sebelum pasar makin ramai.',
    recommendation: 'Prioritaskan validasi produk dengan stok kecil, harga kompetitif, dan konten pendek dalam 24 jam.',
    primaryLabel: 'Lihat Emerging',
    primaryPath: '/viral-products?phase=Emerging',
    tone: 'bg-primary/10 text-primary',
    chatSaturation: 35,
    chatPhase: 'Emerging',
  },
  risk: {
    icon: ShieldCheck,
    title: 'Risk alerts',
    eyebrow: 'Risiko saturation',
    summary: 'Kategori yang sudah masuk Peak, Decay, atau saturation tinggi perlu dicek ulang sebelum tambah stok.',
    recommendation: 'Tahan ekspansi stok sampai margin, kompetitor, dan review velocity terlihat masih sehat.',
    primaryLabel: 'Cek Guard',
    primaryPath: '/saturation-guard',
    tone: 'bg-orange-50 text-orange-600',
    chatSaturation: 78,
    chatPhase: 'Peak',
  },
  growth: {
    icon: Activity,
    title: 'Growth suggestions',
    eyebrow: 'Saran eksekusi konten',
    summary: 'Tren dengan window panjang cocok dijadikan bahan konten pendek, uji pakai, dan variasi angle jualan.',
    recommendation: 'Mulai dari hook 3 detik, before-after, atau unboxing singkat untuk menguji respons audience.',
    primaryLabel: 'Buka Konten',
    primaryPath: '/trending-content',
    tone: 'bg-green-50 text-green-600',
    chatSaturation: 45,
    chatPhase: 'Growing',
  },
};

function getRelatedTrends(insightId: InsightId, trends: Trend[]): Trend[] {
  const sorted = [...trends];

  if (insightId === 'emerging') {
    return sorted
      .filter((trend) => trend.phase === 'Emerging' || trend.saturation <= 45)
      .sort((a, b) => {
        if (a.phase === 'Emerging' && b.phase !== 'Emerging') return -1;
        if (a.phase !== 'Emerging' && b.phase === 'Emerging') return 1;
        return b.growth - a.growth || a.saturation - b.saturation;
      });
  }

  if (insightId === 'risk') {
    return sorted
      .filter((trend) => trend.phase === 'Peak' || trend.phase === 'Decay' || trend.saturation >= 70)
      .sort((a, b) => b.saturation - a.saturation || b.growth - a.growth);
  }

  return sorted
    .filter((trend) => trend.windowHours >= 24)
    .sort((a, b) => b.windowHours - a.windowHours || b.growth - a.growth);
}

function getAverage(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

interface InsightDetailModalProps {
  insightId: InsightId;
  trends: Trend[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  onAskNexo: (trend: Trend) => void;
}

export default function InsightDetailModal({
  insightId,
  trends,
  onClose,
  onNavigate,
  onAskNexo,
}: InsightDetailModalProps) {
  const config = insightConfig[insightId];
  const Icon = config.icon;
  const relatedTrends = getRelatedTrends(insightId, trends);
  const visibleTrends = relatedTrends.slice(0, 3);
  const avgGrowth = getAverage(relatedTrends.map((trend) => trend.growth));
  const avgSaturation = getAverage(relatedTrends.map((trend) => trend.saturation));
  const chatTrend = relatedTrends[0];

  return (
    <div
      className="premium-shell w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl fade-in-up"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={`Detail insight: ${config.title}`}
      aria-modal="true"
    >
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.tone}`}>
              <Icon size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-secondary-gray-500">{config.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-navy-900">{config.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">{config.summary}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-navy-900 transition-colors hover:bg-white btn-press"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/65 p-4">
            <p className="text-xs font-bold text-secondary-gray-500">Tren cocok</p>
            <p className="mt-2 text-xl font-black text-navy-900">{relatedTrends.length}</p>
          </div>
          <div className="rounded-3xl bg-white/65 p-4">
            <p className="text-xs font-bold text-secondary-gray-500">Avg growth</p>
            <p className="mt-2 text-xl font-black text-green-600">{formatGrowth(avgGrowth)}</p>
          </div>
          <div className="rounded-3xl bg-white/65 p-4">
            <p className="text-xs font-bold text-secondary-gray-500">Avg sat</p>
            <p className="mt-2 text-xl font-black text-navy-900">{avgSaturation}%</p>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-primary/20 bg-primary/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-primary">
              <BarChart3 size={16} />
            </span>
            <span className="text-sm font-black text-primary">Rekomendasi Nexo</span>
          </div>
          <p className="text-sm leading-relaxed text-navy-700">{config.recommendation}</p>
        </div>

        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-navy-900">Tren terkait</h3>
            <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold text-secondary-gray-500">
              Top {visibleTrends.length}
            </span>
          </div>

          {visibleTrends.length > 0 ? (
            <div className="space-y-2">
              {visibleTrends.map((trend) => {
                const saturationStyle = getSaturationStyle(trend.saturation);
                return (
                  <div key={trend.id} className="flex items-center gap-3 rounded-3xl bg-white/65 p-3">
                    <img
                      src={trend.thumbnail}
                      alt={trend.name}
                      loading="lazy"
                      onError={hideBrokenImage}
                      className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-navy-900">{trend.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getPhaseColor(trend.phase)}`}>
                          {trend.phase}
                        </span>
                      </div>
                      <p className="text-xs text-secondary-gray-500">
                        {formatGrowth(trend.growth)} growth / {trend.saturation}% saturation / ~{trend.windowHours} jam
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${saturationStyle.bg} ${saturationStyle.text}`}>
                      {saturationStyle.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-white/65 p-6 text-center">
              <SearchCheck className="mx-auto mb-3 text-secondary-gray-500" size={26} />
              <p className="text-sm font-black text-navy-900">Belum ada tren yang cocok</p>
              <p className="mt-1 text-xs leading-relaxed text-secondary-gray-500">
                Insight tetap bisa dicek lewat halaman terkait untuk melihat data terbaru.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onNavigate(config.primaryPath)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3 text-sm font-bold text-white transition-colors hover:bg-primary btn-press"
          >
            {config.primaryLabel}
            <ArrowRight size={17} />
          </button>
          <button
            onClick={() => chatTrend && onAskNexo(chatTrend)}
            disabled={!chatTrend}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/70 py-3 text-sm font-bold text-navy-700 transition-colors hover:bg-white disabled:opacity-50 btn-press"
          >
            <MessageCircle size={17} />
            Tanya Nexo
          </button>
          <button
            onClick={onClose}
            className="flex flex-1 items-center justify-center rounded-2xl bg-white/70 py-3 text-sm font-bold text-navy-700 transition-colors hover:bg-white btn-press"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
