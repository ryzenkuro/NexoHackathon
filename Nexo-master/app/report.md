# Nexo — Audit Report

**Tanggal:** 16 Mei 2026  
**Update terakhir:** 16 Mei 2026 (Batch 1+2+3 selesai dieksekusi)
**Scope:** Frontend (`app/src/**`) + Backend (`app/backend/src/**`) + Config (`app/{vite,tailwind,postcss,eslint}.config.*`, `app/index.html`, `app/public/*`, `app/.env`)
**Metodologi:** Grep berbasis pattern + manual review file kunci. Tidak menjalankan kode.
**Status:** ✅ **3 batch prioritas tinggi selesai** (16 finding di-fix). Sisa 35 finding masih tertunda — lihat tabel akhir.

---

## 📊 Ringkasan Eksekutif

| Kategori | High | Medium | Low | Total |
|---|---:|---:|---:|---:|
| Compatibility (Tailwind v3 vs v4) | **6** | 4 | 2 | 12 |
| Security | **3** | 2 | 1 | 6 |
| Tech debt | 2 | **5** | 4 | 11 |
| Inkonsistensi UI | 0 | **4** | 3 | 7 |
| Performance | 1 | 3 | 2 | 6 |
| Accessibility | 0 | 3 | 2 | 5 |
| Visual bug | 1 | 2 | 1 | 4 |
| **Total** | **13** | **23** | **15** | **51** |

**Top 3 prioritas (kerjain dulu):**
1. **Tailwind v4 utilities di shadcn/ui** — banyak komponen yang akan render salah saat dipakai (root cause yang sudah kita fix di `command.tsx` ada di 30+ tempat lain).
2. **`JWT_SECRET` fallback hardcoded** di `lib/jwt.js` — kalau `.env` lupa di-load, JWT pakai string yang sama untuk semua orang.
3. **`xss-clean` deprecated** + dipasang tapi tidak dipakai di `server.js` — security theatre.

---

## 1. Compatibility (Tailwind v3 vs v4)

> **Konteks:** Project pakai `tailwindcss@3.4.19`, tapi banyak komponen di `src/components/ui/*` di-copy dari template Tailwind v4 (shadcn UI versi terbaru). Class v4-only tidak ter-resolve di v3 → fallback ke browser default atau CSS rule hilang.

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `src/components/ui/tooltip.tsx` | 35, 55 | `outline-hidden`, `animate-in fade-in-0 zoom-in-95`, `data-[state=closed]:animate-out` | **HIGH** | Tooltip kelihatan, tapi animasi enter/exit kemungkinan tidak smooth. Ganti ke `animate-fade-in` / `animate-zoom-in` dari `tw-animate-css` plugin yang sudah terinstall, atau update ke Tailwind v4. |
| `src/components/ui/command.tsx` | 53 | `**:data-[slot=command-input-wrapper]:h-12` (deep descendant selector v4) | **HIGH** | Sudah kita fix sebagian (input outline). Selector ini mungkin tidak apply → input wrapper tidak punya height yang benar. Ganti ke `[&_[data-slot=command-input-wrapper]]:h-12`. |
| `src/components/ui/sheet.tsx` | 73 | `outline-hidden`, `rounded-xs` | **HIGH** | Close button focus ring bakal pakai browser default (hitam). Sama dengan kasus Cmd+K. Ganti ke `outline-none focus-visible:ring-2`. |
| `src/components/ui/select.tsx` | 38, 110 | `outline-hidden`, `*:data-[slot=select-value]:line-clamp-1`, `[&_svg:not([class*='size-'])]:size-4` | **HIGH** | Dropdown trigger focus ring hitam, value tidak truncate dengan benar. Refactor ke v3-equivalent. |
| `src/components/ui/dropdown-menu.tsx` | 75, 93, 129, 212 | `outline-hidden` di tiap menu item | **HIGH** | Setiap item dropdown menu fokus = browser outline hitam. Ganti ke `outline-none focus-visible:ring-2 focus-visible:ring-primary/40`. |
| `src/components/ui/sidebar.tsx` | 408, 429, 477, 564, 689 | 5x `outline-hidden` + `text-sidebar-foreground/70` (alpha syntax v4) | **HIGH** | Sidebar shadcn tidak dipakai sekarang (Nexo punya `Sidebar.tsx` custom), tapi kalau import nanti akan rusak. **Rekomendasi: hapus file** `ui/sidebar.tsx` jika tidak ada plan pakai. |
| `src/components/ui/textarea.tsx` | 10 | `field-sizing-content`, `shadow-xs`, `ring-[3px]`, `aria-invalid:*` | MED | `field-sizing-content` Browser CSS baru, browser support belum lengkap. Tetap fallback OK. `shadow-xs` tidak ada di v3 (v3 punya `shadow-sm`). |
| `src/components/ui/switch.tsx` | 16 | `shadow-xs`, `ring-[3px]`, alpha syntax `bg-input/80` | MED | Toggle tidak punya shadow halus. Ganti `shadow-xs` → `shadow-sm`. |
| `src/components/ui/toggle.tsx` | 8, 14 | `shadow-xs`, `ring-[3px]`, `aria-invalid:ring-destructive/20` | MED | Sama dengan switch. |
| `src/components/ui/tabs.tsx` | 45 | `focus-visible:outline-ring` (kelas v4-only) | MED | Tab trigger focus state hilang. Ganti ke `focus-visible:ring-2 focus-visible:ring-primary/40`. |
| `src/components/ui/menubar.tsx` | 56, 104, 122, 147 | 4x `outline-hidden`, `rounded-xs` | LOW | Menubar tidak dipakai sekarang. Hapus jika tidak akan dipakai. |
| `src/components/ui/navigation-menu.tsx` | 94 | `**:data-[slot=...]:focus:ring-0` deep child v4 | LOW | Tidak dipakai. Hapus. |

