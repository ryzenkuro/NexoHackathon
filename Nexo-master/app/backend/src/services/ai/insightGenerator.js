const CATEGORY_ANGLES = {
  'rumah-tangga': ['before-after pemakaian', 'solusi rumah rapi', 'demo hemat waktu'],
  elektronik: ['demo fitur utama', 'setup meja/kamar', 'perbandingan hasil'],
  fashion: ['mix and match cepat', 'detail bahan dan fit', 'styling harian'],
  kecantikan: ['hasil pemakaian', 'routine singkat', 'tekstur dan before-after'],
  makanan: ['reaksi rasa pertama', 'packing pesanan', 'limited batch'],
};

function toNumber(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const text = String(value ?? '').trim().toUpperCase().replace(',', '.');
  if (!text) return fallback;
  const multiplier = text.includes('M') ? 1_000_000 : text.includes('K') ? 1_000 : 1;
  const parsed = Number(text.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed * multiplier : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashString(value) {
  const text = String(value || 'nexo');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function pick(items, seed, offset = 0) {
  if (!items.length) return '';
  return items[(seed + offset) % items.length];
}

function takeStable(items, seed, count = 2) {
  const pool = [...items.filter(Boolean)];
  const result = [];
  let cursor = seed;

  while (pool.length && result.length < count) {
    const index = cursor % pool.length;
    result.push(pool.splice(index, 1)[0]);
    cursor = Math.floor(cursor / 7) + 3;
  }

  return result;
}

function formatPrice(value) {
  const price = toNumber(value);
  if (!price) return 'harga belum tersedia';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatCompact(value) {
  const number = toNumber(value);
  if (number >= 1_000_000) return `${Number((number / 1_000_000).toFixed(1))}M`;
  if (number >= 1_000) return `${Number((number / 1_000).toFixed(1))}K`;
  return String(Math.round(number));
}

function getWindowHours(trend = {}) {
  if (trend.windowHours !== undefined) return Math.max(0, Math.ceil(toNumber(trend.windowHours)));
  return Math.max(0, Math.ceil(toNumber(trend.windowSeconds) / 3600));
}

function getTrendDecision(trend = {}, mode = 'trend') {
  const saturation = toNumber(trend.saturation);
  const windowHours = getWindowHours(trend);
  const highRisk = saturation >= 65 || trend.phase === 'Decay';
  const needsWatch = saturation >= 45 || windowHours <= 24;

  if (highRisk) return 'Hindari';
  if (needsWatch) return 'Pantau dulu';
  return mode === 'saturation' ? 'Masuk kecil' : 'Aman masuk';
}

function getContentDecision(content = {}) {
  const engagement = toNumber(content.engagement);
  const views = toNumber(content.views);

  if (content.productRelevance && engagement >= 7) return 'Remix sekarang';
  if (content.productRelevance || views >= 100_000) return 'Uji angle';
  return 'Referensi gaya';
}

function getCategoryAngle(category, seed, offset = 0) {
  const angles = CATEGORY_ANGLES[category] || ['problem-solution', 'unboxing singkat', 'demo manfaat'];
  return pick(angles, seed, offset);
}

function buildTrendSummary({ trend, mode, decision, seed }) {
  const name = trend.name || 'Produk ini';
  const growth = Math.round(toNumber(trend.growth));
  const saturation = Math.round(toNumber(trend.saturation));
  const competitors = Math.round(toNumber(trend.competitorCount));
  const windowHours = getWindowHours(trend);

  const variants = {
    Hindari: [
      `${name} berisiko overstock: saturation ${saturation}% dengan ${competitors} kompetitor.`,
      `${name} terlalu ramai untuk stok besar meski growth masih ${growth}%.`,
      `${name} perlu diferensiasi kuat karena pasar sudah mendekati jenuh.`,
    ],
    'Pantau dulu': [
      `${name} punya demand, tapi saturation ${saturation}% perlu validasi kecil.`,
      `${name} layak dipantau karena growth ${growth}% dan window ${windowHours} jam.`,
      `${name} menarik untuk tes konten, bukan untuk stok agresif.`,
    ],
    'Aman masuk': [
      `${name} layak diuji karena growth ${growth}% dan saturation ${saturation}% masih sehat.`,
      `${name} punya ruang masuk dengan kompetitor ${competitors} dan window ${windowHours} jam.`,
      `${name} cocok untuk validasi cepat sebelum pasar makin ramai.`,
    ],
    'Masuk kecil': [
      `${name} masih bisa diuji kecil karena saturation ${saturation}% belum terlalu padat.`,
      `${name} punya peluang masuk terbatas dengan growth ${growth}% dan window ${windowHours} jam.`,
      `${name} cocok untuk stok kecil sambil membaca respons konten.`,
    ],
  };

  const summary = pick(variants[decision] || variants['Pantau dulu'], seed);
  if (mode === 'saturation') return summary;
  return summary.replace('Masuk kecil', 'Aman masuk');
}

function buildTrendReasons(trend = {}, seed) {
  const growth = Math.round(toNumber(trend.growth));
  const saturation = Math.round(toNumber(trend.saturation));
  const competitors = Math.round(toNumber(trend.competitorCount));
  const reviewVelocity = Math.round(toNumber(trend.reviewVelocity));
  const windowHours = getWindowHours(trend);
  const price = formatPrice(trend.avgPrice);

  const demandLabel = growth >= 150 ? 'sangat kuat' : growth >= 80 ? 'bertumbuh' : 'masih awal';
  const saturationLabel = saturation >= 65 ? 'padat' : saturation >= 45 ? 'mulai ramai' : 'masih longgar';

  return takeStable([
    `Growth ${growth}% menunjukkan demand ${demandLabel}.`,
    `Saturation ${saturation}% berarti pasar ${saturationLabel}.`,
    `${competitors} kompetitor terdeteksi di kategori ini.`,
    `Review velocity ${reviewVelocity}/hari memberi sinyal minat pembeli.`,
    `Window sekitar ${windowHours} jam menuntut validasi cepat.`,
    `Harga rata-rata ${price} masih bisa diuji untuk stok kecil.`,
  ], seed, 2);
}

function buildTrendRisks(trend = {}, seed) {
  const saturation = Math.round(toNumber(trend.saturation));
  const competitors = Math.round(toNumber(trend.competitorCount));
  const reviewVelocity = Math.round(toNumber(trend.reviewVelocity));
  const windowHours = getWindowHours(trend);

  return takeStable([
    saturation >= 60
      ? `Saturation ${saturation}% bisa membuat perang harga cepat muncul.`
      : `Saturation bisa naik jika konten kompetitor mulai meniru.`,
    competitors >= 50
      ? `${competitors} kompetitor membuat diferensiasi visual wajib.`
      : `Kompetitor belum padat, tapi validasi harga tetap perlu.`,
    windowHours <= 24
      ? `Window ${windowHours} jam terlalu pendek untuk stok besar.`
      : `Window panjang bisa berubah jika tren masuk fase Peak.`,
    reviewVelocity < 10
      ? `Review ${reviewVelocity}/hari masih lemah untuk pembelian besar.`
      : `Review tinggi bisa menarik seller baru lebih cepat.`,
  ], seed + 11, 2);
}

function buildTrendActions(trend = {}, decision, seed) {
  const categoryAngle = getCategoryAngle(trend.category, seed);
  const price = formatPrice(trend.avgPrice);

  const actionsByDecision = {
    Hindari: [
      `Cari varian lebih niche sebelum membeli stok.`,
      `Pantau ulang 24 jam dan masuk hanya jika saturation turun.`,
      `Gunakan produk ini sebagai benchmark harga, bukan stok utama.`,
      `Fokus ke konten pembanding untuk membaca komentar pembeli.`,
    ],
    'Pantau dulu': [
      `Uji 10-20 pcs dengan harga sekitar ${price}.`,
      `Buat 2 konten ${categoryAngle} sebelum tambah budget.`,
      `Pantau komentar tanya harga sebelum reorder.`,
      `Bandingkan 3 seller teratas untuk cari celah bundling.`,
    ],
    'Aman masuk': [
      `Mulai 20-40 pcs dan tahan reorder sampai konten tervalidasi.`,
      `Rilis 3 video ${categoryAngle} dalam 24 jam.`,
      `Tes harga sekitar ${price} dengan bonus kecil.`,
      `Siapkan varian visual agar tidak terlihat sama dengan kompetitor.`,
    ],
    'Masuk kecil': [
      `Mulai stok kecil, lalu tambah hanya jika engagement naik.`,
      `Uji 2 angle ${categoryAngle} untuk membaca demand.`,
      `Jaga harga dekat ${price} agar margin tetap aman.`,
      `Catat pertanyaan pembeli untuk menentukan varian berikutnya.`,
    ],
  };

  return takeStable(actionsByDecision[decision] || actionsByDecision['Pantau dulu'], seed + 23, 2);
}

export function buildTrendStructuredInsight(trend = {}, { mode = 'trend' } = {}) {
  const safeMode = mode === 'saturation' ? 'saturation' : 'trend';
  const seed = hashString(`${safeMode}:${trend.id || trend.name || ''}`);
  const decision = getTrendDecision(trend, safeMode);

  return {
    decision,
    summary: buildTrendSummary({ trend, mode: safeMode, decision, seed }),
    reasons: buildTrendReasons(trend, seed),
    risks: buildTrendRisks(trend, seed),
    actions: buildTrendActions(trend, decision, seed),
  };
}

function buildContentSummary({ content, trend, decision, seed }) {
  const title = content.title || 'Konten ini';
  const platform = content.platform || 'platform';
  const views = formatCompact(content.views);
  const engagement = toNumber(content.engagement).toFixed(toNumber(content.engagement) >= 10 ? 1 : 2);
  const trendName = trend?.name || 'produk terkait';

  const variants = [
    `${title} layak dipakai untuk ${trendName}: ${views} views dan engagement ${engagement}%.`,
    `${title} memberi sinyal ${decision.toLowerCase()} untuk adaptasi jualan di ${platform}.`,
    `${title} cocok jadi referensi konten karena metriknya kuat di ${platform}.`,
  ];

  return pick(variants, seed);
}

function buildContentHooks(content = {}, trend = {}, seed) {
  const platform = content.platform || 'konten';
  const title = content.title || 'produk ini';
  const trendName = trend?.name || 'produk ini';
  const categoryAngle = getCategoryAngle(trend?.category, seed);

  return takeStable([
    `"Aku kira biasa aja, ternyata ${trendName} kepakai tiap hari."`,
    `"Sebelum beli ${title}, lihat hasilnya dulu."`,
    `"Barang kecil yang bikin rutinitas lebih gampang."`,
    `"Coba format ${platform} ini untuk ${categoryAngle}."`,
    `"Yang sering gagal saat pakai ${trendName}: ini solusinya."`,
  ], seed + 5, 2);
}

function buildContentAngles(content = {}, trend = {}, seed) {
  const categoryAngle = getCategoryAngle(trend?.category, seed, 1);
  const trendName = trend?.name || 'produk terkait';
  const duration = Math.round(toNumber(content.duration));

  return takeStable([
    `Tampilkan ${categoryAngle} dalam 3 detik pertama.`,
    `Hubungkan cerita video ke manfaat utama ${trendName}.`,
    duration > 20
      ? `Potong jadi versi 12-15 detik agar CTA lebih cepat.`
      : `Pertahankan durasi pendek dan tambah teks harga.`
    ,
    `Gunakan komentar pembeli sebagai bahan caption.`
  ], seed + 13, 2);
}

function buildContentActions(content = {}, trend = {}, decision, seed) {
  const trendName = trend?.name || 'produk terkait';
  const engagement = toNumber(content.engagement);

  const variants = {
    'Remix sekarang': [
      `Produksi 2 versi hook untuk ${trendName} hari ini.`,
      `Tambahkan CTA tanya varian di akhir video.`,
      `Duplikasi ritme konten, ganti visual dengan produk sendiri.`,
    ],
    'Uji angle': [
      `Buat 1 video soft-selling sebelum tambah stok.`,
      `Uji caption harga dan manfaat ${trendName}.`,
      `Simpan format opening, lalu ubah CTA sesuai produk.`,
    ],
    'Referensi gaya': [
      `Ambil pola editing saja, jangan tiru klaim produk.`,
      `Cari produk terkait yang lebih relevan sebelum produksi.`,
      `Gunakan sebagai benchmark tempo dan thumbnail.`
    ],
  };

  return takeStable([
    ...(variants[decision] || variants['Uji angle']),
    engagement >= 7 ? `Naikkan budget hanya setelah komentar beli muncul.` : `Tunggu engagement naik sebelum push iklan.`,
  ], seed + 29, 2);
}

function buildContentRisks(content = {}, trend = {}, seed) {
  const engagement = toNumber(content.engagement);
  const saturation = Math.round(toNumber(trend?.saturation));
  const comments = Math.round(toNumber(content.comments));

  return takeStable([
    engagement < 5
      ? `Engagement ${engagement.toFixed(2)}% belum cukup kuat untuk produksi besar.`
      : `Engagement bagus, tapi belum menjamin intent beli.`,
    saturation >= 60
      ? `Trend terkait saturation ${saturation}% sehingga adaptasi harus beda.`
      : `Saturation bisa naik jika format ini mulai ditiru seller lain.`,
    comments < 50
      ? `Komentar ${comments} masih tipis untuk membaca demand.`
      : `Komentar perlu dicek: tanya harga lebih penting dari pujian.`,
    content.productRelevance
      ? `Konten relevan, tapi stok tetap harus kecil dulu.`
      : `Relevansi produk rendah, gunakan sebagai style reference saja.`,
  ], seed + 37, 2);
}

export function buildContentStructuredInsight(content = {}, trend = null) {
  const seed = hashString(`content:${content.id || content.title || ''}:${trend?.id || trend?.name || ''}`);
  const decision = getContentDecision(content);

  return {
    decision,
    summary: buildContentSummary({ content, trend, decision, seed }),
    hooks: buildContentHooks(content, trend, seed),
    angles: buildContentAngles(content, trend, seed),
    actions: buildContentActions(content, trend, decision, seed),
    risks: buildContentRisks(content, trend, seed),
  };
}

export function trendInsightToText(insight = {}) {
  return [
    `Keputusan: ${insight.decision || 'Pantau dulu'}`,
    `Ringkasan: ${insight.summary || '-'}`,
    `Alasan: ${(insight.reasons || []).join(' ') || '-'}`,
    `Risiko: ${(insight.risks || []).join(' ') || '-'}`,
    `Aksi: ${(insight.actions || []).join(' ') || '-'}`,
  ].join('\n');
}

export function contentInsightToText(insight = {}) {
  return [
    `Keputusan: ${insight.decision || 'Uji angle'}`,
    `Ringkasan: ${insight.summary || '-'}`,
    `Hook: ${(insight.hooks || []).join(' ') || '-'}`,
    `Angle: ${(insight.angles || []).join(' ') || '-'}`,
    `Aksi: ${(insight.actions || []).join(' ') || '-'}`,
    `Risiko: ${(insight.risks || []).join(' ') || '-'}`,
  ].join('\n');
}
