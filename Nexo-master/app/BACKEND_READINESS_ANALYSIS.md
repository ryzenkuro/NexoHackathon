# Nexo — Backend Readiness Analysis
**Tanggal:** 15 Mei 2026  
**Versi Kode:** Post-refactor (auth flow Opsi B)  
**Path:** `C:\Users\Kuro\Downloads\Compressed\Kimi_rev\app`

---

## Panduan Ikon

| Ikon | Artinya |
|---|---|
| 🧑 **Kamu** | Perlu kamu kerjain sendiri — butuh akun, keputusan bisnis, atau klik di dashboard |
| 🤖 **AI** | Bisa dikerjain AI sepenuhnya — tinggal minta, AI tulis kodenya |
| 🧑🤖 **Berdua** | Kamu sediakan info/akun, AI kerjain kodenya |

---

## Skor Kesiapan Keseluruhan

| Komponen | Skor | Status |
|---|---|---|
| Server & Infrastruktur | 55/100 | ⚠️ Partial |
| Autentikasi (Auth) | 40/100 | ⚠️ Partial |
| Chat / AI | 45/100 | ⚠️ Partial |
| Trends | 20/100 | ❌ Mock |
| Notifications | 15/100 | ❌ Mock |
| Database | 0/100 | ❌ Belum ada |
| Keamanan (Security) | 35/100 | ⚠️ Partial |
| Logging & Monitoring | 5/100 | ❌ Belum ada |
| Frontend ↔ Backend Integration | 60/100 | ⚠️ Partial |
| **TOTAL RATA-RATA** | **31/100** | ❌ Prototype |

---

## 1. Server & Infrastruktur

### ✅ Yang Sudah Berjalan
- Express + Helmet + CORS + Rate Limiting + Health Check — semua aktif
- 4 route group terdaftar dan berjalan
- Environment variable via dotenv

### ❌ Yang Perlu Diperbaiki

| Item | Siapa |
|---|---|
| Tambah request logging (Winston) | 🤖 AI |
| CORS support multi-origin (staging + production) | 🤖 AI |
| Aktifkan `xss-clean` di server.js | 🤖 AI |
| Tambah environment validation saat startup | 🤖 AI |
| Tambah graceful shutdown | 🤖 AI |
| Kecilkan JSON limit dari 10mb ke 1mb | 🤖 AI |

---

## 2. Autentikasi

### ✅ Yang Sudah Berjalan
- Flow register → OTP → verifikasi → aktifkan akun
- Flow login: phone + password
- Flow forgot password: OTP → reset token → password baru
- Validasi nomor HP Indonesia
- `sanitizeUser()` — password hash tidak pernah dikirim ke client

### ❌ Yang Perlu Diperbaiki

| Item | Siapa | Catatan |
|---|---|---|
| Buat project di Supabase | 🧑 **Kamu** | Daftar di supabase.com, gratis |
| Buat tabel di Supabase (users, otps, sessions, dll) | 🤖 AI | AI tulis SQL-nya, kamu paste di Supabase |
| Isi SUPABASE_URL dan SUPABASE_SERVICE_KEY di .env | 🧑 **Kamu** | Ambil dari dashboard Supabase |
| Install bcrypt + JWT di backend | 🤖 AI | Satu perintah npm |
| Ganti password hashing placeholder dengan bcrypt | 🤖 AI | |
| Ganti token Map() dengan JWT + Supabase | 🤖 AI | |
| Daftar akun WhatsApp API (Fonnte atau Twilio) | 🧑 **Kamu** | Fonnte lebih murah untuk Indonesia |
| Isi FONNTE_TOKEN di .env | 🧑 **Kamu** | Ambil dari dashboard Fonnte |
| Integrasi kirim OTP via WhatsApp | 🤖 AI | Setelah kamu punya token |
| Pasang `verifyToken` middleware di semua route | 🤖 AI | |
| Tambah rate limiting khusus OTP | 🤖 AI | |

---

## 3. Chat / AI

### ✅ Yang Sudah Berjalan
- SSE streaming berfungsi
- Azure OpenAI dengan fallback ke smart response
- Chat history per session, daily rate limit 20/hari
- System prompt Bahasa Indonesia, fokus UMKM

### ❌ Yang Perlu Diperbaiki

