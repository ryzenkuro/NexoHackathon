/**
 * Glossary istilah teknis Nexo dalam bahasa UMKM-friendly.
 * Dipakai di tooltip di seluruh aplikasi supaya istilah seperti
 * "saturation", "window", "phase" mudah dipahami non-teknis.
 */

export type GlossaryTerm =
  | 'saturation'
  | 'window'
  | 'phase'
  | 'growth'
  | 'reviewVelocity'
  | 'competitorCount'
  | 'avgPrice'
  | 'emerging'
  | 'growing'
  | 'peak'
  | 'decay';

export const GLOSSARY: Record<GlossaryTerm, { label: string; description: string }> = {
  saturation: {
    label: 'Kejenuhan Pasar',
    description:
      'Seberapa ramai pasar untuk produk ini. Makin tinggi, makin banyak penjual lain — makin sulit menonjol.',
  },
  window: {
    label: 'Jam Peluang Tersisa',
    description:
      'Estimasi berapa lama lagi tren ini masih menguntungkan sebelum pasar terlalu jenuh.',
  },
  phase: {
    label: 'Fase Tren',
    description:
      'Posisi tren dalam siklusnya: Emerging (baru muncul), Growing (sedang naik), Peak (puncak), Decay (mulai turun).',
  },
  growth: {
    label: 'Pertumbuhan',
    description:
      'Kenaikan minat pasar (search & penjualan) dibanding 7 hari sebelumnya. Makin tinggi, makin cepat tumbuh.',
  },
  reviewVelocity: {
    label: 'Kecepatan Review',
    description:
      'Rata-rata jumlah review baru per hari. Indikator riil seberapa banyak orang sudah membeli dan menggunakan produk ini.',
  },
  competitorCount: {
    label: 'Jumlah Pesaing',
    description: 'Total penjual aktif yang sedang menjual produk serupa di platform.',
  },
  avgPrice: {
    label: 'Harga Rata-rata',
    description: 'Rata-rata harga jual produk serupa di pasaran saat ini.',
  },
  emerging: {
    label: 'Emerging',
    description: 'Tren baru muncul. Kompetisi rendah, tapi belum tervalidasi pasar besar.',
  },
  growing: {
    label: 'Growing',
    description: 'Tren sedang naik. Pasar mulai aware, kompetisi menengah, peluang besar.',
  },
  peak: {
    label: 'Peak',
    description: 'Tren di puncak. Volume penjualan tinggi tapi pasar sudah ramai.',
  },
  decay: {
    label: 'Decay',
    description: 'Tren mulai turun. Sebaiknya hindari masuk baru di fase ini.',
  },
};
