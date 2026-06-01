const baseProducts = [
  ['Tumbler Stainless 40oz', 'rumah-tangga', 185000, 'Stanley Quencher H2.0 Tumbler'],
  ['Tumbler Vacuum Motif Bunga', 'rumah-tangga', 68000, 'Stanley Quencher H2.0 Tumbler'],
  ['Botol Minum Anak Stainless', 'rumah-tangga', 72000, 'children stainless water bottle'],
  ['Mug Keramik Aesthetic', 'rumah-tangga', 45000, 'ceramic mug product'],
  ['Lunch Box Bento Sekat', 'rumah-tangga', 54000, 'bento lunch box'],
  ['Kotak Makan Stainless', 'rumah-tangga', 78000, 'stainless lunch box'],
  ['Rak Troli Dapur Serbaguna', 'rumah-tangga', 139000, 'kitchen trolley storage rack'],
  ['Rak Serbaguna Lipat', 'rumah-tangga', 79000, 'folding kitchen storage rack'],
  ['Organizer Kulkas Transparan', 'rumah-tangga', 65000, 'refrigerator organizer box'],
  ['Vacuum Sealer Mini Portable', 'rumah-tangga', 54000, 'vacuum sealer'],
  ['Plastik Vacuum Makanan', 'rumah-tangga', 28000, 'vacuum food bag'],
  ['Chopper Elektrik Mini', 'rumah-tangga', 89000, 'mini food chopper'],
  ['Blender Portable USB', 'rumah-tangga', 95000, 'portable blender'],
  ['Air Fryer Paper Liner', 'rumah-tangga', 32000, 'air fryer paper liner'],
  ['Cetakan Es Batu Silikon', 'rumah-tangga', 24000, 'silicone ice cube tray'],
  ['Dispenser Sabun Otomatis', 'rumah-tangga', 87000, 'automatic soap dispenser'],
  ['Sikat Pembersih Elektrik', 'rumah-tangga', 74000, 'electric cleaning brush'],
  ['Spray Mop Lantai', 'rumah-tangga', 98000, 'spray mop'],
  ['Pengharum Ruangan Otomatis', 'rumah-tangga', 59000, 'automatic air freshener'],
  ['Vacuum Bag Baju', 'rumah-tangga', 42000, 'vacuum storage bag'],
  ['Box Storage Lipat', 'rumah-tangga', 58000, 'foldable storage box'],
  ['Hanger Multifungsi', 'rumah-tangga', 35000, 'multi function hanger'],
  ['Laundry Ball Reusable', 'rumah-tangga', 29000, 'laundry ball'],
  ['Rak Make Up Akrilik', 'rumah-tangga', 76000, 'acrylic makeup organizer'],
  ['Keset Diatomite Anti Slip', 'rumah-tangga', 63000, 'diatomite bath mat'],
  ['Lampu Proyektor Galaxy', 'elektronik', 115000, 'LED projector'],
  ['Lampu Aurora RGB', 'elektronik', 98000, 'LED projector'],
  ['Lampu LED Strip Smart', 'elektronik', 65000, 'LED strip light'],
  ['Humidifier Mini USB', 'elektronik', 49000, 'mini humidifier'],
  ['Kipas Portable Neck Fan', 'elektronik', 88000, 'portable neck fan'],
  ['Powerbank Mini Fast Charging', 'elektronik', 125000, 'power bank product'],
  ['Charger Magnetic 3in1', 'elektronik', 145000, 'wireless charger'],
  ['Kabel Charger 3in1', 'elektronik', 39000, 'charging cable'],
  ['Holder HP Mobil Magnetic', 'elektronik', 52000, 'phone holder car'],
  ['Tripod Mini Content Creator', 'elektronik', 67000, 'mini tripod'],
  ['Ring Light Clip', 'elektronik', 45000, 'ring light'],
  ['Microphone Wireless Clip', 'elektronik', 165000, 'wireless microphone'],
  ['Earbuds TWS Gaming', 'elektronik', 185000, 'wireless earbuds'],
  ['Smartwatch Anak GPS', 'elektronik', 175000, 'smartwatch'],
  ['Keyboard Mechanical Mini', 'elektronik', 220000, 'mechanical keyboard'],
  ['Mouse Wireless Silent', 'elektronik', 69000, 'wireless mouse'],
  ['Desk Cable Organizer', 'elektronik', 32000, 'desk cable organizer'],
  ['Stand Laptop Portable', 'elektronik', 85000, 'laptop stand'],
  ['Cooling Pad Laptop', 'elektronik', 119000, 'laptop cooling pad'],
  ['CCTV Mini WiFi', 'elektronik', 189000, 'security camera'],
  ['Doorbell Wireless', 'elektronik', 135000, 'wireless doorbell'],
  ['Smart Plug WiFi', 'elektronik', 99000, 'smart plug'],
  ['Lampu Meja Rechargeable', 'elektronik', 76000, 'desk lamp'],
  ['Speaker Bluetooth Mini', 'elektronik', 95000, 'bluetooth speaker'],
  ['USB Hub Type C', 'elektronik', 89000, 'usb c hub'],
  ['Sandal Cloud EVA Unisex', 'fashion', 49000, 'eva slide sandals'],
  ['Tas Selempang Nylon', 'fashion', 85000, 'nylon sling bag'],
  ['Tote Bag Kanvas Custom', 'fashion', 55000, 'canvas tote bag'],
  ['Pashmina Crinkle', 'fashion', 42000, 'crinkle hijab pashmina'],
  ['Inner Hijab Anti Pusing', 'fashion', 28000, 'hijab inner cap'],
  ['Kaos Oversize Polos', 'fashion', 69000, 'oversized t shirt'],
  ['Cargo Pants Wanita', 'fashion', 125000, 'cargo pants'],
  ['Rok Plisket Midi', 'fashion', 78000, 'pleated skirt'],
  ['Sepatu Slip On Pria', 'fashion', 145000, 'slip on shoes'],
  ['Dompet Kartu Slim', 'fashion', 45000, 'card wallet'],
  ['Topi Baseball Vintage', 'fashion', 39000, 'baseball cap'],
  ['Kacamata Anti Radiasi', 'fashion', 65000, 'eyeglasses product'],
  ['Strap Smartwatch Silikon', 'fashion', 35000, 'watch strap'],
  ['Scrunchie Satin', 'fashion', 18000, 'satin scrunchie'],
  ['Tas Laptop Waterproof', 'fashion', 130000, 'laptop bag'],
  ['Sling Bag Phone Holder', 'fashion', 58000, 'phone sling bag'],
  ['Jaket Parasut Ringan', 'fashion', 115000, 'lightweight jacket'],
  ['Daster Rayon Premium', 'fashion', 72000, 'rayon dress'],
  ['Socks Korean Style', 'fashion', 22000, 'fashion socks'],
  ['Belt Canvas Casual', 'fashion', 36000, 'canvas belt'],
  ['Serum Niacinamide', 'kecantikan', 39000, 'cosmetic bottle'],
  ['Sunscreen Gel SPF50', 'kecantikan', 65000, 'sunscreen bottle'],
  ['Lip Tint Glossy', 'kecantikan', 42000, 'lip tint cosmetic'],
  ['Cushion Compact', 'kecantikan', 88000, 'compact makeup'],
  ['Hair Dryer Brush 3in1', 'kecantikan', 125000, 'hair dryer brush'],
  ['Catokan Mini Travel', 'kecantikan', 79000, 'hair straightener'],
  ['Sisir Anti Kusut', 'kecantikan', 35000, 'hair brush'],
  ['Parfum Travel Refill', 'kecantikan', 25000, 'travel perfume atomizer'],
  ['Body Lotion Brightening', 'kecantikan', 48000, 'body lotion bottle'],
  ['Masker Wajah Clay', 'kecantikan', 36000, 'clay face mask'],
  ['Facial Cleansing Brush', 'kecantikan', 67000, 'facial cleansing brush'],
  ['Heated Eyelash Curler', 'kecantikan', 59000, 'eyelash curler'],
  ['Press On Nail Art', 'kecantikan', 48000, 'nail art hand'],
  ['Hair Oil Rosemary', 'kecantikan', 55000, 'cosmetic oil bottle'],
  ['Makeup Sponge Set', 'kecantikan', 27000, 'makeup sponge'],
  ['Pimple Patch Hydrocolloid', 'kecantikan', 25000, 'skin care patch'],
  ['Face Mist Hydrating', 'kecantikan', 39000, 'face mist bottle'],
  ['Sleeping Mask Sachet', 'kecantikan', 33000, 'skincare jar'],
  ['Body Scrub Coffee', 'kecantikan', 46000, 'body scrub jar'],
  ['Shampoo Bar Herbal', 'kecantikan', 41000, 'shampoo bar'],
  ['Snack Bouquet Graduation', 'makanan', 75000, 'gift basket'],
  ['Coklat Bouquet Custom', 'makanan', 89000, 'chocolate gift basket'],
  ['Basreng Pedas Daun Jeruk', 'makanan', 22000, 'spicy snack food'],
  ['Seblak Instan Cup', 'makanan', 18000, 'instant spicy food'],
  ['Makaroni Pedas', 'makanan', 17000, 'macaroni snack'],
  ['Keripik Kaca Pedas', 'makanan', 16000, 'spicy chips'],
  ['Kopi Susu Literan', 'makanan', 55000, 'iced coffee bottle'],
  ['Matcha Powder Sachet', 'makanan', 45000, 'matcha powder'],
  ['Minuman Kolagen Sachet', 'makanan', 25000, 'collagen drink sachet'],
  ['Granola Bites', 'makanan', 32000, 'granola snack'],
  ['Permen Mint Sugar Free', 'makanan', 23000, 'mint candy'],
  ['Bumbu Tabur BBQ', 'makanan', 19000, 'seasoning powder'],
  ['Sambal Bawang Botol', 'makanan', 28000, 'chili sauce bottle'],
  ['Cookies Hampers Mini', 'makanan', 67000, 'cookie gift box'],
  ['Mochi Bites', 'makanan', 35000, 'mochi dessert'],
  ['Dimsum Frozen Pack', 'makanan', 52000, 'frozen dumpling'],
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toSearchUrl(platform, keyword) {
  const encoded = encodeURIComponent(keyword);
  if (platform === 'Shopee') return `https://shopee.co.id/search?keyword=${encoded}`;
  if (platform === 'Tokopedia') return `https://www.tokopedia.com/search?st=&q=${encoded}`;
  if (platform === 'TikTok Shop') return `https://shop.tiktok.com/us/k/${slugify(keyword)}`;

  const tag = slugify(keyword).replace(/-/g, '');
  return `https://www.instagram.com/explore/tags/${tag}/`;
}

function platformEvidence(platform, keyword) {
  return `Riset keyword publik ${platform} untuk "${keyword}". Snapshot halaman disimpan ke R2 sebagai audit trail; metrik live detail membutuhkan akses resmi atau sesi terotorisasi.`;
}

export function buildPlatformKeywordProducts({
  perPlatform = 25,
  offset = 0,
  platforms = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Instagram'],
} = {}) {
  return platforms.flatMap((platform) =>
    baseProducts.slice(offset, offset + perPlatform).map(([name, category, avgPrice, imageQuery]) => ({
      name,
      category,
      platform,
      sourceUrl: toSearchUrl(platform, name),
      avgPrice,
      evidence: platformEvidence(platform, name),
      imageQuery,
      metrics: {},
    }))
  );
}

export const platformKeywordCount = baseProducts.length;