| Item | Siapa | Catatan |
|---|---|---|
| Buat Azure OpenAI resource | 🧑 **Kamu** | Di portal.azure.com, butuh kartu kredit |
| Isi AZURE_OPENAI_ENDPOINT + KEY di .env | 🧑 **Kamu** | Ambil dari Azure portal |
| Pasang auth check di chat route | 🤖 AI | |
| Simpan chat history ke Supabase | 🤖 AI | |
| Hitung daily count dari DB (bukan setInterval) | 🤖 AI | |
| Inisialisasi Azure client sekali saat startup | 🤖 AI | |
| Tambah validasi panjang pesan | 🤖 AI | |

---

## 4. Trends

### ✅ Yang Sudah Berjalan
- Filter, sorting, pagination, search — semua berfungsi
- Endpoint detail per ID

### ❌ Yang Perlu Diperbaiki

| Item | Siapa | Catatan |
|---|---|---|
| Seed 12 data tren ke tabel Supabase | 🤖 AI | AI tulis script-nya |
| Refactor trendController query ke Supabase | 🤖 AI | |
| Pasang auth di trend routes | 🤖 AI | |
| Hapus dead code (readFileSync, path import) | 🤖 AI | |
| Tambah validasi query parameter (limit, page) | 🤖 AI | |

---

## 5. Notifications

### ✅ Yang Sudah Berjalan
- Endpoint GET, mark-read, mark-all-read berfungsi

### ❌ Yang Perlu Diperbaiki

| Item | Siapa | Catatan |
|---|---|---|
| Refactor notificationController query ke Supabase per user | 🤖 AI | |
| Hapus 6 notifikasi hardcoded | 🤖 AI | |
| Tambah endpoint delete notifikasi | 🤖 AI | |
| Tambah pagination | 🤖 AI | |

---

## 6. Database — Blocker Utama

Seluruh backend saat ini pakai data in-memory. Restart server = semua data hilang.

### Yang Harus Dilakukan

| Item | Siapa | Catatan |
|---|---|---|
| Daftar akun Supabase (gratis) | 🧑 **Kamu** | supabase.com |
| Buat project baru di Supabase | 🧑 **Kamu** | Pilih region Asia (Singapore) |
| Jalankan SQL schema di Supabase SQL Editor | 🧑🤖 **Berdua** | AI tulis SQL, kamu paste & run |
| Copy SUPABASE_URL dan SERVICE_KEY ke .env | 🧑 **Kamu** | |
| Install @supabase/supabase-js di backend | 🤖 AI | |

**SQL Schema (AI yang tulis, kamu yang paste di Supabase):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  business_category TEXT DEFAULT 'Umum',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trend_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. Keamanan

### ✅ Yang Sudah Ada
- Helmet, CORS, Rate limiting, sanitizeUser, OTP expiry

### ❌ Yang Perlu Diperbaiki

| Item | Siapa |
|---|---|
| Install dan aktifkan bcrypt | 🤖 AI |
| Aktifkan xss-clean di server.js | 🤖 AI |
| Tambah rate limiting OTP | 🤖 AI |
| Tambah JWT expiry | 🤖 AI |
| HTTPS — aktif otomatis jika deploy ke Vercel/Railway | 🧑 **Kamu** (pilih platform) |

---

## 8. Frontend ↔ Backend Integration

### ✅ Yang Sudah Terhubung
- authStore sudah punya semua method yang sesuai endpoint
- Chat SSE sudah terhubung
- Notification dan Trend store sudah terhubung

### ❌ Yang Perlu Diperbaiki

| Item | Siapa |
|---|---|
| Buat file `src/lib/api.ts` dengan Axios interceptor | 🤖 AI |
| Auto-redirect ke login saat token expired (401) | 🤖 AI |
| Hapus localStorage manual di App.tsx | 🤖 AI |
| Tambah global loading state | 🤖 AI |

---

## 9. Dependencies yang Kurang

| Package | Status | Siapa Install |
|---|---|---|
| `bcrypt` | ❌ Belum ada | 🤖 AI |
| `jsonwebtoken` | ❌ Belum ada | 🤖 AI |
| `@supabase/supabase-js` (backend) | ❌ Belum ada | 🤖 AI |
| `winston` | ❌ Belum ada | 🤖 AI |
| `xss-clean` | ⚠️ Ada tapi tidak dipakai | 🤖 AI aktifkan |

---

## 10. Roadmap — Urutan Pengerjaan

### FASE 1 — Setup Akun & Konfigurasi
> **Kamu kerjain dulu sebelum AI bisa lanjut**

