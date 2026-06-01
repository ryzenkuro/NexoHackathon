# Nexo Refactor Plan

## Tujuan

Mengubah Nexo dari alur data demo-first menjadi database-first dengan research pipeline yang bisa dipertanggungjawabkan saat source code dicek.

Target utama:

- Supabase dipakai sebagai metadata/query layer untuk data final yang dibaca UI dan API.
- Cloudflare R2 dipakai untuk media besar, raw scrape, video TikTok, thumbnail, dan arsip AI.
- Backend memakai ingestion script untuk data Shopee, Tokopedia, TikTok, dan Instagram.
- Jalur demo/mock/dummy/picsum dimatikan dari production path.
- AI trace dan research audit disimpan ke Supabase/R2, bukan memory.

## Arsitektur Baru

```text
Shopee / Tokopedia / TikTok / Instagram
  -> backend ingestion scripts
  -> raw payload + media asset ke Cloudflare R2
  -> normalized metadata + scores ke Supabase
  -> backend API membaca Supabase
  -> frontend Nexo menampilkan data final
```

Supabase bukan data lake besar. Supabase hanya menyimpan data kecil yang sering di-query.

R2 menjadi pengganti ringan untuk fungsi seperti research lake:

```text
raw/shopee/*.json
raw/tokopedia/*.json
raw/tiktok/*.json
raw/instagram/*.json
media/products/*.webp
media/thumbnails/*.webp
media/tiktok/*.mp4
ai-runs/*.json
```

## Konfigurasi

Ganti mode lama:

```env
DEMO_DATA_MODE=demo
AI_OPS_PROVIDER=demo-foundry-trace
LAKEHOUSE_PROVIDER=demo-medallion
```

Menjadi:

```env
DATA_PROVIDER=supabase
MEDIA_PROVIDER=r2
RESEARCH_LAKE_PROVIDER=r2
AI_TRACE_PROVIDER=supabase
OTP_DELIVERY=dev
```

Tambahkan env Cloudflare R2:

```env
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=
```

Catatan demo hackathon:

- OTP tetap `dev` agar demo tidak bergantung pada provider WhatsApp.
- Auth production adapter disiapkan, tetapi Fonnte/Twilio/Meta WhatsApp tidak perlu dipaksakan sebelum demo.

## Supabase Tables

Tabel yang dipakai sebagai metadata final:

- `trends`
- `trending_contents`
- `notifications`
- `chat_messages`
- `ai_runs`
- `research_sources`
- `raw_events`
- `media_assets`
- `product_metrics`
- `content_metrics`
- `trend_scores`

Kolom penting untuk `trends`:

```text
name
category
platform
source_platform
source_url
source_id
thumbnail
media_asset_id
raw_event_id
growth
saturation
phase
competitor_count
avg_price
review_velocity
confidence_score
detected_at
captured_at
last_metric_at
```

Kolom penting untuk `trending_contents`:

```text
title
creator
platform
source_url
source_id
thumbnail
video_url
media_asset_id
raw_event_id
views
likes
comments
engagement
product_relevance
related_trend_id
captured_at
```

## Backend Baru Yang Dibutuhkan

File baru:

```text
app/backend/src/lib/r2.js
app/backend/src/services/storage/mediaStore.js
app/backend/src/services/research/researchIngestor.js
app/backend/src/services/research/researchLakeStore.js
app/backend/src/services/research/scoring.js
app/backend/src/services/ai/supabaseTraceStore.js
app/backend/src/services/otp/otpService.js
app/backend/src/services/otp/providers/devOtpProvider.js
app/backend/src/services/otp/providers/fonnteProvider.js
app/backend/src/services/otp/providers/twilioProvider.js
app/backend/src/services/otp/providers/metaWhatsAppProvider.js
app/backend/src/scripts/ingestResearchData.js
app/backend/src/scripts/seedResearchFromJson.js
app/backend/src/data/researchTargets.json
```

Dependency backend yang perlu ditambah:

```bash
npm install @aws-sdk/client-s3
```

