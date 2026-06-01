# UI/UX untuk Hackathon — AI Impact Challenge
## Materi Pilihan dari UI_UX_LEARNING_NOTES.md

**Hackathon:** Microsoft Elevate Training Center — AI Impact Challenge  
**Link:** https://www.dicoding.com/challenges/971  
**Project:** Nexo (analisis tren UMKM)  
**Tanggal disusun:** 15 Mei 2026

---

## 🎯 Kenapa Dokumen Ini Ada

UI_UX_LEARNING_NOTES.md isinya 600+ baris, terlalu banyak untuk konsumsi cepat sebelum hackathon. Dokumen ini ekstrak yang **paling spesifik untuk menang di hackathon ini** berdasarkan:

1. Kriteria penilaian resmi dari Dicoding
2. Format kompetisi (proposal → workshop → presentation)
3. Konteks Nexo sebagai produk UMKM Indonesia

---

## 📋 Kriteria Penilaian Resmi (yang harus kamu kuasai)

| Kriteria | Bobot | Yang Dinilai |
|---|---|---|
| Inovasi dan Kebaruan | 25% | Solusi baru atau berbeda |
| **Desain dan Kemudahan Penggunaan** | **25%** | **UI quality + usability** |
| Pemanfaatan AI & Microsoft Azure | 30% | Ketepatan & efektivitas |
| Manfaat & Relevansi untuk Masyarakat | 20% | Dampak nyata |

**Insight kritis:** Desain dapat **25% bobot** — sama dengan inovasi, dan hampir setara dengan pemanfaatan AI (30%). Kalau kamu kuasai kategori ini, kamu sudah pegang ¼ skor total.

---

## 🎨 Yang Paling Penting untuk Bobot "Desain dan Kemudahan Penggunaan" (25%)

Diekstrak dari `UI_UX_LEARNING_NOTES.md` — dipilih yang **paling impactful untuk demo singkat di hadapan juri**.

### 1. Dari Don Norman — 3 Prinsip Wajib

**Visibility** — Juri akan menilai dalam 5 detik pertama. Pastikan:
- Tombol primary terlihat jelas (CTA besar, kontras tinggi)
- Filter & sort visible (bukan tersembunyi di menu)
- Status sistem selalu terlihat (loading, success, error)

**Feedback** — Setiap aksi harus dapat respons < 100ms:
- Tombol pakai `btn-press` (sudah ada di Nexo)
- Loading skeleton untuk async actions
- Toast notification setelah submit

**Consistency** — Pattern yang sama di semua halaman:
- Card layout sama di Dashboard, ViralProducts, Notifications
- Color saturation hijau/kuning/merah konsisten artinya
- Posisi tombol sama (close di kanan, action di bawah)

---

### 2. Dari Nielsen Heuristics — 5 yang Paling Critical untuk Demo

**#1 Visibility of System Status**
> Juri tidak boleh bingung "apakah sistem loading atau hang?"

**Action item:**
- Loading skeleton untuk semua fetch
- Streaming indicator untuk chat AI
- Toast feedback setelah aksi sukses/gagal

**#2 Match Between System and Real World**
> Pakai bahasa UMKM, bukan jargon teknis

**Action item:**
- "Kejenuhan pasar" bukan "saturation level"
- "Window peluang" bukan "opportunity window"
- "Aman masuk" / "Hindari saat ini" — sudah benar di Nexo

**#5 Error Prevention**
> Jangan biarkan juri bikin kesalahan saat demo

**Action item:**
- Validasi inline real-time di form
- Confirmation untuk destructive action (logout, hapus akun)
- Disable submit kalau form invalid

**#8 Aesthetic and Minimalist Design**
> Kurangi noise visual

**Action item:**
- 1 primary CTA per layar
- Hapus elemen yang tidak essential
- Whitespace cukup, jangan crowded

**#9 Help Users Recognize Errors**
> Error message yang manusiawi

**Action item:**
- Format: [Apa salah] + [Solusi konkret]
- Jangan tampilkan stack trace
- Bahasa Indonesia natural

---

### 3. Dari Refactoring UI — 7 Quick Wins (Bisa Dikerjain dalam 1 Hari)

| # | Tactic | Waktu | Dampak |
|---|---|---|---|
| 1 | Hindari pure black `#000` → pakai `#0B1437` | 5 menit | Premium feel |
| 2 | Pakai shadow tinted brand color, bukan abu-abu | 5 menit | Lebih konsisten |
| 3 | Hierarchy via font-weight, bukan size saja | 30 menit | Hirarki lebih kuat |
| 4 | Empty states dengan personality (ilustrasi + microcopy) | 1 jam | Memorable |
| 5 | Whitespace generous, hindari crowded | 30 menit | Premium feel |
| 6 | Real numbers (bukan bulat-bulat: Rp 1.000.000) | 15 menit | Less AI-feel |
| 7 | Ganti `text-[10px]` ke `text-xs` (12px minimum) | 20 menit | Accessibility + readable |

