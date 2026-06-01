# Mobile Real-Device Testing — Nexo

> Cara akses Nexo dari HP saat development, untuk verifikasi BottomNav, hamburger menu, touch target, dan responsive behavior.

## ⚡ Quick Start

```bash
# Terminal 1 — Backend
cd app/backend
npm run dev

# Terminal 2 — Frontend
cd app
npm run dev
```

Vite akan tampilkan dua URL:

```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/   ← buka ini di HP
```

Buka URL **Network** di browser HP (HP harus 1 WiFi dengan laptop).

## 🔧 Setup yang Sudah Diatur

| Aspek | Status |
|---|---|
| Vite `server.host: true` | ✅ sudah di `vite.config.ts` |
| Backend CORS allow LAN | ⚠️ saat ini hanya allow `FRONTEND_URL` (default `http://localhost:3000`). |
| Backend listen | ⚠️ Express default listen `0.0.0.0`, OK |

## ⚠️ Yang Harus Disesuaikan untuk Mobile

### 1. CORS untuk LAN access

Frontend di HP akan call backend di laptop dengan IP `192.168.x.x:3001`. CORS harus allow origin yang sama.

**Cara cepat (dev only):** edit `app/.env` sementara:

```env
FRONTEND_URL=http://192.168.x.x:3000
```

Atau lebih aman, ubah CORS jadi multi-origin di `backend/src/server.js`:

```js
const allowedOrigins = [
  'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // any LAN
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(p => typeof p === 'string' ? p === origin : p.test(origin));
    cb(ok ? null : new Error('CORS blocked'), ok);
  },
  credentials: true,
}));
```

### 2. Frontend pakai backend URL yang absolut

`app/.env` saat ini:
```env
VITE_API_URL=http://localhost:3001/api
```

Saat akses dari HP, `localhost` di HP ≠ laptop. Ganti ke IP laptop:

```env
VITE_API_URL=http://192.168.x.x:3001/api
```

> Tips: pakai `npm run dev -- --host` lalu lihat IP yang Vite tampilkan. Update `.env`. Restart frontend.

## 🔍 Cek IP Laptop

### Windows (PowerShell)
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match "Wi-Fi|Ethernet" }).IPAddress
```

### macOS
```bash
ipconfig getifaddr en0   # WiFi
```

### Linux
```bash
hostname -I | awk '{print $1}'
```

## 📱 Test Checklist di HP

Buka URL Vite Network di Safari/Chrome HP, lalu cek:

- [ ] Login page tampil normal, tombol bisa di-tap
- [ ] BottomNav muncul di mobile, semua 6 icon ter-tap (touch target 24px+)
- [ ] Hamburger menu kiri-atas buka/tutup sidebar
- [ ] Cards di Dashboard responsive, image loaded, no horizontal scroll
- [ ] ProductDetailModal full-screen di mobile, scroll smooth
- [ ] ChatbotPanel slide-in dari kanan, keyboard tidak nutupi input
- [ ] OnboardingTour spotlight align dengan element target
- [ ] Cmd+K palette: skip (HP tidak punya keyboard shortcut)
- [ ] Dark mode toggle di Navbar / Settings work, semua page ikut switch
- [ ] Saturation gauge canvas render di small screen
- [ ] Touch target Bottom Nav cukup besar (min 24×24px, ideal 44×44px)

## 🐛 Troubleshooting

| Gejala | Solusi |
|---|---|
| "Cannot connect" di HP | Cek HP & laptop di WiFi yang sama. Test `ping 192.168.x.x` dari HP browser ke `http://192.168.x.x:3001/health`. |
| Frontend load tapi data tidak muncul | Buka DevTools mobile (Safari iOS via Web Inspector, atau Chrome `chrome://inspect/#devices`). Lihat error CORS di console. |
| Backend block CORS | Update `FRONTEND_URL` di `.env` ke URL HP, atau pakai multi-origin handler. |
| Image tidak load (`picsum.photos`) | Cek HP punya akses internet; firewall korporat kadang block. |
| HMR tidak jalan di HP | Add `server.hmr.host` di vite config = IP laptop. |

## 🌐 Production-like Test (lokal)

Untuk test production build di HP (lebih representatif):

```bash
cd app
npm run build
npm run preview -- --host --port 4173
```

Vite preview akan jalan di port 4173. Akses dari HP: `http://192.168.x.x:4173/`.