**Saran systemic:**
- Tambah utility custom `outline-hidden`, `shadow-xs`, dan `rounded-xs` di `index.css` `@layer utilities` untuk drop-in compat (sudah dilakukan untuk `outline-hidden`).
- Audit `src/components/ui/*` (53 file) — banyak yang belum pernah di-import. Hapus yang tidak dipakai untuk mengurangi noise & bundle size potensial.
- Long-term: upgrade ke Tailwind v4 (perlu PostCSS plugin `@tailwindcss/postcss`, refactor `tailwind.config.js` ke `@theme` directive di CSS).

---

## 2. Security

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `backend/src/lib/jwt.js` | 3 | `const SECRET = process.env.JWT_SECRET ‖ 'dev-only-fallback-secret-change-me'` — fallback **hardcoded** | **HIGH** | Kalau `.env` tidak ke-load (deployment baru, salah path), backend tetap jalan tapi sign JWT pakai string statis yang ada di public repo. Penyerang bisa forge token. **Throw error** saat `JWT_SECRET` tidak ada, jangan fallback. |
| `backend/package.json` | 21 | `xss-clean@^0.1.4` — package **deprecated** sejak 2022, npm warning saat install | **HIGH** | Hapus dari dependency. Untuk sanitasi input, pakai input validation per route (Zod / Joi) atau library aktif seperti `express-validator`. Saat ini tidak di-import di `server.js` jadi cuma noise. |
| `backend/src/server.js` | 24-27 | `helmet({ contentSecurityPolicy: false })` — CSP **disabled** | **HIGH** | Untuk production, aktifkan CSP minimal: `default-src 'self'; img-src 'self' https://picsum.photos https://*.supabase.co; connect-src 'self' http://localhost:3001 https://*.supabase.co https://*.openai.azure.com`. |
| `backend/src/controllers/authController.js` | 142, 316 | `console.log` OTP code di stdout untuk dev | MED | Di production, OTP tidak boleh sampai ke log (secret). Tambah guard `if (process.env.NODE_ENV !== 'production')` sebelum `console.log`. |
| `backend/src/server.js` | 29-32 | CORS hanya allow 1 origin via `FRONTEND_URL` | MED | Saat deploy ke Azure, kalau Static Web App URL berubah atau ada custom domain, perlu setup `[origin1, origin2]` array atau function. Sekarang OK untuk dev. |
| `backend/src/controllers/chatController.js` | 30 | `userId = 'anonymous'` default — semua user tanpa login share quota global | LOW | Setelah `verifyToken` middleware diaplikasikan ke `/api/chat`, ambil `req.user.id` sebagai key, jangan trust client-supplied `userId`. |