---

### 4. Dari 23 Laws of UX — 5 yang Wajib Diterapkan

**Hick's Law** — Batasi opsi
- Sidebar Nexo ≤ 6 menu utama (sudah)
- Filter ≤ 5 opsi visible, sisanya di "More"

**Fitts's Law** — Tombol penting harus besar dan dekat
- CTA primary minimum 44×44px
- Bottom nav untuk mobile (sudah ada)

**Doherty Threshold** — Response < 400ms
- Optimistic UI updates
- Skeleton untuk perceived performance

**Aesthetic-Usability Effect** — Cantik = perceived sebagai usable
- Polish visual sebelum demo
- 1 jam polish > 1 jam fitur baru

**Peak-End Rule** — Bikin moment "wow" di tengah dan akhir
- Animasi sukses setelah login berhasil
- Visualisasi gauge yang impressive di SaturationGuard
- Closing demo: kembali ke dashboard dengan summary impressive

---

## 🛠 7 Critical Bugs yang Harus Difix Sebelum Demo

Diekstrak dari `FRONTEND_READINESS_ANALYSIS.md` — **wajib** difix:

| # | Bug | Severity | Dimana |
|---|---|---|---|
| 1 | Konflik dark mode (Toaster vs manual toggle) | 🔴 Blocker | App.tsx + main.tsx |
| 2 | `scaleYUp` keyframe missing (chart broken) | 🔴 High | animations.css |
| 3 | App.css boilerplate Vite konflik layout | 🔴 High | App.css |
| 4 | localStorage manual + Zustand persist (duplikasi) | 🟠 High | App.tsx |
| 5 | Mock notification injection di App.tsx | 🟠 High | App.tsx |
| 6 | `User` type tidak punya `id` field | 🟠 High | types.ts |
| 7 | `text-[10px]` di 12+ tempat (a11y issue) | 🟠 High | Banyak file |

**Total fix time:** 2-3 jam dengan AI bantuan.

---

## 🎬 Strategi Demo (Untuk Presentation Day - 18 Juni 2026)

### Format Penyampaian (10 Tim Finalis Online)

Berdasarkan info hackathon, presentasi online dengan pitching ke juri.

### Struktur Demo 5 Menit

**0:00-0:30 — Hook (30 detik)**
> "Bayangkan kamu UMKM Indonesia. Setiap tren viral di TikTok itu peluang emas, tapi kalau telat masuk, pasar sudah jenuh dan kompetitor banyak. Itulah yang Nexo selesaikan."

Tunjukkan: Statistik UMKM Indonesia + masalah keterlambatan masuk tren.

**0:30-1:00 — Solusi (30 detik)**
> "Nexo adalah AI assistant yang kasih sinyal awal tren produk + window opportunity sebelum pasar jenuh."

Tunjukkan: Logo, tagline, 1 screenshot dashboard.

**1:00-3:00 — Demo Live (2 menit)**

Flow yang harus disiapkan:
```
1. Login (10 detik) — phone + password, smooth
2. Dashboard (20 detik) — fokus ke "Tren Paling Panas"
3. Klik trend → ProductDetailModal (20 detik) — tunjukkan data
4. Tanya Nexo (40 detik) — chat streaming yang impressive
5. SaturationGuard (30 detik) — gauge animation sebagai "wow moment"
```

**3:00-4:00 — Highlight Teknologi AI + Azure (1 menit)**

Wajib karena bobot 30%:
- "Pakai Azure OpenAI GPT-4o-mini untuk reasoning"
- "Streaming via SSE untuk pengalaman real-time"
- "Fallback system kalau Azure down — tetap bisa jawab pertanyaan dasar"

Tunjukkan: Architecture diagram singkat.

**4:00-4:30 — Manfaat untuk Masyarakat (30 detik)**

Wajib karena bobot 20%:
- Target: 64 juta UMKM Indonesia
- Hemat modal karena tidak masuk pasar yang sudah jenuh
- Demokratisasi data tren yang biasanya hanya untuk perusahaan besar

**4:30-5:00 — Closing (30 detik)**
- Vision: "Nexo akan jadi platform analytics standar untuk UMKM Indonesia"
- Roadmap singkat
- "Pertanyaan?"

---

### Demo Choreography Tips

