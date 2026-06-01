# Nexo Fullstack Roadmap — Dari 0 ke Mahir

> Roadmap belajar **fullstack web developer** yang dipetakan langsung ke tech stack project Nexo.
> Tujuan akhir: kamu bisa rebuild app ini (atau yang setara) **dari nol**, paham *kenapa*-nya, bukan cuma copy-paste.
>
> Cara pakai: kerjakan **berurutan**. Tiap fase ada **target output** dan **link materi**. Jangan lompat fase kalau target output belum kepegang.

---

## Tech Stack Nexo (yang akan kamu kuasai)

**Frontend**
- React 19 + TypeScript
- Vite (bundler)
- Tailwind CSS + tailwind-merge + tailwindcss-animate
- Radix UI primitives + shadcn/ui pattern (`components/ui`)
- Zustand (state management)
- React Router 7 (`react-router-dom`)
- React Hook Form + Zod (forms + validation)
- Axios (HTTP client)
- Recharts (charts), Lucide (icons), Sonner (toast), cmdk (command palette), date-fns

**Backend**
- Node.js + Express 4 (ES Modules, `"type": "module"`)
- Supabase (PostgreSQL + Auth + RLS)
- JWT (jsonwebtoken) + bcryptjs
- Helmet + CORS + express-rate-limit (security)
- dotenv (env config)
- Azure OpenAI (`@azure/openai`) — streaming via SSE
- Fonnte (WhatsApp OTP via REST)

**Tooling**
- Git + GitHub
- ESLint (flat config) + TypeScript ESLint
- PostCSS + Autoprefixer
- VS Code / Kiro

---

## Peta Perjalanan (10 Fase)

```
Fase 0  ── Fondasi: cara web bekerja, terminal, Git
Fase 1  ── HTML + CSS + JS murni
Fase 2  ── JavaScript modern (ES2020+) & async
Fase 3  ── TypeScript dasar → menengah
Fase 4  ── React fundamentals
Fase 5  ── React lanjutan: Router, state, forms, data fetching
Fase 6  ── Styling: Tailwind + Radix + shadcn pattern
Fase 7  ── Backend: Node + Express + REST API
Fase 8  ── Database: SQL + Supabase + auth & RLS
Fase 9  ── Integrasi AI (Azure OpenAI + SSE) + WhatsApp OTP
Fase 10 ── Production: testing, deploy, observability
```

Estimasi total: **3–6 bulan** kalau konsisten 1–2 jam/hari. Bisa lebih cepat kalau full-time.

---

## FASE 0 — Fondasi (1 minggu)

### Yang harus paham
1. **Cara web bekerja**: DNS → HTTP request → server → response → browser render.
2. **Client vs Server** (sudah ada penjelasan singkat di `HACKATHON_STUDY_GUIDE.md` Bagian 1).
3. **Terminal dasar**: `cd`, `ls`/`dir`, `mkdir`, `rm`, pipe `|`.
4. **Git & GitHub**: `init`, `add`, `commit`, `push`, `branch`, `merge`, `pull request`.
5. **VS Code / Kiro**: split editor, integrated terminal, extensions.

### Materi
- MDN — *How the web works*: <https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work>
- The Odin Foundations — Prerequisites + Git: <https://www.theodinproject.com/paths/foundations/courses/foundations>
- Pro Git book (gratis): <https://git-scm.com/book/en/v2>
- freeCodeCamp Git crash course (YouTube): <https://www.youtube.com/watch?v=RGOj5yH7evk>

### Target output
- [ ] Punya akun GitHub + repo pertama
- [ ] Bisa clone, edit, commit, push tanpa lihat catatan
- [ ] Paham perbedaan staged vs committed vs pushed

---

## FASE 1 — HTML + CSS + JavaScript Murni (2 minggu)

