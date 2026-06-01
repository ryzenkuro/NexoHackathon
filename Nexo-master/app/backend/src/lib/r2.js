import '../config/env.js';
import {
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const endpoint =
  process.env.CLOUDFLARE_R2_ENDPOINT ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

const requiredEnv = {
  CLOUDFLARE_R2_ACCOUNT_ID: accountId,
  CLOUDFLARE_R2_ACCESS_KEY_ID: accessKeyId,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: secretAccessKey,
  CLOUDFLARE_R2_BUCKET: bucket,
  CLOUDFLARE_R2_ENDPOINT: endpoint,
  CLOUDFLARE_R2_PUBLIC_URL: publicUrl,
};

export const isR2Configured = Object.values(requiredEnv).every(Boolean);

export function getR2Config() {
  return {
    configured: isR2Configured,
    bucket,
    endpoint,
    publicUrl,
    missing: Object.entries(requiredEnv)
      .filter(([, value]) => !value)
      .map(([key]) => key),
  };
}

function assertR2Configured() {
  if (isR2Configured) return;
  const missing = getR2Config().missing.join(', ');
  throw new Error(`Cloudflare R2 belum lengkap. Env yang kurang: ${missing}`);
}

function createR2Client() {
  assertR2Configured();

  return new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const r2Client = isR2Configured ? createR2Client() : null;

function encodeObjectKey(key) {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function getR2PublicUrl(key) {
  assertR2Configured();
  return `${publicUrl.replace(/\/$/, '')}/${encodeObjectKey(key)}`;
}

export async function putR2Object({
  key,
  body,
  contentType = 'application/octet-stream',
  cacheControl = 'public, max-age=31536000, immutable',
}) {
  assertR2Configured();
  if (!key || typeof key !== 'string') {
    throw new Error('R2 object key wajib berupa string.');
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return {
    bucket,
    key,
    url: getR2PublicUrl(key),
  };
}

export async function checkR2Bucket() {
  assertR2Configured();
  await r2Client.send(new HeadBucketCommand({ Bucket: bucket }));
  return {
    bucket,
    endpoint,
    publicUrl,
  };
}

export async function checkR2Object(key) {
  assertR2Configured();
  await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return {
    bucket,
    key,
    url: getR2PublicUrl(key),
  };
}