Opsional untuk scraping:

```bash
npm install playwright cheerio
```

## Research Pipeline

Sumber awal:

- Shopee
- Tokopedia
- TikTok
- Instagram

Strategi deadline:

- Target minimum 30 item.
- Target bagus 50 item.
- Target ideal 100 item jika scraping lancar.
- Supabase hanya menyimpan hasil final.
- Raw JSON, thumbnail, dan video disimpan ke R2.

Flow ingestion:

```text
researchTargets.json
  -> fetch/scrape/curate source
  -> save raw payload to R2
  -> save image/video to R2
  -> normalize item
  -> calculate growth/saturation/confidence
  -> upsert Supabase
```

Field confidence:

```text
high    = source URL jelas, image valid, metric ada
medium  = source URL dan image valid, metric sebagian
low     = hanya curated name/source, metric minim
```

## Scoring Awal

Gunakan scoring sederhana dulu.

```text
final_score =
  0.30 product_velocity
+ 0.25 content_velocity
+ 0.20 low_saturation_score
+ 0.15 recency_score
+ 0.10 confidence_score
```

Saturation awal:

```text
saturation =
  seller_density_score
+ price_competition_score
+ review_volume_score
+ content_repetition_score
```

Jika data belum cukup, jangan mengarang. Isi `confidence_score` rendah.

## Refactor Per Modul

### 1. Runtime / Config

File:

- `app/backend/src/lib/runtime.js`
- `app/backend/src/config/validateBackendConfig.js`
- `app/.env`
- `app/backend/.env`
- `app/.env.example`

Perubahan:

- Ganti `DEMO_DATA_MODE` dengan `DATA_PROVIDER`.
- Jangan fallback diam-diam ke data demo saat database gagal.
- Tambah validasi R2 env jika `MEDIA_PROVIDER=r2`.
- Tambah validasi AI trace env jika `AI_TRACE_PROVIDER=supabase`.

### 2. Trends

File:

- `app/backend/src/controllers/trendController.js`
- `app/backend/src/scripts/seedTrends.js`
- `app/backend/src/data/demoData.js`
- `app/backend/src/services/demoRealtimeStore.js`

Perubahan:

- Controller membaca Supabase sebagai sumber utama.
- Hilangkan fallback ke `queryDemoTrends` dari production path.
- Ganti `seedTrends.js` menjadi ingestion/seed hasil riset.
- Hapus atau pindahkan data lama ke `devFixtures`.
- Ganti semua `picsum` dengan R2/source image.

### 3. Trending Content

File:

- `app/backend/src/controllers/trendingContentController.js`
- `app/backend/src/data/demoData.js`

Perubahan:

- Isi tabel `trending_contents`.
- Simpan thumbnail/video TikTok ke R2.
- Simpan `source_url` asli.
- Hilangkan video placeholder `flower.mp4`.

### 4. Media Storage

File baru:

- `app/backend/src/lib/r2.js`
- `app/backend/src/services/storage/mediaStore.js`

Perubahan:

- Upload image/video ke R2.
- Return public URL.
- Simpan metadata ke `media_assets`.
- Update CSP di `app/backend/src/app.js` agar mengizinkan domain R2 public.
- Hapus `https://picsum.photos` dari CSP production.

### 5. Notifications

File:

- `app/backend/src/controllers/notificationController.js`

Perubahan:

- Hapus array hardcoded.
- `GET /api/notifications` query Supabase.
- `POST /api/notifications/read` update Supabase.
- `POST /api/notifications/read-all` update Supabase.
- Optional: generate notif dari `trend_scores`.

### 6. Chat

File:

- `app/backend/src/controllers/chatController.js`

Perubahan:

- Simpan chat ke `chat_messages`.
- Daily count dihitung dari Supabase.
- History dibaca dari Supabase.
- Untuk demo, ini P1, bukan blocker P0.

### 7. AI Trace / Foundry-Like

File:

- `app/backend/src/services/ai/traceStore.js`
- `app/backend/src/services/lakehouse/demoLakehouseStore.js`
- `app/backend/src/controllers/aiController.js`

