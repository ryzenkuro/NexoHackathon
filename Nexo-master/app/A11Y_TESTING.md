# Nexo — Accessibility Testing Guide

> Checklist & tools untuk validate WCAG 2.2 compliance secara manual. Ada 2 test inti: **color contrast** dan **screen reader**.

## 🎯 Target

| Standar | Level | Target Score |
|---|---|---|
| WCAG 2.2 | **AA** | semua kriteria pass |
| Lighthouse | Accessibility | **≥ 90** |
| Color contrast | text body / large text | **≥ 4.5:1 / 3:1** |
| Touch target | UI control | **≥ 24×24 CSS px** |

---

## 🌈 Test 1 — Color Contrast (≈30 menit)

### Tools

| Tool | Cara install | Use case |
|---|---|---|
| **Chrome DevTools** built-in | sudah ada | Cek kontras inline saat hover element |
| **WCAG Color Contrast Checker** Chrome ext | [link](https://chrome.google.com/webstore/detail/wcag-color-contrast-check/plnahcmalebffmaghcpcmpaciebdhgdf) | Klik element, dapat ratio |
| **Stark** Figma + browser plugin | [getstark.co](https://www.getstark.co) | Audit batch, simulate color blindness |

### Step-by-step Chrome DevTools

1. Buka Nexo di Chrome → tekan `F12` (DevTools)
2. Klik tombol **"Inspect"** (panah kiri-atas), lalu hover ke text yang mau dicek
3. Di panel **"Styles"** scroll ke `color: ...` → klik kotak warna di kiri
4. Color picker muncul → ada bagian **"Contrast ratio"** otomatis
5. Indikator:
   - ✅ Hijau ≥ 4.5:1 (lulus AA normal text)
   - 🟡 Kuning ≥ 3:1 (lulus AA large text)
   - ❌ Merah < 3:1 (gagal)

### Checklist Spesifik Nexo

Cek satu-satu di setiap halaman, **mode terang dulu** lalu **dark mode**:

#### Light Mode

| Lokasi | Foreground | Background | Target |
|---|---|---|---|
| Body text di card | `text-navy-700` (#1B254B) | `bg-white` | ✅ 12.6:1 |
| Body text di card | `text-navy-900` (#0B1437) | `bg-white` | ✅ 16.5:1 |
| Helper text | `text-secondary-gray-500` (#A3AED0) | `bg-white` | 🟡 3.6:1 (marginal AA) |
| Disabled text | `text-secondary-gray-400` (#CBD5E0) | `bg-white` | ❌ 2.7:1 — sudah di-replace ke -500 |
| Saturation label "Aman" | `text-green-600` (#019155…) | `bg-white` | cek manual, harusnya ≥ 4.5:1 |
| Saturation label "Waspada" | `text-orange-600` (#E6A340) | `bg-white` | 🟡 cek — orange di white sering borderline |
| Saturation label "Hindari" | `text-red-600` (#D45246) | `bg-white` | ✅ |
| Button primary | `text-white` | `bg-primary` (#422AFB) | ✅ 8.7:1 |
| Link "Tanya Nexo" | `text-primary` | `bg-white` | ✅ 8.7:1 |

#### Dark Mode

| Lokasi | Foreground | Background | Target |
|---|---|---|---|
| Body text card | overrides ke `hsl(210 40% 96%)` | `hsl(222 47% 14%)` (card) | cek manual, target ≥ 7:1 |
| Helper text | overrides ke `hsl(215 20% 70%)` | dark card | cek manual |
| Saturation labels | warna asli | dark card | **risk: hijau-600 di dark = low contrast** |

### Action Items kalau Gagal

| Gejala | Fix |
|---|---|
| `text-secondary-gray-500` < 3:1 di dark | Naikkan ke `hsl(215 20% 80%)` di dark-mode.css |
| `text-green-600` < 3:1 di dark | Pakai `text-green-400` di dark mode (lebih cerah) |
| `text-orange-600` borderline di light | Pakai `text-orange-700` (lebih gelap) |

---

## 🔊 Test 2 — Screen Reader (≈1 jam)

### Tools

| OS | Screen Reader | Cara aktif |
|---|---|---|
| **macOS** | VoiceOver | `Cmd + F5` |
| **Windows** | NVDA (gratis) | Download di [nvaccess.org](https://www.nvaccess.org) |
| **Windows alt** | Narrator (built-in) | `Ctrl + Win + Enter` |
| **iOS** | VoiceOver | Settings > Accessibility > VoiceOver |
| **Android** | TalkBack | Settings > Accessibility > TalkBack |

### Quick Reference NVDA

| Action | Shortcut |
|---|---|
| Stop bicara | `Ctrl` |
| Lanjutkan | `Insert + Down` |
| Baca element berikutnya | `Down arrow` |
| Heading berikutnya | `H` |
| Link berikutnya | `K` |
| Button berikutnya | `B` |
| Form field berikutnya | `F` |
| Landmark berikutnya | `D` |

### Quick Reference VoiceOver

| Action | Shortcut |
|---|---|
| Aktif/non-aktif | `Cmd + F5` |
| Item berikutnya | `Ctrl + Option + Right` |
| Heading berikutnya | `Ctrl + Option + Cmd + H` |
| Rotor (menu nav) | `Ctrl + Option + U` |

### Checklist Spesifik Nexo

#### Login Flow
- [ ] Heading "Masuk ke Nexo" terbaca
- [ ] Field "Nomor WhatsApp" punya label terbaca
- [ ] Field "Password" punya label
- [ ] Tombol "Tampilkan/Sembunyikan password" punya aria-label terbaca
- [ ] Tombol "Masuk" terbaca, status saat loading
- [ ] Toast error/sukses terbaca otomatis
- [ ] Link "Daftar" / "Lupa password" jelas

#### Dashboard
- [ ] Welcome banner h2 terbaca
- [ ] 4 stat cards: label + nilai (e.g. "Total Tren Aktif: 12") terbaca berurutan
- [ ] Trend cards: heading + saturation label + window jam terbaca
- [ ] Tombol "Tanya Nexo" di featured card jelas

#### SaturationGuard
- [ ] Page title "Saturation Guard" terbaca
- [ ] Category selector buttons: nama produk terbaca
- [ ] Canvas gauge: aria-label "Saturation gauge: 33 dari 100, kategori Peluang Terbuka" terbaca
- [ ] Phase timeline: label "Emerging/Growing/Peak/Decay" terbaca
- [ ] Key Metrics card: label + nilai terbaca

#### Chatbot Panel
- [ ] Trigger "Tanya Nexo" terbaca
- [ ] Panel terbuka, focus pindah ke heading panel
- [ ] Sample prompts terbaca sebagai button
- [ ] Send button terbaca
- [ ] Streaming response terbaca progressively (aria-live)
- [ ] Tombol close terbaca

#### Notifications
- [ ] Notif badge di Sidebar/Navbar ada `aria-label` "Notifikasi, X belum dibaca"
- [ ] Buka panel notif, list item terbaca dengan urgency
- [ ] Tombol "Tandai semua dibaca" terbaca

#### Onboarding Tour
- [ ] Tooltip muncul, isi terbaca
- [ ] Tombol Next/Back/Skip terbaca
- [ ] ESC tutup tour

### Anti-pattern yang Harus Dihindari

| Pattern | Masalah | Fix |
|---|---|---|
| `<div onClick>` tanpa role | Tidak terdeteksi sebagai button | Pakai `<button>` atau add `role="button"` |
| Image dengan alt="" tapi informatif | Screen reader skip | Set alt yang descriptive |
| Form tanpa `<label>` | Field tidak punya nama | Wrap `<label>` atau pakai `aria-label` |
| Modal tidak trap focus | Tab keluar overlay | Add focus trap |
| Toast tanpa `role="status"` | Tidak announce | Pakai sonner (sudah handle) |
| Loading state cuma visual | SR diam | Add `aria-busy="true"` saat loading |

---

## 📱 Test 3 — Touch Target (≈30 menit)

### Tools

- **Chrome DevTools** → Toggle Device Toolbar (Cmd+Shift+M) → pilih iPhone SE (320px width)
- Atau real device

### Cara Ukur

1. Open DevTools di mobile view
2. Inspect element → lihat `Computed > width/height`
3. Bandingkan dengan target:
   - Minimum WCAG AA: **24×24 CSS px**
   - Recommended: **44×44 CSS px**
   - Apple HIG: 44×44pt
   - Android: 48×48dp

### Checklist Nexo

- [ ] **BottomNav icons** — 5 tabs, target tap area
- [ ] **Sidebar hamburger** (mobile) — top-left
- [ ] **Notif bell** di Navbar
- [ ] **Dark mode toggle** di Navbar
- [ ] **User avatar / logout** di Navbar
- [ ] **Modal close** button (X)
- [ ] **Modal prev/next arrows** ✅ sudah dinaikkan ke 36×36
- [ ] **Show/hide password** di Login form
- [ ] **Trash icon** di ChatbotPanel header
- [ ] **Send button** di chat input
- [ ] **Filter chips** di ViralProducts
- [ ] **Sort dropdown** di ViralProducts

### Apa yang Sudah Dinaikkan
- Modal close: `w-8 h-8` → `w-9 h-9` (36×36)
- Modal prev/next: `w-7 h-7` → `w-9 h-9` (36×36)

---

## 📊 Lighthouse Audit (Bonus)

### Cara Run

1. Buka Nexo di Chrome → DevTools → tab **"Lighthouse"**
2. **Mode**: Navigation, **Device**: Mobile
3. Categories: centang semua (Performance, Accessibility, Best Practices, SEO)
4. Klik **"Analyze page load"**

### Target Skor

| Category | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 70 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 90 |
| Best Practices | ≥ 90 | ≥ 90 |
| SEO | ≥ 90 | ≥ 95 |

### Common Issues yang Mungkin Ditemukan

| Issue | Fix |
|---|---|
| "Background and foreground colors do not have a sufficient contrast ratio" | Lihat Test 1 |
| "Image elements do not have explicit width and height" | Sudah di-fix di logo |
| "Links do not have a discernible name" | Cek aria-label |
| "Document does not have a meta description" | Sudah ada di index.html |
| "Server response times slow" | Bukan frontend issue, biarkan |

---

## ✅ Sign-off Checklist

Setelah semua test di atas, isi:

- [ ] Lighthouse Mobile Accessibility ≥ 90
- [ ] WCAG color contrast pass di semua text content (light + dark)
- [ ] Screen reader bisa navigate flow Login → Dashboard tanpa stuck
- [ ] Screen reader bisa interact dengan ChatbotPanel
- [ ] Touch target audit di iPhone SE 320px → semua minimum 24×24
- [ ] No keyboard trap (Tab loop dengan ESC selalu bisa)
- [ ] `prefers-reduced-motion` honored (test di OS settings)
- [ ] Browser zoom 200% — tidak ada layout break

---

## 📌 Rekap Issue yang Belum Otomatis Tertangani

| Item | Severity | Status |
|---|---|---|
| Saturation label warna kontras di dark mode | Medium | Manual cek |
| Touch target di Login form (show/hide password) | Medium | `p-1` mungkin kecil di mobile |
| Heading hierarchy konsisten | Low | ✅ sudah dinormalize |
| Focus trap di OnboardingTour | Low | Sebagian (Esc handler ada, Tab trap belum) |

Issue lain otomatis tertangani via:
- Helmet CSP, Cmd+K palette, NotifBadge konsistensi
- Helper `onActivateKey` Enter+Space
- Dark mode override `.dark .light-scope` exception
