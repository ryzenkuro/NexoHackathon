import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, LogOut, User, X, Moon, Sun, MessageCircle, Command } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore, useTrendStore } from '@/stores';
import { useNotificationStore } from '@/stores';
import { clearStoredAuth, formatGrowth } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Trend } from '@/types';
import nexoLogo from '@/images/logo.png';
import NotifBadge from '@/components/NotifBadge';
import ConfirmDialog from '@/components/ConfirmDialog';

interface NavbarProps {
  onChatToggle: () => void;
  onNotifToggle: () => void;
  onOpenProduct: () => void;
}

function normalizeSearchRaw(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeSearchText(value: string): string {
  return normalizeSearchRaw(value)
    .trim()
    .replace(/\s+/g, ' ');
}

function getSearchRank(trend: Trend, query: string): number | null {
  const name = normalizeSearchText(trend.name);
  const category = normalizeSearchText(trend.category);
  const platform = normalizeSearchText(trend.platform);
  const words = name.split(/\s+/);

  if (query.length === 1) {
    return name.startsWith(query) ? 0 : null;
  }

  if (name.startsWith(query)) return 0;
  if (words.some((word) => word.startsWith(query))) return 1;
  if (name.includes(query)) return 2;
  if (category.includes(query) || platform.includes(query)) return 3;

  return null;
}

function getNormalizedMatchRange(text: string, query: string): [number, number] | null {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;

  let normalizedText = '';
  const indexMap: number[] = [];

  Array.from(text).forEach((char, index) => {
    const normalizedChar = normalizeSearchRaw(char);
    Array.from(normalizedChar).forEach((normalizedPart) => {
      normalizedText += normalizedPart;
      indexMap.push(index);
    });
  });

  const start = normalizedText.indexOf(normalizedQuery);
  if (start < 0) return null;

  const end = start + normalizedQuery.length - 1;
  const originalStart = indexMap[start];
  const originalEnd = indexMap[end] + 1;

  return [originalStart, originalEnd];
}

function renderHighlightedName(name: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length === 1) {
    return (
      <>
        <mark className="rounded bg-yellow-100 px-0.5 font-black text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-200">
          {name.slice(0, 1)}
        </mark>
        {name.slice(1)}
      </>
    );
  }

  const range = getNormalizedMatchRange(name, query);
  if (!range) return name;

  const [start, end] = range;
  return (
    <>
      {name.slice(0, start)}
      <mark className="rounded bg-yellow-100 px-0.5 font-black text-yellow-800 dark:bg-yellow-400/20 dark:text-yellow-200">
        {name.slice(start, end)}
      </mark>
      {name.slice(end)}
    </>
  );
}

