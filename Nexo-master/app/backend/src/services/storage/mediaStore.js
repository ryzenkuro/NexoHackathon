import crypto from 'crypto';
import { putR2Object } from '../../lib/r2.js';

function sanitizePathSegment(value) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

function toIsoPath(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashValue(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function buildResearchObjectKey({
  platform = 'research',
  type = 'raw',
  label = 'payload',
  extension = 'json',
  capturedAt = new Date(),
  uniqueValue,
}) {
  const datePath = toIsoPath(new Date(capturedAt));
  const safePlatform = sanitizePathSegment(platform);
  const safeType = sanitizePathSegment(type);
  const safeLabel = sanitizePathSegment(label);
  const id = hashValue(uniqueValue || `${safePlatform}:${safeLabel}:${Date.now()}`);

  return `${safeType}/${safePlatform}/${datePath}/${safeLabel}-${id}.${extension}`;
}

export async function saveResearchJson({
  platform,
  type = 'raw',
  label,
  payload,
  sourceUrl,
  capturedAt = new Date(),
}) {
  const body = JSON.stringify(
    {
      captured_at: new Date(capturedAt).toISOString(),
      source_url: sourceUrl || null,
      platform: platform || null,
      payload,
    },
    null,
    2
  );

  return putR2Object({
    key: buildResearchObjectKey({
      platform,
      type,
      label,
      capturedAt,
      uniqueValue: `${sourceUrl || ''}:${body}`,
    }),
    body,
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=86400',
  });
}

export async function saveMediaBuffer({
  platform,
  label,
  bytes,
  contentType,
  extension,
  capturedAt = new Date(),
}) {
  const body = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return putR2Object({
    key: buildResearchObjectKey({
      platform,
      type: 'media',
      label,
      extension,
      capturedAt,
      uniqueValue: `${label || ''}:${hashValue(body)}`,
    }),
    body,
    contentType,
  });
}