Perubahan:

- Ganti memory trace ke `supabaseTraceStore.js`.
- Simpan ringkasan run ke `ai_runs`.
- Simpan payload besar ke R2 `ai-runs/*.json`.
- Rename provider:
  - `AI_OPS_PROVIDER=supabase-ai-trace`
  - `LAKEHOUSE_PROVIDER=r2-research-lake`

### 8. Dashboard

File:

- `app/backend/src/services/dashboardAggregator.js`

Perubahan:

- Hilangkan fallback data demo.
- `weeklyDeltaPct` dihitung dari `product_metrics`.
- Growth momentum dihitung dari `trend_scores`.
- Jika data tidak cukup, tampilkan value konservatif + confidence.

### 9. Saturation

File:

- `app/backend/src/controllers/saturationController.js`

Perubahan:

- `competitorDensity` dihitung dari `product_metrics`.
- `opportunityScore` memakai `trend_scores`.
- Jangan fallback ke data demo.

### 10. Auth / OTP

File:

- `app/backend/src/controllers/authController.js`
- `app/backend/src/services/demoAuthStore.js`

Perubahan:

- Buat `otpService`.
- Untuk hackathon pakai `OTP_DELIVERY=dev`.
- Siapkan provider Fonnte/Twilio/Meta untuk production.
- Pindahkan auth memory fallback ke dev-only jika masih dibutuhkan.

### 11. Smoke Test

File:

- `app/backend/src/scripts/smokeBackend.ps1`

Perubahan:

- Ganti assertion `demo-foundry-trace`.
- Ganti assertion `demo-medallion`.
- Tambah test:
  - `/api/trends` source database.
  - `/api/trending-content` tidak kosong.
  - `/api/notifications` dari Supabase.
  - AI trace tersimpan.
  - R2 config valid jika enabled.

## Cleanup Kata Kunci

Kata yang perlu hilang dari production path:

- `mock`
- `dummy`
- `picsum`
- `flower.mp4`
- `demoData`
- `demoRealtimeStore`
- `demoLakehouseStore`
- `demo-foundry-trace`
- `demo-medallion`
- `nexo-demo-rules`

Boleh tetap ada di folder khusus:

```text
app/backend/src/devFixtures/
```

Tetapi jangan di-import oleh controller production.

## Prioritas

### P0 - Wajib Sebelum Demo

- Set data mode database-first.
- Tambah R2 integration.
- Buat `ingestResearchData.js`.
- Isi `trends` 30-100 item.
- Isi `trending_contents` 10-30 item.
- Refactor `notificationController` ke Supabase.
- Ganti seed lama.
- Hapus `picsum` dari data aktif dan CSP production.

### P1 - Setelah Data Utama Aman

- Chat history ke Supabase.
- AI trace ke Supabase/R2.
- Dashboard dari metric snapshot.
- Saturation dari metric snapshot.
- Smoke test baru.

### P2 - Setelah Hackathon

- Scraper lebih stabil dengan retry, dedupe, dan rate limit.
- Integrasi provider/API resmi.
- Real OTP WhatsApp.
- Monitoring production.
- Admin panel untuk review hasil scrape.

## Checklist Eksekusi

```text
[ ] Tambah env R2
[ ] Install @aws-sdk/client-s3
[ ] Buat src/lib/r2.js
[ ] Buat mediaStore
[ ] Buat schema/index media_assets
[ ] Buat researchTargets.json
[ ] Buat researchIngestor
[ ] Buat scoring
[ ] Buat ingestResearchData.js
[ ] Upsert 30+ trends
[ ] Upsert 10+ trending_contents
[ ] Set DATA_PROVIDER=supabase
[ ] Refactor trendController no demo fallback
[ ] Refactor trendingContentController no demo fallback
[ ] Refactor notificationController ke Supabase
[ ] Update CSP R2, hapus picsum
[ ] Update smoke test
[ ] Scan ulang rg mock/dummy/demo/picsum
```

