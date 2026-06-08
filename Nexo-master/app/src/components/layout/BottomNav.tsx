import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  TrendingUp,
  Flame,
  Shield,
  MessageCircle,
  Bell,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNotificationStore } from '@/stores';
import NotifBadge from '@/components/NotifBadge';

interface BottomNavProps {
  onOpenChat: () => void;
  onOpenNotif: () => void;
  hidden?: boolean;
}

type BottomNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  action?: 'chat' | 'notif';
};

const navPages: BottomNavItem[][] = [
  [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'viral-products', label: 'Viral', icon: TrendingUp, path: '/viral-products' },
    { id: 'trending-content', label: 'Content', icon: Flame, path: '/trending-content' },
  ],
  [
    { id: 'saturation-guard', label: 'Saturation', icon: Shield, path: '/saturation-guard' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, action: 'chat' },
    { id: 'notif', label: 'Notif', icon: Bell, action: 'notif' },
  ],
  [
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ],
];

export default function BottomNav({ onOpenChat, onOpenNotif, hidden = false }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();
  const [page, setPage] = useState(0);

  useEffect(() => {
    const activePage = navPages.findIndex((items) =>
      items.some((item) => item.path && location.pathname === item.path)
    );
    if (activePage >= 0) setPage(activePage);
  }, [location.pathname]);

  if (hidden) return null;

  const goPrev = () => setPage((current) => (current - 1 + navPages.length) % navPages.length);
  const goNext = () => setPage((current) => (current + 1) % navPages.length);

  const handleItemClick = (item: BottomNavItem) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    if (item.action === 'chat') onOpenChat();
    if (item.action === 'notif') onOpenNotif();
  };

  return (
    <nav className="bottom-nav-shell fixed bottom-3 left-3 right-3 z-50 rounded-3xl border border-white/90 bg-white/95 shadow-card bottom-nav-anim md:hidden">
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Navigasi sebelumnya"
          className="group flex h-11 w-9 shrink-0 items-center justify-center rounded-2xl text-secondary-gray-500 transition-colors hover:bg-secondary-gray-50 hover:text-navy-900 btn-press"
        >
          <ChevronLeft size={18} className="bottom-nav-arrow-icon group-active:-translate-x-0.5" />
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="bottom-nav-track flex"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {navPages.map((items, pageIndex) => (
              <div
                key={pageIndex}
                className="grid w-full shrink-0 grid-cols-3 gap-1"
                aria-hidden={pageIndex !== page}
              >
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      tabIndex={pageIndex === page ? 0 : -1}
                      className={`flex h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 text-center transition-all duration-200 btn-press
                        ${items.length === 1 ? 'col-start-2' : ''}
                        ${isActive ? 'bg-navy-900 text-white shadow-sm' : 'text-secondary-gray-500 hover:bg-white/70'}`}
                    >
                      <span className="relative">
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        {item.action === 'notif' && (
                          <NotifBadge count={unreadCount} className="absolute -top-1.5 -right-1.5" />
                        )}
                      </span>
                      <span className="block max-w-full truncate text-[11px] font-semibold leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Navigasi berikutnya"
          className="group flex h-11 w-9 shrink-0 items-center justify-center rounded-2xl text-secondary-gray-500 transition-colors hover:bg-secondary-gray-50 hover:text-navy-900 btn-press"
        >
          <ChevronRight size={18} className="bottom-nav-arrow-icon group-active:translate-x-0.5" />
        </button>
      </div>
    </nav>
  );
}
