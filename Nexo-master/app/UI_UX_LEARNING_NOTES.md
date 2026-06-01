# UI/UX Mastery Notes — Tingkat Principal
## Comprehensive Learning Material

**Disusun:** 15 Mei 2026  
**Sumber:** Riset langsung dari sumber primer (Nielsen Norman Group, Linear, Apple, W3C, Brad Frost, dll)  
**Untuk:** Persiapan Hackathon Nexo + Long-term mastery  
**Level:** Principal UI/UX Engineer

---

## 📖 Daftar Isi

**Bagian I — Foundational Theory**
1. Don Norman — 6 Principles of Interaction Design
2. Jakob Nielsen — 10 Usability Heuristics
3. 23 Laws of UX (Cognitive Psychology)

**Bagian II — Practical Tactics**
4. Refactoring UI — Tactical Tips
5. Atomic Design Methodology (Brad Frost)
6. Design Tokens System

**Bagian III — Modern Standards**
7. Linear Method — SaaS Modern
8. Apple HIG — Clarity, Deference, Depth
9. Material Design 3 — Tonal & Adaptive

**Bagian IV — Excellence Metrics**
10. WCAG 2.2 — Accessibility Standards
11. Core Web Vitals — Performance UX
12. Design QA Checklist

**Bagian V — Operational Mastery**
13. Design Critique Framework
14. User Research Methods
15. Hackathon-Specific Application

---

# BAGIAN I — FOUNDATIONAL THEORY

## 1️⃣ Don Norman — 6 Principles of Interaction Design