export default function Navbar({ onChatToggle, onNotifToggle, onOpenProduct }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setAuth } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { searchQuery, setSearchQuery, trends } = useTrendStore();
  const [showResults, setShowResults] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const path = location.pathname;
  const searchContext: { placeholder: string; behavior: 'modal' | 'select' | 'navigate' } =
    path.startsWith('/saturation-guard')
      ? { placeholder: 'Cari tren untuk dianalisis...', behavior: 'select' }
      : path.startsWith('/trending-content')
      ? { placeholder: 'Cari konten viral...', behavior: 'navigate' }
      : path.startsWith('/notifications')
      ? { placeholder: 'Cari notifikasi...', behavior: 'navigate' }
      : { placeholder: 'Cari tren produk...', behavior: 'modal' };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth(false, null);
    toast.success('Logout berhasil. Sampai jumpa!');
    navigate('/login');
  };

  const toggleDark = () => setTheme(isDark ? 'light' : 'dark');

  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const searchResults: Trend[] = useMemo(() => {
    if (normalizedSearchQuery.length < 1) return [];

    return trends
      .map((trend) => ({ trend, rank: getSearchRank(trend, normalizedSearchQuery) }))
      .filter((result): result is { trend: Trend; rank: number } => result.rank !== null)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.trend.name.localeCompare(b.trend.name, 'id', { sensitivity: 'base' });
      })
      .slice(0, 5)
      .map((result) => result.trend);
  }, [normalizedSearchQuery, trends]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectResult = (trend: Trend) => {
    useTrendStore.getState().setSelectedTrend(trend);
    setSearchQuery('');
    setShowResults(false);

    if (searchContext.behavior === 'select') {
      return;
    }
    if (searchContext.behavior === 'navigate') {
      navigate('/viral-products');
      onOpenProduct();
      return;
    }
    onOpenProduct();
  };

  return (
    <header className="fixed top-4 left-4 right-4 md:left-[292px] md:right-8 z-40 min-h-[74px] rounded-3xl glassmorphism shadow-navbar flex items-center justify-between gap-4 px-4 sm:px-5">
      <div className="md:hidden ml-11 flex items-center gap-2 min-w-0">
        <img src={nexoLogo} alt="Nexo Logo" width={32} height={32} className="h-8 w-8 rounded-xl object-cover" />
        <span className="font-black text-navy-900">Nexo</span>
      </div>

      <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl relative">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-gray-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={searchContext.placeholder}
            aria-label={searchContext.placeholder}
            className="soft-input h-12 w-full rounded-2xl pl-11 pr-24 text-sm"
          />
          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setShowResults(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-gray-400 hover:text-navy-700 btn-press"
              aria-label="Hapus pencarian"
            >
              <X size={16} />
            </button>
          ) : (
            <span
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-xl border border-secondary-gray-200 bg-white/80 px-2 py-1 text-xs font-semibold text-secondary-gray-500 md:flex"
              aria-hidden="true"
            >
              <Command size={12} />
              Ctrl K
            </span>
          )}
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-card-hover backdrop-blur-xl z-50 fade-in-up">
            {searchResults.map((trend) => (
              <button
                key={trend.id}
                onClick={() => handleSelectResult(trend)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary-gray-50"
              >
                <img
                  src={trend.thumbnail}
                  alt={trend.name}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${trend.id}/400/300`; }}
                  className="h-11 w-11 flex-shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-900">
                    {renderHighlightedName(trend.name, searchQuery)}
                  </p>
                  <p className="text-xs text-secondary-gray-500">{trend.platform} / {formatGrowth(trend.growth)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && normalizedSearchQuery.length >= 1 && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 rounded-3xl border border-white/80 bg-white/95 px-4 py-4 shadow-card z-50 fade-in">
            <p className="text-sm font-bold text-navy-900">Tidak ada hasil</p>
            <p className="text-xs text-secondary-gray-500">Tidak ada hasil untuk "{searchQuery}"</p>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          onClick={onChatToggle}
          aria-label="Buka chat Nexo"
          className="hidden h-11 w-11 icon-button bg-white/55 btn-press sm:inline-flex"
        >
          <MessageCircle size={19} />
        </button>

        <button
          onClick={toggleDark}
          aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
          className="h-11 w-11 icon-button bg-white/55 btn-press"
        >
          {isDark ? <Sun size={19} className="text-yellow-500" /> : <Moon size={19} className="text-navy-700" />}
        </button>

        <button
          onClick={onNotifToggle}
          aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
          className="relative h-11 w-11 icon-button bg-white/55 btn-press"
        >
          <Bell size={20} className="text-navy-700" />
          <NotifBadge count={unreadCount} className="absolute -top-0.5 -right-0.5" />
        </button>

        <div className="hidden items-center gap-3 rounded-2xl bg-white/55 py-1.5 pl-3 pr-1.5 sm:flex">
          <div className="text-right">
            <p className="text-sm font-bold leading-tight text-navy-900">{user?.name ?? 'User'}</p>
            <p className="text-xs text-secondary-gray-500">UMKM Seller</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User size={19} />
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="hidden h-11 w-11 icon-button text-red-500 hover:bg-red-50 btn-press sm:inline-flex"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Keluar dari Nexo?"
        description="Anda akan diarahkan ke halaman login. Data tren tetap tersimpan untuk login berikutnya."
        confirmLabel="Ya, keluar"
        cancelLabel="Batal"
        variant="danger"
      />
    </header>
  );
}
