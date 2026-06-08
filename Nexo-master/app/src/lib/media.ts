import type { ContentItem, Trend } from '@/types';

const R2_PUBLIC_HOST = 'pub-753c1672040c42ff8d9bf183e2837cc7.r2.dev';
const R2_PROXY_PREFIX = '/media/r2';

export function toMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (import.meta.env.MODE !== 'production' || url.startsWith(`${R2_PROXY_PREFIX}/`)) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== R2_PUBLIC_HOST) return url;

    return `${R2_PROXY_PREFIX}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

export function normalizeTrendMedia<T extends Trend>(trend: T): T {
  return {
    ...trend,
    thumbnail: toMediaUrl(trend.thumbnail),
    rawPayloadUrl: trend.rawPayloadUrl ? toMediaUrl(trend.rawPayloadUrl) : trend.rawPayloadUrl,
  };
}

export function normalizeContentMedia(content: ContentItem): ContentItem {
  return {
    ...content,
    thumbnail: toMediaUrl(content.thumbnail),
    videoUrl: content.videoUrl ? toMediaUrl(content.videoUrl) : content.videoUrl,
  };
}
