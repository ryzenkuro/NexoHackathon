import { getDashboardSnapshot } from '../services/dashboardAggregator.js';
import { addDashboardClient, getDashboardClientCount } from '../services/dashboardRealtimeHub.js';

export async function getDashboardRealtime(req, res) {
  try {
    const snapshot = await getDashboardSnapshot();
    return res.json({ data: snapshot });
  } catch (error) {
    console.error('[dashboard] snapshot error:', error);
    return res.status(500).json({ error: 'Failed to build dashboard snapshot' });
  }
}

export function streamDashboardRealtime(req, res) {
  addDashboardClient(req, res);
}

export function getDashboardStreamStatus(_req, res) {
  return res.json({
    data: {
      clients: getDashboardClientCount(),
      cadenceMs: Number(process.env.DASHBOARD_REALTIME_INTERVAL_MS || 1000),
    },
  });
}
