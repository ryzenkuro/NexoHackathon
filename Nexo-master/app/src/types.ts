export interface Trend {
  id: string;
  name: string;
  category: string;
  growth: number;
  saturation: number;
  phase: 'Emerging' | 'Growing' | 'Peak' | 'Decay';
  platform: string;
  timeDetected: string;
  windowHours: number;
  windowSeconds?: number;
  thumbnail: string;
  competitorCount: number;
  avgPrice: number;
  reviewVelocity: number;
  description: string;
  recommendation: string;
  updatedAt?: string;
  freshness?: string;
}

export type InsightId = 'emerging' | 'risk' | 'growth';

export interface Notification {
  id: string;
  trendId: string;
  trendName: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  windowHours: number;
  timestamp: string;
  read: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  trendId: string;
  messages: ChatMessage[];
}

export interface ContentItem {
  id: string;
  title: string;
  creator: string;
  platform: 'TikTok' | 'Instagram';
  views: string;
  engagement: string;
  likes: string;
  comments: string;
  thumbnail: string;
  productRelevance: boolean;
  duration: string;
  url?: string;
  videoUrl?: string;
  relatedTrendId?: string;
  updatedAt?: string;
}

export interface DashboardGrowthItem {
  trendId: string;
  name: string;
  growth: number;
  saturation: number;
  windowSeconds: number;
  phase: Trend['phase'];
  momentumScore?: number;
  momentumDirection?: 'up' | 'down' | 'flat';
}

export interface DashboardSnapshot {
  updatedAt: string;
  cadenceMs: number;
  sourceStatus: 'demo-live' | 'demo-fallback' | 'database' | string;
  metrics: {
    activeTrends: number;
    emergingTrends: number;
    avgSaturation: number;
    nearestWindowSeconds: number;
    nearestWindowTrendId: string | null;
  };
  deltas: {
    activeTrends: number;
    emergingTrends: number;
    avgSaturation: number;
  };
  growthMomentum: {
    totalWatched: number;
    weeklyDeltaPct: number;
    items: DashboardGrowthItem[];
  };
}

export interface SaturationDetail extends Trend {
  trendId: string;
  opportunityScore: number;
  decision: string;
  competitorDensity?: Array<{
    day: string;
    count: number;
  }>;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  businessCategory?: string;
  isNewUser?: boolean;
}