### Yang harus paham
- **HTML semantik**: `<header>`, `<main>`, `<nav>`, `<button>`, form elements, ARIA dasar (penting untuk a11y, lihat `A11Y_TESTING.md` di project).
- **CSS dasar**: box model, Flexbox, Grid, position, responsive (`@media`), variables (`--color-primary`).
- **JS murni**: variabel (`const`/`let`), function, array methods (`map`, `filter`, `reduce`), object, DOM (`querySelector`, `addEventListener`).

### Materi
- MDN HTML: <https://developer.mozilla.org/en-US/docs/Learn/HTML>
- MDN CSS: <https://developer.mozilla.org/en-US/docs/Learn/CSS>
- Flexbox Froggy (game): <https://flexboxfroggy.com/>
- Grid Garden (game): <https://cssgridgarden.com/>
- JavaScript.info (sangat lengkap): <https://javascript.info/>
- The Odin Project — *Foundations* (HTML/CSS/JS): <https://www.theodinproject.com/paths/foundations/courses/foundations>

### Latihan
- Bikin landing page statis 1 halaman dengan layout responsive (mirip section "info" di `app/info.md`).
- Bikin todo list pakai vanilla JS (DOM manipulation murni, tanpa framework).

### Target output
- [ ] Bisa bikin layout dashboard sederhana pakai Flexbox + Grid
- [ ] Tahu kapan pakai `class` vs `id`, `div` vs semantic tag
- [ ] Bisa fetch API publik (mis. JSONPlaceholder) dan tampilkan datanya

---

## FASE 2 — JavaScript Modern + Async (2 minggu)

### Yang harus paham
- ES Modules (`import`/`export`) — Nexo pakai `"type": "module"` di `package.json`.
- Destructuring, spread/rest, optional chaining (`?.`), nullish coalescing (`??`).
- **Promise + async/await**, error handling dengan `try/catch`.
- **Fetch API** dan baca response JSON.
- Closures, `this`, arrow function vs regular function.

### Materi
- JavaScript.info — bagian Promises, async/await: <https://javascript.info/async>
- MDN — Using Fetch: <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch>
- *You Don't Know JS Yet* (Kyle Simpson, gratis di GitHub): <https://github.com/getify/You-Dont-Know-JS>

### Latihan
- Konsumsi REST API publik (TheMovieDB, OpenWeather, dsb), tampilkan list dengan loading & error state.
- Buat fungsi `debounce` dan `throttle` sendiri.

### Target output
- [ ] Paham kenapa `async/await` lebih readable daripada `.then()` chain
- [ ] Bisa handle error network dan tampilkan ke user
- [ ] Tahu beda `fetch` vs `axios` (Nexo pakai axios di frontend)

---

## FASE 3 — TypeScript (1–2 minggu)

### Yang harus paham
- Type primitives, `interface` vs `type`, union (`|`), intersection (`&`).
- Generics (penting untuk hook/util reusable).
- Utility types: `Partial`, `Pick`, `Omit`, `Record`.
- Narrowing (`typeof`, `in`, discriminated union).
- Konfigurasi `tsconfig.json` (Nexo punya 3 file: root, app, node).

### Materi
- TypeScript Handbook (resmi): <https://www.typescriptlang.org/docs/handbook/intro.html>
- *Total TypeScript* — Beginner's Tutorial (gratis): <https://www.totaltypescript.com/tutorials/beginners-typescript>
- Type Challenges (latihan): <https://github.com/type-challenges/type-challenges>

### Latihan
- Refactor todo list dari Fase 1 ke TypeScript.
- Buat type-safe API client kecil pakai `axios` + generics.

### Target output
- [ ] Bisa baca `app/src/types.ts` dan paham semua type yang ada
- [ ] Tahu kapan pakai `interface` vs `type` alias
- [ ] Bisa baca error TS tanpa panik

---

## FASE 4 — React Fundamentals (3–4 minggu)

