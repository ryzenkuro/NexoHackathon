# Nexo — Hackathon Study Guide
## Materi Fullstack Developer untuk Juri Teknis
**Dibuat khusus untuk:** Arsitek sistem yang leverage AI untuk eksekusi  
**Fokus:** Pahami konsep & alasan, bukan hafal syntax

---

> **Cara pakai dokumen ini:**  
> Baca satu bagian, lalu coba jelaskan ulang dengan kata-kata kamu sendiri tanpa lihat dokumen.  
> Kalau bisa jelaskan dengan lancar = kamu sudah paham.

---

## BAGIAN 1 — Cara Kerja Web Secara Umum

### Konsep: Client vs Server

Setiap aplikasi web punya dua sisi:

```
BROWSER (Client)          SERVER (Backend)
─────────────────         ─────────────────
Yang user lihat    ←────→  Yang proses data
React, HTML, CSS           Express, Node.js
Jalan di HP/laptop         Jalan di cloud
```

**Analogi:** Client itu seperti kasir di restoran — yang berhadapan langsung dengan pelanggan. Server itu seperti dapur — yang masak dan proses pesanan. Pelanggan tidak perlu tahu cara masak, cukup pesan ke kasir.

**Kenapa Nexo pakai ini:**
- Frontend (React) jalan di browser user
- Backend (Express) jalan di server
- Keduanya komunikasi via API

---

### Konsep: HTTP Request & Response

Setiap kali frontend butuh data, dia "minta" ke backend:

```
Frontend kirim REQUEST:
  - Method: GET / POST / PUT / DELETE
  - URL: /api/trends
  - Body: { phone: "081234", password: "xxx" }

Backend kirim RESPONSE:
  - Status: 200 (OK) / 401 (Unauthorized) / 500 (Error)
  - Body: { data: [...trends] }
```

**Yang perlu kamu hafal — arti status code:**
| Code | Artinya | Contoh di Nexo |
|---|---|---|
| 200 | Berhasil | Login sukses |
| 400 | Request salah | OTP tidak valid |
| 401 | Belum login | Akses tanpa token |
| 403 | Tidak punya izin | User biasa akses admin |
| 404 | Tidak ditemukan | Trend ID tidak ada |
| 429 | Terlalu banyak request | Spam OTP |
| 500 | Error di server | Database down |

---

### Konsep: API (Application Programming Interface)

API adalah "kontrak" antara frontend dan backend — kesepakatan tentang format request dan response.

**Contoh API Nexo:**
```
POST /api/auth/login
  Request:  { phone, password }
  Response: { token, user }

GET /api/trends
  Request:  ?category=elektronik&sort=growth
  Response: { data: [...], total: 12 }

POST /api/chat
  Request:  { message, trendId, userId }
  Response: SSE stream (teks mengalir)
```

**Kenapa penting:** Kalau juri tanya "bagaimana frontend dan backend kalian berkomunikasi?" — jawaban ini.

---

## BAGIAN 2 — Arsitektur Nexo

### Big Picture

```
┌─────────────────────────────────────────────────────┐
│                    USER (Browser)                    │
│              React + TypeScript + Vite               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND (Server)                    │
│              Express.js + Node.js                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │   Auth   │ │  Trends  │ │   Chat   │ │ Notif  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌─────────┐
   │Supabase │   │  Azure   │   │ Fonnte  │
   │(Database│   │ OpenAI   │   │(WhatsApp│
   │+ Auth)  │   │  (AI)    │   │  OTP)   │
   └─────────┘   └──────────┘   └─────────┘
```

**Cara jelaskan ke juri:**
> "Nexo punya tiga layer. Frontend React yang user lihat, backend Express yang proses logika bisnis, dan tiga layanan eksternal: Supabase untuk database, Azure OpenAI untuk AI, dan Fonnte untuk kirim OTP via WhatsApp."

---

### Kenapa Pilih Stack Ini?