---

## 3. Tech debt (TODO, FIXME, mock data, dead code)

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `backend/src/controllers/authController.js` | 142, 316 | `// TODO: Send OTP via WhatsApp API (Fonnte / Twilio)` (2x) | HIGH | Kerjakan saat masuk Bagian 1.2 di `handsonweb.md`. Konfirmasi: skip untuk demo (OTP via console). |
| `backend/src/controllers/notificationController.js` | 9-39 | Hard-coded `mockNotifications` array, **tidak terhubung Supabase** | HIGH | Refactor ke Supabase (sesuai kesepakatan, ditunda). Status: known. |
| `backend/src/controllers/chatController.js` | 14-15 | `chatHistory` & `dailyCounts` in-memory `Map` — hilang saat restart | MED | Migrate ke Supabase `chat_messages` table (sudah ada di schema). Status: known. |
| `backend/src/controllers/chatController.js` | 18-24 | `setInterval` reset midnight pakai `getHours() === 0 && getMinutes() === 0` — race window 1 menit, **tidak akurat di timezone server** | MED | Ganti pakai check `lastResetDate` saat `streamChat`, atau pakai cron library. Atau biarkan, tunggu Supabase migration (timestamp filter `created_at > today`). |
| `src/mockData.ts` | 1-411 | 411 baris mock data — masih di-import di 6 file frontend | MED | Sudah dibahas. Status: ditunda sampai backend ready. Biarkan tapi beri header comment "DEPRECATED — DO NOT EXPAND". |
| `src/mockData.ts` | 369-411 | `chatbotResponses` Record — **tidak pernah di-import** (dead code) | MED | `grepSearch chatbotResponses` → 0 reference. Hapus. |
| `backend/src/controllers/notificationController.js` | 1-4 | `import { readFileSync } from 'fs'` — tidak dipakai | LOW | Hapus import (dead). |
| `backend/src/controllers/trendController.js` | (sebelumnya) | `import { readFileSync }` — sudah dihapus saat refactor | ✅ | Resolved. |
| `backend/package.json` | 21 | `xss-clean` dipasang tapi tidak di-import di `server.js` | LOW | Hapus dari `dependencies`. |
| `src/components/ui/*` | — | 53 komponen shadcn, banyak yang **tidak pernah di-import** (sidebar, menubar, navigation-menu, drawer, carousel, chart, calendar, dll) | LOW | `grep` cek mana yang dipakai → sisanya hapus. Mengurangi noise audit + bundle size potensial. |
| `app/scripts/generate-favicons.mjs` | — | Belum di-review apakah pernah dipakai. Output favicon sudah ada di `public/`. | LOW | Konfirmasi: sudah jalan sekali. Bisa keep sebagai dokumentasi. |

---