**Sumber:** *The Design of Everyday Things* (1988, revisi 2013) — [principles.design](https://principles.design/examples/don-norman-s-principles-of-design)  
**Status:** Foundational, dikutip di hampir semua kurikulum UX di dunia.

### 1.1 Visibility (Keterlihatan)
> User harus bisa melihat opsi yang tersedia tanpa perlu menebak.

**Anti-pattern:** Hidden menu, gesture-only navigation tanpa hint visual.

**Aplikasi Nexo:**
- ✅ Tombol "Tanya Nexo" terlihat jelas di setiap card
- ✅ Filter, sort, dan search visible di toolbar
- ⚠️ Bottom sheet/modal yang muncul tanpa indicator awal — perlu hint

### 1.2 Feedback (Umpan Balik)
> Setiap aksi user harus dapat respons jelas dalam 100ms.

**Skala feedback:**
- < 100ms: instant (tombol click)
- 100-300ms: smooth (transisi halaman)
- 300ms-1s: feedback visual (loading spinner)
- > 1s: progress indicator dengan ETA

**Aplikasi Nexo:**
- ✅ `btn-press` animation (instant feedback)
- ✅ Skeleton shimmer saat loading
- ⚠️ Beberapa fetch tidak punya loading state (notificationStore tidak tampil error UI)

### 1.3 Constraints (Batasan)
> Cegah user dari kesalahan dengan membatasi opsi.

**3 jenis constraint:**
- **Physical**: input numeric only untuk phone
- **Logical**: disable submit button kalau form invalid
- **Cultural**: warna merah = error, hijau = sukses

**Aplikasi Nexo:** Input phone numeric, OTP max 6 digit, password min 8 char.

### 1.4 Mapping (Pemetaan)
> Hubungan antara kontrol dan efeknya harus intuitif.

**Best practice:**
- Toggle dark mode → langsung ganti tema (direct mapping)
- Slider volume di kanan untuk tinggi, kiri untuk rendah (spatial mapping)

### 1.5 Consistency (Konsistensi)
> Element yang sama harus terlihat dan berperilaku sama.

**3 level konsistensi:**
- **Internal**: dalam app sendiri
- **External**: dengan platform (web/mobile conventions)
- **Metaphorical**: dengan konsep dunia nyata

### 1.6 Affordance (Petunjuk Aksi)
> Bentuk visual harus menunjukkan cara penggunaannya.

**Contoh:**
- Tombol terlihat "bisa ditekan" (shadow, padding)
- Link terlihat "bisa diklik" (color, underline saat hover)
- Card terlihat "bisa dibuka" (hover state, cursor pointer)

### 💡 Mental Model

> "Good design is invisible. Bad design demands attention."

Kalau user bertanya "ini gimana caranya?" — design gagal.

---

## 2️⃣ Jakob Nielsen — 10 Usability Heuristics

**Sumber:** Nielsen Norman Group (1994, masih relevan) — [nngroup.com/articles/ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics)  
**Status:** Framework paling banyak dipakai untuk evaluate usability.

### 2.1 Visibility of System Status
> Sistem harus selalu kasih tahu user apa yang sedang terjadi.

**Implementasi:**
- Loading indicator saat fetch
- Progress bar untuk multi-step
- Toast notification setelah aksi
- Breadcrumb untuk lokasi user

### 2.2 Match Between System and Real World
> Pakai bahasa user, bukan bahasa teknis.

**Anti-pattern:** "Error 401 Unauthorized"  
**Better:** "Sesi Anda telah berakhir. Silakan login kembali."

### 2.3 User Control and Freedom
> User harus bisa undo, redo, batalkan, escape.

**Implementasi wajib:**
- Tombol back/cancel di setiap step
- Confirmation untuk aksi destructive
- Auto-save untuk draft
- Undo dengan timer (Gmail style: "Email sent. Undo")

### 2.4 Consistency and Standards
> Ikuti konvensi platform.

**Konvensi yang harus diikuti:**
- Logo di pojok kiri atas → home
- Search di tengah/kanan navbar
- User menu di pojok kanan atas
- Submit button di kanan, cancel di kiri

### 2.5 Error Prevention
> Cegah error sebelum terjadi.

**Strategi:**
- Validation real-time (saat ngetik)
- Confirmation dialog untuk destructive action
- Disable invalid options
- Smart defaults

### 2.6 Recognition Rather Than Recall
> Tampilkan opsi, jangan minta user mengingat.

**Best practice:**
- Recent searches di search bar
- Autocomplete suggestions
- Visible navigation (bukan hidden menu)
- Breadcrumbs

### 2.7 Flexibility and Efficiency of Use
> Power user perlu shortcut, pemula perlu guidance.

**Implementasi:**
- Keyboard shortcuts (Cmd+K untuk search)
- Customizable workflows
- Saved filters/views
- Tetap simpel untuk first-time user

### 2.8 Aesthetic and Minimalist Design
> Setiap elemen tidak penting mengurangi visibility yang penting.

**Audit pertanyaan:**
- "Kalau elemen ini dihapus, ada masalah?" Jika tidak, hapus.
- "Berapa jumlah CTA per layar?" Idealnya 1-2 primary.

### 2.9 Help Users Recognize, Diagnose, and Recover from Errors
> Pesan error: jelas masalahnya, kasih solusi.

**Format ideal:**
```
[Apa yang salah]
[Kenapa terjadi]
[Apa yang user bisa lakukan]
```

**Contoh bagus:**
> "OTP yang Anda masukkan salah. Periksa kembali pesan WhatsApp atau klik 'Kirim ulang OTP'."

### 2.10 Help and Documentation
> Sediakan bantuan kontekstual.

**Tier dokumentasi:**
- **Tier 1**: Tooltip & inline help (paling sering dibutuhkan)
- **Tier 2**: Onboarding tour (untuk first-time)
- **Tier 3**: Knowledge base (untuk complex use case)

### 💡 Self-Audit Checklist

Sebelum demo, audit setiap halaman dengan 10 heuristic ini. Itu akan menangkap 70-80% masalah UX.

---

## 3️⃣ 23 Laws of UX — Cognitive Psychology

**Sumber:** [lawsofux.com](https://lawsofux.com) (kurasi Jon Yablonski)  
**Status:** Research-backed principles dari psikologi kognitif.

### 3.1 Hick's Law
> Waktu pengambilan keputusan meningkat seiring jumlah pilihan.

**Aplikasi:**
- Batasi opsi menu utama 5-7 item
- Progressive disclosure (tampilkan opsi advanced hanya saat dibutuhkan)
- Highlight rekomendasi untuk reduce decision fatigue

**Aplikasi Nexo:** Sidebar punya 4 menu utama + 2 secondary (notif, settings) — sudah optimal.

### 3.2 Fitts's Law
> Waktu mencapai target = fungsi jarak dan ukuran target.

**Implikasi:**
- Tombol penting harus besar (minimum 44×44px untuk touch)
- Tombol penting harus dekat dengan tangan/kursor
- Pojok layar punya "infinite size" (mudah dijangkau)

**Aplikasi Nexo:** Bottom nav bagus untuk thumb reach. Tapi beberapa tombol icon-only perlu dibesarkan.

### 3.3 Miller's Law
> Manusia bisa pegang 7±2 item dalam working memory.

**Aplikasi:**
- Chunking: kelompokkan info menjadi grup 5-9
- Phone number format: 0812-3456-7890 (3 chunks)
- Form panjang: pecah jadi multi-step

### 3.4 Jakob's Law
> User menghabiskan kebanyakan waktu di app lain. Mereka expect app kamu bekerja seperti yang sudah mereka kenal.

**Implikasi penting:** Jangan reinvent wheel. Pakai pattern yang sudah familiar.

**Aplikasi Nexo:** Login form pakai pattern Tokopedia/Shopee (phone-first) — sudah benar.

### 3.5 Tesler's Law (Conservation of Complexity)
> Setiap sistem punya complexity yang inherent. Pertanyaannya: siapa yang menanggung — user atau system?

**Best practice:** Sebanyak mungkin complexity ditangani system, sesimpel mungkin untuk user.

**Aplikasi Nexo:** Filter advance bisa di-handle backend, user tinggal pilih dari preset.

### 3.6 Doherty Threshold
> Productivity meningkat dramatis kalau response time < 400ms.

**Implikasi:**
- Optimistic UI updates (update UI dulu, sync ke backend)
- Prefetch data yang kemungkinan dibutuhkan
- Skeleton loading untuk perceived performance

### 3.7 Cognitive Load
> Manusia punya kapasitas terbatas untuk memproses informasi.

**3 jenis cognitive load:**
- **Intrinsic**: kompleksitas inherent dari task
- **Extraneous**: cara info disajikan (bisa dikurangi designer)
- **Germane**: effort untuk membentuk pemahaman

**Strategi mengurangi:**
- Visual hierarchy yang jelas
- Whitespace yang cukup
- Hindari distraction (popup berlebihan, animasi yang tidak perlu)

### 3.8 Aesthetic-Usability Effect
> User merasa app yang cantik lebih mudah digunakan, walaupun secara objektif tidak.

**Implikasi:** Visual polish bukan optional. Itu mempengaruhi perceived usability.

### 3.9 Peak-End Rule
> User mengingat experience berdasarkan dua momen: peak (paling intense) dan end.

**Aplikasi:**
- Bikin moment "wow" di tengah journey (animasi sukses, achievement)
- Pastikan ending positif (success state yang memorable)
- Untuk Nexo: setelah berhasil mendapat insight tren, ada moment celebration

### 3.10 Goal-Gradient Effect
> Motivasi meningkat saat mendekati goal.

**Aplikasi:**
- Progress bar di multi-step form
- Step indicator (login Nexo sudah pakai)
- "2 langkah lagi sebelum selesai!"

### 3.11 Zeigarnik Effect
> Task yang belum selesai dingat lebih lama.

**Aplikasi:**
- Tampilkan progress yang belum complete
- "Anda punya 3 produk yang belum direview"
- Notification yang remind unfinished action

### 3.12 Von Restorff Effect (Isolation Effect)
> Item yang terlihat berbeda akan diingat lebih baik.

**Aplikasi:**
- CTA primary harus stand out (color, size)
- Highlight informasi penting (urgency badge)
- Aplikasi Nexo: badge "Bisa Dijual" hijau di TrendingContent — sudah benar

### 3.13 Serial Position Effect
> Item pertama dan terakhir dalam list paling diingat.

**Aplikasi:**
- Item paling penting di awal/akhir
- Navigation: Home pertama, Settings terakhir
- Form: field paling penting di awal

### 3.14 Aesthetic Usability Effect
> User toleran dengan minor usability issue di app yang cantik.

**Catatan:** Ini bukan excuse untuk usability buruk. Ini reminder bahwa visual design penting.

### 3.15 Occam's Razor
> Solusi paling simpel biasanya yang terbaik.

**Aplikasi:**
- Hapus elemen yang tidak essential
- Satu CTA per screen
- Default workflow yang straightforward

### 3.16 KISS (Keep It Simple, Stupid)
> Kompleksitas adalah musuh adoption.

### 3.17 Pareto Principle (80/20)
> 80% user pakai 20% fitur. Optimasi untuk 20% fitur itu.

**Aplikasi Nexo:** Fitur paling sering dipakai — lihat tren, tanya AI. Optimasi ini, biarkan fitur lain biasa-biasa saja.

### 3.18 Parkinson's Law
> Task akan memakan waktu sebanyak yang disediakan.

**Implikasi:** Set deadline yang ketat untuk drive focus.

### 3.19 Postel's Law (Robustness Principle)
> Be liberal in what you accept, conservative in what you send.

**Aplikasi:**
- Accept input dengan format bervariasi (08xxx, +62 8xxx, 628xxx)
- Tampilkan output dengan format konsisten

### 3.20 Law of Proximity (Gestalt)
> Elemen yang berdekatan dianggap satu kelompok.

**Aplikasi:**
- Group related fields dengan spacing tighter
- Beri spacing besar antar grup
- Visual hierarchy via spacing

### 3.21 Law of Common Region (Gestalt)
> Elemen di dalam border/background yang sama dianggap satu grup.

**Aplikasi Nexo:** Card grouping informasi terkait dengan satu background.

### 3.22 Law of Similarity (Gestalt)
> Elemen yang mirip secara visual dianggap punya fungsi sama.

**Aplikasi:** Semua tombol primary pakai style sama. Semua link pakai color sama.

### 3.23 Law of Uniform Connectedness (Gestalt)
> Elemen yang terhubung secara visual dianggap lebih terkait.

**Aplikasi:** Garis penghubung di phase timeline (SaturationGuard) — menunjukkan progresi.

---

# BAGIAN II — PRACTICAL TACTICS

## 4️⃣ Refactoring UI — Steve Schoger & Adam Wathan

**Sumber:** [refactoringui.com](https://refactoringui.com)  
**Status:** Most actionable untuk developer.

### 4.1 Spacing System

**Problem:** Spacing acak (5px, 13px, 18px) bikin design "off".

**Solution:** Pakai spacing scale konsisten.
```
4, 8, 12, 16, 24, 32, 48, 64, 96, 128
```

Tailwind sudah punya scale ini built-in. Pakai `gap-2`, `gap-4`, `gap-6` — jangan pakai `gap-[5px]`.

### 4.2 Typography Hierarchy

**6-level scale:**
```
text-xs (12px)    — caption, label
text-sm (14px)    — body, metadata
text-base (16px)  — body utama
text-lg (18px)    — subheading
text-xl (20px)    — heading
text-2xl (24px)   — page title
text-3xl (30px)   — hero
```

**Weight strategy:**
- 400 (regular) — body text
- 500 (medium) — UI elements
- 600 (semibold) — emphasis
- 700 (bold) — heading

### 4.3 Color Strategy

**Avoid pure colors:**
- Pure black (#000): too harsh → pakai `#0B1437` (navy-ish)
- Pure white (#fff): too sterile → pakai `#FAFCFE` (slightly warm)
- Pure red: too aggressive → pakai `#EE5D50` (softer)

**Single hue with shades > multiple hues:**
- 9 shade indigo > indigo + purple + blue
- Menghasilkan visual coherence

### 4.4 Shadows Strategy

**Layered shadows untuk depth:**
```css
/* Subtle */
box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Card */
box-shadow: 0px 18px 40px 4px rgba(112, 144, 176, 0.08);

/* Elevated/Modal */
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1);
```

**Shadow color tip:** Tint dengan warna brand (Nexo pakai `rgba(112, 144, 176, 0.08)` — biru-abu, lebih natural dari hitam).

### 4.5 Don't Use Borders Everywhere

**Replace border with:**
- Background color difference
- Shadow
- Spacing

**Border budget:** Maximum 2-3 border per screen.

### 4.6 Empty States

**Bad:**
```
"No data found"
```

**Good:**
```
[Illustration]
"Belum ada notifikasi"
"Saya akan kasih tahu saat ada tren baru yang panas"
[Action: Set up alerts]
```

3 elemen wajib di empty state:
- Visual (ilustrasi/ikon besar)
- Pesan dengan personality
- Action yang bisa dilakukan

### 4.7 Real Content > Lorem Ipsum

Design dengan data realistis. Lorem ipsum menyembunyikan masalah:
- Text overflow
- Edge cases (nama panjang, angka besar)
- Empty states

### 4.8 Visual Hierarchy via Weight

**Not just size:**
```tsx
<h1>Lampu Tidur 3D Moon</h1>  // size 24, weight 700
<h2>Rp 125.000</h2>            // size 20, weight 600 — penting
<p>TikTok Shop</p>             // size 14, weight 400 — secondary
```

### 4.9 Image Treatment

**Best practices:**
- Aspect ratio konsisten (4:3 untuk produk, 16:9 untuk video)
- Lazy loading wajib
- `object-cover` (bukan `contain`) untuk produk
- Fallback image jika gagal load

### 4.10 Loading States

**3-tier loading:**
- **Optimistic**: update UI langsung, sync background (untuk action cepat)
- **Skeleton**: shimmer selama < 2s
- **Progress bar**: untuk operation > 2s dengan ETA

---

## 5️⃣ Atomic Design — Brad Frost

**Sumber:** [atomicdesign.bradfrost.com](https://atomicdesign.bradfrost.com)  
**Status:** Methodology paling banyak dipakai untuk design system.

### 5.1 5 Levels Hierarchy

```
Atoms      → Tombol, input, label
   ↓
Molecules  → Search bar (input + button)
   ↓
Organisms  → Header (logo + nav + search bar)
   ↓
Templates  → Layout halaman (placeholder)
   ↓
Pages      → Konten real di template
```

### 5.2 Aplikasi di Nexo

**Atoms:**
- `Button`, `Input`, `Badge`, `Icon`, `Avatar`

**Molecules:**
- `SearchBar` (input + ikon)
- `FormField` (label + input + error message)
- `StatCard` (icon + label + value)

**Organisms:**
- `Navbar` (logo + search + user menu)
- `Sidebar` (logo + menu list + bottom links)
- `TrendCard` (image + badge + content + actions)

**Templates:**
- `DashboardLayout` (sidebar + navbar + content area)
- `AuthLayout` (centered card)

**Pages:**
- `Dashboard` (real data dalam DashboardLayout)
- `LoginPage` (real form dalam AuthLayout)

### 5.3 Manfaat Methodology Ini

1. **Consistency** — atom yang sama dipakai di banyak tempat
2. **Reusability** — molecule bisa dipakai berulang
3. **Scalability** — tambah fitur tinggal kombinasi yang ada
4. **Maintainability** — update atom = update semua tempat

### 5.4 Catatan Penting

> Brad Frost sendiri bilang labels "atoms, molecules, organisms" tidak penting. Yang penting konsep **hierarchical composition** — nesting komponen kecil ke besar.

---

## 6️⃣ Design Tokens System

**Sumber:** Salesforce Lightning Design System, Tokens Studio  
**Status:** Standard industri untuk design system modern.

### 6.1 Apa Itu Design Tokens?

Variabel terpusat untuk visual attributes. Bukan hardcode `#422AFB`, tapi `--color-primary`.

### 6.2 3 Tier System (Best Practice)

**Tier 1 — Global tokens (Primitive):**
```css
--blue-500: #422AFB;
--gray-100: #F4F7FE;
--space-4: 16px;
```

**Tier 2 — Semantic tokens:**
```css
--color-primary: var(--blue-500);
--color-background: var(--gray-100);
--space-md: var(--space-4);
```

**Tier 3 — Component tokens:**
```css
--button-bg: var(--color-primary);
--card-padding: var(--space-md);
```

### 6.3 Manfaat 3-Tier

1. **Theming** — ganti dark mode tinggal swap Tier 2 tokens
2. **Brand variant** — multi-brand tinggal swap Tier 1
3. **Component customization** — Tier 3 fleksibel tanpa break system

### 6.4 Aplikasi di Nexo

Nexo sekarang sudah pakai pattern ini di `index.css`:
```css
:root {
  --primary: 248 95% 57%;
  --foreground: 222 47% 11%;
  --radius: 0.5rem;
}
```

Yang masih kurang:
- Tier 2 (semantic) belum eksplisit
- Spacing tokens belum centralized

---

# BAGIAN III — MODERN STANDARDS

## 7️⃣ Linear Method — SaaS Modern

**Sumber:** [linear.app/method](https://linear.app/method)  
**Status:** Benchmark UX SaaS 2020+.

### 7.1 8 Principles (Diparafrase)

**1. Build for the creators**  
Tools harus melayani end user, bukan generate report.

**2. Purpose-built**  
Software yang fokus mengalahkan yang serbaguna.

**3. Create momentum, don't sprint**  
Konsistensi mengalahkan burst.

**4. Aim for clarity**  
Bahasa simpel, hindari jargon.

**5. Say no to busy work**  
Otomasi pekerjaan administratif.

**6. Simple first, then powerful**  
Mulai simple, scale ke powerful.

**7. Decide and move on**  
Bikin keputusan, lanjut.

**8. Opinionated software**  
Software dengan opini > software netral.

### 7.2 Implementasi Konkret di Nexo

**Opinionated**: Nexo bilang "Aman masuk" atau "Hindari saat ini" — bukan "Pertimbangkan situasi pasar". Itu kekuatan.

**Purpose-built**: Fokus pada satu masalah (analisis tren UMKM). Jangan tergoda jadi all-in-one platform.

**Aim for clarity**: "Tren" bukan "trend signal indicator". "Modal" bukan "initial capital allocation".

---

## 8️⃣ Apple Human Interface Guidelines

**Sumber:** [developer.apple.com/design](https://developer.apple.com/design/)  
**Status:** Most polished design system di consumer tech.

### 8.1 Clarity

> Teks legible di setiap ukuran. Ikon precise. Adornment subtle dan tepat.

**Strategi:**
- Functional > decorative
- Setiap elemen punya purpose
- Hindari ornament untuk ornament's sake

### 8.2 Deference

> UI helps user understand and interact with content, but never competes with it.

**Strategi:**
- Konten sebagai protagonist
- UI sebagai supporting cast
- Translucency untuk hint, bukan dominasi

### 8.3 Depth

> Visual layers and realistic motion convey hierarchy.

**Strategi:**
- Z-index hierarchy yang jelas
- Modal di atas content
- Toast di atas modal
- Subtle parallax untuk depth

### 8.4 Aplikasi Spesifik untuk Web

Walaupun HIG untuk iOS, prinsipnya translatable:
- **Clarity**: Pilih font yang readable di setiap zoom level
- **Deference**: Hindari background pattern yang busy
- **Depth**: Shadow + transition untuk hierarchical feedback

---

## 9️⃣ Material Design 3 — Adaptive Tokens

**Sumber:** [m3.material.io](https://m3.material.io)  
**Status:** Google's design system, dipakai miliaran user.

### 9.1 Core Concepts

**Color System (HCT):**
- Hue, Chroma, Tone
- Lebih perceptually uniform dari HSL
- Auto-generate accessibility-compliant palettes

**Tonal Palettes:**
- 13 tonal stops per color
- Otomatis menjamin contrast ratio

**Adaptive Layouts:**
- Compact (< 600dp)
- Medium (600-840dp)
- Expanded (840+dp)

### 9.2 Yang Bisa Diadopsi

- Tonal scale (sudah dipakai di tailwind.config.js Nexo)
- Adaptive layout breakpoints
- Motion easing curves yang sudah teruji

### 9.3 Material Motion

**Easing curves:**
- `Standard`: untuk transition normal
- `Decelerated`: untuk masuk ke screen
- `Accelerated`: untuk keluar dari screen
- `Emphasized`: untuk hero animation

---

# BAGIAN IV — EXCELLENCE METRICS

## 🔟 WCAG 2.2 — Accessibility Standards

**Sumber:** [w3.org/WAI/standards-guidelines/wcag/new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)  
**Status:** Mandatory standard sejak Oct 2023, EU Accessibility Act sejak Jun 2025.

### 10.1 4 Principles (POUR)

**P — Perceivable**: Info harus bisa dipersepsi (tidak invisible)  
**O — Operable**: UI harus bisa dioperasi (mouse/keyboard/voice)  
**U — Understandable**: Info & UI harus mudah dipahami  
**R — Robust**: Konten harus robust untuk berbagai assistive tech

### 10.2 9 New Criteria di WCAG 2.2

**Level A:**
- 2.4.11 Focus Not Obscured (Minimum) — focus indicator tidak boleh ketutup
- 2.5.7 Dragging Movements — drag harus ada alternatif klik
- 2.5.8 Target Size (Minimum) — minimum 24×24 CSS pixels
- 3.2.6 Consistent Help — help selalu di tempat yang sama
- 3.3.7 Redundant Entry — jangan minta info yang sudah diisi
- 3.3.8 Accessible Authentication (Minimum) — tidak boleh require cognitive function test untuk login

**Level AA:**
- 2.4.12 Focus Not Obscured (Enhanced) — focus indicator harus fully visible
- 2.4.13 Focus Appearance — focus harus jelas terlihat
- 3.3.9 Accessible Authentication (Enhanced) — auth methods alternative

### 10.3 Contrast Requirements

| Type | Minimum | Enhanced |
|---|---|---|
| Normal text | 4.5:1 | 7:1 |
| Large text (18pt+) | 3:1 | 4.5:1 |
| UI components | 3:1 | — |
| Graphical objects | 3:1 | — |

**Tools cek:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools (built-in)

### 10.4 Audit Nexo dengan WCAG 2.2

| Item | Status |
|---|---|
| Touch target 24×24px minimum | ⚠️ Beberapa icon button kecil |
| Focus indicator visible | ⚠️ Tidak konsisten di semua elemen |
| Color contrast 4.5:1 | ❌ `text-secondary-gray-400` di white = 2.5:1 |
| Keyboard navigation | ✅ Sebagian besar OK |
| Alt text di images | ✅ Ada |
| Aria labels | ✅ Sebagian besar ada |
| Consistent help | ❌ Tidak ada help system |
| Redundant entry | ✅ N/A |

---

## 1️⃣1️⃣ Core Web Vitals — Performance UX

**Sumber:** Google Search Central  
**Status:** Mempengaruhi SEO ranking sejak 2021.

### 11.1 3 Metric Utama

**LCP (Largest Contentful Paint):**
- < 2.5s = Good
- Mengukur perceived loading speed

**INP (Interaction to Next Paint):**
- < 200ms = Good
- Mengganti FID sejak Mar 2024

**CLS (Cumulative Layout Shift):**
- < 0.1 = Good
- Mengukur visual stability

### 11.2 Dampak ke UX

User leave rate naik:
- 32% kalau load > 3s
- 90% kalau load > 5s
- 123% kalau load > 10s

### 11.3 Optimization Strategy

**LCP:**
- Lazy load images below fold
- Preload critical resources
- CDN untuk static assets
- Server-side render (kalau bisa)

**INP:**
- Code splitting (Nexo sudah pakai React.lazy)
- Debounce/throttle event handlers
- Web Workers untuk heavy computation

**CLS:**
- Set width/height pada images
- Reserve space untuk async content
- Avoid layout-shifting animations

---

## 1️⃣2️⃣ Design QA Checklist (Principal Level)

Comprehensive checklist sebelum ship.

### 12.1 Visual

```
[ ] Spacing konsisten (pakai scale)
[ ] Typography hierarchy clear
[ ] Color palette terbatas (1 hue + accent)
[ ] Shadow yang konsisten dengan brand
[ ] Border digunakan minimal
[ ] Icon konsisten (one library, one weight)
[ ] Image aspect ratio konsisten
[ ] Empty states designed
[ ] Error states designed
[ ] Loading states designed
[ ] Success states designed
```

### 12.2 Interaction

```
[ ] Hover state untuk semua interactive
[ ] Focus state visible & konsisten
[ ] Active state untuk feedback
[ ] Disabled state visually distinct
[ ] Loading state untuk async actions
[ ] Confirmation untuk destructive
[ ] Undo capability where appropriate
[ ] Keyboard navigation works
[ ] Tab order logical
[ ] ESC closes modals/panels
```

### 12.3 Content

```
[ ] Microcopy punya personality
[ ] Tidak ada lorem ipsum tersisa
[ ] Real numbers, bukan angka bulat
[ ] Tone konsisten (formal/casual)
[ ] No typos
[ ] Translation/i18n consistent
[ ] Help text contextual
```

### 12.4 Responsive

```
[ ] Tested di 320px (smallest mobile)
[ ] Tested di 768px (tablet)
[ ] Tested di 1024px (small desktop)
[ ] Tested di 1920px (large desktop)
[ ] Touch targets minimum 44×44px
[ ] No horizontal scroll
[ ] Modal responsive
[ ] Navigation responsive
```

### 12.5 Accessibility

```
[ ] Color contrast 4.5:1 minimum
[ ] Touch targets 24×24 minimum
[ ] Focus indicators visible
[ ] Keyboard navigation works
[ ] Screen reader tested
[ ] Alt text di images
[ ] Aria labels di interactive
[ ] Skip-to-content link
[ ] No color-only indicators
[ ] prefers-reduced-motion honored
```

### 12.6 Performance

```
[ ] LCP < 2.5s
[ ] INP < 200ms
[ ] CLS < 0.1
[ ] Bundle size < 200KB initial
[ ] Images optimized
[ ] Code splitting active
[ ] Font loading optimized
[ ] No render-blocking resources
```

### 12.7 Edge Cases

```
[ ] Long text truncation
[ ] Empty arrays handled
[ ] Network error handled
[ ] Offline mode handled
[ ] Slow connection tested
[ ] Stale data refresh
[ ] Concurrent user actions
[ ] Browser back/forward
```

---

# BAGIAN V — OPERATIONAL MASTERY

## 1️⃣3️⃣ Design Critique Framework

Cara melakukan critique yang konstruktif (untuk diri sendiri atau tim).

### 13.1 Framework "I Like, I Wish, What If"

Dari Stanford d.school:

**I Like** — apa yang sudah bagus  
**I Wish** — apa yang bisa diperbaiki  
**What If** — alternatif yang belum dieksplor

### 13.2 Critique Levels

**Level 1 — Visual:**
- Spacing, typography, color
- Easy to identify, easy to fix

**Level 2 — Interaction:**
- States, transitions, feedback
- Medium effort

**Level 3 — Information Architecture:**
- Navigation, hierarchy, flow
- Hard to fix once shipped

**Level 4 — Conceptual:**
- Mental model, value proposition
- Fundamental, expensive to change

**Aturan:** Selalu critique dari Level 4 ke Level 1, jangan kebalik.

### 13.3 Self-Critique Questions

Setelah selesai design:
1. Apakah user paham purpose dalam 5 detik?
2. Apa primary action di halaman ini?
3. Kalau saya hapus 30% elemen, apa yang hilang?
4. Apakah ini work untuk user yang tidak tech-savvy?
5. Apakah ini work tanpa internet stabil?

---

## 1️⃣4️⃣ User Research Methods

### 14.1 Spectrum dari Quick to Rigorous

**Tier 1 — Quick (1 jam):**
- 5-second test
- First-click test
- Hallway testing

**Tier 2 — Medium (1 hari):**
- Moderated usability testing (5 user)
- A/B test
- Heatmap analysis

**Tier 3 — Rigorous (1 minggu+):**
- Diary studies
- Contextual inquiry
- Card sorting

### 14.2 5-Second Test (Paling Cepat & Berguna)

**Cara:**
1. Tunjukkan halaman ke user 5 detik
2. Sembunyikan, lalu tanya: "Apa yang kamu lihat?"
3. Tanya: "Apa yang bisa kamu lakukan di halaman ini?"

**Yang dievaluasi:**
- Visual hierarchy
- First impression
- Value proposition clarity

### 14.3 Hallway Testing

Test dengan orang random (bukan target user) untuk:
- Catch obvious usability issues
- Test microcopy clarity
- First-time user confusion

### 14.4 Untuk Hackathon Nexo

**Minimum viable testing (1-2 jam):**
- 5-second test ke 3 orang awam
- 5-minute task: "Cari produk modal di bawah Rp 1 juta"
- Note semua momen confused

**Hasil = priority list** untuk fix sebelum demo.

---

## 1️⃣5️⃣ Hackathon-Specific Application

### 15.1 Apa yang Juri Cari (Beyond Visual)

**Juri developer melihat:**
- Code quality
- Architecture decisions
- Trade-offs justification

**Juri bisnis melihat:**
- Problem-solution fit
- Market opportunity
- Demo flow yang smooth

**Juri designer (kalau ada) melihat:**
- Design system maturity
- Attention to detail
- User-centric thinking

### 15.2 Demo Choreography

**Anti-pattern:** Klik random, jelaskan random.

**Pattern yang efektif:**
1. **Hook** (10 detik): "Bayangkan kamu UMKM yang..."
2. **Problem** (20 detik): show pain point
3. **Solution** (60 detik): show happy path
4. **Wow moment** (30 detik): unique feature
5. **Close** (20 detik): vision + ask

### 15.3 Detail yang Membedakan dari Tim Lain

**Polish detail yang sering dilewatkan kompetitor:**

| Detail | Effort | Impact |
|---|---|---|
| Custom favicon | 5 menit | Tinggi |
| Page title yang descriptive | 2 menit | Tinggi |
| `::selection` color custom | 5 menit | Medium |
| Loading state pertama kali (bukan blank) | 15 menit | Tinggi |
| Error boundary dengan recovery action | 20 menit | Tinggi |
| Empty states dengan CTA | 30 menit | Tinggi |
| Toast notifications dengan icon | 10 menit | Medium |
| Form validation real-time | 30 menit | Tinggi |
| Keyboard shortcut (Cmd+K) | 30 menit | Medium |
| Smooth scroll behavior | 5 menit | Low-Medium |

**Total time investment**: ~3-4 jam untuk semua. **ROI**: signifikan untuk perceived quality.

---

# 🎯 SINTESIS: Path to UI/UX Excellence

## Phase 1 — Foundation (Sebelum Design)

1. Pahami user (job-to-be-done)
2. Riset competitor (3 minimum)
3. Define principles (tone, density, color)
4. Setup design tokens
5. Create component library structure

## Phase 2 — Implementation (Saat Design)

1. Apply Atomic Design hierarchy
2. Use spacing scale konsisten
3. Type scale 6-level
4. Color palette dengan 9 shades
5. Empty/error/loading states sejak awal

## Phase 3 — Validation (Setelah Design)

1. Self-audit dengan 10 heuristics Nielsen
2. WCAG 2.2 compliance check
3. Core Web Vitals measurement
4. 5-second test dengan 3 user
5. Hallway test dengan 3 awam
6. Iterate based on findings

## Phase 4 — Polish (Sebelum Ship)

1. QA checklist 6 dimensions
2. Edge cases handling
3. Cross-browser testing
4. Performance optimization
5. Accessibility audit
6. Microcopy review

---

# 📚 MASTERY READING LIST

**Beginner → Intermediate (3 bulan):**
1. *The Design of Everyday Things* — Don Norman
2. *Don't Make Me Think* — Steve Krug
3. *Refactoring UI* — Adam Wathan & Steve Schoger
4. NN Group articles (free, ongoing)

**Intermediate → Advanced (6 bulan):**
5. *Laws of UX* — Jon Yablonski
6. *Atomic Design* — Brad Frost
7. *Hooked* — Nir Eyal
8. *About Face* — Alan Cooper

**Advanced → Principal (1+ tahun):**
9. *Articulating Design Decisions* — Tom Greever
10. *Designing Interfaces* — Jenifer Tidwell
11. *The Inmates Are Running the Asylum* — Alan Cooper
12. *Just Enough Research* — Erika Hall

---

# 🎓 PRINCIPAL-LEVEL MENTAL MODELS

Setelah menyerap semua di atas, ini mental model yang membedakan principal dari senior:

### 1. Trade-off Thinking
> "Tidak ada keputusan design tanpa trade-off. Tugas saya adalah membuat trade-off itu eksplisit."

### 2. Systems Thinking
> "Ini bukan satu screen. Ini bagian dari sistem yang akan tumbuh selama 5 tahun."

### 3. Constraint as Feature
> "Limitasi memaksa kreativitas. Tidak ada budget untuk fitur X = harus simpel = mungkin lebih baik."

### 4. User Empathy + Engineering Reality
> "User mau infinite scroll, tapi engineering biaya 3x. Solusi: pagination dengan UX yang feel seperti scroll."

### 5. Document Decisions
> "Future me/team perlu tahu kenapa, bukan cuma apa."

### 6. Disagree and Commit
> "Saya boleh tidak setuju. Tapi setelah keputusan dibuat, saya commit penuh."

### 7. Quality is Cumulative
> "100 detail kecil = product yang feel premium. Tidak ada shortcut."

---

## 🎬 Kata Penutup

> **"Saya bukan designer. Saya bukan developer. Saya pemecah masalah yang menggunakan design dan code sebagai tools."**

UI/UX bukan tentang membuat sesuatu yang cantik. Tentang membuat sesuatu yang **bekerja untuk manusia**.

Dengan dokumen ini, kamu sekarang punya foundation yang sama dengan principal UI/UX engineer di top tech companies. Yang membedakan dari sini adalah **practice dan iteration** — bukan menambah teori.

**Practice =** apply ke project nyata (Nexo).  
**Iteration =** review hasil, dapat feedback, perbaiki.  
**Repeat =** sampai instinct.

Kamu siap.

---

*Dokumen ini disusun pada 15 Mei 2026 berdasarkan riset langsung dari 15+ sumber primer. Total ~600 baris, mencakup foundational theory hingga operational mastery.*

*Konten diparafrase untuk compliance dengan licensing — silakan baca sumber asli untuk versi lengkap. Atribusi sumber tertera di setiap section.*

*Estimasi waktu untuk membaca penuh: 60-90 menit. Estimasi waktu untuk mengaplikasikan semua: 6-12 bulan dengan praktek konsisten.*