**Persiapan Sebelum Demo:**
- ✅ Prefil data login (jangan ngetik phone+password live)
- ✅ Cache data tren (jangan loading live di depan juri)
- ✅ Screen recording sebagai backup (kalau live demo gagal)
- ✅ 2 device sebagai backup
- ✅ Kabel charger ready

**Saat Demo:**
- ✅ Klik dengan **purpose**, bukan random
- ✅ Narasi tiap step ("Sekarang saya tanya tentang modal...")
- ✅ Diam sejenak di moment "wow"
- ✅ Kalau ada bug: jangan panik, "ini yang kami temukan saat testing, sedang difix"

---

## 🏅 Polish Detail yang Membedakan dari Kompetitor

7 detail kecil yang juri biasa perhatikan tapi tim lain sering lupa:

| Detail | Effort | Impact | Sudah Ada di Nexo? |
|---|---|---|---|
| Custom favicon | 5 menit | Tinggi | ❌ Belum |
| Page title yang descriptive | 2 menit | Tinggi | ⚠️ Generic ("Trendly Nexo") |
| `::selection` color custom | 5 menit | Medium | ❌ Belum |
| Loading state pertama (bukan blank) | 15 menit | Tinggi | ✅ Ada (skeleton) |
| Error boundary dengan recovery | 20 menit | Tinggi | ✅ Ada |
| Empty states dengan CTA | 30 menit | Tinggi | ⚠️ Sebagian generic |
| Toast notifications dengan icon | 10 menit | Medium | ✅ Ada |
| Form validation real-time | 30 menit | Tinggi | ✅ Ada |
| Keyboard shortcut (Cmd+K) | 30 menit | Medium | ❌ Belum |
| Smooth scroll behavior | 5 menit | Low-Medium | ❌ Belum |

**Total fix time:** ~2 jam untuk yang belum ada.

---

## 🎯 Self-Audit Checklist Sebelum Submit Proposal

```
Visual Quality (Bobot 25% - Desain)
[ ] 1 primary CTA per halaman (jelas)
[ ] Spacing konsisten (Tailwind scale)
[ ] Color palette terbatas (1 hue + accent)
[ ] Typography hierarchy clear (size + weight)
[ ] Empty/error/loading states designed
[ ] Tested di mobile + desktop
[ ] Dark mode bekerja konsisten
[ ] Tidak ada `text-[10px]` (minimum 12px)
[ ] Kontras WCAG AA (4.5:1 untuk text)
[ ] Custom favicon + page title

Usability (Bobot 25% - Kemudahan Penggunaan)
[ ] Visibility: aksi terlihat dalam 5 detik
[ ] Feedback: setiap aksi punya respons
[ ] Consistency: pattern sama di semua halaman
[ ] Error prevention: validasi inline
[ ] User control: tombol back/cancel ada
[ ] Recognition: tidak perlu mengingat
[ ] Help: tooltip untuk istilah teknis

AI Integration (Bobot 30%)
[ ] Azure OpenAI terintegrasi & berfungsi
[ ] Streaming response (perceived performance)
[ ] Fallback saat Azure down
[ ] Documentation tentang AI usage
[ ] Demo AI flow yang impressive

Impact (Bobot 20%)
[ ] Problem statement jelas (UMKM Indonesia)
[ ] Solution mengatasi masalah real
[ ] Roadmap & vision jelas
[ ] Data/research mendukung claim

Innovation (Bobot 25%)
[ ] USP jelas vs kompetitor
[ ] Feature unique (fallback AI, dll)
[ ] Pendekatan baru untuk masalah lama
```

---

## 🚀 Action Plan: 5 Hari Sebelum Demo

Asumsi: ada 5 hari kerja sebelum Presentation Day (18 Juni 2026).

### Hari 1 — Critical Bug Fix (8 jam)
- ✅ Fix 7 critical bugs dari list di atas
- ✅ Lighthouse audit + fix yang kritis
- ✅ Test di 3 browser (Chrome, Safari, Firefox)

### Hari 2 — Polish & Detail (8 jam)
- ✅ Implementasi 7 quick wins dari Refactoring UI
- ✅ Polish 10 detail kecil yang membedakan
- ✅ Empty states dengan personality
- ✅ Microcopy review (UMKM-friendly)

### Hari 3 — User Testing (8 jam)
- ✅ 5-second test ke 3 orang
- ✅ Hallway test ke 3 orang awam
- ✅ Fix issues yang ditemukan
- ✅ Final accessibility audit

### Hari 4 — Demo Preparation (8 jam)
- ✅ Buat slide presentasi (max 10 slide)
- ✅ Practice demo flow 5x minimum
- ✅ Record backup demo video
- ✅ Prepare Q&A jawaban (lihat HACKATHON_STUDY_GUIDE.md)

