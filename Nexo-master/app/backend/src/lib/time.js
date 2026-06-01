/**
 * Format a Date / ISO string into Indonesian relative time
 * (e.g. "2 jam yang lalu", "45 menit yang lalu", "2 hari yang lalu").
 */
export function formatRelativeTimeID(input) {
  const date = input instanceof Date ? input : new Date(input);
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam yang lalu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek} minggu yang lalu`;
  const diffMon = Math.floor(diffDay / 30);
  if (diffMon < 12) return `${diffMon} bulan yang lalu`;
  const diffYr = Math.floor(diffDay / 365);
  return `${diffYr} tahun yang lalu`;
}
