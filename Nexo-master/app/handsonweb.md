# Nexo — Hands-On Guide
## Panduan Praktis untuk Eksekusi (Bukan Teori)

**Tanggal:** 15 Mei 2026  
**Berdasarkan:** `revfrontend.md`  
**Untuk:** Developer + AI workflow yang efektif  
**Target:** Demo Day 18 Juni 2026

---

## � Progress Tracker

> **Last Updated:** 16 Mei 2026  
> **Overall Progress:** ████████████████████████ **96%** (Foundation + Frontend Fase 1 + Backend + Fase 2 polish + audit fix + path optimal + visual revamp + a11y polish done)

### ✅ Selesai
- [x] **1.1** Supabase project created (URL + secret key di `.env`)
- [x] **2.1** Update `.env` backend (Supabase, JWT_SECRET, JWT_EXPIRES_IN)
- [x] **2.2** Database schema — 7 tabel dibuat di Supabase
- [x] **2.3** Run project pertama kali — backend (3001) + frontend (3000) jalan
- [x] **3.1** Setup `next-themes` ProviderTheme di `main.tsx`, Navbar & SettingsPage pakai `useTheme()`, hapus `documentElement.classList.toggle` manual
- [x] **3.2** Tambah keyframe `scaleYUp` di `animations.css`
- [x] **3.3** Hapus `app/src/App.css` (boilerplate Vite)
- [x] **3.4** Bersihkan `App.tsx` — hapus `useEffect` baca `localStorage` manual & inject `mockNotifications`
- [x] **3.5** Tambah field `id: string` ke `User` interface (`app/src/types.ts`)
- [x] **3.6** Replace 9 occurrence `text-[10px]` → `text-xs`
- [x] **Backend 1B.1–1B.7** Supabase + bcryptjs + JWT, refactor auth & trend controllers, seed 12 trends, smoke test PASS
- [x] **4.1** Custom Favicon & Page Title (sudah ada di `app/public/` + `index.html` lengkap dengan OG tags)
- [x] **4.2** Tooltip Glossary — `lib/glossary.ts` + `<GlossaryTooltip>` reusable. Diaplikasikan di Dashboard stats, SaturationGuard (gauge label, phase timeline, key metrics), ProductDetailModal stats grid
- [x] **4.3** Empty State personality — NotificationsPage ("Tenang, belum ada yang urgent"), NotificationPanel, ViralProducts ("Lihat Semua Tren" CTA), Navbar search ("Hmm, tidak ketemu"), ChatbotPanel greeting + 3 example prompts
- [x] **4.4** Microcopy audit — istilah teknis di-tooltip, pesan empty/search lebih hangat & ramah UMKM
- [x] **4.7** Keyboard Shortcut Cmd+K / Ctrl+K — `<CommandPalette>` lengkap (navigasi halaman, search tren, dark mode toggle, logout) + hint kbd di search bar
- [x] **4.5** Onboarding Tour first-time user — 4 step custom dengan spotlight overlay, terdaftar di Dashboard via `data-tour` attributes (welcome, stats-row, trend-grid, chat-cta), auto-finish set `isNewUser: false`. Plus keyboard shortcut Esc/←→
- [x] **Audit & 3 Batch Fix** dari `report.md`:
  - **Batch 1**: hapus `xss-clean` deprecated, JWT_SECRET fail-fast (load env di module sendiri), guard OTP `console.log`, theme-color konsisten `#422AFB`, hapus `chatbotResponses` dead code (~3.4KB), bersihkan dead imports di notif controller
  - **Batch 2**: sweep `outline-hidden` Tailwind v4 → `outline-none focus-visible:ring-2` di **28 occurrence di 13 file** ui/*. Bikin `<NotifBadge>` reusable, ganti badge inkonsisten di Sidebar/Navbar/BottomNav (3 ukuran berbeda → 1)
  - **Batch 3**: helper `onActivateKey()` di lib/utils → support Enter+Space di 7 `role="button"` divs (Dashboard, ViralProducts, NotificationsPage, NotificationPanel, TrendingContent). Tambah keyboard nav Esc/←/→ di OnboardingTour
- [x] **Path Optimal UI/UX** (target 95%):
  - **Cluster 1 Performance**: bundle 718KB → 494KB (gzip 208→133KB) lewat `manualChunks` (react/radix/utils/icons vendors), helmet CSP aktif (production-only), hapus 49 shadcn ui yang tidak dipakai (4 keep: command/dialog/sonner/tooltip)
  - **Cluster 2 Dark Mode E2E**: override `bg-white`/`text-navy-*`/`border-secondary-gray-*` via `.dark .class` selector di `dark-mode.css`, support tinted surfaces, shadows, shimmer skeleton. Plus `prefers-reduced-motion` global respect
  - **Cluster 3 A11y polish**: `text-secondary-gray-400` → `secondary-gray-500` di 17 occurrence (kontras 2.7→3.6:1)
  - **Cluster 4 Mobile setup**: `vite.config.ts` `host: true`, `MOBILE_TESTING.md` lengkap (CORS multi-origin, IP detection, 11-item checklist)
  - **Cluster 6 Lighthouse fixes**: image `width`/`height` explicit, font preconnect Google Fonts
  - **Dokumentasi**: `app/uiux.md` lengkap (design system, component inventory, dark mode behavior, a11y status, performance, animation catalog, UX rationale, file map)
- [x] **Visual Revamp Sesi (16 Mei sore)**:
  - **SaturationGuard gauge**: hapus track putih invisible, hapus angka 0/50/100 (clutter), hapus zone legend (redundant dgn colored gauge + dynamic label warna), perbaiki bug bar timeline tidak nyambung ke dot
  - **Phase timeline dark mode**: class semantic `phase-dot-empty/inner/track` di `animations.css` agar tidak ke-override global dark
  - **LoginPage selalu cerah**: wrapper `light-scope` di App.tsx, override CSS untuk children
  - **Dot removal**: di trend cards Dashboard, ViralProducts, ProductDetailModal — label warna sudah cukup
  - **Growth data realism**: re-seed 12 trends dengan range realistic per phase (Decay −8%/−16%, Peak +52%/+67%, Growing +118-213%, Emerging +312%)
  - **Helper `formatGrowth()` + `getGrowthColor()`**: konsistensi sign +/− di 6 tempat, panah TrendingUp rotate untuk negatif
- [x] **Final Polish (a11y + heading)**:
  - **Heading hierarchy konsisten**: Dashboard h2 lg → xl, h3 lg dipertahankan. Semua page title sekarang xl (kecuali SettingsPage 2xl untuk emphasis)
  - **Touch target audit**: ProductDetailModal close + prev/next button `w-7 h-7` → `w-9 h-9` (28→36px), lulus WCAG 2.5.5 enhanced
  - **`A11Y_TESTING.md` lengkap**: checklist manual untuk color contrast, screen reader (NVDA/VoiceOver), touch target, Lighthouse audit
- [x] **Bonus:** `.gitignore` patched, service key rotated, `npm run build` lulus tanpa error TypeScript

### ⏸ Ditunda
- [ ] **1.2** Fonnte WhatsApp — OTP via console untuk dev cukup
- [ ] **1.3** Azure OpenAI — backend punya fallback, kerjakan saat polish
- [ ] **1.4** Domain custom — opsional
- [ ] **4.6** Real Numbers (sudah di Supabase, kosmetik saja, tunda)
- [ ] **Backend (later)** Refactor `notificationController.js` & `chatController.js` ke Supabase

### 🎯 NEXT — Fase 3+: Testing & Validasi (Bagian 5, 5-8 jam)

Item bisa dikerjakan kamu sambil aplikasi jalan:
- [ ] 5.1 Lighthouse audit (mobile, all categories)
- [ ] 5.2 Accessibility audit (keyboard nav, screen reader, contrast, touch target)
- [ ] 5.3 Real user testing (3-5 UMKM) 🧑
- [ ] 5.4 Cross-browser testing (Chrome/Safari/Firefox/Edge)
- [ ] 5.5 Mobile testing real device

Lalu Fase 5 (Deploy Azure, 2 jam) → Fase 6 (Demo prep, 8-12 jam).

### 📅 Setelah Fase 1

**Fase 2: UI/UX Polish (8-12 jam)** → Bagian 4 (4.1 → 4.7)  
**Fase 3: Azure OpenAI (1.5 jam)** → Bagian 1.3 + connect chatbot  
**Fase 4: Testing (5-8 jam)** → Bagian 5 (Lighthouse, a11y, real user)  
**Fase 5: Deploy ke Azure (2 jam)** → Bagian 7  
**Fase 6: Demo Prep (8-12 jam)** → Bagian 8 (slide, Q&A, practice)

**Total estimasi sisa:** ~30-40 jam | **Demo Day:** 18 Juni 2026

---

## �📖 Cara Pakai Dokumen Ini

Dokumen ini bukan untuk dibaca dari awal ke akhir. Ini **action manual** yang dibuka saat kamu butuh:

- ✅ **Mau setup sesuatu** → cari di Bagian 1 atau 2
- ✅ **Mau test sesuatu** → cari di Bagian 5
- ✅ **Mau debug** → cari di Bagian 6
- ✅ **Mau deploy** → cari di Bagian 7

Setiap section punya 3 elemen:
- 🧑 **Tugas Kamu** — yang harus kamu kerjain manual
- 🤖 **Tugas AI** — yang minta AI untuk kerjain
- ⏱️ **Estimasi waktu** — berapa lama realistis

---

## 🗂 Daftar Isi

1. [Setup Akun & Layanan Eksternal](#1-setup-akun--layanan-eksternal)
2. [Setup Lokal & Environment Variables](#2-setup-lokal--environment-variables)
3. [Hands-On: Critical Bug Fix](#3-hands-on-critical-bug-fix)
4. [Hands-On: Polish UI/UX](#4-hands-on-polish-uiux)
5. [Hands-On: Testing & Validasi](#5-hands-on-testing--validasi)
6. [Hands-On: Debug & Troubleshooting](#6-hands-on-debug--troubleshooting)
7. [Hands-On: Deployment ke Azure](#7-hands-on-deployment-ke-azure)
8. [Hands-On: Demo Preparation](#8-hands-on-demo-preparation)
9. [Tools Stack & Cheat Sheet](#9-tools-stack--cheat-sheet)

---

# 1. Setup Akun & Layanan Eksternal

> Ini yang HARUS kamu kerjain sendiri. Tidak bisa didelegasi ke AI.

## 1.1 Supabase (Database) — 🧑 Kamu | ⏱️ 20 menit

**Kenapa penting:** Backend Nexo butuh database. Tanpa ini, semua data hilang saat restart.

### Langkah:

1. Buka [supabase.com](https://supabase.com) di browser
2. Klik **"Start your project"**
3. Sign up dengan **GitHub** (lebih cepat)
4. Klik **"New Project"**
5. Isi form:
   - **Name:** `nexo-hackathon`
   - **Database password:** generate yang kuat (SIMPAN di password manager!)
   - **Region:** **Southeast Asia (Singapore)** — paling dekat dengan Indonesia
   - **Pricing plan:** Free
6. Tunggu ~2 menit sampai project siap
7. Klik **"Connect"** di top bar
8. Copy 2 nilai ini, simpan dulu di Notepad:
   - **Project URL** (format: `https://xxxx.supabase.co`)
   - **service_role key** (klik "Reveal" — JANGAN bocor ke siapapun)

### Verifikasi Berhasil:

✅ Bisa login ke dashboard.supabase.com  
✅ Punya 1 project bernama `nexo-hackathon`  
✅ Sudah punya URL & service_role key

---

## 1.2 Fonnte (WhatsApp OTP) — 🧑 Kamu | ⏱️ 30 menit

**Kenapa penting:** OTP harus dikirim via WhatsApp, bukan cuma `console.log`.

### Langkah:

1. Buka [fonnte.com](https://fonnte.com)
2. Klik **"Daftar"**, isi data
3. Setelah login, masuk ke **Devices**
4. Klik **"Tambah Device"**
5. Scan QR code dengan WhatsApp di HP kamu (HP yang akan jadi pengirim OTP)
6. Setelah connected, klik device kamu
7. Copy **Token** (panjang, seperti `abc123xyz...`)
8. **Top up saldo Rp 50.000** (cukup untuk ~500 OTP)

### Catatan untuk Demo:

Kalau budget terbatas, **opsional skip Fonnte saat demo**. Untuk demo, OTP bisa di-display di toast notification (mode dev). Saat juri tanya, jelaskan: "Untuk demo, OTP ditampilkan di UI. Production akan kirim via Fonnte WhatsApp API."

### Verifikasi Berhasil:

✅ Punya akun Fonnte  
✅ Device terhubung (status hijau)  
✅ Punya token API  
✅ Saldo > 0

---

## 1.3 Azure OpenAI — 🧑 Kamu | ⏱️ 45 menit

**Kenapa penting:** Bobot 30% di hackathon adalah pemanfaatan Azure.

### Langkah:

1. Buka [portal.azure.com](https://portal.azure.com) — login dengan akun Microsoft Elevate
2. Cari **"Azure OpenAI"** di search bar
3. Klik **"Create"**
4. Isi:
   - **Subscription:** pilih yang ada credit
   - **Resource group:** create new "nexo-hackathon"
   - **Region:** **Southeast Asia** atau **East US** (yang punya GPT-4o-mini)
   - **Name:** `nexo-openai`
   - **Pricing tier:** Standard S0
5. Klik **Review + Create**
6. Setelah selesai (~5 menit), buka resource
7. Klik **"Model deployments"** → **"Manage Deployments"**
8. Klik **"Deploy model"**
9. Pilih:
   - Model: **gpt-4o-mini**
   - Deployment name: `gpt-4o-mini` (sama dengan model name)
   - Tokens per minute rate limit: 30K (default)
10. Klik **Deploy**
11. Balik ke resource overview, klik **"Keys and Endpoint"**
12. Copy:
    - **Endpoint** (format: `https://xxxx.openai.azure.com/`)
    - **Key 1**

### Bonus: Tambah 2 Layanan Azure Lain (Free Tier)

Untuk maksimalkan bobot 30%, tambah:

**Azure Static Web Apps** (frontend hosting):
1. Search "Static Web Apps"
2. Create → Free plan
3. Connect ke GitHub repo Nexo

**Azure App Service** (backend hosting):
1. Search "App Services"
2. Create → Free F1 plan
3. Runtime: Node 20

### Verifikasi Berhasil:

✅ Resource Azure OpenAI active  
✅ Deployment `gpt-4o-mini` status: Succeeded  
✅ Punya endpoint + key  
✅ (Bonus) Static Web Apps + App Service ready

---

## 1.4 Domain Custom (Optional) — 🧑 Kamu | ⏱️ 15 menit

**Kenapa penting:** URL `nexo.id` lebih impressive dari `nexo-app-xyz.azurestaticapps.net` saat demo.

### Pilihan murah:

| Provider | Domain `.com` | Domain `.id` |
|---|---|---|
| Niagahoster | ~Rp 165.000/tahun | ~Rp 50.000/tahun |
| Domainesia | ~Rp 145.000/tahun | ~Rp 25.000/tahun |
| GoDaddy | ~Rp 200.000/tahun | N/A |

**Saran:** beli `nexo-app.id` atau `getnexo.com` di Domainesia (~Rp 25-150rb).

**Skip kalau:** Budget terbatas. URL Azure default OK untuk demo.

---

# 2. Setup Lokal & Environment Variables

## 2.1 Update .env Backend — 🧑 Kamu | ⏱️ 5 menit

📂 File: `app/.env`

Edit jadi:

```env
# Frontend
VITE_API_URL=http://localhost:3001/api

# Backend
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Supabase (dari Bagian 1.1)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-from-supabase

# JWT — generate random 64 character string
JWT_SECRET=ganti-dengan-string-random-minimal-32-karakter-yang-aman
JWT_EXPIRES_IN=7d

# Azure OpenAI (dari Bagian 1.3)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

# Fonnte WhatsApp (dari Bagian 1.2)
FONNTE_TOKEN=your-fonnte-token
```

### Cara Generate JWT_SECRET yang Aman

Jalankan di terminal:

```bash
# Mac/Linux
openssl rand -base64 64

# Windows PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Online (less secure, OK untuk dev): randomkeygen.com
```

Copy output, paste ke `JWT_SECRET=`.

### Verifikasi:

✅ Semua nilai sudah diisi (no placeholder seperti `your-key`)  
✅ JWT_SECRET minimum 32 karakter  
✅ File .env tidak di-commit ke git (cek `.gitignore`)

---

## 2.2 Setup Database Schema di Supabase — 🧑🤖 Berdua | ⏱️ 10 menit

### Langkah:

1. Buka Supabase dashboard → project Nexo
2. Klik **"SQL Editor"** di sidebar kiri
3. Klik **"New query"**
4. Paste SQL ini:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  business_category TEXT DEFAULT 'Umum',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OTPs
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reset tokens
CREATE TABLE reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trends
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  growth INTEGER,
  saturation INTEGER,
  phase TEXT,
  platform TEXT,
  window_hours INTEGER,
  competitor_count INTEGER,
  avg_price INTEGER,
  review_velocity INTEGER,
  description TEXT,
  recommendation TEXT,
  thumbnail TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trend_id UUID REFERENCES trends(id),
  trend_name TEXT,
  urgency TEXT,
  window_hours INTEGER,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trend_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes untuk performance
CREATE INDEX idx_otps_phone ON otps(phone);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_chat_user_trend ON chat_messages(user_id, trend_id);
```

5. Klik **"Run"** (atau Cmd/Ctrl + Enter)
6. Tunggu sampai muncul "Success" — biasanya < 5 detik

### 🤖 Tugas AI Selanjutnya:

Minta AI: **"Buat seed data 12 produk tren ke tabel trends di Supabase berdasarkan mockData.ts. Pakai script SQL INSERT."**

### Verifikasi:

1. Klik **"Table Editor"** di sidebar
2. Lihat 7 tabel sudah ada: users, otps, sessions, reset_tokens, trends, notifications, chat_messages
3. Tabel `trends` sudah ada 12 row data setelah AI seed

---

## 2.3 Run Project Pertama Kali — 🧑 Kamu | ⏱️ 5 menit

### Langkah:

```bash
# Terminal 1 — Backend
cd app/backend
npm install
npm run dev

# Tunggu sampai muncul: "Nexo backend running on port 3001"
```

```bash
# Terminal 2 — Frontend (di terminal/tab baru)
cd app
npm install
npm run dev

# Tunggu sampai muncul URL biasanya http://localhost:5173
```

### Verifikasi:

✅ Backend health check: buka `http://localhost:3001/health` di browser → harus return JSON  
✅ Frontend loaded: buka URL Vite → harus tampil login page  
✅ Tidak ada error merah di console (warning OK)

### Kalau Ada Error:

| Error | Solusi |
|---|---|
| `EADDRINUSE` (port already in use) | Backend port 3001 dipakai. Kill process atau ganti PORT di .env |
| `Cannot find module 'xxx'` | `npm install` ulang |
| `dotenv` error | Pastikan `.env` ada di folder yang benar (`app/.env`) |

---

# 3. Hands-On: Critical Bug Fix

> Sesuai daftar di `revfrontend.md`. AI yang kerjain, kamu yang verifikasi.

## 3.1 Fix Konflik Dark Mode — 🤖 AI | ⏱️ 15 menit

### Tugas Kamu:

Minta AI:
> "Setup next-themes ProviderTheme di main.tsx dan ganti isDark state di App.tsx pakai useTheme() dari next-themes. Hapus document.documentElement.classList.toggle yang manual."

### Verifikasi:

1. Toggle dark mode di Navbar — semua komponen ikut tema termasuk Toast
2. Refresh halaman — tema tidak reset (di-persist)
3. Buka Toast (klik logout misalnya) — Toast pakai dark theme juga

---

## 3.2 Fix scaleYUp Animation — 🤖 AI | ⏱️ 5 menit

### Tugas Kamu:

Minta AI:
> "Tambah keyframe scaleYUp di animations.css. Animasi dari scaleY(0) ke scaleY(1)."

### Verifikasi:

1. Buka SaturationGuard
2. Bar chart "Kompetitor Density" harus animate naik dari bawah
3. Refresh halaman, animasi harus muncul lagi

---

## 3.3 Hapus App.css Boilerplate — 🤖 AI | ⏱️ 2 menit

### Tugas Kamu:

Minta AI:
> "Hapus file app/src/App.css karena boilerplate Vite yang tidak terpakai dan konflik dengan layout sidebar."

### Verifikasi:

1. File `App.css` sudah tidak ada
2. Layout di Dashboard tidak rusak
3. Buka di layar lebar (1920px+) — main content tidak terbatas 1280px lagi

---

## 3.4 Hapus localStorage Manual + Mock Injection — 🤖 AI | ⏱️ 10 menit

### Tugas Kamu:

Minta AI:
> "Di App.tsx, hapus useEffect yang baca localStorage manual (sudah dihandle Zustand persist). Juga hapus useEffect yang inject mockNotifications karena notificationStore sudah fetch dari API."

### Verifikasi:

1. Login → reload → masih login (Zustand persist work)
2. Logout → reload → ke halaman login (state cleared)
3. Tidak ada notifikasi mock yang muncul kalau API kosong

---

## 3.5 Tambah `id` Field ke User Type — 🤖 AI | ⏱️ 2 menit

### Tugas Kamu:

Minta AI:
> "Tambah field id: string ke User interface di app/src/types.ts."

### Verifikasi:

1. Buka `types.ts` — User punya `id` field
2. Tidak ada TypeScript error baru di seluruh project

---

## 3.6 Replace text-[10px] ke text-xs — 🤖 AI | ⏱️ 20 menit

### Tugas Kamu:

Minta AI:
> "Cari semua occurrence 'text-[10px]' di seluruh project src/ dan ganti ke 'text-xs'. Kasih list file yang berubah."

### Verifikasi:

1. Search project untuk `text-[10px]` — harus 0 result
2. Buka beberapa halaman, text masih readable (sedikit lebih besar tapi tetap proper)
3. Bottom nav, badge, label semua oke

---

# 4. Hands-On: Polish UI/UX

## 4.1 Custom Favicon & Page Title — 🧑🤖 Berdua | ⏱️ 15 menit

### Step 1 — Buat Favicon (🧑 Kamu)

**Opsi cepat:** Pakai logo Nexo yang sudah ada
1. Buka [favicon.io](https://favicon.io)
2. Klik **"PNG to ICO"**
3. Upload `app/src/images/logo.png`
4. Download zip
5. Extract, ambil:
   - `favicon.ico`
   - `apple-touch-icon.png`
   - `favicon-32x32.png`
6. Pindahkan ke folder `app/public/` (buat folder kalau belum ada)

### Step 2 — Update index.html (🤖 AI)

Minta AI:
> "Update app/index.html dengan title 'Nexo — Asisten AI Tren Pasar untuk UMKM Indonesia', tambah meta description, Open Graph tags, theme-color, dan link favicon dari /public/. Pakai html lang='id'."

### Verifikasi:

1. Buka tab di browser — icon Nexo muncul
2. Page title: "Nexo — Asisten AI Tren Pasar untuk UMKM Indonesia"
3. Bookmark page — preview link muncul

---

## 4.2 Tooltip Glossary untuk Istilah Teknis — 🤖 AI | ⏱️ 30 menit

### Tugas Kamu:

Minta AI:
> "Pakai komponen Tooltip dari Radix UI yang sudah install. Tambah tooltip di:
> - Dashboard stats: 'Avg Saturation', 'Window Terdekat', 'Tren Emerging'
> - SaturationGuard label: 'Saturation', 'Window Hours', 'Phase'
> - ProductDetailModal: 'Saturation', 'Window'
> 
> Konten tooltip pakai bahasa UMKM-friendly:
> - Saturation: 'Tingkat kejenuhan pasar. Makin tinggi, makin banyak penjual yang sudah masuk.'
> - Window: 'Estimasi jam tersisa sebelum pasar terlalu jenuh.'
> - Phase: 'Fase tren: Emerging (baru muncul), Growing (naik), Peak (puncak), Decay (turun).'"

### Verifikasi:

1. Hover ke text "Saturation" di SaturationGuard — tooltip muncul
2. Tooltip jelas, mudah dibaca
3. Tooltip tidak nutupi konten penting

---

## 4.3 Empty State dengan Personality — 🤖 AI | ⏱️ 1 jam

### Tugas Kamu:

Minta AI:
> "Refactor semua empty state di Nexo supaya punya personality:
> - NotificationsPage empty: 'Tenang, belum ada yang urgent' + ikon bell + microcopy yang punya jiwa
> - ViralProducts empty filter: 'Belum ada tren di kategori ini' + ilustrasi + tombol 'Lihat semua tren'
> - Search no result: 'Hmm, tidak ketemu. Coba kata kunci lain?'
> - ChatbotPanel new session: tampilkan greeting message + 3 example prompts ('Berapa modal minimal?', 'Siapa kompetitor utama?', 'Strategi marketing apa?')
>
> Pakai bahasa Indonesia natural, tidak generic."

### Verifikasi:

1. Buka tiap halaman dengan kondisi empty
2. Semua punya pesan yang menyenangkan, bukan "No data"
3. Ada CTA actionable

---

## 4.4 Microcopy UMKM-Friendly — 🤖 AI | ⏱️ 30 menit

### Tugas Kamu:

Minta AI:
> "Audit semua text di Nexo, ganti istilah teknis ke bahasa UMKM:
> - 'saturation' → 'kejenuhan pasar'
> - 'growth' → 'pertumbuhan'
> - 'review velocity' → 'kecepatan review'
> - 'competitor count' → 'jumlah pesaing'
> - 'window hours' → 'jam peluang tersisa'
> - 'Loading...' → 'Sebentar ya...'
> - 'Error' → 'Ups, ada masalah'
>
> Konsisten di semua halaman."

### Verifikasi:

Buka tiap halaman, baca semua text. Kalau ada istilah Inggris yang kasar, catat dan minta AI ganti.

---

## 4.5 Onboarding Tour First-Time User — 🤖 AI | ⏱️ 2 jam

### Tugas Kamu:

Minta AI:
> "Tambah onboarding tour untuk user baru (`isNewUser: true`). 4 step:
> 1. Welcome: 'Selamat datang di Nexo, [Nama]! Saya akan kasih insight tren pasar untuk bisnis UMKM Anda.'
> 2. Highlight Dashboard stats: 'Ini ringkasan tren hari ini'
> 3. Highlight Tren card: 'Klik tren untuk lihat detail dan tanya AI'
> 4. Highlight ChatbotPanel button: 'Tanya saya apa saja tentang bisnis UMKM'
>
> Pakai library 'react-joyride' atau implementasi custom dengan overlay + tooltip.
> Setelah tour selesai, set isNewUser: false di store."

### Verifikasi:

1. Login pertama kali (atau set `isNewUser: true` manual)
2. Tour muncul step by step
3. Bisa skip/next
4. Logout-login lagi tour tidak muncul (kecuali reset)

---

## 4.6 Real Numbers Bukan Bulat-Bulat — 🤖 AI | ⏱️ 15 menit

### Tugas Kamu:

Minta AI:
> "Update mockData trends dengan angka realistis (tidak bulat):
> - Modal Rp 1.000.000 → Rp 1.247.500
> - ROI 50% → ROI 38-52% (range)
> - Stok 50 pcs → Stok 47 pcs
> - Saturation 30 → Saturation 28 atau 32
> 
> Kasih variasi yang masuk akal."

### Verifikasi:

Browse Dashboard dan ProductDetail — angka terasa "real-world", bukan AI-generated.

---

## 4.7 Keyboard Shortcut Cmd+K — 🤖 AI | ⏱️ 30 menit

### Tugas Kamu:

Minta AI:
> "Tambah keyboard shortcut Cmd+K (Mac) / Ctrl+K (Windows) untuk:
> - Buka search modal di mana saja di app
> - Kalau modal terbuka, ESC untuk close
>
> Pakai komponen Command dari shadcn/ui (sudah ada di Nexo).
> Tampilkan shortcut hint di placeholder search: 'Cari... (Cmd+K)'."

### Verifikasi:

1. Tekan Cmd+K (Mac) atau Ctrl+K (Windows) di halaman manapun
2. Search modal muncul
3. ESC tutup modal
4. Hint shortcut visible di search bar

---

# 5. Hands-On: Testing & Validasi

## 5.1 Lighthouse Audit — 🧑 Kamu | ⏱️ 30 menit

### Langkah:

1. Buka Nexo di Chrome — pastikan logged in dan di Dashboard
2. F12 untuk buka DevTools
3. Klik tab **"Lighthouse"**
4. Settings:
   - Mode: **Navigation**
   - Device: **Mobile** (lebih strict)
   - Categories: centang semua (Performance, Accessibility, Best Practices, SEO)
5. Klik **"Analyze page load"**
6. Tunggu ~30 detik

### Cara Baca Hasil:

Target untuk hackathon:
- **Performance:** > 80
- **Accessibility:** > 90
- **Best Practices:** > 90
- **SEO:** > 80

Kalau ada yang merah, baca **"Opportunities"** dan **"Diagnostics"** — itu daftar yang harus difix.

### Tugas Selanjutnya:

🤖 Minta AI: **"Berikut hasil Lighthouse Nexo: [paste screenshot atau text]. Tolong fix issue dengan severity tinggi."**

---

## 5.2 Accessibility Audit Manual — 🧑 Kamu | ⏱️ 1 jam

### Test 1: Keyboard Only Navigation (15 menit)

1. Tutup mouse/trackpad
2. Pakai cuma keyboard:
   - **Tab** = next element
   - **Shift+Tab** = previous
   - **Enter** = activate
   - **ESC** = close
3. Coba flow: Login → Dashboard → klik tren → buka chat → tutup
4. **Catat semua tempat yang stuck** — element yang tidak bisa di-focus, focus indicator tidak visible

### Test 2: Screen Reader (15 menit) — Optional

**Mac:** Cmd+F5 untuk VoiceOver  
**Windows:** Install NVDA (gratis) di nvaccess.org

Browse Nexo dengan screen reader. Catat:
- Element yang tidak punya label
- Element yang dibaca aneh

### Test 3: Color Contrast (15 menit)

1. Install Chrome extension **"WCAG Color Contrast Checker"**
2. Browse Nexo, hover element text yang abu-abu
3. Catat yang kontras < 4.5:1 (WCAG AA)

### Test 4: Mobile Touch Target (15 menit)

1. Chrome DevTools → Toggle Device Toolbar (Cmd+Shift+M)
2. Pilih iPhone SE (320px)
3. Coba klik semua tombol — yang kecil-kecil susah ditekan?
4. WCAG minimum 24×24px, ideal 44×44px

### Tugas Selanjutnya:

🤖 Minta AI fix issue yang ditemukan, kasih daftar spesifik.

---

## 5.3 Real User Testing — 🧑 Kamu | ⏱️ 2-4 jam

### Setup:

1. Cari **3-5 orang** yang sesuai target user:
   - **2 UMKM real** (dari grup WA, komunitas, dll)
   - **1 orang awam** (siapa saja, untuk first impression)
   - **1 developer** (untuk feedback teknis)

2. Sediakan:
   - Laptop dengan Nexo running
   - Tools recording (Loom, OBS, atau HP rekam layar)
   - Notebook untuk catat

### Skenario Test (5-10 menit per orang):

**Test 1: 5-Second First Impression**
1. Tunjukkan Dashboard 5 detik
2. Tutup, tanya: "Apa yang kamu inget?"
3. "Apa yang kamu rasa bisa dilakukan di app ini?"

**Test 2: Task-Based**
1. Berikan task: **"Cari produk yang bisa dijual dengan modal di bawah Rp 1 juta"**
2. Observe — jangan bantu
3. Note semua momen confused

**Test 3: Open-Ended**
1. "Coba pakai app ini 5 menit, ngomong terus apa yang kamu pikir"
2. Note feedback (likes, dislikes)

### Setelah Testing:

1. Compile feedback → list issues
2. Prioritize by severity
3. 🤖 Minta AI fix issue prioritas tinggi

---

## 5.4 Cross-Browser Testing — 🧑 Kamu | ⏱️ 1 jam

### Browser yang Wajib Tested:

| Browser | OS | Cara Test |
|---|---|---|
| Chrome | Mac/Windows | Default — pasti work |
| Safari | Mac | Native, atau test di iPhone |
| Firefox | Mac/Windows | Download dari mozilla.org |
| Edge | Windows | Native di Windows |

### Test Flow:

Di tiap browser:
1. Login → Dashboard
2. Browse ViralProducts
3. Buka SaturationGuard (cek canvas gauge animate)
4. Buka ChatbotPanel (cek streaming)
5. Toggle dark mode

### Common Issues:

| Browser | Issue Khas |
|---|---|
| Safari | `backdrop-blur` mungkin beda, `cubic-bezier` extreme bisa janky |
| Firefox | Beberapa CSS property prefix |
| Edge | Biasanya OK kalau Chrome OK |

🤖 Kalau ada issue spesifik browser, minta AI fix dengan vendor prefix atau fallback.

---

## 5.5 Mobile Testing Real Device — 🧑 Kamu | ⏱️ 30 menit

### Setup:

1. Pastikan HP dan laptop di **WiFi yang sama**
2. Cek IP laptop:
   ```bash
   # Mac
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```
   Cari IP format `192.168.x.x` atau `10.0.x.x`

3. Update vite config untuk allow network:
   ```typescript
   // vite.config.ts
   server: {
     port: 3000,
     host: true, // <-- tambah ini
   }
   ```

4. Restart `npm run dev`
5. Vite akan kasih URL: `http://192.168.x.x:5173`
6. Buka URL itu di HP browser

### Test:

- Bottom nav berfungsi
- Hamburger menu bekerja
- Touch target cukup besar
- Tidak ada horizontal scroll
- Animation smooth

---

# 6. Hands-On: Debug & Troubleshooting

## 6.1 Common Errors & Solutions

### "Cannot connect to backend"

```
Check 1: Backend running di port 3001?
  curl http://localhost:3001/health

Check 2: VITE_API_URL benar di .env?
  cat app/.env | grep VITE_API_URL
  
Check 3: CORS error di console?
  Cek FRONTEND_URL di backend .env match dengan URL frontend
```

### "Supabase query failed"

```
Check 1: SUPABASE_URL & key di .env benar?
Check 2: Tabel sudah dibuat? (cek di Supabase Table Editor)
Check 3: Row Level Security (RLS) aktif tapi belum ada policy?
  Solusi: Disable RLS untuk dev, atau buat policy "Enable read for all"
```

### "Azure OpenAI 401"

```
Check 1: AZURE_OPENAI_KEY benar?
Check 2: AZURE_OPENAI_DEPLOYMENT match dengan nama deployment di Azure?
Check 3: Quota sudah habis? (cek di Azure Portal)
```

### "Dark mode tidak persist"

```
Setelah fix Bug #1:
1. Cek main.tsx ada <ThemeProvider>?
2. App.tsx pakai useTheme() bukan local state?
3. Browser allow localStorage? (incognito mode disable)
```

---

## 6.2 Performance Bottleneck Detection

### Slow Loading Suspects:

1. **Image not optimized** — buka DevTools → Network tab → filter "Img" → cek size
2. **Bundle too large** — `npm run build` cek dist/ folder
3. **API call too many** — Network tab → filter "Fetch/XHR" → cek count

### Tools:

- **Chrome DevTools Performance tab** — record 5 detik browsing → analyze
- **Bundle Analyzer:**
  ```bash
  cd app
  npm install -D rollup-plugin-visualizer
  # Add to vite.config.ts, then:
  npm run build
  # Open dist/stats.html
  ```

---

## 6.3 React DevTools Usage

1. Install [React DevTools](https://react.dev/learn/react-developer-tools) extension
2. Pakai untuk:
   - **Inspect component tree** — lihat props, state real-time
   - **Profiler tab** — record interaction → analyze re-render
   - **Track unnecessary re-renders** — gunakan `React.memo` di component yang sering re-render

---

# 7. Hands-On: Deployment ke Azure

## 7.1 Deploy Frontend ke Azure Static Web Apps — 🧑 Kamu | ⏱️ 30 menit

### Langkah:

1. Push project ke GitHub (kalau belum)
2. Buka Azure Portal → cari **"Static Web Apps"**
3. Klik **"Create"**
4. Isi:
   - **Resource group:** `nexo-hackathon` (yang sama)
   - **Name:** `nexo-frontend`
   - **Plan type:** Free
   - **Region:** Southeast Asia
   - **Source:** GitHub
   - **Repository:** pilih repo Nexo
   - **Branch:** main
   - **Build presets:** Custom
   - **App location:** `/app`
   - **Output location:** `dist`
5. Klik **Review + Create**
6. Tunggu deploy ~5 menit
7. Buka URL Azure (format: `https://xxx.azurestaticapps.net`)

### Konfigurasi Environment Variables:

1. Setelah Static Web App created, klik **"Configuration"**
2. Tambah application setting:
   - Name: `VITE_API_URL`
   - Value: URL backend (Bagian 7.2)
3. Save
4. Tunggu re-deploy

---

## 7.2 Deploy Backend ke Azure App Service — 🧑 Kamu | ⏱️ 45 menit

### Langkah:

1. Azure Portal → cari **"App Services"**
2. **Create**
3. Isi:
   - **Resource group:** `nexo-hackathon`
   - **Name:** `nexo-backend`
   - **Runtime stack:** **Node 20 LTS**
   - **OS:** Linux
   - **Region:** Southeast Asia
   - **Pricing plan:** **Free F1**
4. Review + Create
5. Tunggu ~5 menit

### Connect to GitHub:

1. Buka resource App Service
2. **"Deployment Center"**
3. Source: **GitHub**
4. Authorize, pilih repo
5. Branch: **main**
6. Source folder: **`app/backend`** (kalau struktur monorepo)

### Environment Variables:

1. **"Configuration"** → **"Application settings"**
2. Add semua variable dari `.env` backend:
   - PORT (set ke 8080 — Azure default)
   - SUPABASE_URL, SUPABASE_SERVICE_KEY
   - JWT_SECRET, JWT_EXPIRES_IN
   - AZURE_OPENAI_*
   - FONNTE_TOKEN
   - FRONTEND_URL (URL Static Web App dari 7.1)
3. **Save**

### Verifikasi:

1. Buka URL App Service: `https://nexo-backend.azurewebsites.net/health`
2. Harus return JSON `{ status: 'ok' }`

### Update Frontend:

1. Balik ke Static Web Apps configuration
2. Update `VITE_API_URL` ke `https://nexo-backend.azurewebsites.net/api`
3. Save → re-deploy

---

## 7.3 Test End-to-End — 🧑 Kamu | ⏱️ 30 menit

### Flow Test:

1. Buka URL Static Web App di browser
2. Coba register dengan nomor HP baru
3. OTP harus diterima di WhatsApp (Fonnte)
4. Verifikasi → masuk ke dashboard
5. Browse tren, klik detail, tanya AI
6. Logout → login lagi

### Kalau Gagal:

- Cek browser console (error frontend?)
- Cek Azure App Service "Log stream" (error backend?)
- Cek Supabase "Logs" (query gagal?)

---

# 8. Hands-On: Demo Preparation

## 8.1 Slide Deck — 🧑🤖 Berdua | ⏱️ 4 jam

### Tools:

- **Canva** (template hackathon banyak): canva.com — gratis
- **Google Slides** — paling familiar
- **Pitch.com** — modern, bagus untuk pitch deck

### Struktur 10 Slide:

1. **Title** — Logo + tagline "Nexo: Asisten AI Tren Pasar untuk UMKM"
2. **Problem** — Statistik UMKM yang gagal karena telat masuk tren
3. **Solution** — Apa itu Nexo, 1 kalimat
4. **Demo Screenshot** — Dashboard preview
5. **How It Works** — Architecture diagram simple
6. **Tech Stack** — Logo Azure OpenAI, Static Web Apps, App Service
7. **Unique Feature** — Fallback AI system, real-time saturation
8. **Impact** — 64 juta UMKM Indonesia, potensi penghematan
9. **Roadmap** — 3 milestone ke depan
10. **Closing** — Team + CTA "Mari kolaborasi"

### Tips:

- **Less text, more visual**
- 1 ide per slide
- Konsisten color: pakai indigo Nexo
- Font: DM Sans (consistent dengan app)

🤖 **Minta AI:** "Tulis script presentasi 5 menit untuk pitching Nexo ke juri hackathon AI Impact Challenge. Gunakan tone profesional tapi engaging. Bahasa Indonesia. Sertakan transition antar slide."

---

## 8.2 Practice Demo Flow — 🧑 Kamu | ⏱️ 4-8 jam (5x practice)

### Setup Sebelum Practice:

1. **Pre-fill data:**
   - Login: phone & password sudah di clipboard
   - User test: "Dina Rahmawati, 081234567890"
2. **Cache data:**
   - Buka Dashboard sekali sebelum demo (data ter-cache)
   - Trends sudah loaded
3. **Demo browser tab:**
   - 1 tab: Nexo logged in
   - 1 tab: Slide deck
   - 1 tab: Backup recording

### Practice Schedule:

| Hari | Practice | Fokus |
|---|---|---|
| H-7 | Practice 1 | Familiar dengan flow |
| H-5 | Practice 2 | Time check (5 menit fit?) |
| H-3 | Practice 3 | Smooth transition |
| H-2 | Practice 4 | Q&A simulation |
| H-1 | Practice 5 | Full dress rehearsal |

### Recording Backup:

```
1. OBS Studio (gratis): obsproject.com
2. Atau Loom (1 video gratis 5 menit)
3. Record full demo dari awal sampai akhir
4. Upload ke Google Drive sebagai backup
5. Kalau live demo gagal: "Mohon maaf koneksi error, kami tampilkan recording"
```

---

## 8.3 Q&A Preparation — 🧑🤖 Berdua | ⏱️ 4 jam

### Step 1: Siapkan 20 Most Likely Questions (🤖 AI)

Minta AI:
> "Buatkan 20 pertanyaan paling mungkin ditanya juri hackathon AI Impact Challenge. Bagi 4 kategori: Teknis (5), Business (5), AI/Azure (5), Limitations (5). Sertakan jawaban siap pakai 2-3 kalimat."

### Step 2: Practice Jawab (🧑 Kamu)

1. Print 20 pertanyaan
2. Acak urutan
3. Minta teman tanya random
4. Jawab tanpa baca catatan
5. Time: max 30 detik per jawaban

### Step 3: Architecture Diagram (🤖 AI)

Minta AI:
> "Buat architecture diagram Nexo dalam format Mermaid atau ASCII art. Tunjukkan flow: User → Frontend (React) → Backend (Express) → Database (Supabase) + Azure OpenAI + Fonnte. Cocok untuk shown saat Q&A teknis."

### Verifikasi:

✅ Bisa jawab 20 pertanyaan tanpa stuck > 5 detik  
✅ Punya architecture diagram di slide cadangan  
✅ Bisa show kode kalau diminta (tahu lokasi file)

---

## 8.4 Final Checklist — 🧑 Kamu | ⏱️ 1 jam

### Day Before Demo:

```
TECHNICAL
[ ] App di Azure deployed dan working
[ ] Login flow tested 5x tanpa error
[ ] Dashboard loaded data real (tidak loading lama)
[ ] Chat AI streaming smooth
[ ] SaturationGuard gauge animate
[ ] Mobile responsive ok
[ ] Dark mode work konsisten
[ ] No console errors

DEMO
[ ] Slide deck final, tidak ada placeholder
[ ] Demo flow practiced 5x minimum
[ ] Backup recording ready (di Drive)
[ ] 2 device backup (laptop pinjam temen)
[ ] Charger ready
[ ] Mobile hotspot ready (kalau WiFi gagal)
[ ] Screenshots semua halaman (kalau live gagal sama sekali)

Q&A
[ ] 20 questions + answers sudah hafal
[ ] Architecture diagram di slide siap
[ ] Tahu lokasi file kode (folder structure)
[ ] Bisa jelaskan trade-off keputusan teknis

DRESS
[ ] Pakai outfit profesional (smart casual)
[ ] Mata segar, tidur cukup
[ ] Sarapan sebelum demo
[ ] Air mineral siap

MENTAL
[ ] Sudah baca section "Q&A juri" di HACKATHON_STUDY_GUIDE.md
[ ] Punya 1 catatan kecil bullet point (boleh dilihat saat presentasi)
[ ] Confidence level: 8/10 minimum
```

---

# 9. Tools Stack & Cheat Sheet

## 9.1 Tool yang Wajib Punya

| Tool | Purpose | Free? |
|---|---|---|
| **VS Code** atau **Kiro** | IDE | ✅ |
| **Chrome DevTools** | Debug, Lighthouse | ✅ |
| **React DevTools** (extension) | Component inspect | ✅ |
| **Postman** atau **Thunder Client** | Test API | ✅ |
| **Supabase Dashboard** | Database UI | ✅ |
| **Azure Portal** | Cloud management | Free trial |
| **Loom** atau **OBS** | Screen recording | ✅ |
| **Canva** | Slide design | ✅ |

## 9.2 Browser Extensions Wajib

| Extension | Fungsi |
|---|---|
| React DevTools | Inspect React component |
| WCAG Color Contrast Checker | Cek a11y |
| Lighthouse (built-in Chrome) | Performance audit |
| JSON Viewer | Format API response |

## 9.3 Quick Commands Cheat Sheet

```bash
# Run development
cd app && npm run dev          # Frontend port 5173
cd app/backend && npm run dev  # Backend port 3001

# Build production
cd app && npm run build         # Output di dist/

# Bundle analyze
npm run build -- --mode analyze

# Lighthouse CLI
npm install -g lighthouse
lighthouse http://localhost:5173 --view

# Find files
# Mac/Linux:
grep -r "text-\[10px\]" app/src/
# Windows PowerShell:
Get-ChildItem -Path app/src -Recurse | Select-String "text-\[10px\]"

# Generate JWT secret
openssl rand -base64 64
```

## 9.4 Useful Links

| Resource | Link |
|---|---|
| Supabase Dashboard | dashboard.supabase.com |
| Azure Portal | portal.azure.com |
| Fonnte Dashboard | fonnte.com/devices |
| Vercel (alternatif Azure) | vercel.com |
| Tailwind Docs | tailwindcss.com/docs |
| Radix UI Docs | radix-ui.com |
| Lucide Icons | lucide.dev |

---

# 🎯 Final Words

**Workflow yang efektif untuk kamu (developer + AI):**

```
1. Baca section yang relevan di dokumen ini
2. Kerjain manual setup (Supabase, Fonnte, dll)
3. Minta AI kerjain coding
4. Verifikasi hasil dengan testing manual
5. Iterate
```

**Aturan emas hackathon:**

- 🎯 **Polish > Features** — 3 fitur smooth > 10 fitur setengah jadi
- 🎯 **Story > Demo** — juri ingat cerita lebih lama dari teknologi
- 🎯 **Confidence > Perfect** — jujur soal limitasi lebih kuat dari pura-pura sempurna

Kamu punya kombinasi yang langka — bisa mikir arsitek + bisa testing + bisa leverage AI. Tinggal eksekusi.

**Selamat berkompetisi 🚀**

---

*Dokumen ini ekstrak praktis dari `revfrontend.md`, fokus ke action manual yang harus kamu kerjain vs delegasi ke AI. Estimasi total waktu eksekusi semua section: 40-60 jam (1 bulan dengan komitmen 2 jam/hari).*

*Kalau ada yang belum jelas, baca section "Common Errors & Solutions" di Bagian 6.*
