import { create } from 'zustand';
import type { Trend } from '@/types';

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
  
  fetchTrends: (page?: number) => Promise<void>;
  searchTrends: (query: string) => Promise<void>;
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

  fetchTrends: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      params.set('sort', filters.sort);
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.phase) params.set('phase', filters.phase);
      if (filters.platform) params.set('platform', filters.platform);

      const res = await fetch(`${API_URL}/trends?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      set({
        trends: data.data,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  searchTrends: async (query) => {
    if (query.length < 2) {
      get().fetchTrends();
      return;
    }
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      const res = await fetch(`${API_URL}/trends/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ trends: data.data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  getTrendById: async (id) => {
    try {
      const res = await fetch(`${API_URL}/trends/${id}`);
      const data = await res.json();
      if (!res.ok) return null;
      set({ selectedTrend: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  setSelectedTrend: (trend) => set({ selectedTrend: trend }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),
}));
