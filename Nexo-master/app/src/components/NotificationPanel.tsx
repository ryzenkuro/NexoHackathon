import { X, Clock, Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useNotificationStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import { useTrendStore } from '@/stores';
import { onActivateKey } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationPanelProps {
  onClose: () => void;
  onOpenProduct: () => void;
}

export default function NotificationPanel({ onClose, onOpenProduct }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllRead } = useNotificationStore();
  const { getTrendById } = useTrendStore();
  const navigate = useNavigate();

  const handleNotifClick = async (notif: Notification) => {
    await markAsRead(notif.id);
    const fullTrend = notif.trendId ? await getTrendById(notif.trendId) : null;
    if (fullTrend) {
      onClose();
      onOpenProduct();
    } else {
      onClose();
      navigate('/dashboard');
    }
  };

  const getUrgencyColor = (urgency: Notification['urgency']) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-secondary-gray-400';
    }
  };

  const getUrgencySurface = (urgency: Notification['urgency']) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-50 text-red-600';
      case 'High': return 'bg-orange-50 text-orange-600';
      case 'Medium': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-secondary-gray-50 text-secondary-gray-600';
    }
  };

  const [now] = useState(() => Date.now());

  const formatTimestamp = (ts: string) => {
    const diff = now - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const grouped = {
    recent: notifications.filter((n) => !n.read),
    today: notifications.filter((n) => {
      const diff = now - new Date(n.timestamp).getTime();
      return n.read && diff < 24 * 3600000;
    }),
    earlier: notifications.filter((n) => {
      const diff = now - new Date(n.timestamp).getTime();
      return n.read && diff >= 24 * 3600000;
    }),
  };

  const NotifItem = ({ notif, highlighted }: { notif: Notification; highlighted: boolean }) => (
    <div
      key={notif.id}
      onClick={() => void handleNotifClick(notif)}
      role="button"
      tabIndex={0}
      onKeyDown={onActivateKey(() => void handleNotifClick(notif))}
      className={`rounded-3xl p-3 cursor-pointer transition-colors list-item-enter btn-press ${
        highlighted
          ? 'border border-primary/20 bg-white/75 hover:bg-white'
          : 'hover:bg-white/70'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getUrgencySurface(notif.urgency)}`}>
          <span
            className={`h-2.5 w-2.5 rounded-full ${getUrgencyColor(notif.urgency)} ${
              notif.windowHours < 24 ? 'animate-pulse-urgency' : ''
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm text-navy-900 ${highlighted ? 'font-black' : 'font-bold'}`}>
            {notif.trendName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${getUrgencyColor(notif.urgency)}`}>
              {notif.urgency}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-secondary-gray-500">
              <Clock size={11} />
              ~{notif.windowHours} jam
            </span>
            <span className="text-xs text-secondary-gray-500">{formatTimestamp(notif.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="flex shrink-0 items-center justify-between border-b border-secondary-gray-200 p-5">
        <div>
          <h2 className="text-lg font-black text-navy-900">Notifikasi</h2>
          <p className="text-xs text-secondary-gray-500">{grouped.recent.length} belum dibaca</p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white btn-press"
            >
              <CheckCheck size={14} />
              Dibaca
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Tutup panel notifikasi"
            className="notification-close-button flex h-10 w-10 items-center justify-center rounded-2xl text-navy-700 transition-colors hover:bg-white/75 btn-press"
          >
            <X size={20} className="notification-close-icon" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {grouped.recent.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-secondary-gray-500">
              Baru / {grouped.recent.length} belum dibaca
            </h3>
            <div className="space-y-2">
              {grouped.recent.map((notif) => (
                <NotifItem key={notif.id} notif={notif} highlighted />
              ))}
            </div>
          </section>
        )}

        {grouped.today.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Hari ini</h3>
            <div className="space-y-2">
              {grouped.today.map((notif) => (
                <NotifItem key={notif.id} notif={notif} highlighted={false} />
              ))}
            </div>
          </section>
        )}

        {grouped.earlier.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Sebelumnya</h3>
            <div className="space-y-2">
              {grouped.earlier.map((notif) => (
                <NotifItem key={notif.id} notif={notif} highlighted={false} />
              ))}
            </div>
          </section>
        )}

        {notifications.length === 0 && (
          <div className="py-16 text-center fade-in">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-green-50 text-green-600">
              <Bell size={24} />
            </div>
            <p className="mb-1 text-sm font-black text-navy-900">Tenang, belum ada yang urgent</p>
            <p className="px-4 text-xs text-secondary-gray-500">
              Kami pantau pasar 24/7. Peluang baru muncul di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
