import { create } from 'zustand';
import { normalizeTrendMedia } from '@/lib/media';
import type { Trend } from '@/types';

const DEFAULT_TREND_LIMIT = 100;

interface TrendState {
  trends: Trend[];
  selectedTrend: Trend | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  filters: {
    category: string;
    phase: string;
    platform: string;
    sort: string;
  };
  
  fetchTrends: (page?: number, limit?: number) => Promise<void>;
  searchTrends: (query: string) => Promise<Trend[]>;
  getTrendById: (id: string) => Promise<Trend | null>;
  setSelectedTrend: (trend: Trend | null) => void;
  setSearchQuery: (q: string) => void;
  setFilters: (filters: Partial<TrendState['filters']>) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useTrendStore = create<TrendState>((set, get) => ({
  trends: [],
  selectedTrend: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  searchQuery: '',
  filters: {
    category: 'all',
    phase: '',
    platform: '',
    sort: 'window',
  },

  fetchTrends: async (page = 1, limit = DEFAULT_TREND_LIMIT) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', String(limit));
      params.set('sort', filters.sort);
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.phase) params.set('phase', filters.phase);
      if (filters.platform) params.set('platform', filters.platform);

      const res = await fetch(`${API_URL}/trends?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      set({
        trends: ((data.data ?? []) as Trend[]).map(normalizeTrendMedia),
        total: data.total ?? 0,
        page: data.page ?? page,
        totalPages: data.totalPages ?? 1,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  searchTrends: async (query) => {
    if (query.length < 2) {
      await get().fetchTrends();
      return get().trends;
    }
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      const res = await fetch(`${API_URL}/trends/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const results = ((data.data ?? []) as Trend[]).map(normalizeTrendMedia);
      set({ trends: results, total: results.length, page: 1, totalPages: 1, isLoading: false });
      return results;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return [];
    }
  },

  getTrendById: async (id) => {
    try {
      const res = await fetch(`${API_URL}/trends/${id}`);
      const data = await res.json();
      if (!res.ok || !data.data) return null;
      const trend = normalizeTrendMedia(data.data as Trend);
      set({ selectedTrend: trend });
      return trend;
    } catch {
      return null;
    }
  },

  setSelectedTrend: (trend) => set({
    selectedTrend: trend ? normalizeTrendMedia(trend) : null,
  }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),
}));
