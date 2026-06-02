import { getDashboardSnapshot } from './dashboardAggregator.js';

const clients = new Set();
let broadcastTimer = null;

function writeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addDashboardClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const client = { res };
  clients.add(client);

  getDashboardSnapshot()
    .then((snapshot) => writeEvent(res, 'dashboard.snapshot', snapshot))
    .catch((error) => writeEvent(res, 'dashboard.error', { message: error.message }));

  req.on('close', () => {
    clients.delete(client);
  });
}

export function startDashboardRealtimeHub() {
  if (broadcastTimer) return;

  const intervalMs = Number(process.env.DASHBOARD_REALTIME_INTERVAL_MS || 5 * 60 * 1000);
  broadcastTimer = setInterval(async () => {
    if (clients.size === 0) return;

    try {
      const snapshot = await getDashboardSnapshot();
      for (const client of clients) {
        writeEvent(client.res, 'dashboard.snapshot', snapshot);
      }
    } catch (error) {
      for (const client of clients) {
        writeEvent(client.res, 'dashboard.error', { message: error.message });
      }
    }
  }, intervalMs);

  broadcastTimer.unref?.();
}

export function getDashboardClientCount() {
  return clients.size;
}
