import { supabase } from '../lib/supabase.js';
import { saveMediaBuffer } from '../services/storage/mediaStore.js';

const USER_AGENT = 'NexoResearchBot/1.0 (duplicate thumbnail repair)';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg === '--apply') args.apply = true;
    else if (arg.startsWith('--')) {
      const [key, value = 'true'] = arg.slice(2).split('=');
      args[key] = value;
    }
  }
  return args;
}

function getImageExtension(contentType) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
}

function getSpecificImageQuery(row) {
  const name = String(row.name || '').toLowerCase();
  if (/serum|niacinamide|skincare|lip balm/.test(name)) return 'skincare serum bottle product photo';
  if (/bouquet|snack|candy|gift/.test(name)) return 'candy bouquet gift product';
  if (/hijab|pashmina|scarf|crinkle/.test(name)) return 'pashmina scarf folded textile';
  if (/tote|kanvas|bag/.test(name)) return 'canvas tote bag product photo';
  if (/sandal|slide|eva/.test(name)) return 'slide sandal product photo';
  if (/botol|tumbler|stainless|cup|minum/.test(name)) return 'stainless tumbler product photo';
  if (/lampu|projector|led|aurora|moon/.test(name)) return 'projector lamp product photo';
  if (/tisu|wet wipe|wipes/.test(name)) return 'wet wipes package product photo';
  if (/powerbank|charger|charging/.test(name)) return 'portable power bank product photo';
  if (/air fryer|paper liner/.test(name)) return 'parchment paper baking liner product photo';
  if (/cetakan|es batu|silikon|ice/.test(name)) return 'silicone ice cube tray product photo';
  if (/dispenser|sabun|soap/.test(name)) return 'automatic soap dispenser product photo';
  if (/hair dryer/.test(name)) return 'hot air brush product photo';
  if (/sikat|pembersih|cleaning brush/.test(name)) return 'electric cleaning brush product photo';
  if (/spray mop|mop lantai/.test(name)) return 'spray mop product photo';
  if (/box storage|storage lipat|folding storage/.test(name)) return 'folding storage box product photo';
  if (/laundry ball/.test(name)) return 'reusable laundry ball product photo';
  if (/make up|akrilik|acrylic organizer/.test(name)) return 'acrylic makeup organizer product photo';
  if (/keset|diatomite|bath mat/.test(name)) return 'diatomite bath mat product photo';
  if (/smartwatch/.test(name)) return 'kids smartwatch product photo';
  return `${row.name} product photo`;
}

async function findWikimediaImage(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '10',
    gsrsearch: query,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '900',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!response.ok) return null;

  const json = await response.json();
  const pages = Object.values(json.query?.pages || {});
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !['product', 'photo'].includes(token));

  const candidates = pages
    .map((page) => ({ info: page.imageinfo?.[0], title: page.title || '' }))
    .filter(({ info }) => {
      const mime = String(info?.mime || '');
      const url = String(info?.thumburl || info?.url || '');
      return mime.startsWith('image/') && !mime.includes('svg') && !/\.svg($|\?)/i.test(url);
    })
    .map((candidate) => {
      const searchable = `${candidate.title} ${candidate.info?.thumburl || ''} ${candidate.info?.url || ''}`.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (searchable.includes(token) ? 1 : 0), 0);
      return { ...candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  const image = candidates.find((candidate) => candidate.score > 0)?.info;

  if (!image) return null;
  return {
    url: image.thumburl || image.url,
    contentType: image.mime,
  };
}

async function uploadImage(row, image, query) {
  const response = await fetch(image.url, {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} saat download ${query}`);

  const contentType = response.headers.get('content-type') || image.contentType || 'image/jpeg';
  const bytes = Buffer.from(await response.arrayBuffer());
  const uploaded = await saveMediaBuffer({
    platform: 'repair',
    label: `${row.name}-${query}`,
    bytes,
    contentType,
    extension: getImageExtension(contentType),
  });
  return uploaded.url;
}

function findDuplicateTargets(rows, maxPerThumbnail) {
  const groups = rows.reduce((map, row) => {
    const key = row.thumbnail || 'missing';
    const current = map.get(key) || [];
    current.push(row);
    map.set(key, current);
    return map;
  }, new Map());

  return [...groups.values()]
    .filter((group) => group.length > maxPerThumbnail || String(group[0].thumbnail || '').includes('/category-'))
    .flatMap((group) => group.slice(maxPerThumbnail));
}

async function main() {
  const args = parseArgs(process.argv);
  const limit = Number(args.limit || 100);
  const maxUpdates = Number(args['max-updates'] || 30);
  const maxPerThumbnail = Number(args['max-per-thumbnail'] || 2);
  const apply = Boolean(args.apply);

  const { data, error } = await supabase
    .from('trends')
    .select('id,name,platform,category,thumbnail,growth')
    .order('growth', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const targets = findDuplicateTargets(data || [], maxPerThumbnail).slice(0, maxUpdates);
  let updated = 0;
  let skipped = 0;

  for (const row of targets) {
    const query = getSpecificImageQuery(row);
    const image = await findWikimediaImage(query);
    if (!image?.url) {
      skipped += 1;
      console.log(`skip=no_image | ${row.name} | query=${query}`);
      continue;
    }

    if (!apply) {
      console.log(`dry_run | ${row.name} | query=${query} | source=${image.url}`);
      continue;
    }

    const thumbnail = await uploadImage(row, image, query);
    const { error: updateError } = await supabase
      .from('trends')
      .update({ thumbnail, updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (updateError) {
      skipped += 1;
      console.log(`skip=update_failed | ${row.name} | ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(`updated | ${row.name} | ${thumbnail}`);
  }

  console.log(`sampled=${data?.length || 0}`);
  console.log(`targets=${targets.length}`);
  console.log(`updated=${updated}`);
  console.log(`skipped=${skipped}`);
  console.log(`mode=${apply ? 'apply' : 'dry-run'}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
