import { create } from 'zustand';
import { API_URL } from '@/lib/constants';
import type { DashboardSnapshot } from '@/types';

interface DashboardRealtimeState {
  snapshot: DashboardSnapshot | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  fetchSnapshot: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;
}

let eventSource: EventSource | null = null;
let pollingTimer: number | null = null;

function stopPolling() {
  if (pollingTimer !== null) {
    window.clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

export const useDashboardRealtimeStore = create<DashboardRealtimeState>((set, get) => ({
  snapshot: null,
  isLoading: false,
  isConnected: false,
  error: null,

  fetchSnapshot: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/dashboard/realtime`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengambil dashboard realtime');
      set({ snapshot: json.data, isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  connect: () => {
    if (eventSource && eventSource.readyState !== EventSource.CLOSED) return;

    stopPolling();
    eventSource = new EventSource(`${API_URL}/dashboard/realtime/stream`);

    eventSource.onopen = () => {
      set({ isConnected: true, error: null });
      stopPolling();
    };

    eventSource.addEventListener('dashboard.snapshot', (event) => {
      const snapshot = JSON.parse((event as MessageEvent).data) as DashboardSnapshot;
      set({ snapshot, isConnected: true, error: null, isLoading: false });
    });

    eventSource.addEventListener('dashboard.error', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { message?: string };
      set({ error: payload.message || 'Stream dashboard bermasalah' });
    });

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      set({ isConnected: false, error: 'SSE terputus, memakai polling fallback' });

      if (pollingTimer === null) {
        void get().fetchSnapshot();
        pollingTimer = window.setInterval(() => {
          void get().fetchSnapshot();
        }, 5000);
      }
    };
  },

  disconnect: () => {
    eventSource?.close();
    eventSource = null;
    stopPolling();
    set({ isConnected: false });
  },
}));
