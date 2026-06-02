# Structured AI Output Implementation

## Overview
Implementasi structured JSON output untuk AI recommendations menggantikan raw text paragraf panjang dengan format data terstruktur yang mudah di-render di UI.

## Changes Made

### Backend Changes

#### 1. Prompt Registry (`backend/src/services/ai/promptRegistry.js`)
- **trend_recommendation**: Diubah untuk mengembalikan JSON dengan struktur:
  ```json
  {
    "decision": "Aman masuk | Pantau dulu | Hindari",
    "summary": "1 kalimat ringkasan (max 120 char)",
    "reasons": ["alasan 1", "alasan 2"],
    "actions": ["aksi 1", "aksi 2"]
  }
  ```

- **saturation_recommendation**: Diubah untuk mengembalikan JSON dengan struktur:
  ```json
  {
    "decision": "Masuk kecil | Pantau dulu | Hindari",
    "summary": "1-2 kalimat ringkasan (max 140 char)",
    "reasons": ["alasan 1", "alasan 2"],
    "risks": ["risiko 1", "risiko 2"],
    "actions": ["aksi 24 jam 1", "aksi 24 jam 2"]
  }
  ```

#### 2. AI Controller (`backend/src/controllers/aiController.js`)
Menambahkan fungsi helper:

- **`normalizeRecommendation(payload, mode)`**: Normalize dan validate JSON dari AI
  - Memastikan semua field ada dengan default values
  - Limit panjang string sesuai spec
  - Slice array maksimal 2 items
  - Mode-aware (saturation vs trend)

- **`fallbackRecommendationFromText(text, mode)`**: Parse text mentah jika JSON gagal
  - Regex-based extraction untuk decision, summary, reasons, risks, actions
  - Fallback ke default values jika parsing gagal
  - Backward compatible dengan format text lama

- **`generateTrendRecommendation()`**: Updated untuk:
  - Try parse JSON dengan `parseJsonObject()`
  - Catch error dan fallback ke text parsing
  - Return response dengan field `structured` dan `text`

### Frontend Changes

#### 1. Types (`app/src/types.ts`)
Menambahkan interface baru:
```typescript
export interface StructuredRecommendation {
  decision: string;
  summary: string;
  reasons: string[];
  actions: string[];
  risks?: string[];
}

export interface AiRecommendationResponse {
  text: string;
  structured?: StructuredRecommendation;
  promptId: string;
  provider: string;
  model: string;
  runId: string;
  mode: 'trend' | 'saturation';
  cached?: boolean;
}
```

#### 2. Product Detail Modal (`app/src/components/ProductDetailModal.tsx`)
- Update state type dari `string` ke `AiRecommendationResponse`
- Update cache structure untuk menyimpan full response object
- Render conditional:
  - Jika `structured` ada: render sebagai card dengan sections (Alasan, Aksi Cepat)
  - Jika tidak: fallback ke raw text display
  - Loading state: shimmer skeleton

Layout baru:
```
┌─────────────────────────────────────┐
│ [Label]          [Decision Pill]    │
│ Summary text...                     │
│                                     │
│ ALASAN                              │
│ ✓ Reason 1                          │
│ ✓ Reason 2                          │
│                                     │
│ AKSI CEPAT                          │
│ ⚠ Action 1                          │
│ ⚠ Action 2                          │
└─────────────────────────────────────┘
```

#### 3. Saturation Guard (`app/src/pages/SaturationGuard.tsx`)
- Update state type dari `string` ke `AiRecommendationResponse`
- Update cache structure
- Render conditional dengan 3 sections dalam grid:
  - **Alasan** (CheckCircle2 icon)
  - **Risiko Utama** (AlertTriangle icon)
  - **Aksi 24 Jam** (numbered list)

Layout baru:
```
┌─────────────────────────────────────┐
│ [Icon] Rekomendasi  [Decision Pill] │
│ Summary text...                     │
│                                     │
│ ┌─────────────┬─────────────────┐   │
│ │ ALASAN      │ RISIKO UTAMA    │   │
│ │ ✓ Reason 1  │ ⚠ Risk 1        │   │
│ │ ✓ Reason 2  │ ⚠ Risk 2        │   │
│ └─────────────┴─────────────────┘   │
│                                     │
│ AKSI 24 JAM                         │
│ 1. Action 1                         │
│ 2. Action 2                         │
└─────────────────────────────────────┘
```

## Benefits

1. **Scannable UI**: Informasi terstruktur lebih mudah di-scan daripada paragraf panjang
2. **Consistent Layout**: Semua rekomendasi punya format yang sama
3. **Better UX**: Icons dan sections membantu user cepat menemukan info yang dicari
4. **Backward Compatible**: Fallback ke text display jika structured parsing gagal
5. **Maintainable**: Mudah menambah/ubah field tanpa mengubah prompt drastis

## API Response Example

### Trend Recommendation
```json
{
  "data": {
    "text": "...",
    "structured": {
      "decision": "Aman masuk",
      "summary": "Lampu Proyektor Aurora layak diuji karena growth tinggi dan saturation rendah.",
      "reasons": [
        "Growth 152% menunjukkan demand kuat",
        "Saturation 42% masih di zona aman"
      ],
      "actions": [
        "Order 30-50 unit untuk test market",
        "Buat konten fokus kamar tidur dan dekorasi malam"
      ]
    },
    "promptId": "trend_recommendation",
    "provider": "groq",
    "mode": "trend",
    "cached": false
  }
}
```

### Saturation Recommendation
```json
{
  "data": {
    "text": "...",
    "structured": {
      "decision": "Masuk kecil",
      "summary": "Produk ini masih layak diuji kecil karena window 48 jam dan growth 167%.",
      "reasons": [
        "Saturation 42% masih aman",
        "Growth 167% menunjukkan demand kuat"
      ],
      "risks": [
        "Kompetitor 54 mulai padat",
        "Window 48 jam perlu validasi cepat"
      ],
      "actions": [
        "Uji stok kecil 20-30 unit",
        "Buat konten varian warna dan bundling"
      ]
    },
    "promptId": "saturation_recommendation",
    "provider": "groq",
    "mode": "saturation",
    "cached": false
  }
}
```

## Testing

### Manual Testing
1. Start backend: `npm run dev` (di folder backend)
2. Start frontend: `npm run dev` (di folder app)
3. Test endpoints:
   - `/api/ai/trends/:id/recommendation` (trend mode)
   - `/api/ai/trends/:id/recommendation?mode=saturation` (saturation mode)
4. Verify UI di:
   - Product Detail Modal (dari Viral Products)
   - Saturation Guard page

### Build Verification
```bash
cd app
npm run build
```
Build harus sukses tanpa TypeScript errors.

## Rollback Plan

Jika ada masalah, structured output bersifat optional:
1. Frontend akan fallback ke `text` field jika `structured` tidak ada
2. Backend tetap mengirim `text` field untuk backward compatibility
3. Prompt bisa di-revert ke format text lama tanpa mengubah controller logic

## Future Improvements

1. **Confidence Score**: Tambahkan field `confidence` untuk menunjukkan seberapa yakin AI dengan rekomendasi
2. **Source Attribution**: Tambahkan field `sources` untuk menunjukkan data mana yang dipakai
3. **Action Priority**: Tambahkan field `priority` untuk setiap action (high/medium/low)
4. **Risk Severity**: Tambahkan field `severity` untuk setiap risk
5. **Localization**: Support multi-language structured output
