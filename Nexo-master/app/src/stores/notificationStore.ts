import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  addNotification: (notif: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/notifications`);
      const data = await res.json();
      if (res.ok) {
        const notifications = data.data || [];
        const unreadCount = notifications.filter((n: Notification) => !n.read).length;
        set({ notifications, unreadCount, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addNotification: (notif) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notif.id)) return state;
      return {
        notifications: [notif, ...state.notifications],
        unreadCount: notif.read ? state.unreadCount : state.unreadCount + 1,
      };
    }),

  markAsRead: async (id) => {
    try {
      await fetch(`${API_URL}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        if (!notif || notif.read) return state;
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    } catch {
      // Silently fail
    }
  },

  markAllRead: async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, { method: 'POST' });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silently fail
    }
  },
}));