### Yang harus paham
- JSX, komponen functional, **props**, children.
- **Hooks inti**: `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`.
- Conditional rendering, list + `key`, lifting state up.
- Controlled vs uncontrolled input.
- Aturan hooks (jangan dalam `if`/loop).
- Vite sebagai bundler (kenapa lebih cepat dari CRA).

### Materi
- React Docs resmi (versi baru, sangat bagus): <https://react.dev/learn>
- *React Tutorial* by Bob Ziroll (Scrimba, free): <https://scrimba.com/learn/learnreact>
- Vite docs: <https://vitejs.dev/guide/>

### Latihan
- Rebuild komponen `StatCard.tsx` dari scratch.
- Bikin `TrendCard` mini: terima props `{ name, growth, saturation }`, render badge berdasarkan saturation.

### Target output
- [ ] Paham kenapa state harus immutable (`setState(prev => ...)`)
- [ ] Tahu kapan butuh `useMemo`/`useCallback` (jawab: jarang banget di awal)
- [ ] Bisa baca `app/src/pages/Dashboard.tsx` dan jelaskan flow render-nya

---

## FASE 5 — React Lanjutan (3–4 minggu)

### 5a. Routing
- React Router v7 (Nexo pakai `react-router-dom@7`)
- Nested routes, `<Outlet />`, `useNavigate`, `useParams`, route guards.
- Lazy routes dengan `React.lazy` + `<Suspense>` (lihat `app/src/App.tsx`).

Materi: <https://reactrouter.com/en/main/start/tutorial>

### 5b. State management — Zustand
- Kenapa butuh state global (lihat Bagian 6 di `HACKATHON_STUDY_GUIDE.md`).
- Pattern: store per domain (`authStore`, `chatStore`, `notificationStore`, `trendStore` — sudah ada di project kamu).
- Selector untuk avoid re-render.
- Persist middleware (untuk simpan token/preference).

Materi:
- Zustand docs: <https://docs.pmnd.rs/zustand/getting-started/introduction>
- *TkDodo's blog — Working with Zustand*: <https://tkdodo.eu/blog/working-with-zustand>

### 5c. Forms
- React Hook Form + Zod resolver (Nexo punya `@hookform/resolvers` + `zod`).
- Pattern: schema Zod jadi single source of truth untuk validation.

Materi:
- RHF: <https://react-hook-form.com/get-started>
- Zod: <https://zod.dev>
- Tutorial RHF + Zod: <https://www.youtube.com/watch?v=u6PQ5xZAv7Q>

### 5d. Data fetching
- Pakai `axios` dengan interceptor untuk attach JWT.
- Loading/error/empty state pattern.
- (Opsional, advanced) TanStack Query untuk cache server state. Nexo belum pakai, tapi worth dipelajari.

### 5e. Code splitting & performance
- `React.lazy`, dynamic import.
- Kenapa Nexo split per-page (lihat `App.tsx`).

### Target output
- [ ] Bisa setup project React + TS + Router + Zustand dari nol dalam <30 menit
- [ ] Bisa bikin form login pakai RHF + Zod yang mirror `LoginPage.tsx`
- [ ] Paham kenapa `authStore.ts` simpan token di localStorage, bukan di memory saja

---

## FASE 6 — Styling: Tailwind + Radix + shadcn (2 minggu)

### Yang harus paham
- **Tailwind CSS**: utility-first, kenapa beda dari CSS-in-JS.
- Konfigurasi `tailwind.config.js`, custom colors, `dark:` variant.
- `clsx` + `tailwind-merge` (Nexo pakai keduanya, lihat `app/src/lib/utils.ts`).
- **Radix UI primitives**: unstyled, accessible, headless components.
- **shadcn/ui pattern**: copy-paste components, bukan npm install. Lihat folder `app/src/components/ui/`.
- Animasi: `tailwindcss-animate` + `tw-animate-css`.

### Materi
- Tailwind docs: <https://tailwindcss.com/docs>
- Radix UI docs: <https://www.radix-ui.com/primitives/docs/overview/introduction>
- shadcn/ui: <https://ui.shadcn.com/docs>
- *Tailwind Labs YouTube*: <https://www.youtube.com/@TailwindLabs>

