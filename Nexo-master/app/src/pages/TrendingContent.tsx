import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  MessageSquare,
  Play,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { onActivateKey } from '@/lib/utils';
import Pagination from '@/components/Pagination';
import { useTrendStore } from '@/stores';
import type { ContentItem, Trend } from '@/types';

const platformFilters = ['Semua', 'TikTok', 'Instagram'] as const;
const PAGE_SIZE = 3;

interface TrendingContentProps {
  onOpenChat: () => void;
}

function getPlatformColor(platform: string): string {
  return platform === 'TikTok'
    ? 'bg-navy-900 text-white'
    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
}

function getEngagementNumber(engagement: string): number {
  const parsed = parseFloat(engagement.replace('%', '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getContentAnalysis(content: ContentItem) {
  const engagement = getEngagementNumber(content.engagement);
  const isHighEngagement = engagement >= 10;
  const platformHook = content.platform === 'TikTok'
    ? 'Hook 3 detik pertama harus langsung menunjukkan hasil atau transformasi produk.'
    : 'Visual opening perlu kuat dan rapi karena audiens Instagram lebih cepat menilai estetika.';

  return {
    title: isHighEngagement ? 'Momentum kuat untuk ditiru' : 'Layak diuji dengan angle baru',
    body: content.productRelevance
      ? `${platformHook} Format konten ini cocok dipakai sebagai referensi demo produk, unboxing, atau before-after singkat.`
      : `${platformHook} Gunakan sebagai referensi gaya penyampaian, lalu hubungkan ke produk yang lebih relevan untuk jualan.`,
    action: isHighEngagement
      ? 'Prioritaskan remix konten dalam 24 jam dan uji 2 variasi caption.'
      : 'Uji satu versi soft-selling dulu sebelum masuk ke produksi konten penuh.',
  };
}

function ContentDetailModal({
  content,
  onClose,
  onAskNexo,
}: {
  content: ContentItem;
  onClose: () => void;
  onAskNexo: () => void;
}) {
  const analysis = getContentAnalysis(content);
  const metricCards = [
    { icon: Eye, label: 'Views', value: content.views },
    { icon: BarChart3, label: 'Engagement', value: content.engagement },
    { icon: MessageSquare, label: 'Comments', value: content.comments },
    { icon: Clock, label: 'Duration', value: content.duration },
  ];

  return (
    <div
      className="premium-shell w-full min-w-0 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl shadow-2xl fade-in-up lg:max-w-5xl"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={`Analisis konten: ${content.title}`}
    >
      <div className="grid lg:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
        <div className="relative min-h-[420px] overflow-hidden bg-navy-900 lg:min-h-[680px]">
          {content.videoUrl ? (
            <video
              src={content.videoUrl}
              poster={content.thumbnail}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            >
              Browser Anda belum mendukung pemutar video.
            </video>
          ) : (
            <img
              src={content.thumbnail}
              alt={content.title}
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${content.id}/400/600`; }}
              className="h-full w-full object-cover"
            />
          )}
          {!content.videoUrl && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent" />
          )}

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-navy-900 shadow-sm transition-colors hover:bg-white btn-press"
          >
            <X size={18} />
          </button>

          {!content.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/35 bg-navy-900/65 text-white backdrop-blur-md">
                <Play size={27} className="ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {content.videoUrl && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              Video preview
            </div>
          )}

          {!content.videoUrl && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              Poster preview
            </div>
          )}

          <div className="pointer-events-none absolute right-4 top-16 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            {content.duration}
          </div>

          {!content.videoUrl && (
            <div className="pointer-events-none absolute bottom-4 left-4 right-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${getPlatformColor(content.platform)}`}>
                  {content.platform}
                </span>
                {content.productRelevance && (
                  <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                    Bisa Dijual
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white/80">{content.creator}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-white">{content.title}</h2>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 lg:py-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-secondary-gray-500">Content detail</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-navy-900">{content.title}</h2>
              <p className="mt-1 text-sm font-bold text-secondary-gray-500">{content.creator} / {content.platform}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-700">
                Analisis performa video untuk melihat potensi adaptasi ke konten jualan.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-primary/10 px-3 py-2 text-primary">
              <Sparkles size={16} />
              <span className="text-sm font-black">{content.engagement}</span>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            {metricCards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-3xl bg-white/65 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={15} />
                  </span>
                  <span className="text-xs font-semibold text-secondary-gray-500">{label}</span>
                </div>
                <p className="text-lg font-black text-navy-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-5 rounded-3xl border border-primary/20 bg-primary/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-primary">
                <MessageCircle size={16} />
              </span>
              <span className="text-sm font-black text-primary">{analysis.title}</span>
            </div>
            <p className="text-sm leading-relaxed text-navy-700">{analysis.body}</p>
            <p className="mt-3 text-sm font-bold text-navy-900">{analysis.action}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onAskNexo}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-navy-900 py-3 text-sm font-bold text-white transition-colors hover:bg-primary btn-press"
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
    </div>
  );
}

function mapContentToChatTrend(content: ContentItem): Trend {
  const engagement = getEngagementNumber(content.engagement);
  return {
    id: `content:${content.id}`,
    name: content.title,
    category: 'konten',
    growth: Math.round(engagement * 10),
    saturation: content.productRelevance ? 34 : 55,
    phase: engagement >= 10 ? 'Growing' : 'Emerging',
    platform: content.platform,
    timeDetected: 'Baru saja',
    windowHours: 24,
    thumbnail: content.thumbnail,
    competitorCount: 0,
    avgPrice: 0,
    reviewVelocity: Number.parseInt(content.comments.replace(/\D/g, ''), 10) || 0,
    description: `Konten ${content.platform} dari ${content.creator}: ${content.title}. Views ${content.views}, likes ${content.likes}, engagement ${content.engagement}.`,
    recommendation: getContentAnalysis(content).action,
  };
}

export default function TrendingContent({ onOpenChat }: TrendingContentProps) {
  const { setSelectedTrend } = useTrendStore();
  const [activePlatform, setActivePlatform] = useState<string>('Semua');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [page, setPage] = useState(1);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContents() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '100');
        params.set('sort', 'engagement');
        if (activePlatform !== 'Semua') params.set('platform', activePlatform);

        const res = await fetch(`${API_URL}/trending-content?${params}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal mengambil trending content');
        setContents(json.data);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError((fetchError as Error).message);
          setContents([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadContents();
    return () => controller.abort();
  }, [activePlatform]);

  useEffect(() => {
    if (!selectedContent) return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [selectedContent]);

  const filtered: ContentItem[] = contents;

  const displayed = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handlePageChange = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectContent = (content: ContentItem) => {
    setSelectedContent(content);
  };

  const handleAskNexo = (content: ContentItem) => {
    setSelectedTrend(mapContentToChatTrend(content));
    setSelectedContent(null);
    onOpenChat();
  };

  const modalOverlay = selectedContent ? (
    <>
      <div
        className="fixed inset-0 z-[49] modal-backdrop overlay-fade"
        onClick={() => setSelectedContent(null)}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 left-0 right-0 z-50 overflow-y-auto overflow-x-hidden overscroll-contain p-4 md:left-[276px] md:pr-6"
        onClick={() => setSelectedContent(null)}
      >
        <div className="flex min-h-full w-full items-start justify-center py-8">
          <ContentDetailModal
            content={selectedContent}
            onClose={() => setSelectedContent(null)}
            onAskNexo={() => handleAskNexo(selectedContent)}
          />
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <div className="space-y-6 fade-in-up">
        <section className="premium-card rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-navy-900">Trending Content</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-gray-500">
                Konten viral yang bisa diadaptasi untuk jualan, lengkap dengan engagement dan sinyal relevansi produk.
              </p>
            </div>
            <div className="rounded-3xl bg-navy-900 p-4 text-white sm:min-w-[180px]">
              <p className="text-2xl font-black">{filtered.length}</p>
              <p className="text-xs font-medium text-white/65">konten terkurasi</p>
            </div>
          </div>
        </section>

        <section className="premium-card rounded-3xl p-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {platformFilters.map((platform) => (
              <button
                key={platform}
                onClick={() => {
                  setActivePlatform(platform);
                  setPage(1);
                }}
                className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition-all btn-press ${
                  activePlatform === platform
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-white/70 text-navy-700 hover:bg-white'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="premium-card overflow-hidden rounded-3xl">
                <div className="aspect-[3/4] shimmer" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-3 w-1/2 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="premium-card rounded-3xl px-6 py-16 text-center fade-in">
            <p className="text-lg font-black text-navy-900">Gagal memuat konten</p>
            <p className="text-sm text-secondary-gray-500">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((content, i) => (
              <article
                key={content.id}
                onMouseEnter={() => setHoveredCard(content.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleInspectContent(content)}
                role="button"
                tabIndex={0}
                onKeyDown={onActivateKey(() => handleInspectContent(content))}
                aria-label={`Analisis konten: ${content.title}`}
                className="group premium-card premium-card-hover overflow-hidden rounded-3xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/15 list-item-enter"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${content.id}/400/600`; }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  <div className="absolute left-3 top-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPlatformColor(content.platform)}`}>
                      {content.platform}
                    </span>
                  </div>

                  {content.productRelevance && (
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white">
                        Bisa Dijual
                      </span>
                    </div>
                  )}

                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hoveredCard === content.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-navy-900/70 text-white shadow-none backdrop-blur-md transition-colors group-hover:bg-primary/85">
                      <Play size={26} className="ml-1" fill="currentColor" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-bold text-white/80">{content.creator}</p>
                    <h4 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white">{content.title}</h4>
                  </div>

                  <div className="absolute right-3 top-14 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white">
                    {content.duration}
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-white/70 p-2">
                      <p className="text-sm font-black text-navy-900">{content.views}</p>
                      <p className="text-[11px] text-secondary-gray-500">views</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-2">
                      <p className="text-sm font-black text-navy-900">{content.likes}</p>
                      <p className="text-[11px] text-secondary-gray-500">likes</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-2">
                      <p className="text-sm font-black text-primary">{content.engagement}</p>
                      <p className="text-[11px] text-secondary-gray-500">engage</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-secondary-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} />
                      {content.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart size={14} />
                      {content.likes}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-primary">
                      Analisis
                      <Sparkles size={12} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="premium-card rounded-3xl px-6 py-16 text-center fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Video size={30} />
            </div>
            <p className="text-lg font-black text-navy-900">Belum ada konten</p>
            <p className="text-sm text-secondary-gray-500">Coba ubah filter platform</p>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <Pagination
            total={filtered.length}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={handlePageChange}
            itemLabel="konten"
          />
        )}
      </div>

      {modalOverlay}
    </>
  );
}
