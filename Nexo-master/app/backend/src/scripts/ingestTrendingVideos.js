import { ingestTrendingVideos } from '../services/research/videoIngestor.js';

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
  const result = await ingestTrendingVideos({
    source: args.source || process.env.VIDEO_INGEST_SOURCE || 'all',
    tiktokLimit: args['tiktok-limit'] || process.env.TIKTOK_VIDEO_LIMIT || 50,
    instagramLimit: args['instagram-limit'] || process.env.INSTAGRAM_VIDEO_LIMIT || 50,
    maxVideoMb: args['max-video-mb'] || process.env.MAX_VIDEO_MB || 35,
  });

  console.log(`processed=${result.processed}`);
  console.log(`inserted=${result.inserted}`);
  console.log(`updated=${result.updated}`);
  console.log(`skipped=${result.skipped}`);

  const byPlatform = result.results.reduce((acc, item) => {
    acc[item.platform] ||= { inserted: 0, updated: 0, skipped: 0 };
    acc[item.platform][item.action] = (acc[item.platform][item.action] || 0) + 1;
    return acc;
  }, {});
  console.log(`by_platform=${JSON.stringify(byPlatform)}`);

  for (const item of result.results) {
    const detail = item.reason ? ` | ${item.reason}` : '';
    console.log(`${item.action}: ${item.platform} | ${item.title}${detail}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