### Hari 5 — Final Run-through (8 jam)
- ✅ Full dress rehearsal pagi
- ✅ Test semua device & koneksi
- ✅ Backup semua file ke cloud
- ✅ Istirahat siang
- ✅ Light review malam — jangan ubah apa-apa

---

## 💡 3 Aturan Emas untuk Hackathon Ini

### 1. Polish > Features
> 3 fitur yang polished mengalahkan 10 fitur yang setengah jadi.

Setelah Fase 0 selesai, **STOP nambah fitur baru**. Polish yang sudah ada.

### 2. Story > Demo
> Juri lebih ingat **cerita** daripada teknologi.

"UMKM Dina hampir bangkrut karena masuk tren yang sudah jenuh. Nexo bisa kasih sinyal lebih awal." → ini lebih impactful daripada "kami pakai GPT-4o-mini dengan streaming SSE."

### 3. Confident > Perfect
> Juri prefer presenter yang confident dengan limitasi yang jujur, daripada presenter yang gugup tapi klaim sempurna.

Kalau ada bug: **akui dengan jujur**. "Ini yang kami temukan saat testing, akan difix di iterasi berikutnya."

---

## 📚 Referensi yang Wajib Dibaca Sebelum Demo

Dari `UI_UX_LEARNING_NOTES.md`:

**Wajib baca (1 jam total):**
- Bagian 2: Nielsen Heuristics (10 menit)
- Bagian 4: Refactoring UI tactics (15 menit)
- Bagian 12: Design QA Checklist (20 menit)
- Bagian 15: Hackathon-Specific Application (15 menit)

**Sangat disarankan (30 menit):**
- Bagian 3: 23 Laws of UX (skim)
- Bagian 10: WCAG 2.2 (skim)

**Skip dulu, baca setelah hackathon:**
- Bagian 5: Atomic Design (untuk long-term)
- Bagian 6: Design Tokens (untuk long-term)
- Bagian 8-9: Apple HIG & Material 3 (referensi)

---

## 🎓 Kalimat Sakti untuk Q&A Juri

Pertanyaan juri yang kemungkinan muncul + jawaban siap:

**Q: "Kenapa UI seperti ini?"**
> "Kami follow Nielsen's Heuristics, terutama #4 Consistency dan #8 Minimalist Design. Setiap card pattern sama di semua halaman, dan kami sengaja batasi 1 primary CTA per layar untuk reduce cognitive load — ini sesuai Hick's Law."

**Q: "Bagaimana memastikan accessibility?"**
> "Kami target WCAG 2.2 Level AA. Contrast ratio minimum 4.5:1, focus indicator visible, semantic HTML dengan ARIA labels. Belum sempurna, tapi sudah menutup 80% kriteria utama."

**Q: "Kenapa pakai design pattern Tokopedia?"**
> "Jakob's Law — user UMKM Indonesia sudah familiar dengan pattern Tokopedia/Shopee. Reinvent wheel akan menambah cognitive load yang tidak perlu."

**Q: "Apa kelemahan UI kalian?"**
> "Dark mode masih perlu polish karena pakai approach lama yang tidak scalable. Sudah ada plan migrasi ke next-themes. Plus beberapa komponen mobile masih perlu refinement untuk layar < 360px."

**Q: "Kenapa pilih color indigo?"**
> "Indigo memberi feel premium sesuai posisi Nexo sebagai 'tools profesional untuk UMKM serius'. Kami sengaja hindari hijau/merah yang terlalu generic untuk fintech, dan kuning/oranye yang terlalu casual."

---

## ✨ Penutup

UI bagus tidak menjamin menang hackathon. Tapi UI buruk hampir pasti membuat kalah.

Untuk hackathon ini, target realistic:
- **80-85/100** UI quality = sangat kompetitif untuk top 3
- **95+/100** = butuh tim designer profesional, tidak realistis dalam waktu hackathon

Fokus ke 25% yang dinilai juri, bukan 100% yang sempurna.

**Yang membuat tim menang biasanya bukan UI paling cantik — tapi UI yang clean + story yang clear + AI integration yang make sense + delivery yang confident.**

Semua bahan untuk itu sudah ada di tangan kamu. Tinggal eksekusi.

Selamat berkompetisi 🚀

---

*Dokumen ini ekstrak dari UI_UX_LEARNING_NOTES.md, disesuaikan dengan kriteria penilaian AI Impact Challenge dari Microsoft Elevate Training Center.*  
*Estimasi reading time: 15-20 menit. Reference time saat polishing: ongoing.*
