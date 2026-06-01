import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { Trend } from '@/types';
import { onActivateKey } from '@/lib/utils';

interface TrendSelectorProps {
  trends: Trend[];
  selected: Trend;
  onSelect: (trend: Trend) => void;
}

/**
 * Trend switcher dropdown — bukan search, hanya pemilih.
 *
 * Design rationale:
 * - Sorted by saturation **ascending** → trend paling rendah saturasi (= peluang
 *   terbaik) di atas. User UMKM langsung lihat opsi paling worthy dianalisis.
 * - Tanpa search input → untuk dataset 12-30 item, scrollable list lebih cepat
 *   dari mengetik (Hick's Law).
 * - Label "Sedang dianalisis" lebih kontekstual untuk user UMKM dibanding
 *   "Tren" generik.
 * - Search bar global di Navbar tetap berfungsi untuk cari trend dari
 *   konteks page mana pun.
 */
export default function TrendSelector({ trends, selected, onSelect }: TrendSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort by saturation asc — peluang terbaik di atas
  const sorted = useMemo(
    () => [...trends].sort((a, b) => a.saturation - b.saturation),
    [trends]
  );

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const saturationTextColor = (sat: number) => {
    if (sat <= 30) return 'text-green-600';
    if (sat <= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="premium-card flex w-full items-center justify-between gap-3 rounded-3xl px-4 py-3 text-sm text-navy-900 transition-colors hover:bg-white focus:outline-none focus:ring-4 focus:ring-primary/15 sm:w-[440px]"
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs uppercase tracking-wide text-secondary-gray-500 leading-tight">
            Sedang dianalisis
          </p>
          <p className="font-semibold truncate leading-tight">{selected.name}</p>
        </div>
        <ChevronDown
          size={18}
          className={`text-secondary-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 z-30 mt-2 overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-card-hover backdrop-blur-xl fade-in-up sm:right-auto sm:w-[440px]"
        >
          <div className="border-b border-secondary-gray-200 bg-secondary-gray-50/80 px-4 py-3">
            <p className="text-xs font-semibold text-secondary-gray-500 uppercase tracking-wide">
              Diurutkan: peluang terbaik
            </p>
          </div>

          <div className="max-h-[360px] overflow-y-auto py-1">
            {sorted.map((t) => {
              const isActive = t.id === selected.id;
              return (
                <div
                  key={t.id}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={0}
                  onClick={() => {
                    onSelect(t);
                    setOpen(false);
                  }}
                  onKeyDown={onActivateKey(() => {
                    onSelect(t);
                    setOpen(false);
                  })}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-navy-900 hover:bg-secondary-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {t.name}
                    </p>
                    <p className="text-xs text-secondary-gray-500 truncate">
                      Saturasi <span className={`font-semibold ${saturationTextColor(t.saturation)}`}>{t.saturation}</span> / {t.platform}
                    </p>
                  </div>
                  {isActive && <Check size={16} className="text-primary flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