## 4. Inkonsistensi UI

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `index.html` (16) vs `tailwind.config.js` (15) vs `public/site.webmanifest` (17) | — | `theme-color` **tidak konsisten**: HTML `#6366f1` (indigo Tailwind default), Tailwind `primary` `#422AFB` (Nexo brand), manifest `#6366f1` | MED | Pilih satu — saran pakai Nexo brand `#422AFB` di semua tempat. Browser top bar (mobile) pakai `theme-color`, jadi user lihat warna Nexo asli, bukan indigo generic. |
| `src/components/Sidebar.tsx` | 102 | Notif badge: `w-4 h-4 text-[9px]` (arbitrary) | MED | Setelah audit `text-[10px]` kemarin, **masih ada `text-[9px]` tertinggal**. Ganti ke `text-xs` (sama dengan Navbar+BottomNav). Tapi 9px terlalu kecil untuk a11y, naikkan ke `text-xs` = 12px. |
| `src/components/layout/BottomNav.tsx` | 70 | Notif badge: `w-3.5 h-3.5 text-[7px]` | MED | `text-[7px]` sangat kecil — gagal WCAG 2.5.5 (target size). Naikkan ke `w-4 h-4 text-xs` agar konsisten dengan Sidebar+Navbar. |
| Notif badge ukuran berbeda di 3 tempat | — | Navbar `w-[18px] h-[18px] text-xs`, Sidebar `w-4 h-4 text-[9px]`, BottomNav `w-3.5 h-3.5 text-[7px]` | MED | Standardisasi ke 1 ukuran (saran: `w-[18px] h-[18px] text-xs`). Buat komponen `<NotifBadge count={n} />` reusable. |
| Button primary di Dashboard (`Tanya Nexo`) vs Sidebar menu active vs LoginPage submit | — | Semua pakai `bg-primary` tapi padding & rounded variasi: `py-2.5 rounded-xl` (Dashboard) vs `py-3 rounded-xl` (Modal) vs `py-3.5 rounded-xl` (Settings logout) | LOW | Bukan critical, biarkan. Future: bikin variant `<Button intent="primary" size="md/lg" />`. |
| Empty state ikon ukuran beda | NotificationsPage `size={28}` vs NotificationPanel `size={24}` vs ViralProducts `size={32}` | LOW | Konsisten ke 1 size (saran 24-28). |
| Heading size inconsistent: `text-xl` (SaturationGuard h2), `text-lg` (Dashboard h2), `text-2xl` (SettingsPage h1) | — | LOW | Audit `<h1/h2/h3>` size matrix di seluruh page. Saran h1=2xl, h2=xl, h3=base. |

---

## 5. Performance

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `dist/assets/index-*.js` | bundle | **717 KB** (gzip 208 KB) — Vite warn `>500 KB` | HIGH | 53 file `ui/*` di-resolve sebelum tree-shaking. Saran (ranked by impact): (1) hapus yang tidak dipakai, (2) `manualChunks` di `vite.config.ts` split `react-vendor`, `radix`, `recharts`, (3) lazy-load chart-heavy `SaturationGuard` (sudah di-lazy ✓). |
| `src/main.tsx` | — | `ThemeProvider` wrap di main, tapi `Toaster` & `TooltipProvider` re-render tiap App update | MED | Sudah optimal, biarkan. |
| `src/components/CommandPalette.tsx` | 1 | Import seluruh `@/stores` (auth+trend) walau cuma butuh 2 store | MED | Sudah destructure dengan benar, store sub yang tidak dipakai tidak trigger re-render (Zustand selector). OK. |
| `src/pages/Dashboard.tsx` | useMemo deps | `useMemo(() => trends.slice(0, 6), [trends])` — fine. `featuredTrend` reduce O(n) saat trends update — fine untuk n=12. | LOW | OK. |
| `src/components/ChatbotPanel.tsx` | 75-83 | `useEffect` set textarea height tiap input change — direct DOM manipulation | LOW | OK untuk auto-resize textarea pattern. |
| `backend/src/controllers/chatController.js` | 18-24 | `setInterval(..., 60_000)` jalan terus walau tidak ada user — minor | LOW | OK, 1 menit tick tidak signifikan. |

---