### Latihan
- Reskin `Sidebar.tsx` jadi tema baru tanpa ubah struktur.
- Bikin `Dialog` modal pakai `@radix-ui/react-dialog` + custom Tailwind styling.

### Target output
- [ ] Bisa pakai utility Tailwind tanpa lihat docs (untuk kelas umum: padding, flex, grid, color)
- [ ] Tahu kapan extract jadi komponen vs biarkan utility
- [ ] Paham kenapa `cn()` helper (clsx + tailwind-merge) dipakai di project

---

## FASE 7 — Backend: Node + Express + REST API (3–4 minggu)

### Yang harus paham
- Node.js basics: ES Modules, npm/package.json, `node --watch` (Nexo pakai untuk dev).
- **Express 4**: routing, middleware, request/response cycle.
- Struktur project: `controllers/`, `routes/`, `lib/`, `scripts/` — lihat `app/backend/src/`.
- HTTP status codes (lihat tabel di `HACKATHON_STUDY_GUIDE.md` Bagian 1).
- **Auth dengan JWT + bcrypt** (lihat `authController.js` + `lib/jwt.js`).
- **Security middleware**: Helmet, CORS, rate limiting, sanitization.
- Environment variables dengan dotenv (`.env` file, jangan commit).
- Error handling pattern: central error middleware.

### Materi
- Node.js docs: <https://nodejs.org/en/learn/getting-started/introduction-to-nodejs>
- Express docs: <https://expressjs.com/en/starter/installing.html>
- *The Net Ninja — Node.js + Express crash course* (YouTube)
- Express security best practices: <https://expressjs.com/en/advanced/best-practice-security.html>
- JWT.io intro: <https://jwt.io/introduction>
- bcrypt explanation: <https://www.npmjs.com/package/bcryptjs>

### Latihan
- Rebuild endpoint `POST /api/auth/register` dari nol — pakai bcrypt untuk hash password, simpan ke memory (Map) dulu sebelum pakai database.
- Tambahkan rate limiter ke endpoint OTP.
- Bikin middleware `verifyToken` sendiri.

### Target output
- [ ] Bisa baca `authController.js` dan jelaskan tiap baris
- [ ] Paham kenapa password disimpan sebagai hash, bukan plaintext
- [ ] Tahu beda `app.use()` global middleware vs route-level middleware
- [ ] Bisa setup Express server baru dengan Helmet + CORS + rate limit dari nol

---

## FASE 8 — Database: SQL + Supabase (2–3 minggu)

