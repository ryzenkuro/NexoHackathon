import { useState } from 'react';
import {
  Moon, Sun, Bell, Shield, User, Trash2, ChevronRight,
  Smartphone, LogOut, Info, Settings
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import { clearStoredAuth } from '@/lib/utils';
import { toast } from 'sonner';
import Toggle from '@/components/Toggle';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const onToggleDark = () => setTheme(isDark ? 'light' : 'dark');
  const { user, setAuth } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    clearStoredAuth();
    setAuth(false, null);
    toast.success('Logout berhasil. Sampai jumpa!');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    toast.error('Fitur ini belum tersedia');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 fade-in-up">
      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-primary">
          <Settings size={14} />
          Preference center
        </div>
        <h1 className="text-3xl font-black tracking-tight text-navy-900">Pengaturan</h1>
        <p className="mt-2 text-sm text-secondary-gray-500">Kelola akun, notifikasi, keamanan, dan preferensi tampilan Nexo.</p>
      </section>

      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Profil</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <User size={28} />
            </div>
            <div>
              <p className="text-lg font-black text-navy-900">{user?.name ?? 'User'}</p>
              <p className="text-sm text-secondary-gray-500">{user?.phone ?? '-'}</p>
              <p className="mt-1 text-xs font-semibold text-secondary-gray-500">
                Kategori: {user?.businessCategory ?? 'Umum'}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
            Active seller
          </span>
        </div>
      </section>

      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Tampilan</h3>
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/65 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80">
              {isDark ? <Moon size={20} className="text-violet-500" /> : <Sun size={20} className="text-orange-500" />}
            </span>
            <div>
              <p className="text-sm font-bold text-navy-900">Mode Gelap</p>
              <p className="text-xs text-secondary-gray-500">Ubah tampilan menjadi gelap</p>
            </div>
          </div>
          <Toggle checked={isDark} onChange={onToggleDark} ariaLabel="Aktifkan mode gelap" />
        </div>
      </section>

      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Notifikasi</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/65 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Bell size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-navy-900">Notifikasi Tren</p>
                <p className="text-xs text-secondary-gray-500">Dapatkan alert tren baru</p>
              </div>
            </div>
            <Toggle checked={notifications} onChange={setNotifications} ariaLabel="Aktifkan notifikasi tren" />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/65 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Smartphone size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-navy-900">Notifikasi WhatsApp</p>
                <p className="text-xs text-secondary-gray-500">Update via WhatsApp</p>
              </div>
            </div>
            <Toggle checked={marketingEmails} onChange={setMarketingEmails} ariaLabel="Aktifkan notifikasi WhatsApp" />
          </div>
        </div>
      </section>

      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Keamanan</h3>
        <div className="space-y-2">
          <button className="flex w-full items-center justify-between rounded-3xl p-4 text-left transition-colors hover:bg-white/75 btn-press">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Shield size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-navy-900">Ubah Password</p>
                <p className="text-xs text-secondary-gray-500">Perbarui keamanan akun</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-secondary-gray-500" />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center justify-between rounded-3xl p-4 text-left transition-colors hover:bg-red-50 btn-press"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-red-600">Hapus Akun</p>
                <p className="text-xs text-secondary-gray-500">Hapus data dan akun permanen</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-red-400" />
          </button>
        </div>
      </section>

      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Tentang</h3>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Info size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-navy-900">Nexo v2.0</p>
            <p className="text-xs text-secondary-gray-500">Powered by Azure OpenAI</p>
            <p className="mt-0.5 text-xs text-secondary-gray-500">AI Impact Challenge 2026</p>
          </div>
        </div>
      </section>

      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-red-50 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 btn-press"
      >
        <LogOut size={18} />
        Keluar Akun
      </button>

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

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Hapus akun secara permanen?"
        description="Semua data Anda akan dihapus dan tidak bisa dipulihkan. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, hapus akun"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
}
