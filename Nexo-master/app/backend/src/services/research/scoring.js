function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function logScore(value, multiplier) {
  const numeric = Number(value || 0);
  if (numeric <= 0) return 0;
  return Math.log10(numeric + 1) * multiplier;
}

export function scoreResearchProduct(product) {
  const metrics = product.metrics || {};
  const sold = Number(metrics.sold || 0);
  const views = Number(metrics.views || 0);
  const likes = Number(metrics.likes || 0);
  const comments = Number(metrics.comments || 0);
  const rating = Number(metrics.rating || 0);

  const platformBoost = {
    'TikTok Shop': 34,
    Instagram: 24,
    Shopee: 20,
    Tokopedia: 18,
  }[product.platform] || 14;

  const growth = Math.round(
    clamp(
      26 +
        platformBoost +
        logScore(sold, 34) +
        logScore(views, 22) +
        logScore(likes, 18) +
        logScore(comments, 14) +
        (rating >= 4.7 ? 16 : rating >= 4.3 ? 8 : 0),
      -20,
      340
    )
  );

  const competitorCount = Number(
    product.competitorCount ??
      clamp(
        12 +
          logScore(sold, 9) +
          logScore(views, 7) +
          (product.platform === 'Shopee' || product.platform === 'Tokopedia' ? 14 : 0),
        8,
        220
      )
  );

  const saturation = Math.round(
    clamp(
      product.saturation ??
        18 +
          competitorCount * 0.32 +
          (sold > 5000 ? 12 : sold > 500 ? 7 : 0) +
          (product.platform === 'Instagram' ? -4 : 0),
      10,
      88
    )
  );

  const phase =
    product.phase ||
    (growth >= 170 && saturation <= 45
      ? 'Emerging'
      : growth >= 90 && saturation <= 62
        ? 'Growing'
        : saturation >= 68
          ? 'Peak'
          : 'Growing');

  const windowHours =
    product.windowHours ||
    (phase === 'Emerging' ? 72 : phase === 'Growing' ? 48 : phase === 'Peak' ? 24 : 8);

  return {
    growth,
    saturation,
    phase,
    competitorCount: Math.round(competitorCount),
    reviewVelocity: Math.round(
      product.reviewVelocity ??
        clamp(logScore(sold, 18) + logScore(comments, 16) + logScore(likes, 9), 8, 260)
    ),
    windowHours,
  };
}

export function buildRecommendation({ phase, saturation, avgPrice }) {
  if (phase === 'Emerging' && saturation <= 45) {
    return `Aman diuji cepat. Mulai dari stok kecil, validasi konten, dan jaga harga sekitar Rp ${Number(avgPrice || 0).toLocaleString('id-ID')}.`;
  }

  if (phase === 'Growing' && saturation <= 62) {
    return 'Masih layak masuk dengan diferensiasi visual, bundling, atau varian warna yang jelas.';
  }

  if (saturation >= 68) {
    return 'Masuk hanya jika ada angle yang kuat, supplier lebih murah, atau channel konten yang sudah siap.';
  }

  return 'Pantau metrik ulang sebelum stok besar. Gunakan konten singkat untuk validasi demand.';
}
