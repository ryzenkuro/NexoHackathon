import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Flame,
  Shield,
  Bell,
  Settings,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useNotificationStore } from '@/stores';
import NotifBadge from '@/components/NotifBadge';
import nexoLogo from '@/images/logo.png';

const menuGroups = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'viral-products', label: 'Viral Products', icon: TrendingUp, path: '/viral-products' },
      { id: 'trending-content', label: 'Trending Content', icon: Flame, path: '/trending-content' },
      { id: 'saturation-guard', label: 'Saturation Guard', icon: Shield, path: '/saturation-guard' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
        className="fixed top-4 left-4 z-[60] md:hidden h-11 w-11 icon-button bg-white/85 shadow-navbar btn-press"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 modal-backdrop z-[55] md:hidden overlay-fade"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-3 top-3 bottom-3 z-50 w-[274px] premium-shell rounded-3xl
          transform transition-transform duration-300 ease-out md:left-4 md:top-4 md:bottom-4 md:w-[244px]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] md:translate-x-0'}`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center gap-3 pb-5">
            <div className="relative">
              <img src={nexoLogo} alt="Nexo Logo" width={38} height={38} className="h-10 w-10 rounded-2xl object-cover shadow-sm" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-navy-900">Nexo</h1>
              <p className="text-xs font-medium text-secondary-gray-500">Powered by Azure</p>
            </div>
          </div>

          <div className="mb-5 h-px bg-gradient-to-r from-transparent via-secondary-gray-200 to-transparent" />

          <nav className="flex-1 space-y-6">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-secondary-gray-500">
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleClick(item.path)}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 btn-press focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                          isActive
                            ? 'bg-navy-900 text-white shadow-card'
                            : 'text-navy-700 hover:bg-white/80'
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                          isActive ? 'bg-white/15 text-white' : 'bg-white/70 text-secondary-gray-500 group-hover:text-primary'
                        }`}>
                          <Icon size={17} strokeWidth={2.2} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-secondary-gray-500">
                Tools
              </p>
              <div className="rounded-3xl border border-white/75 bg-white/55 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-navy-900">AI Watchlist</p>
                    <p className="text-xs text-secondary-gray-500">12 tren dipantau</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary-gray-100">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </nav>

          <div className="space-y-1.5 border-t border-secondary-gray-200 pt-4">
            <button
              onClick={() => handleClick('/notifications')}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all btn-press focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                location.pathname === '/notifications'
                  ? 'bg-navy-900 text-white shadow-card'
                  : 'text-navy-700 hover:bg-white/80'
              }`}
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/70">
                <Bell size={17} />
                <NotifBadge count={unreadCount} className="absolute -top-1.5 -right-1.5" />
              </span>
              Notifikasi
            </button>
            <button
              onClick={() => handleClick('/settings')}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all btn-press focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                location.pathname === '/settings'
                  ? 'bg-navy-900 text-white shadow-card'
                  : 'text-navy-700 hover:bg-white/80'
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70">
                <Settings size={17} />
              </span>
              Pengaturan
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
