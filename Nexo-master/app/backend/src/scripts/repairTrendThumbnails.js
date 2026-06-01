import { supabase } from '../lib/supabase.js';
import { saveMediaBuffer } from '../services/storage/mediaStore.js';

const fallbackImages = {
  'rumah-tangga': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Stanley_Quencher_in_a_shop.jpg',
    contentType: 'image/jpeg',
  },
  elektronik: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/LED_Projector_machine.jpg/960px-LED_Projector_machine.jpg',
    contentType: 'image/jpeg',
  },
  fashion: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Reusable_Bag_3.jpg',
    contentType: 'image/jpeg',
  },
  kecantikan: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Optical_caustic_Cosmetic_oil_bottle_in_the_sun_mj.jpg/960px-Optical_caustic_Cosmetic_oil_bottle_in_the_sun_mj.jpg',
    contentType: 'image/jpeg',
  },
  makanan: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Exotic_Fruit_Gift_Basket_%284461109309%29.jpg/960px-Exotic_Fruit_Gift_Basket_%284461109309%29.jpg',
    contentType: 'image/jpeg',
  },
};

async function uploadCategoryFallback(category) {
  const fallback = fallbackImages[category] || fallbackImages['rumah-tangga'];
  const response = await fetch(fallback.url, {
    headers: { 'user-agent': 'NexoResearchBot/1.0 (thumbnail repair)' },
  });
  if (!response.ok) {
    throw new Error(`Gagal fetch fallback ${category}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || fallback.contentType;
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = contentType.includes('png') ? 'png' : 'jpg';
  return saveMediaBuffer({
    platform: 'repair',
    label: `category-${category}`,
    bytes,
    contentType,
    extension,
  });
}

async function main() {
  const { data: rows, error } = await supabase
    .from('trends')
    .select('id,name,platform,category,thumbnail')
    .in('platform', ['Shopee', 'Tokopedia', 'TikTok Shop', 'Instagram']);

  if (error) throw error;

  const data = (rows || []).filter(
    (row) => !row.thumbnail || !String(row.thumbnail).includes('r2.dev')
  );
  const categoryUrls = new Map();
  let updated = 0;

  for (const row of data || []) {
    if (!categoryUrls.has(row.category)) {
      const uploaded = await uploadCategoryFallback(row.category);
      categoryUrls.set(row.category, uploaded.url);
    }

    const thumbnail = categoryUrls.get(row.category);
    const { error: updateError } = await supabase
      .from('trends')
      .update({ thumbnail, updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (updateError) {
      console.error(`failed: ${row.platform} | ${row.name} | ${updateError.message}`);
      continue;
    }

    updated += 1;
  }

  console.log(`missing_found=${data?.length || 0}`);
  console.log(`updated=${updated}`);
  console.log(`category_fallbacks=${categoryUrls.size}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
