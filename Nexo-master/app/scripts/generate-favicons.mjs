// Generate favicons dari logo.png ke folder public/
// Run: node scripts/generate-favicons.mjs

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGO_PATH = path.join(ROOT, 'src', 'images', 'logo.png');
const PUBLIC_DIR = path.join(ROOT, 'public');

const PNG_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

// Sumber untuk file .ico (multi-resolution)
const ICO_SIZES = [16, 32, 48];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function generatePngs() {
  for (const { name, size } of PNG_SIZES) {
    const out = path.join(PUBLIC_DIR, name);
    await sharp(LOGO_PATH)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent
      })
      .png()
      .toFile(out);
    console.log(`  ✓ ${name}`);
  }
}

async function generateIco() {
  // Buat PNG sementara untuk multiple sizes, lalu gabung jadi .ico
  const tempBuffers = await Promise.all(
    ICO_SIZES.map((size) =>
      sharp(LOGO_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    )
  );
  const icoBuffer = await pngToIco(tempBuffers);
  await fs.writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  ✓ favicon.ico (16, 32, 48)');
}

async function generateManifest() {
  const manifest = {
    name: 'Nexo — Asisten AI Tren Pasar',
    short_name: 'Nexo',
    description: 'Asisten AI tren pasar untuk UMKM Indonesia',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#6366f1',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    lang: 'id',
  };
  await fs.writeFile(
    path.join(PUBLIC_DIR, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('  ✓ site.webmanifest');
}

async function main() {
  console.log('📦 Generating favicons...');
  console.log(`   Source: ${path.relative(ROOT, LOGO_PATH)}`);
  console.log(`   Output: ${path.relative(ROOT, PUBLIC_DIR)}/\n`);

  await ensureDir(PUBLIC_DIR);
  await generatePngs();
  await generateIco();
  await generateManifest();

  console.log('\n✅ Done! Generated 7 files in public/');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
