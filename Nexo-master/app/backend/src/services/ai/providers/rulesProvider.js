function formatCurrency(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return 'Rp 1.000.000 - Rp 3.000.000';
  const low = Math.max(500000, Math.round(number * 20));
  const high = Math.max(low + 250000, Math.round(number * 45));
  return `${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(low)} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(high)}`;
}

function getDecision(trend = {}) {
  if (trend.saturation >= 65 || trend.phase === 'Decay') return 'Hindari';
  if (trend.saturation >= 45 || trend.windowSeconds < 24 * 3600) return 'Pantau dulu';
  return 'Aman masuk';
}

function getTopItems(snapshot = {}) {
  return snapshot.growthMomentum?.items || [];
}

function dashboardInsight(variables) {
  const snapshot = variables.snapshot || {};
  const metrics = snapshot.metrics || {};
  const topItems = getTopItems(snapshot);
  const best = topItems[0];
  const riskiest = [...topItems].sort((a, b) => b.saturation - a.saturation)[0];

  return `1. Ringkasan kondisi pasar
Ada ${metrics.activeTrends ?? 0} tren aktif dengan rata-rata saturation ${metrics.avgSaturation ?? 0}%. Momentum pasar dibaca dari data Supabase dan aset riset yang tersimpan di R2.

2. Peluang paling kuat
Prioritaskan ${best?.name || 'produk dengan growth tertinggi'} karena growth ${best?.growth ?? 0}% dan saturation ${best?.saturation ?? 0}%. Keputusan awal: ${getDecision(best)}.

3. Risiko utama
Risiko terbesar ada di ${riskiest?.name || 'produk paling jenuh'} dengan saturation ${riskiest?.saturation ?? 0}%. Jangan tampilkan rekomendasi masuk jika saturation melewati 65% tanpa diferensiasi konten, bundling, atau harga.

4. Tiga aksi presentasi hari ini
- Tunjukkan AI memilih 1 produk prioritas dari dashboard.
- Buka Saturation Guard untuk membuktikan risiko kompetitor.
- Pakai chat Nexo untuk minta modal awal, ide konten, dan strategi 7 hari.`;
}

function trendRecommendation(variables) {
  const trend = variables.trend || {};
  const decision = getDecision(trend);
  const windowHours = Math.max(0, Math.ceil((trend.windowSeconds || trend.windowHours * 3600 || 0) / 3600));

  return `Keputusan: ${decision}

Alasan:
- Growth ${trend.growth ?? 0}% menunjukkan demand sedang ${Number(trend.growth) >= 150 ? 'kuat' : 'bertumbuh'}.
- Saturation ${trend.saturation ?? 0}% berarti kompetisi ${Number(trend.saturation) >= 60 ? 'tinggi' : 'masih bisa dikelola'}.
- Window tersisa sekitar ${windowHours} jam, jadi eksekusi harus cepat.

Estimasi modal awal:
- Mulai dari ${formatCurrency(trend.avgPrice)} untuk validasi stok kecil.
- Target 20-40 pcs dulu, jangan langsung overstock.

Strategi konten:
- Buat 3 video pendek: unboxing, problem-solution, dan perbandingan harga.
- Pakai CTA "stok terbatas" hanya jika stok benar-benar terbatas.

Risiko:
- Kompetitor sekitar ${trend.competitorCount ?? 0} seller.
- Jika review velocity turun atau saturation naik di atas 65%, pindah ke variasi produk lain.`;
}

function contentAnalysis(variables) {
  const content = variables.content || {};
  const trend = variables.trend || {};

  return `Analisis konten: ${content.title || 'Konten viral'}

Hook yang bisa ditiru:
- "Aku kira biasa aja, ternyata kepakai tiap hari."
- "Barang kecil yang bikin rutinitas lebih rapi."

Angle jualan:
- Kaitkan dengan produk ${trend.name || 'terkait'} dan tampilkan manfaat dalam 3 detik pertama.
- Tampilkan harga, ukuran, dan cara pakai tanpa terlalu lama.

CTA:
- "Cek stok hari ini sebelum harga naik."
- "Komentar mau warna/varian apa."

Risiko:
- Engagement ${content.engagement || '-'} bagus untuk validasi, tapi tetap cek saturation ${trend.saturation ?? 0}% sebelum masuk stok besar.`;
}

function chatResponse(variables) {
  const message = String(variables.message || '').toLowerCase();
  const trend = variables.trend || null;

  if (/(cuaca|politik|film|lagu|resep|bola)/i.test(message)) {
    return 'Maaf, saya fokus membantu bisnis UMKM, tren produk, modal, kompetitor, konten, dan strategi jualan. Coba tanyakan produk mana yang mau dianalisis.';
  }

  if (/modal|uang|budget|biaya/.test(message)) {
    return `Untuk modal awal, saya sarankan mulai kecil: ${formatCurrency(trend?.avgPrice)}. Fokus validasi 20-40 pcs dulu, pantau review velocity, lalu tambah stok kalau 70% stok pertama laku dalam 7-10 hari.`;
  }

  if (/konten|video|tiktok|reels|marketing/.test(message)) {
    return `Strategi konten paling aman: buat 3 format pendek, yaitu unboxing, problem-solution, dan testimoni. Untuk ${trend?.name || 'produk ini'}, tampilkan manfaat di 3 detik pertama, lalu CTA ke stok atau varian.`;
  }

  if (/kompetitor|saingan|saturation|jenuh/.test(message)) {
    return `Cek saturation dan jumlah kompetitor dulu. ${trend?.name ? `${trend.name} saat ini saturation ${trend.saturation}% dengan sekitar ${trend.competitorCount} kompetitor.` : 'Kalau saturation di atas 65%, jangan masuk tanpa diferensiasi.'} Bedakan lewat bundling, packaging, atau konten original.`;
  }

  return `${trend?.name ? `Untuk ${trend.name}, keputusan awal saya: ${getDecision(trend)}.` : 'Saya bisa bantu pilih produk yang layak masuk.'} Fokus ke growth, saturation, window tersisa, modal kecil, dan konten validasi. Minta saya hitungkan modal, strategi konten, atau risiko kompetitor.`;
}

function estimateUsage(text) {
  const tokens = Math.max(20, Math.ceil(String(text).length / 4));
  return { inputTokens: tokens, outputTokens: tokens, totalTokens: tokens * 2 };
}

export async function completeWithRules({ promptId, variables }) {
  let text;
  switch (promptId) {
    case 'dashboard_insight':
      text = dashboardInsight(variables);
      break;
    case 'trend_recommendation':
      text = trendRecommendation(variables);
      break;
    case 'content_analysis':
      text = contentAnalysis(variables);
      break;
    case 'chat':
    default:
      text = chatResponse(variables);
      break;
  }

  return {
    text,
    provider: 'rules',
    model: 'nexo-rules',
    usage: estimateUsage(text),
  };
}
