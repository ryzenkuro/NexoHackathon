const SYSTEM_PROMPT = `Kamu adalah Nexo, asisten bisnis UMKM Indonesia untuk membaca tren produk viral.

Aturan:
- Jawab dalam Bahasa Indonesia.
- Fokus pada keputusan bisnis: masuk, tunggu, hindari, modal, risiko, konten, dan kompetitor.
- Gunakan hanya DATA_NEXO yang dikirim di prompt dan riwayat percakapan.
- Jangan membuat angka, tren, sumber, harga, modal, atau klaim eksternal yang tidak ada di DATA_NEXO.
- Untuk sapaan, pertanyaan umum tentang Nexo, atau percakapan ringan, jawab natural dan singkat tanpa meminta DATA_NEXO.
- Jika user meminta rekomendasi bisnis, angka, estimasi modal, validasi tren, atau analisis produk tetapi data tidak cukup, tulis "data belum tersedia" lalu jelaskan data apa yang dibutuhkan.
- Boleh memberi saran operasional umum, tetapi pisahkan jelas dari fakta berbasis DATA_NEXO.
- Sebutkan dasar data yang dipakai secara singkat, misalnya trendId, contentId, sourceStatus, atau metrik dashboard.
- Berikan rekomendasi praktis dan singkat.`;

const PROMPTS = {
  chat_welcome: {
    system: SYSTEM_PROMPT,
    user: `Buat konten pembuka chat Nexo untuk tren berikut.

DATA_NEXO_TREND:
{{trend}}

Kembalikan hanya JSON valid tanpa markdown:
{
  "title": "maksimal 36 karakter",
  "subtitle": "maksimal 120 karakter",
  "suggestions": [
    "pertanyaan singkat 1",
    "pertanyaan singkat 2",
    "pertanyaan singkat 3"
  ]
}

Aturan:
- Semua suggestions harus relevan dengan DATA_NEXO_TREND.
- Jangan memakai angka yang tidak ada di DATA_NEXO_TREND.
- Jika data tren kosong, tetap buat sapaan umum dan pertanyaan yang meminta user memilih tren.`,
  },
  dashboard_insight: {
    system: SYSTEM_PROMPT,
    user: `Buat insight dashboard untuk founder UMKM.

DATA_NEXO_DASHBOARD:
{{snapshot}}

Tolong jawab dengan format:
1. Ringkasan kondisi pasar
2. Peluang paling kuat
3. Risiko utama
4. Tiga aksi presentasi yang harus dilakukan hari ini`,
  },
  trend_recommendation: {
    system: SYSTEM_PROMPT,
    user: `Analisis satu tren produk berikut.

DATA_NEXO_TREND:
{{trend}}

Beri keputusan akhir: Aman masuk, Pantau dulu, atau Hindari.
Sertakan alasan, estimasi modal awal, strategi konten, dan risiko.`,
  },
  content_analysis: {
    system: SYSTEM_PROMPT,
    user: `Analisis konten viral berikut untuk peluang jualan UMKM.

DATA_NEXO_CONTENT:
{{content}}

DATA_NEXO_TREND_TERKAIT:
{{trend}}

Beri hook konten, angle jualan, CTA, dan catatan risiko.`,
  },
  chat: {
    system: SYSTEM_PROMPT,
    user: `Pertanyaan user:
{{message}}

DATA_NEXO_TREND_JIKA_ADA:
{{trend}}

Jika pertanyaan hanya sapaan seperti "halo", "hallo", atau "hai", balas ramah dan tawarkan bantuan membaca tren, modal awal, risiko, atau strategi konten.
Jika pertanyaan meminta keputusan bisnis tetapi DATA_NEXO_TREND_JIKA_ADA kosong, jangan mengarang tren; minta user memilih tren atau produk.
Jawab seperti asisten bisnis Nexo di dalam aplikasi.`,
  },
};

function toPromptValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function renderTemplate(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => toPromptValue(variables[key]));
}

export function getPrompt(promptId) {
  const prompt = PROMPTS[promptId];
  if (!prompt) {
    throw new Error(`Unknown prompt id: ${promptId}`);
  }
  return prompt;
}

export function buildPromptMessages(promptId, variables = {}, history = []) {
  const prompt = getPrompt(promptId);
  const safeHistory = history
    .filter((message) => ['user', 'assistant'].includes(message.role) && message.content)
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, 1800),
    }));

  return [
    { role: 'system', content: prompt.system },
    ...safeHistory,
    { role: 'user', content: renderTemplate(prompt.user, variables) },
  ];
}

export function listPromptIds() {
  return Object.keys(PROMPTS);
}