### Yang harus paham
- **SQL dasar**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`, `GROUP BY`, indexes.
- **Relational design**: primary key, foreign key, normalisasi.
- **PostgreSQL** spesifik: `uuid`, `jsonb`, `timestamp with time zone`, `RETURNING`.
- **Supabase**:
  - Auth (Nexo pakai custom + Supabase mix)
  - Row Level Security (RLS) — sangat penting untuk multi-tenant
  - Service role key vs anon key
  - JS client (`@supabase/supabase-js`)
- Migrations & seed scripts (lihat `app/backend/src/scripts/seedTrends.js` + `grants.sql`).

### Materi
- SQLBolt (interaktif, gratis): <https://sqlbolt.com/>
- PostgreSQL Tutorial: <https://www.postgresqltutorial.com/>
- Supabase docs: <https://supabase.com/docs>
- *Supabase YouTube channel*: <https://www.youtube.com/@Supabase>
- RLS guide: <https://supabase.com/docs/guides/auth/row-level-security>

### Latihan
- Buat schema sendiri di Supabase Studio: tabel `users`, `trends`, `notifications`, `chat_messages` — mirror Nexo.
- Tulis 3 query SQL kompleks (mis. user yang punya >5 notifikasi unread, top 10 trend by growth).
- Tulis policy RLS untuk tabel `notifications` (user hanya bisa baca punyanya sendiri).

### Target output
- [ ] Bisa desain schema baru (3+ tabel berelasi) dari requirement teks
- [ ] Tahu kapan butuh index dan kenapa jangan over-index
- [ ] Paham kenapa RLS penting (jawab: pertahanan terakhir kalau backend bocor)
- [ ] Bisa run `seed:trends` script dan jelaskan apa yang terjadi

---

## FASE 9 — Integrasi: AI Streaming + WhatsApp OTP (1–2 minggu)

### 9a. Azure OpenAI + SSE
- Apa itu **SSE** vs WebSocket vs polling (lihat Bagian 5 `HACKATHON_STUDY_GUIDE.md`).
- Streaming response: `text/event-stream`, `flushHeaders()`, format `data: ...\n\n`.
- System prompt design, conversation history window.
- **Fallback pattern** — penting (cek `chatController.js`): jangan biarkan user dapet error kalau AI down.

Materi:
- Azure OpenAI docs: <https://learn.microsoft.com/en-us/azure/ai-services/openai/>
- MDN SSE: <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events>
- OpenAI streaming guide: <https://platform.openai.com/docs/api-reference/streaming>

### 9b. Fonnte (WhatsApp OTP)
- Konsep OTP yang aman: random 6 digit, expiry 5 menit, hash sebelum simpan, rate limit per nomor.
- Kenapa OTP **bukan** untuk login utama (SIM swap risk — sudah dibahas di study guide Bagian 3).
- Fonnte API: <https://docs.fonnte.com/>

### Latihan
- Bikin endpoint chat sendiri dengan streaming. Pakai `EventSource` di frontend untuk konsumsi.
- Bikin sistem OTP: generate, kirim ke WhatsApp, verify, expire.

### Target output
- [ ] Paham kenapa `flushHeaders()` perlu dipanggil sebelum stream
- [ ] Bisa jelaskan kenapa hash OTP lebih aman daripada simpan plaintext
- [ ] Tahu kapan pakai SSE vs WebSocket

---

## FASE 10 — Production-ready (2–3 minggu)

### 10a. Testing
- Unit test: Vitest (cocok dengan Vite).
- Component test: React Testing Library.
- E2E: Playwright (recommended) atau Cypress.
- API test: Supertest untuk Express.

Materi:
- Vitest: <https://vitest.dev/>
- Testing Library: <https://testing-library.com/docs/react-testing-library/intro/>
- Playwright: <https://playwright.dev/docs/intro>

### 10b. Deployment
- **Frontend**: Vercel atau Netlify (build = `npm run build`, output `dist/`).
- **Backend**: Railway, Render, Fly.io, atau Azure App Service.
- **Database**: Supabase sudah managed.
- Env vars di production (jangan pernah commit `.env`).

Materi:
- Vercel: <https://vercel.com/docs>
- Railway: <https://docs.railway.app/>
- Twelve-Factor App (prinsip umum): <https://12factor.net/>

### 10c. Observability & error handling
- Logging terstruktur (pino/winston).
- Sentry untuk error tracking frontend + backend: <https://sentry.io>
- Health check endpoint, uptime monitoring (UptimeRobot gratis).

### 10d. Performance
- Lighthouse audit (sudah ada di `report.md` & `performaweb.md`).
- Bundle analyzer (`rollup-plugin-visualizer`).
- Image optimization (sharp, sudah ada di devDeps).
- Lazy loading + code splitting (sudah dipraktikkan di Nexo).

### 10e. Accessibility (sudah dimulai di `A11Y_TESTING.md`)
- WCAG 2.1 AA basics.
- Keyboard navigation, focus management, ARIA.
- axe DevTools, Lighthouse a11y score.

### Target output
- [ ] Punya 1 project deploy live dengan domain custom
- [ ] Test coverage minimal 50% untuk logic kritis
- [ ] Lighthouse score >90 di semua kategori
- [ ] Paham checklist `BACKEND_READINESS_ANALYSIS.md` & `FRONTEND_READINESS_ANALYSIS.md`

---

## Bonus: Rekomendasi Cara Belajar

### Prinsip
1. **Build > Watch**. Tutorial 1 jam, latihan 4 jam.
2. **Rebuild fitur Nexo**. Setelah selesai 1 fase, rebuild bagian Nexo yang relevan dari nol di repo terpisah.
3. **Baca kode lebih banyak dari nulis**. Setiap minggu baca 1 file di project Nexo, paham tiap baris.
4. **Debug = belajar paling cepat**. Sengaja bikin error, baca stack trace, fix.
5. **Tulis ulang dengan kata sendiri**. Setelah baca konsep, tulis ulang di Notion/markdown. Kalau bisa nulis = paham.

### Komunitas & resource on-going
- The Odin Project (gratis, kurikulum lengkap): <https://www.theodinproject.com/>
- frontendmasters.com (berbayar, premium quality)
- *Josh Comeau's blog* (CSS + React): <https://www.joshwcomeau.com/>
- *Dan Abramov — overreacted.io*: <https://overreacted.io/>
- *Kent C. Dodds*: <https://kentcdodds.com/blog>
- Discord Reactiflux, r/reactjs di Reddit

### Project-based learning order (kalau ingin alternatif lain)
1. Static portfolio site (HTML/CSS/JS murni)
2. Todo app (React + LocalStorage)
3. Weather app (React + fetch API publik)
4. Auth-only app (Express + JWT + Postgres) — backend saja
5. Blog dengan CMS sendiri (fullstack + database)
6. **Rebuild Nexo** — sebagai capstone

---

## Cara Pakai Roadmap Ini

1. Print/bookmark file ini.
2. Tiap awal minggu, pilih 1 fase (atau sub-fase). Tulis di kalender.
3. Tiap akhir minggu, centang target output. Kalau belum tercapai, ulang.
4. Jangan lompat fase. Fase 5 tanpa Fase 2 = pasti stuck.
5. Setelah Fase 7, mulai contribute fix kecil di project Nexo (perbaiki typo, refactor 1 komponen). Real practice.

---

## Lampiran: File-file Project sebagai Referensi Belajar

| Topik belajar | File untuk dibaca | Yang diperhatikan |
|---|---|---|
| TypeScript types | `app/src/types.ts` | interface, union types |
| React component | `app/src/components/StatCard.tsx` | props, conditional render |
| React hooks | `app/src/pages/Dashboard.tsx` | useState, useEffect |
| Routing | `app/src/App.tsx` | lazy, Suspense, Routes |
| Zustand store | `app/src/stores/authStore.ts` | create, persist |
| Form + Zod | `app/src/pages/LoginPage.tsx` | useForm, zodResolver |
| Tailwind utility | `app/src/components/Sidebar.tsx` | utility classes, cn() |
| Radix UI | `app/src/components/ui/dialog.tsx` | wrapper pattern |
| Express setup | `app/backend/src/server.js` | helmet, cors, rate limit |
| JWT auth | `app/backend/src/lib/jwt.js` | sign, verify |
| Auth controller | `app/backend/src/controllers/authController.js` | bcrypt, JWT, OTP |
| AI streaming | `app/backend/src/controllers/chatController.js` | SSE, fallback |
| Supabase client | `app/backend/src/lib/supabase.js` | service vs anon key |
| Seed script | `app/backend/src/scripts/seedTrends.js` | bulk insert |
| SQL grants/RLS | `app/backend/src/scripts/grants.sql` | role permissions |

---

*Setelah selesai roadmap ini, kamu tidak hanya bisa rebuild Nexo — kamu bisa bangun product fullstack apapun dari nol, tahu cara pilih stack yang tepat, dan tahu trade-off di tiap keputusan. Selamat belajar.*