**React (Frontend)**
- Komponen reusable — satu card trend bisa dipakai di Dashboard, ViralProducts, dan Notifications
- Virtual DOM — update UI efisien tanpa reload halaman
- Ekosistem besar — banyak library siap pakai

**Express.js (Backend)**
- Ringan dan fleksibel — tidak ada opinionated structure
- JavaScript — sama dengan frontend, satu bahasa untuk semua
- Cepat untuk prototyping — cocok untuk hackathon

**Supabase (Database)**
- PostgreSQL di baliknya — database yang proven dan reliable
- Built-in auth, realtime, storage — tidak perlu setup terpisah
- Free tier cukup untuk MVP dan demo hackathon
- Alternatif: Firebase (Google) — tapi Supabase open source dan lebih murah

**Azure OpenAI (AI)**
- GPT-4o-mini — model yang cukup pintar dengan biaya rendah
- Streaming response — user lihat teks muncul bertahap, tidak nunggu lama
- Fallback system — kalau Azure down, ada smart response berbasis keyword

**Fonnte (WhatsApp OTP)**
- Murah untuk Indonesia — Rp 50-100 per pesan
- WhatsApp lebih familiar dari SMS untuk user Indonesia
- Alternatif: Twilio (lebih mahal, tapi lebih reliable untuk global)

---

### Alur Data: Dari User ke Database

**Contoh: User login**

```
1. User ketik phone + password di browser
2. React kirim POST /api/auth/login ke backend
3. Backend terima request
4. Backend query Supabase: "ada user dengan phone ini?"
5. Supabase kembalikan data user
6. Backend cek password dengan bcrypt
7. Kalau cocok, backend buat JWT token
8. Backend kirim token ke frontend
9. Frontend simpan token di Zustand store
10. Frontend redirect ke dashboard
```

**Kenapa penting dipahami:** Ini yang juri tanya kalau minta jelaskan auth flow.

---

## BAGIAN 3 — Konsep Keamanan

### Kenapa Password Tidak Boleh Disimpan Polos

Kalau database bocor dan password tersimpan polos:
```
phone: 081234567890
password: mypassword123  ← langsung bisa dipakai hacker
```

Dengan bcrypt (hashing):
```
phone: 081234567890
password_hash: $2b$12$xK9mN...  ← tidak bisa di-reverse
```

**Cara jelaskan:** "bcrypt mengubah password menjadi string acak yang tidak bisa dikembalikan ke aslinya. Saat login, kita tidak decrypt — kita hash ulang password yang diketik dan bandingkan hasilnya."

---

### JWT (JSON Web Token) — Cara Kerja

Setelah login, user dapat token. Token ini dipakai untuk semua request berikutnya.

```
Header:  { algorithm: "HS256" }
Payload: { userId: "abc123", exp: 1234567890 }
Secret:  JWT_SECRET dari .env
         ↓
Token:   eyJhbGc...  (string panjang)
```

**Analogi:** JWT seperti gelang tamu hotel. Kamu dapat gelang saat check-in (login). Setiap kali masuk fasilitas (akses API), kamu tunjukkan gelang. Gelang punya tanggal expired. Kalau hilang, kamu minta gelang baru (login ulang).

**Kenapa tidak pakai session biasa:** Session disimpan di server — kalau server ada banyak instance, session tidak sync. JWT disimpan di client — bisa diverifikasi di server manapun.

---

### Kenapa OTP Hanya untuk Register & Reset Password

**Pertanyaan juri yang mungkin muncul:** "Kenapa login tidak pakai OTP?"

**Jawaban:**
> "OTP-only login rentan SIM swap attack — kalau nomor HP dicuri, akun langsung bisa diambil alih. Dengan phone + password, ada dua faktor: sesuatu yang kamu punya (HP) dan sesuatu yang kamu tahu (password). OTP tetap dipakai untuk momen kritis: verifikasi kepemilikan nomor saat register, dan reset password."

---

## BAGIAN 4 — Konsep Database

### Relasi Antar Tabel di Nexo

