import { researchProducts } from '../data/researchProducts.js';
import { ingestResearchProducts } from '../services/research/researchIngestor.js';

function parseArgs(argv) {
  const args = {};
  for (const item of argv) {
    const [key, value] = item.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = Number(args.limit || process.env.RESEARCH_INGEST_LIMIT || 100);
  const mediaLimit = Number(args['media-limit'] || process.env.RESEARCH_MEDIA_LIMIT || limit);

  const result = await ingestResearchProducts(researchProducts, {
    limit,
    mediaLimit,
  });

  console.log(`requested=${result.requested}`);
  console.log(`processed=${result.processed}`);
  console.log(`inserted=${result.inserted}`);
  console.log(`updated=${result.updated}`);
  console.log(`media_uploaded=${result.mediaUploaded}`);
  for (const item of result.results) {
    console.log(`${item.action}: ${item.platform} | ${item.name} | ${item.id}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
