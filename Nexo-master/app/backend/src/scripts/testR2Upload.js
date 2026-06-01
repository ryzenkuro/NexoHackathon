import {
  checkR2Bucket,
  checkR2Object,
  getR2Config,
  putR2Object,
} from '../lib/r2.js';

function logResult(label, value) {
  console.log(`${label}: ${value}`);
}

async function assertPublicUrl(url) {
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Public R2 URL belum bisa dibaca. HTTP ${response.status} ${response.statusText}`);
  }
}

async function main() {
  const config = getR2Config();
  if (!config.configured) {
    throw new Error(`R2 env belum lengkap: ${config.missing.join(', ')}`);
  }

  await checkR2Bucket();

  const timestamp = new Date().toISOString();
  const key = `health/r2-smoke-${timestamp.replace(/[:.]/g, '-')}.json`;
  const payload = {
    ok: true,
    source: 'nexo-backend-r2-smoke',
    captured_at: timestamp,
  };

  const uploaded = await putR2Object({
    key,
    body: JSON.stringify(payload, null, 2),
    contentType: 'application/json; charset=utf-8',
    cacheControl: 'public, max-age=300',
  });

  await checkR2Object(uploaded.key);

  logResult('bucket', uploaded.bucket);
  logResult('key', uploaded.key);
  logResult('public_url', uploaded.url);

  try {
    await assertPublicUrl(uploaded.url);
    logResult('public_read', 'berhasil');
  } catch (error) {
    logResult('public_read_warning', error.cause?.message || error.message);
  }

  logResult('status', 'R2 upload dan object verification berhasil');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