## 6. Accessibility

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `src/components/layout/BottomNav.tsx` | 70 | Notif badge `text-[7px]` — tidak terbaca, gagal WCAG 1.4.4 (resize text) | MED | Naikkan ke `text-xs`. Dibahas juga di kategori UI. |
| `src/pages/Dashboard.tsx` | 132-134 | `role="button"` + `onKeyDown={(e) => e.key === 'Enter' && ...}` — **tidak handle `Space` key** | MED | Element dengan role=button harus handle Enter **dan** Space. Ganti ke `<button>` real (lebih simple) atau tambah `e.key === ' '`. Pattern yang sama ada di `ViralProducts.tsx` (142), `NotificationsPage.tsx` (96, 137), `NotificationPanel.tsx` (74), `TrendingContent.tsx` (66). |
| `src/components/OnboardingTour.tsx` | 113-179 | Tour overlay tidak trap focus — user bisa Tab keluar overlay & nyangkut di element belakang | MED | Add focus trap (loop Tab dalam tooltip), atau tutup overlay saat focus loss. |
| `src/pages/SaturationGuard.tsx` | 215-219 | `<canvas role="img" aria-label="...">` ✓ tapi data tabel di chart "Kompetitor Density" cuma di tooltip — screen reader user tidak bisa baca | LOW | Tambah `<table className="sr-only">` dengan data 7 hari, atau `aria-describedby` ke heading. |
| Color contrast | `text-secondary-gray-400` (`#CBD5E0` di tailwind config) di atas `bg-white` | LOW | Kontras ratio ≈ 2.7:1, **gagal WCAG AA (4.5:1)**. Dipakai sebagai placeholder/helper text (e.g. ChatbotPanel hint). Naikkan ke `secondary-gray-500` (`#A3AED0` ≈ 3.6:1, masih marginal) atau `secondary-gray-700` (`#707EAE` ≈ 5.4:1 ✓). |

---

## 7. Visual bug

| File | Line | Masalah | Severity | Rekomendasi |
|---|---|---|---|---|
| `src/components/ui/*` (banyak) | — | `outline-hidden` (Tailwind v4) → focus ring **hitam browser default** muncul | HIGH | Kategori 1 (Compatibility) di atas. Sudah fix di `command.tsx`, tapi 30+ tempat lain belum. |
| Dark mode | `src/styles/dark-mode.css` | Variable di-set, tapi class fixed seperti `bg-white`, `text-navy-900` di komponen tidak ikut switch | MED | Test dark mode end-to-end → halaman tetap putih karena semua komponen pakai literal `bg-white`. **Action:** pakai semantic `bg-card`/`text-foreground` di semua page, bukan `bg-white`/`text-navy-900` literal. Effort 2-3 jam, cocok dilakukan saat 4.4 microcopy pass. |
| `src/pages/SaturationGuard.tsx` | 290 | Phase timeline progress line `transition: 'none'` — animasi pakai rAF saja. Kalau rAF di-skip (tab inactive), bar stuck di posisi lama. | MED | Tambah fallback `transition: width 200ms ease-out` saat tab inactive (`document.hidden`). Atau biarkan, edge case kecil. |
| `src/components/Sidebar.tsx` | 60 | Sidebar mobile pakai `z-50`, navbar `z-40` — saat sidebar buka di mobile, **navbar logo + menu hamburger tetap visible di atas overlay** karena hamburger button `z-[60]` | LOW | Cek di mobile view — kalau mengganggu, naikkan z-index sidebar ke `z-[55]`. Saat ini overlay click handler di z-[55], jadi click outside sidebar tidak menutup. |

---

## 🎯 Rekomendasi Prioritas Eksekusi

### Sekarang (preventif, blocker UI)
1. **Tailwind v4 utilities sweep** (kategori 1) — fix `outline-hidden` di semua `ui/*` file dengan `outline-none focus-visible:ring-2`. Estimasi: 30 menit dengan global replace + spot check.
2. **Hapus dead `chatbotResponses`** (kategori 3) — 5 menit.
3. **Standardisasi notif badge** (kategori 4) — bikin `<NotifBadge>`, ganti di 3 tempat. 15 menit.