```
users
  id, phone, name, password_hash, verified

     ↓ satu user punya banyak
     
notifications          chat_messages
  user_id (FK)           user_id (FK)
  trend_id (FK)          trend_id
  urgency, read          role, content

     ↑ notifikasi merujuk ke
     
trends
  id, name, category, growth, saturation
  phase, platform, window_hours
```

**FK = Foreign Key** — cara tabel saling terhubung. `user_id` di tabel notifications merujuk ke `id` di tabel users.

**Kenapa penting:** Kalau juri tanya "bagaimana kalian store data?" — ini jawabannya.

---

### SQL vs NoSQL — Kenapa Pilih PostgreSQL (via Supabase)

| | SQL (PostgreSQL) | NoSQL (MongoDB/Firebase) |
|---|---|---|
| Data terstruktur | ✅ Bagus | ⚠️ Fleksibel tapi bisa berantakan |
| Relasi antar data | ✅ Native (JOIN) | ⚠️ Manual |
| Konsistensi data | ✅ ACID compliant | ⚠️ Eventual consistency |
| Cocok untuk Nexo | ✅ Ya | Bisa, tapi kurang tepat |

**Nexo pilih PostgreSQL karena:** data punya relasi yang jelas (user → notifications → trends). SQL lebih tepat untuk data relasional.

---

## BAGIAN 5 — Konsep AI Integration

### Cara Kerja Azure OpenAI di Nexo

```
User kirim pesan: "Berapa modal untuk produk ini?"
         ↓
Backend kirim ke Azure OpenAI:
  - System prompt: "Kamu adalah Nexo, asisten UMKM..."
  - History: 10 pesan terakhir
  - User message: "Berapa modal untuk produk ini?"
         ↓
Azure OpenAI proses
         ↓
Response mengalir (streaming) ke backend
         ↓
Backend forward ke frontend via SSE
         ↓
User lihat teks muncul bertahap
```

### SSE vs WebSocket — Kenapa Nexo Pakai SSE

**SSE (Server-Sent Events):**
- Koneksi satu arah: server → client
- Lebih simpel, tidak butuh library tambahan
- Cocok untuk streaming teks (chat AI)

**WebSocket:**
- Koneksi dua arah: server ↔ client
- Lebih kompleks
- Cocok untuk chat real-time antar user, game, kolaborasi

**Kenapa Nexo pakai SSE:** Chat di Nexo adalah user tanya → AI jawab. Tidak ada komunikasi dua arah antar user. SSE lebih tepat dan lebih simpel.

---

### Fallback System — Kalau AI Down

```
Azure OpenAI tersedia?
    ├── Ya → Kirim ke Azure, stream response
    └── Tidak → Fallback ke smart response
                    ↓
              Cek keyword di pesan user:
              "modal" → jawab estimasi modal
              "kompetitor" → jawab analisis kompetitor
              "strategi" → jawab strategi marketing
              lainnya → jawab umum
```

**Cara jelaskan ke juri:**
> "Kami punya dua layer AI. Primary adalah Azure OpenAI untuk respons yang intelligent dan kontekstual. Fallback adalah rule-based system berbasis keyword yang tetap bisa jawab pertanyaan bisnis dasar. User tetap dapat respons meski Azure down."

---

## BAGIAN 6 — Konsep Frontend

### Kenapa React Pakai Komponen

Bayangkan kamu bangun rumah. Kamu tidak buat pintu dari nol setiap kali butuh pintu — kamu punya template pintu yang bisa dipakai berulang.

Di React, komponen adalah template itu:
```
TrendCard (komponen)
  ↓ dipakai di
  Dashboard (6 card)
  ViralProducts (12 card)
  NotificationPanel (preview)
```

Kalau ada bug di TrendCard, fix sekali, semua halaman ikut fix.

---

### Zustand — Kenapa Butuh State Management

**Masalah tanpa state management:**
```
Dashboard tahu user siapa
Navbar tahu user siapa
Settings tahu user siapa
→ Tiga komponen simpan data yang sama → tidak sync
```

