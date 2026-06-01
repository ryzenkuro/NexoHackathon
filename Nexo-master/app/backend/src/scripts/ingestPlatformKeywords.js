import {
  buildPlatformKeywordProducts,
  platformKeywordCount,
} from '../data/platformKeywordProducts.js';
import { ingestResearchProducts } from '../services/research/researchIngestor.js';

function parseArgs(argv) {
  const args = {};
  for (const item of argv) {
    const [key, value] = item.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

function parsePlatforms(value) {
  if (!value || value === 'all') return undefined;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const perPlatform = Math.min(
    Number(args['per-platform'] || process.env.RESEARCH_PER_PLATFORM || 25),
    platformKeywordCount
  );
  const offset = Math.max(0, Number(args.offset || process.env.RESEARCH_OFFSET || 0));
  const platforms = parsePlatforms(args.platforms || process.env.RESEARCH_PLATFORMS);
  const delayMs = Number(args['delay-ms'] || process.env.RESEARCH_DELAY_MS || 2500);
  const mediaLimit = Number(args['media-limit'] || process.env.RESEARCH_MEDIA_LIMIT || perPlatform * 4);

  const products = buildPlatformKeywordProducts({ perPlatform, offset, platforms });
  console.log(`platform_keyword_capacity=${platformKeywordCount}`);
  console.log(`offset=${offset}`);
  console.log(`platforms=${[...new Set(products.map((product) => product.platform))].join(', ')}`);
  console.log(`planned_products=${products.length}`);
  console.log(`delay_ms=${delayMs}`);

  const result = await ingestResearchProducts(products, {
    limit: products.length,
    mediaLimit,
    delayMs,
  });

  console.log(`processed=${result.processed}`);
  console.log(`inserted=${result.inserted}`);
  console.log(`updated=${result.updated}`);
  console.log(`media_uploaded=${result.mediaUploaded}`);

  const byPlatform = result.results.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1;
    return acc;
  }, {});
  console.log(`by_platform=${JSON.stringify(byPlatform)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
