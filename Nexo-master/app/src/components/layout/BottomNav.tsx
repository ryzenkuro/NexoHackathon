import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Flame,
  Shield,
  MessageCircle,
  Bell,
} from 'lucide-react';
import { useNotificationStore } from '@/stores';
import NotifBadge from '@/components/NotifBadge';

interface BottomNavProps {
  onOpenChat: () => void;
  onOpenNotif: () => void;
}

const mainItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'viral-products', label: 'Viral', icon: TrendingUp, path: '/viral-products' },
  { id: 'trending-content', label: 'Content', icon: Flame, path: '/trending-content' },
  { id: 'saturation-guard', label: 'Saturation', icon: Shield, path: '/saturation-guard' },
];

export default function BottomNav({ onOpenChat, onOpenNotif }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 premium-shell rounded-3xl bottom-nav-anim">
      <div className="flex items-center justify-around px-2 py-2">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-2.5 py-2 transition-all duration-200 btn-press
                ${isActive ? 'bg-navy-900 text-white shadow-sm' : 'text-secondary-gray-500 hover:bg-white/70'}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="max-w-[58px] truncate text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}

        {/* Chat FAB */}
        <button
          onClick={onOpenChat}
          className="flex flex-col items-center gap-0.5 rounded-2xl px-2.5 py-2 text-secondary-gray-500 transition-all duration-200 hover:bg-white/70 btn-press"
        >
          <MessageCircle size={20} />
          <span className="text-[11px] font-semibold">Chat</span>
        </button>

        {/* Notification */}
        <button
          onClick={onOpenNotif}
          className="relative flex flex-col items-center gap-0.5 rounded-2xl px-2.5 py-2 text-secondary-gray-500 transition-all duration-200 hover:bg-white/70 btn-press"
        >
          <div className="relative">
            <Bell size={20} />
            <NotifBadge count={unreadCount} className="absolute -top-1.5 -right-1.5" />
          </div>
          <span className="text-[11px] font-semibold">Notif</span>
        </button>
      </div>
    </nav>
  );
}