**Dengan Zustand:**
```
authStore simpan data user
    ↓ semua komponen baca dari sini
Dashboard, Navbar, Settings → selalu sync
```

**Analogi:** Zustand seperti papan pengumuman kantor. Semua orang baca dari papan yang sama. Kalau ada update, semua langsung tahu.

---

### Lazy Loading — Kenapa Halaman Tidak Semua Dimuat Sekaligus

Kalau semua halaman dimuat saat pertama buka app:
- Load time lama
- User yang cuma buka Dashboard ikut download kode Settings

Dengan lazy loading:
- Hanya kode yang dibutuhkan yang didownload
- Dashboard buka cepat
- Settings baru didownload saat user klik Settings

**Di Nexo:** Semua halaman pakai `React.lazy()` — ini yang bikin app terasa cepat.

---

## BAGIAN 7 — Pertanyaan Juri & Jawaban Siap

### Pertanyaan Teknis yang Paling Sering Muncul

**"Bagaimana kalian handle keamanan?"**
> "Ada beberapa layer. Password di-hash dengan bcrypt sebelum disimpan — tidak bisa di-reverse. Autentikasi pakai JWT dengan expiry 7 hari. Semua endpoint yang butuh login dilindungi middleware verifyToken. Rate limiting mencegah spam OTP. Input di-sanitize dengan xss-clean untuk mencegah XSS attack."

**"Bagaimana sistem kalian scale kalau user banyak?"**
> "Database di Supabase yang sudah handle scaling otomatis. Backend Express bisa di-deploy ke multiple instance karena JWT stateless — tidak ada session yang perlu di-sync antar server. Untuk AI, Azure OpenAI sudah punya rate limiting dan auto-scaling dari sisi mereka."

**"Kenapa tidak pakai Next.js?"**
> "Untuk hackathon ini, kita pilih Vite + React karena lebih cepat untuk setup dan development. Next.js lebih cocok kalau butuh SSR untuk SEO — Nexo adalah dashboard yang butuh login, jadi SEO tidak relevan. Kalau scale ke production, migrasi ke Next.js bisa dilakukan tanpa ubah komponen React."

**"Data tren kalian dari mana?"**
> "Saat ini data tren masih seed data untuk demo. Arsitektur backend sudah dirancang untuk swap ke data real — trendController tinggal ganti query dari Supabase ke integrasi API marketplace. TikTok dan Shopee punya API untuk data produk trending, tapi butuh approval yang memakan waktu lebih dari durasi hackathon."

**"Apa yang paling kamu banggakan dari sistem ini?"**
> "Fallback system untuk AI. Banyak aplikasi AI yang langsung error kalau API down. Nexo tetap bisa jawab pertanyaan bisnis dasar meski Azure OpenAI tidak tersedia — user tidak sadar ada masalah di backend."

**"Apa kelemahan terbesar sistem kalian?"**
> "Jujur, data tren masih mock. Ini yang paling membatasi nilai bisnis saat ini. Tapi kami sengaja prioritaskan arsitektur yang solid dulu — lebih mudah swap data source daripada refactor arsitektur yang salah."

---

## BAGIAN 8 — Glossary Istilah Teknis

Istilah yang mungkin muncul saat tanya jawab dengan juri developer:

