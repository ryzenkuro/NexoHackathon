import { Bell, Clock, CheckCheck, Radar } from 'lucide-react';
import { useState } from 'react';
import { useNotificationStore, useTrendStore } from '@/stores';
import { onActivateKey } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationsPageProps {
  onOpenProduct: () => void;
}

export default function NotificationsPage({ onOpenProduct }: NotificationsPageProps) {
  const { notifications, markAsRead, markAllRead } = useNotificationStore();
  const { getTrendById } = useTrendStore();
  const [now] = useState(() => Date.now());

  const handleNotifClick = async (notif: Notification) => {
    await markAsRead(notif.id);
    const fullTrend = notif.trendId ? await getTrendById(notif.trendId) : null;
    if (fullTrend) {
      onOpenProduct();
    }
  };

  const getUrgencyColor = (urgency: Notification['urgency']) => {
    switch (urgency) {
      case 'Critical': return { dot: 'bg-red-500', badge: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
      case 'High': return { dot: 'bg-orange-500', badge: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' };
      case 'Medium': return { dot: 'bg-yellow-500', badge: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
      default: return { dot: 'bg-secondary-gray-400', badge: 'bg-secondary-gray-400', text: 'text-secondary-gray-600', bg: 'bg-secondary-gray-50' };
    }
  };

  const formatTimestamp = (ts: string) => {
    const diff = now - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const renderNotif = (notif: Notification, highlighted: boolean, index = 0) => {
    const style = getUrgencyColor(notif.urgency);
    return (
      <article
        key={notif.id}
        onClick={() => void handleNotifClick(notif)}
        role="button"
        tabIndex={0}
        onKeyDown={onActivateKey(() => void handleNotifClick(notif))}
        className={`premium-card premium-card-hover rounded-3xl p-4 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/15 list-item-enter btn-press ${highlighted ? 'border-primary/30' : 'opacity-75 hover:opacity-100'}`}
        style={{ animationDelay: `${Math.min(index * 0.05, 0.2)}s` }}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.bg}`}>
            <div className={`h-3 w-3 rounded-full ${style.dot} ${notif.windowHours < 24 ? 'animate-pulse-urgency' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className={`text-sm text-navy-900 ${highlighted ? 'font-black' : 'font-bold'}`}>{notif.trendName}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${style.badge}`}>
                {notif.urgency}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-gray-500">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                Window: ~{notif.windowHours} jam
              </span>
              <span>{formatTimestamp(notif.timestamp)}</span>
            </div>
          </div>
          {highlighted && <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 fade-in-up">
      <section className="premium-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-primary">
              <Radar size={14} />
              Alert center
            </div>
            <h2 className="text-3xl font-black tracking-tight text-navy-900">Notifikasi</h2>
            <p className="mt-2 text-sm text-secondary-gray-500">
              {unread.length > 0 ? `${unread.length} belum dibaca` : 'Semua sudah dibaca'}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white btn-press"
            >
              <CheckCheck size={16} />
              Tandai semua dibaca
            </button>
          )}
        </div>
      </section>

      {notifications.length === 0 && (
        <div className="premium-card rounded-3xl px-6 py-20 text-center fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-600">
            <Bell size={28} />
          </div>
          <p className="mb-1 text-base font-black text-navy-900">Tenang, belum ada yang urgent</p>
          <p className="mx-auto max-w-xs text-sm text-secondary-gray-500">
            Kami pantau pasar 24/7. Begitu ada peluang baru yang cocok, langsung muncul di sini.
          </p>
        </div>
      )}

      {unread.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-black uppercase tracking-wide text-secondary-gray-500">
            Baru / {unread.length}
          </h3>
          {unread.map((notif, i) => renderNotif(notif, true, i))}
        </section>
      )}

      {read.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-black uppercase tracking-wide text-secondary-gray-500">Sudah Dibaca</h3>
          {read.map((notif, i) => renderNotif(notif, false, i))}
        </section>
      )}
    </div>
  );
}
