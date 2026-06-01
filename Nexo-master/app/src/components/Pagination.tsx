import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** Total jumlah item (semua, sebelum paginate) */
  total: number;
  /** Item per halaman */
  pageSize: number;
  /** Halaman aktif (1-based) */
  page: number;
  /** Callback saat user pilih halaman lain */
  onPageChange: (page: number) => void;
  /** Label item untuk pesan "Showing 1 to 10 of N <itemLabel>". Default 'hasil'. */
  itemLabel?: string;
  className?: string;
}

/**
 * Pagination component sesuai pattern Tailwind UI Plus
 * "Card footer with page buttons".
 *
 * - Mobile: 2 button (Previous / Next)
 * - Desktop: text count + numbered nav (1, 2, 3 … 8, 9, 10)
 * - Truncation otomatis dengan ellipsis kalau total page > 7
 */
export default function Pagination({
  total,
  pageSize,
  page,
  onPageChange,
  itemLabel = 'hasil',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  // Build page items dengan ellipsis: 1 … 4 5 6 … 10
  const pages: (number | 'dots')[] = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: (number | 'dots')[] = [1];
    if (safePage > 3) items.push('dots');
    const startMid = Math.max(2, safePage - 1);
    const endMid = Math.min(totalPages - 1, safePage + 1);
    for (let p = startMid; p <= endMid; p++) items.push(p);
    if (safePage < totalPages - 2) items.push('dots');
    items.push(totalPages);
    return items;
  })();

  if (total === 0) return null;

  return (
    <div
      className={`premium-card flex items-center justify-between rounded-3xl px-4 py-3 ${className}`}
    >
      {/* Mobile: simple prev/next */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => canPrev && onPageChange(safePage - 1)}
          disabled={!canPrev}
          className="relative inline-flex items-center rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-navy-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 btn-press"
        >
          Sebelumnya
        </button>
        <span className="self-center text-xs text-secondary-gray-500 tabular-nums">
          Hal. {safePage} / {totalPages}
        </span>
        <button
          onClick={() => canNext && onPageChange(safePage + 1)}
          disabled={!canNext}
          className="relative inline-flex items-center rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-navy-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 btn-press"
        >
          Berikutnya
        </button>
      </div>

      {/* Desktop: count + numbered nav */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-secondary-gray-500">
          Menampilkan <span className="font-medium text-navy-900 tabular-nums">{start}</span>{' '}
          - <span className="font-medium text-navy-900 tabular-nums">{end}</span> dari{' '}
          <span className="font-medium text-navy-900 tabular-nums">{total}</span> {itemLabel}
        </p>

        <nav aria-label="Pagination" className="isolate inline-flex gap-1 rounded-2xl">
          {/* Prev */}
          <button
            onClick={() => canPrev && onPageChange(safePage - 1)}
            disabled={!canPrev}
            aria-label="Halaman sebelumnya"
            className="relative inline-flex items-center rounded-2xl px-2 py-2 text-secondary-gray-500 transition-colors hover:bg-white/70 focus:z-20 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          {/* Pages */}
          {pages.map((p, i) =>
            p === 'dots' ? (
              <span
                key={`dots-${i}`}
                className="relative inline-flex items-center rounded-2xl px-3 py-2 text-sm font-semibold text-secondary-gray-500"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === safePage ? 'page' : undefined}
                aria-label={`Halaman ${p}`}
                className={
                  p === safePage
                    ? 'relative z-10 inline-flex items-center rounded-2xl bg-navy-900 px-4 py-2 text-sm font-bold text-white transition-colors focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                    : 'relative inline-flex items-center rounded-2xl px-4 py-2 text-sm font-bold text-navy-700 transition-colors hover:bg-white/70 focus:z-20 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15'
                }
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => canNext && onPageChange(safePage + 1)}
            disabled={!canNext}
            aria-label="Halaman berikutnya"
            className="relative inline-flex items-center rounded-2xl px-2 py-2 text-secondary-gray-500 transition-colors hover:bg-white/70 focus:z-20 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}
