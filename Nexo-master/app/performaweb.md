Daftar Isi: Performa & Keamanan (Versi Hackathon Ini)

A. Performa
A1. Ukuran Dasar

Lighthouse score (target 80+)
Core Web Vitals: LCP, CLS, INP
Tools: Chrome DevTools, PageSpeed Insights

A2. Asset Cepat

Gambar: WebP, lazy loading, kasih width & height
JavaScript: hindari bundle besar, dynamic import
Font: font-display swap

A3. Perceived Performance

Skeleton screen saat data loading
Optimistic UI untuk aksi yang sering dipakai
Empty state yang informatif, bukan blank putih

A4. Rendering

Pilih SSR atau SSG sesuai kebutuhan halaman
Loading state yang konsisten di semua halaman


B. Keamanan
B1. Autentikasi Dasar

Password di-hash (bcrypt)
Token di httpOnly cookie, bukan localStorage
Session timeout yang wajar

B2. Validasi Input

Validasi di backend, bukan hanya frontend
Sanitasi semua input user sebelum disimpan
File upload: batasi tipe dan ukuran

B3. Serangan Paling Umum

XSS: gunakan framework yang auto-escape output
IDOR: validasi ownership di setiap endpoint
Brute force: rate limiting di endpoint login

B4. HTTPS & Header Dasar

HTTPS aktif (gratis di Vercel/Railway)
X-Frame-Options
X-Content-Type-Options

B5. Secrets & Environment

API key dan credentials tidak masuk ke git
Pakai environment variables
Azure credentials dikelola dengan benar


C. Reliability (Nilai Tambah di Demo)
C1. Error Handling

Setiap API call punya error state di UI
Pesan error yang human-readable, bukan kode teknis
Jangan expose stack trace ke user

C2. Edge Cases

Kondisi data kosong
Kondisi loading gagal
Kondisi network lambat


Yang Tidak Perlu untuk Hackathon Ini
Semua yang ini bisa dilewat dulu:

CDN kompleks
Database indexing lanjutan
Compliance (GDPR, PDPA)
Load testing
Distributed tracing
Container security