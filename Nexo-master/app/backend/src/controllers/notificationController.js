import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

function ensureDatabaseReady(res) {
  if (isSupabaseConfigured && supabase) return true;
  res.status(503).json({
    error: 'Database is not configured',
    sourceStatus: 'database-unavailable',
  });
  return false;
}

function getUserId(req) {
  const value = req.query.userId || req.body?.userId;
  return value ? String(value) : null;
}

function applyUserFilter(query, userId) {
  return userId ? query.eq('user_id', userId) : query;
}

function mapNotification(row) {
  return {
    id: row.id,
    trendId: row.trend_id,
    trendName: row.trend_name,
    urgency: row.urgency,
    windowHours: row.window_hours,
    timestamp: row.created_at,
    read: Boolean(row.read),
  };
}

export async function getNotifications(req, res) {
  try {
    if (!ensureDatabaseReady(res)) return;

    const userId = getUserId(req);
    const query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    const { data, error } = await applyUserFilter(query, userId);

    if (error) throw error;
    res.json({ data: (data ?? []).map(mapNotification), sourceStatus: 'database' });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', sourceStatus: 'database-error' });
  }
}

export async function markAsRead(req, res) {
  try {
    if (!ensureDatabaseReady(res)) return;

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Notification id is required' });

    const userId = getUserId(req);
    const query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    const { error } = await applyUserFilter(query, userId);

    if (error) throw error;
    res.json({ message: 'Notification marked as read', sourceStatus: 'database' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read', sourceStatus: 'database-error' });
  }
}

export async function markAllRead(req, res) {
  try {
    if (!ensureDatabaseReady(res)) return;

    const userId = getUserId(req);
    const query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    const { error } = await applyUserFilter(query, userId);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read', sourceStatus: 'database' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read', sourceStatus: 'database-error' });
  }
}