### Sebelum Deploy (security)
4. **JWT_SECRET throw error** kalau missing (kategori 2). 3 menit.
5. **Hapus `xss-clean`** dari `package.json` (kategori 2 + 3). 1 menit.
6. **Aktifkan CSP helmet** dengan whitelist Supabase + Azure (kategori 2). 10 menit.
7. **Guard `console.log` OTP** dengan `NODE_ENV !== 'production'` (kategori 2). 2 menit.

### Future (saat ada waktu)
8. **Audit & hapus shadcn/ui yang tidak dipakai** — bundle size win.
9. **Dark mode end-to-end** — banyak literal color di Page yang tidak switch.
10. **Focus trap di OnboardingTour** — accessibility win.
11. **Migrasi `notificationController` & `chatController` ke Supabase** — kesepakatan ditunda, masuk Fase 4.

---

## 📌 Catatan Methodologi

- **Tidak include:** unit test coverage, runtime profiling (Lighthouse), real-device testing — tunggu Bagian 5 di `handsonweb.md`.
- **False positive risk:** beberapa class Tailwind v4 mungkin **tidak terlihat efeknya** di v3 karena komponen tidak pernah di-render (ui/* dead code). Saat dipakai baru kelihatan rusak.
- **Confidence level per kategori:**
  - Compatibility: **HIGH** (cek `tailwind.config.js` + grep utility, deterministik)
  - Security: **HIGH** (pattern matching, manual review)
  - Tech debt: **HIGH** (literal grep TODO/FIXME/import)
  - UI inkonsistensi: **MED** (subjektif, butuh designer review)
  - Performance: **MED** (bundle size objektif, tapi tidak profile runtime)
  - A11y: **MED** (heuristic, butuh real test dengan screen reader)
  - Visual bug: **MED** (sebagian assumption dari class analysis, belum runtime cek)

Bilang aja "fix kategori X" atau "fix item nomor Y" — saya eksekusi.

---

## ✅ Status Eksekusi (16 Mei 2026)

### Batch 1 — Quick wins (dilakukan)
- [x] Hapus `xss-clean` dari `package.json` + `npm uninstall`
- [x] `JWT_SECRET` fail-fast di `lib/jwt.js` (load env di module sendiri agar robust thd import order)
- [x] Guard `console.log` OTP dengan `NODE_ENV !== 'production'` (2 lokasi)
- [x] Theme color konsisten `#422AFB` (Nexo brand) di `index.html` + `site.webmanifest`
- [x] Hapus `chatbotResponses` dead code di `mockData.ts` (~3.4 KB)
- [x] Bersihkan dead imports di `notificationController.js` (`readFileSync`, `__filename`, `__dirname`)

### Batch 2 — Tailwind v4 sweep (dilakukan)
- [x] Replace `outline-hidden` → `outline-none focus-visible:ring-2 focus-visible:ring-primary/40` di 28 occurrence × 13 file `ui/*`
- [x] `<NotifBadge>` reusable component, dipasang di Sidebar/Navbar/BottomNav (3 inkonsistensi → 1)

### Batch 3 — A11y polish (dilakukan)
- [x] Helper `onActivateKey()` di `lib/utils.ts` — Enter+Space support
- [x] Apply ke 7 `role="button"` div: Dashboard×2, ViralProducts, NotificationsPage×2, NotificationPanel, TrendingContent
- [x] Keyboard navigation di `OnboardingTour`: Esc tutup tour, ←/→ navigasi step

### Verifikasi
- [x] Frontend `npm run build` lulus, 1827 modules
- [x] Backend smoke auth (register → OTP → verify → login → wrong-password 401 → logout) lulus
- [x] No TypeScript diagnostics

### Sisa Finding (belum di-fix)
- **High (5):** `notificationController` & `chatController` belum migrasi Supabase, helmet CSP belum diaktifkan, bundle 718KB perlu manual chunks
- **Medium (~16):** dark mode literal color audit, focus trap detail, color contrast `secondary-gray-400`, dead `ui/*` components, dll.
- **Low (~14):** kosmetik & nice-to-have

Detail di tabel utama di atas.
