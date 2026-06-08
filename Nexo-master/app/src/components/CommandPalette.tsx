import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  TrendingUp,
  Shield,
  Flame,
  Bell,
  Settings,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore, useTrendStore } from '@/stores';
import { clearStoredAuth, formatGrowth } from '@/lib/utils';
import { API_URL } from '@/lib/constants';
import { normalizeTrendMedia } from '@/lib/media';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Trend } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProduct: () => void;
}

/**
 * Command palette (Cmd+K / Ctrl+K) untuk navigasi cepat dan pencarian tren.
 * Trigger key listener-nya didaftarkan di `useCommandPaletteHotkey` hook.
 */
export default function CommandPalette({ open, onOpenChange, onOpenProduct }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const { trends, setSelectedTrend } = useTrendStore();
  const { setAuth } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [query, setQuery] = useState('');
  const [remoteTrends, setRemoteTrends] = useState<Trend[]>([]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setRemoteTrends([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/trends/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Pencarian gagal');
        setRemoteTrends(((json.data ?? []) as Trend[]).map(normalizeTrendMedia));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setRemoteTrends([]);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const trendResults = useMemo(
    () => (query.trim().length >= 2 ? remoteTrends : trends.slice(0, 8)),
    [query, remoteTrends, trends]
  );

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSelectTrend = (trend: Trend) => {
    setSelectedTrend(trend);
    onOpenChange(false);
    onOpenProduct();
  };

  const handleLogout = () => {
    clearStoredAuth();
    setAuth(false, null);
    toast.success('Logout berhasil. Sampai jumpa!');
    navigate('/login');
  };

  const askLogout = () => {
    // Tutup palette dulu supaya tidak overlap
    onOpenChange(false);
    setShowLogoutConfirm(true);
  };

  return (
    <>
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pencarian cepat"
      description="Cari tren atau berpindah halaman dengan cepat"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Cari tren atau halaman..."
      />
      <CommandList>
        <CommandEmpty>Hmm, tidak ketemu. Coba kata kunci lain.</CommandEmpty>

        <CommandGroup heading="Halaman">
          <CommandItem onSelect={() => go('/dashboard')}>
            <LayoutDashboard />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/viral-products')}>
            <TrendingUp />
            <span>Produk Viral</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/saturation-guard')}>
            <Shield />
            <span>Saturation Guard</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/trending-content')}>
            <Flame />
            <span>Konten Trending</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/notifications')}>
            <Bell />
            <span>Notifikasi</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/settings')}>
            <Settings />
            <span>Pengaturan</span>
          </CommandItem>
        </CommandGroup>

        {trendResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tren Aktif">
              {trendResults.slice(0, 8).map((trend) => (
                <CommandItem
                  key={trend.id}
                  value={`${trend.name} ${trend.category} ${trend.platform}`}
                  onSelect={() => handleSelectTrend(trend)}
                >
                  <TrendingUp />
                  <span>{trend.name}</span>
                  <CommandShortcut>{formatGrowth(trend.growth)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Aksi">
          <CommandItem onSelect={() => { setTheme(isDark ? 'light' : 'dark'); onOpenChange(false); }}>
            {isDark ? <Sun /> : <Moon />}
            <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
          </CommandItem>
          <CommandItem onSelect={askLogout}>
            <LogOut />
            <span>Keluar Akun</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
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
    </>
  );
}
