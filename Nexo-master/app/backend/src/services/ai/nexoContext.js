import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { getDashboardSnapshot } from '../dashboardAggregator.js';
import { mapTrendRow } from '../../controllers/trendController.js';

function mapContentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    platform: row.platform,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    engagement: row.engagement,
    productRelevance: Boolean(row.product_relevance),
    duration: row.duration,
    url: row.url,
    relatedTrendId: row.related_trend_id,
    updatedAt: row.updated_at ?? row.scraped_at ?? new Date().toISOString(),
  };
}

export async function loadDashboardAiContext() {
  return getDashboardSnapshot();
}

export async function loadTrendAiContext(id) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is required for AI trend context.');
  }

  const query = id
    ? supabase.from('trends').select('*').eq('id', id).maybeSingle()
    : supabase.from('trends').select('*').order('growth', { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await query;
  if (!error && data) {
    return { trend: mapTrendRow(data), sourceStatus: 'database' };
  }

  if (error) throw error;
  return { trend: null, sourceStatus: 'database' };
}

export async function loadContentAiContext(id) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is required for AI content context.');
  }

  const contentQuery = id
    ? supabase.from('trending_contents').select('*').eq('id', id).maybeSingle()
    : supabase.from('trending_contents').select('*').order('engagement', { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await contentQuery;
  if (!error && data) {
    let trend = null;
    if (data.related_trend_id) {
      const trendResult = await supabase
        .from('trends')
        .select('*')
        .eq('id', data.related_trend_id)
        .maybeSingle();
      trend = trendResult.data ? mapTrendRow(trendResult.data) : null;
    }

    return { content: mapContentRow(data), trend, sourceStatus: 'database' };
  }

  if (error) throw error;
  return {
    content: null,
    trend: null,
    sourceStatus: 'database',
  };
}
