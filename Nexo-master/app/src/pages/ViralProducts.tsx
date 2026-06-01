import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ArrowUpDown, ArrowRight, SearchCheck } from 'lucide-react';
import { useTrendStore } from '@/stores';
import { categories, sortOptions } from '@/mockData';
import { getSaturationStyle, getPhaseColor, onActivateKey, formatGrowth, getGrowthColor } from '@/lib/utils';
import Pagination from '@/components/Pagination';
import type { Trend } from '@/types';

interface ViralProductsProps {
  onOpenChat: () => void;
  onOpenProduct: () => void;
}

const PAGE_SIZE = 6;
const VALID_PHASES = ['Emerging', 'Growing', 'Peak', 'Decay'] as const;
type PhaseFilter = typeof VALID_PHASES[number];

function isPhaseFilter(value: string | null): value is PhaseFilter {
  return Boolean(value && VALID_PHASES.includes(value as PhaseFilter));
}

function isSortOption(value: string | null): value is string {
  return Boolean(value && sortOptions.some((opt) => opt.id === value));
}

export default function ViralProducts({ onOpenProduct }: ViralProductsProps) {
  const { setSelectedTrend, trends, fetchTrends, isLoading: storeLoading } = useTrendStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = searchParams.get('sort');
  const initialPhase = searchParams.get('phase');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePhase, setActivePhase] = useState<PhaseFilter | ''>(
    isPhaseFilter(initialPhase) ? initialPhase : ''
  );
  const [sortBy, setSortBy] = useState(isSortOption(initialSort) ? initialSort : 'window');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    const queryPhase = searchParams.get('phase');
    const querySort = searchParams.get('sort');

    setActivePhase(isPhaseFilter(queryPhase) ? queryPhase : '');
    setSortBy(isSortOption(querySort) ? querySort : 'window');
    setPage(1);
  }, [searchParams]);

  const updateSearchParams = (update: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    update(next);
    setSearchParams(next, { replace: true });
  };

  const clearPhaseFilter = () => {
    setActivePhase('');
    updateSearchParams((next) => next.delete('phase'));
  };

  const sortedTrends = useMemo<Trend[]>(() => {
    const categoryFiltered = activeCategory === 'all'
      ? trends
      : trends.filter((t) => t.category === activeCategory);
    const filtered = activePhase
      ? categoryFiltered.filter((t) => t.phase === activePhase)
      : categoryFiltered;

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'window': return a.windowHours - b.windowHours;
        case 'saturation': return a.saturation - b.saturation;
        case 'growth': return b.growth - a.growth;
        default: return 0;
      }
    });
  }, [activeCategory, activePhase, sortBy, trends]);

  const displayedTrends = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedTrends.slice(start, start + PAGE_SIZE);
  }, [sortedTrends, page]);

  const handlePageChange = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardClick = (trend: Trend) => {
    setSelectedTrend(trend);
    onOpenProduct();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-navy-900">Viral Products</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-gray-500">
              Produk trending dari TikTok, Shopee, dan Instagram yang siap dianalisis sebelum pasar terlalu ramai.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <div className="rounded-3xl bg-white/70 p-4">
              <p className="text-2xl font-black text-navy-900">{sortedTrends.length}</p>
              <p className="text-xs font-medium text-secondary-gray-500">hasil ditemukan</p>
            </div>
            <div className="rounded-3xl bg-navy-900 p-4 text-white">
              <p className="text-2xl font-black">{trends.filter((t) => t.phase === 'Emerging').length}</p>
              <p className="text-xs font-medium text-white/65">emerging</p>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-card rounded-3xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-secondary-gray-500 sm:flex">
              <Filter size={17} />
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (activePhase) clearPhaseFilter();
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-bold transition-all btn-press ${
                    activeCategory === cat.id
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'bg-white/70 text-navy-700 hover:bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ArrowUpDown size={16} className="text-secondary-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => {
                const nextSort = e.target.value;
                setSortBy(nextSort);
                updateSearchParams((next) => next.set('sort', nextSort));
                setPage(1);
              }}
              aria-label="Urutkan produk"
              className="soft-input rounded-2xl px-3 py-2.5 text-sm font-semibold"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {activePhase && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-secondary-gray-200/80 pt-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              Phase: {activePhase}
            </span>
            <button
              onClick={clearPhaseFilter}
              className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-navy-700 transition-colors hover:bg-white btn-press"
            >
              Tampilkan semua phase
            </button>
          </div>
        )}
      </section>

      {storeLoading && trends.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="premium-card overflow-hidden rounded-3xl">
              <div className="h-48 shimmer" />
              <div className="space-y-2 p-4">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {displayedTrends.map((trend, i) => {
            const satStyle = getSaturationStyle(trend.saturation);
            return (
              <article
                key={trend.id}
                onClick={() => handleCardClick(trend)}
                role="button"
                tabIndex={0}
                onKeyDown={onActivateKey(() => handleCardClick(trend))}
                aria-label={`Lihat detail ${trend.name}`}
                className="group premium-card premium-card-hover overflow-hidden rounded-3xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/15 list-item-enter"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.15)}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trend.thumbnail}
                    alt={trend.name}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${trend.id}/400/300`; }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPhaseColor(trend.phase)}`}>
                      {trend.phase}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/70">{trend.platform}</p>
                    <h4 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white">{trend.name}</h4>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-white/70 p-2">
                      <p className={`text-sm font-black ${getGrowthColor(trend.growth)}`}>{formatGrowth(trend.growth)}</p>
                      <p className="text-[11px] text-secondary-gray-500">growth</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-2">
                      <p className="text-sm font-black text-navy-900">{trend.saturation}%</p>
                      <p className="text-[11px] text-secondary-gray-500">sat</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-2">
                      <p className="text-sm font-black text-navy-900">{trend.windowHours}h</p>
                      <p className="text-[11px] text-secondary-gray-500">window</p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary-gray-100">
                      <div className={`h-full rounded-full ${satStyle.bar}`} style={{ width: `${trend.saturation}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${satStyle.text}`}>{satStyle.label}</span>
                  </div>

                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCardClick(trend); }}
                      className="w-full rounded-2xl bg-navy-900 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary btn-press"
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        Detail
                        <ArrowRight size={14} />
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {sortedTrends.length === 0 && !storeLoading && (
        <div className="premium-card rounded-3xl px-6 py-16 text-center fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <SearchCheck size={30} />
          </div>
          <p className="mb-2 text-lg font-black text-navy-900">Belum ada tren di kategori ini</p>
          <p className="mx-auto mb-5 max-w-sm text-sm text-secondary-gray-500">
            Coba ubah filter atau lihat semua kategori untuk menemukan peluang lain.
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            className="rounded-2xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary btn-press"
          >
            Lihat Semua Tren
          </button>
        </div>
      )}

      {storeLoading && trends.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent spin" />
        </div>
      )}

      {sortedTrends.length > PAGE_SIZE && (
        <Pagination
          total={sortedTrends.length}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={handlePageChange}
          itemLabel="tren"
        />
      )}
    </div>
  );
}