| # | Tugas | Siapa | Estimasi |
|---|---|---|---|
| 1 | Daftar Supabase, buat project | 🧑 **Kamu** | 15 menit |
| 2 | Copy SUPABASE_URL + SERVICE_KEY ke .env | 🧑 **Kamu** | 5 menit |
| 3 | Daftar Fonnte (fonnte.com), beli token | 🧑 **Kamu** | 30 menit |
| 4 | Copy FONNTE_TOKEN ke .env | 🧑 **Kamu** | 2 menit |
| 5 | Buat Azure OpenAI resource (opsional, ada fallback) | 🧑 **Kamu** | 30 menit |
| 6 | Jalankan SQL schema di Supabase SQL Editor | 🧑🤖 **Berdua** | 10 menit |

### FASE 2 — AI Kerjain Kode Backend
> **Setelah Fase 1 selesai, tinggal minta AI**

| # | Tugas | Siapa | Estimasi |
|---|---|---|---|
| 1 | Install bcrypt + JWT + supabase di backend | 🤖 AI | 5 menit |
| 2 | Refactor authController: bcrypt + JWT + Supabase | 🤖 AI | 30 menit |
| 3 | Integrasi Fonnte untuk kirim OTP | 🤖 AI | 15 menit |
| 4 | Pasang verifyToken di semua route | 🤖 AI | 10 menit |
| 5 | Refactor trendController ke Supabase | 🤖 AI | 20 menit |
| 6 | Refactor notificationController ke Supabase | 🤖 AI | 20 menit |
| 7 | Refactor chatController: history ke Supabase + auth | 🤖 AI | 20 menit |
| 8 | Tambah Winston logging + xss-clean + env validation | 🤖 AI | 15 menit |
| 9 | Buat Axios interceptor di frontend | 🤖 AI | 15 menit |

### FASE 3 — Testing & Deploy
> **Berdua**

| # | Tugas | Siapa | Estimasi |
|---|---|---|---|
| 1 | Test register + login + OTP di local | 🧑 **Kamu** | 20 menit |
| 2 | Fix bug yang ditemukan | 🤖 AI | varies |
| 3 | Pilih platform deploy (Railway / Render / Vercel) | 🧑 **Kamu** | 10 menit |
| 4 | Setup environment variables di platform | 🧑 **Kamu** | 15 menit |
| 5 | Deploy dan test production | 🧑🤖 **Berdua** | 30 menit |

---

## 11. Checklist Sebelum Production

```
FASE 1 — Akun & Konfigurasi (Kamu)
[ ] Supabase project dibuat
[ ] SQL schema dijalankan di Supabase
[ ] SUPABASE_URL dan SUPABASE_SERVICE_KEY di .env
[ ] Fonnte token didapat dan di .env
[ ] JWT_SECRET diset (min 32 karakter random)

FASE 2 — Kode Backend (AI)
[ ] bcrypt aktif untuk hash password
[ ] JWT aktif untuk token
[ ] verifyToken dipasang di semua route
[ ] OTP dikirim via WhatsApp (bukan console.log)
[ ] Semua controller query ke Supabase
[ ] Chat history tersimpan di DB
[ ] Winston logger aktif
[ ] xss-clean aktif

FASE 3 — Frontend (AI)
[ ] Axios interceptor aktif
[ ] Auto-redirect ke login saat 401
[ ] localStorage manual dihapus
```

---

## 12. Ringkasan Prioritas

| Prioritas | Item | Siapa | Dampak |
|---|---|---|---|
| 🔴 P0 | Buat Supabase project + jalankan schema | 🧑 **Kamu** | Semua data hilang tanpa ini |
| 🔴 P0 | Install bcrypt + JWT, refactor auth | 🤖 AI | Password tidak aman |
| 🔴 P0 | Daftar Fonnte, integrasi OTP | 🧑🤖 **Berdua** | Auth tidak berfungsi di production |
| 🔴 P0 | Pasang verifyToken di routes | 🤖 AI | Semua endpoint masih public |
| 🟠 P1 | Refactor trend + notif ke Supabase | 🤖 AI | Data tidak persist |
| 🟠 P1 | Chat history ke Supabase | 🤖 AI | History hilang saat restart |
| 🟡 P2 | Winston logging | 🤖 AI | Debugging production |
| 🟡 P2 | Axios interceptor frontend | 🤖 AI | UX saat token expired |
| 🟢 P3 | Graceful shutdown + env validation | 🤖 AI | Stability |

---

*Dokumen ini dibuat berdasarkan analisis kode pada 15 Mei 2026.*
