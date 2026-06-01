export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const APP_CONFIG = {
  name: 'Nexo',
  description: 'Analisis tren produk viral untuk UMKM Indonesia',
  maxChatsPerDay: 20,
};

export const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'elektronik', label: 'Elektronik' },
  { id: 'rumah-tangga', label: 'Rumah Tangga' },
  { id: 'kecantikan', label: 'Kecantikan' },
  { id: 'makanan', label: 'Makanan' },
];

export const SORT_OPTIONS = [
  { id: 'window', label: 'Window Tersisa' },
  { id: 'saturation', label: 'Saturation Terendah' },
  { id: 'growth', label: 'Growth Tertinggi' },
];

export const PLATFORMS = [
  { id: '', label: 'Semua Platform' },
  { id: 'TikTok Shop', label: 'TikTok Shop' },
  { id: 'Shopee', label: 'Shopee' },
  { id: 'Instagram', label: 'Instagram' },
];

export const PHASES = [
  { id: '', label: 'Semua Fase' },
  { id: 'Emerging', label: 'Emerging' },
  { id: 'Growing', label: 'Growing' },
  { id: 'Peak', label: 'Peak' },
  { id: 'Decay', label: 'Decay' },
];