| Istilah | Artinya dalam Bahasa Manusia |
|---|---|
| **API** | Pintu masuk untuk berkomunikasi dengan sistem lain |
| **REST API** | Standar cara bikin API yang paling umum dipakai |
| **JWT** | Tiket digital yang membuktikan user sudah login |
| **bcrypt** | Alat untuk mengacak password supaya tidak bisa dibaca |
| **Middleware** | Kode yang jalan di antara request masuk dan response keluar |
| **ORM** | Cara bicara ke database pakai kode, bukan SQL langsung |
| **SSE** | Cara server kirim data ke browser secara real-time (satu arah) |
| **WebSocket** | Cara server dan browser saling kirim data real-time (dua arah) |
| **CORS** | Aturan keamanan browser — siapa yang boleh akses API kita |
| **Rate limiting** | Batasan berapa kali seseorang boleh request dalam waktu tertentu |
| **Hashing** | Mengubah data jadi kode acak yang tidak bisa dikembalikan |
| **Encryption** | Mengubah data jadi kode yang bisa dikembalikan dengan kunci |
| **Foreign Key** | Cara tabel database saling terhubung |
| **Migration** | Perubahan struktur database yang terdokumentasi |
| **Environment variable** | Konfigurasi rahasia yang tidak masuk ke kode (API key, dll) |
| **Lazy loading** | Muat kode hanya saat dibutuhkan, bukan semuanya sekaligus |
| **State management** | Cara menyimpan dan berbagi data antar komponen |
| **Hydration** | Proses React "menghidupkan" HTML statis menjadi interaktif |
| **SSR** | Halaman di-render di server, bukan di browser |
| **CSR** | Halaman di-render di browser (yang Nexo pakai) |
| **Bottleneck** | Titik paling lambat dalam sistem yang membatasi performa |
| **Scalability** | Kemampuan sistem untuk handle lebih banyak user/data |
| **Latency** | Waktu yang dibutuhkan dari request sampai response |
| **Throughput** | Berapa banyak request yang bisa dihandle per detik |

---

## BAGIAN 9 — Cara Presentasi ke Juri Developer

### Struktur yang Efektif (5 menit)

```
1. Problem (30 detik)
   "UMKM Indonesia sering terlambat masuk tren karena tidak ada 
   tools yang kasih sinyal awal sebelum pasar jenuh."

2. Solution (30 detik)
   "Nexo deteksi tren viral dari TikTok, Shopee, Instagram dan 
   kasih window opportunity sebelum kompetitor masuk."

3. Demo (2 menit)
   Tunjukkan: login → dashboard → klik tren → tanya AI → dapat rekomendasi

4. Arsitektur (1 menit)
   Tunjukkan diagram, jelaskan tiga layer dan kenapa pilih stack ini

5. Traction & Next Steps (1 menit)
   Apa yang sudah berjalan, apa yang belum, ke mana arahnya
```

### Tips Saat Tanya Jawab

- **Kalau tidak tahu:** "Itu pertanyaan yang bagus. Saat ini kami belum implement itu karena prioritas waktu, tapi arsitekturnya sudah memungkinkan untuk ditambahkan."
- **Kalau ditanya detail kode:** "Boleh saya tunjukkan langsung di kode?" — lalu navigasi ke file yang relevan
- **Kalau ada bug saat demo:** Jangan panik. "Ini yang kami temukan saat testing, sedang dalam proses fix." Juri lebih respect sama orang yang tahu ada bug daripada yang pura-pura tidak ada masalah.

---

## BAGIAN 10 — Checklist Persiapan Hackathon

```
TEKNIS
[ ] Aplikasi bisa jalan di laptop presentasi
[ ] Sudah test semua flow utama: register, login, lihat tren, chat AI
[ ] Punya backup kalau internet lambat (data offline/mock)
[ ] Screenshot/recording demo sebagai backup kalau live demo gagal

MATERI
[ ] Bisa jelaskan arsitektur dalam 1 menit tanpa lihat dokumen
[ ] Hafal 5 pertanyaan juri + jawabannya (Bagian 7)
[ ] Tahu di mana file-file utama di kode (server.js, authController, App.tsx)
[ ] Bisa navigasi kode kalau juri minta lihat implementasi

PRESENTASI
[ ] Slide atau diagram arsitektur sudah siap
[ ] Demo flow sudah dipraktikkan minimal 3x
[ ] Tahu berapa lama waktu presentasi dan sudah latihan sesuai durasi
[ ] Punya jawaban untuk "apa kelemahan sistem kalian?"
```

---

*Dokumen ini dibuat khusus untuk persiapan hackathon Nexo — 15 Mei 2026*  
*Fokus: pahami konsep dan alasan, bukan hafal syntax*
