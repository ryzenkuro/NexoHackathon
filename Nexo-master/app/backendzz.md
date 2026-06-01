# Backendzz - Hands-on AI Backend Nexo

Dokumen ini urutan paling aman untuk demo hackathon: model AI dipakai real melalui OpenAI API langsung jika Azure OpenAI belum siap, sementara Azure AI Foundry dan Microsoft Fabric/OneLake tetap dummy lokal untuk trace dan lakehouse summary.

## 1. Status yang sudah dikerjakan AI

Bagian AI backend sudah ditambahkan tanpa mematahkan dashboard/demo yang sudah jalan.

Yang sudah masuk:
- AI gateway: target demo real bisa `AI_PROVIDER=openai` atau `AI_PROVIDER=azure_openai`; mode gratis lokal tetap bisa memakai `AI_PROVIDER=demo`.
- Demo AI provider gratis: masih tersedia untuk development tanpa API key.
- OpenAI provider langsung: alternatif real jika Azure OpenAI Service belum bisa dipakai.
- Azure OpenAI provider: dipakai real saat env Azure lengkap dan `AI_PROVIDER_STRICT=true`.
- Prompt registry: prompt dashboard, rekomendasi trend, analisis konten, dan chat sudah diperketat agar menjawab dari `DATA_NEXO`.
- Trace/evaluation sederhana: mapping ke fungsi Azure AI Foundry untuk observability.
- Demo lakehouse in-memory: mapping ke Microsoft Fabric / OneLake medallion pattern.
- Endpoint baru `/api/ai/...`.
- Chat lama `/api/chat` sekarang lewat AI gateway baru, jadi UI existing tetap aman.
- Express `app` sudah dipisah dari `server.listen`, sehingga lebih siap untuk adapter serverless nanti.
- Smoke script backend: `npm run smoke:backend`.

File penting:
- `backend/src/services/ai/aiGateway.js`
- `backend/src/services/ai/promptRegistry.js`
- `backend/src/services/ai/providers/demoProvider.js`
- `backend/src/services/ai/providers/openAiProvider.js`
- `backend/src/services/ai/providers/azureOpenAiProvider.js`
- `backend/src/services/ai/traceStore.js`
- `backend/src/services/lakehouse/demoLakehouseStore.js`
- `backend/src/controllers/aiController.js`
- `backend/src/routes/ai.js`

## 2. Fungsi Azure di Nexo

Azure OpenAI Service:
- Fungsi di Nexo: menghasilkan rekomendasi bisnis, insight dashboard, analisis konten viral, dan chat Nexo.
- Status: tetap didukung, memakai `AI_PROVIDER=azure_openai`.
- Backend gagal start dengan pesan jelas jika `AI_PROVIDER_STRICT=true` tetapi endpoint/key/deployment Azure belum lengkap.

OpenAI API langsung:
- Fungsi di Nexo: alternatif real untuk model AI jika Azure OpenAI Service belum bisa.
- Status target demo saat ini: real, memakai `AI_PROVIDER=openai`.
- Backend gagal start dengan pesan jelas jika `AI_PROVIDER_STRICT=true` tetapi `OPENAI_API_KEY` belum diisi.
- Alternatif gratis untuk development: `AI_PROVIDER=demo`, yaitu rule-based AI yang sudah disiapkan.

Azure AI Foundry:
- Fungsi di Nexo: prompt management, trace, evaluation, monitoring kualitas jawaban AI.
- Alternatif gratis untuk demo: `traceStore.js` dan evaluator lokal.
- Endpoint demo: `GET /api/ai/runs`.

Microsoft Fabric / OneLake:
- Fungsi di Nexo: menyimpan raw event, normalized event, dan metric agregat untuk analitik.
- Alternatif gratis untuk demo: `demoLakehouseStore.js` in-memory dengan konsep Bronze, Silver, Gold.
- Endpoint demo: `GET /api/ai/lakehouse/summary`.

Referensi resmi:
- Azure OpenAI Responses API: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses
- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses
- Azure AI Foundry observability: https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/observability
- Microsoft Fabric overview: https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview
- Fabric OneLake medallion architecture: https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture
- Vercel Functions limits: https://vercel.com/docs/functions/limitations
- Vercel runtimes: https://vercel.com/docs/functions/runtimes

## 3. Urutan paling aman

Ikuti urutan ini supaya tidak merusak demo:

1. Isi env OpenAI API asli.
2. Jalankan backend dengan `AI_PROVIDER=openai` dan `AI_PROVIDER_STRICT=true`.
3. Tes endpoint AI satu per satu.
3. Tes UI chat existing.
4. Tunjukkan dummy Foundry trace dan dummy Fabric lakehouse.
5. Baru siapkan GitHub.
6. Deploy frontend ke Vercel.
7. Backend production dipindahkan ke serverless/hosting setelah endpoint AI stabil.

Catatan penting:
- Saat ini backend masih Express server biasa.
- Vercel cocok untuk frontend dan API stateless.
- SSE realtime dan in-memory worker jangan dijadikan fondasi production multi-instance.
- Untuk Vercel production penuh, fase berikutnya adalah membuat adapter API serverless dan mengganti state in-memory dengan database.

## 4. Setup env local

Di root project, buat `.env` dari `.env.example`. Untuk backend local, pastikan `app/.env` dan `app/backend/.env` berisi nilai yang sama atau backend-specific value di `app/backend/.env`.

Mode demo utama: OpenAI API real, Foundry/Fabric dummy:

```env
VITE_API_URL=http://localhost:3001/api
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

DEMO_DATA_MODE=demo
DEMO_REALTIME_ENABLED=true
DASHBOARD_REALTIME_INTERVAL_MS=1000
DEMO_MUTATION_INTERVAL_MS=4000
SATURATION_REFRESH_INTERVAL_MS=10000

JWT_SECRET=change-this-to-a-strong-32-character-secret
JWT_EXPIRES_IN=7d

AI_PROVIDER=openai
AI_PROVIDER_STRICT=true
AI_OPS_PROVIDER=demo-foundry-trace
LAKEHOUSE_PROVIDER=demo-medallion

OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Mode Azure jika sudah siap:

```env
AI_PROVIDER=azure_openai
AI_PROVIDER_STRICT=true
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21
```

Mode gratis untuk development lokal jika belum ada key Azure:

```env
AI_PROVIDER=demo
AI_PROVIDER_STRICT=false
```

## 5. Jalankan local

Terminal 1, backend:

```powershell
cd C:\Users\Kuro\Music\Nexo-master\Nexo-master\app\backend
npm install
npm start
```

Jika env Azure belum lengkap dan strict mode aktif, backend akan berhenti dengan error seperti:

```text
[startup] Backend configuration invalid:
- AI_PROVIDER=openai and AI_PROVIDER_STRICT=true, but OpenAI is not ready: ...
```

Terminal 2, frontend:

```powershell
cd C:\Users\Kuro\Music\Nexo-master\Nexo-master\app
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:3001
```

## 6. Smoke test endpoint AI

Smoke test otomatis:

```powershell
cd C:\Users\Kuro\Music\Nexo-master\Nexo-master\app\backend
npm run smoke:backend
```

Script ini wajib melihat `activeProvider=openai` atau `activeProvider=azure_openai`; jika provider masih `demo`, script akan gagal.

Health check:

```powershell
curl.exe -s http://localhost:3001/api/ai/health
```

Dashboard insight:

```powershell
curl.exe -s -X POST http://localhost:3001/api/ai/insights/dashboard
```

Rekomendasi trend:

```powershell
curl.exe -s http://localhost:3001/api/ai/trends/demo-trend-2/recommendation
```

Analisis konten:

```powershell
curl.exe -s http://localhost:3001/api/ai/content/demo-content-5/analysis
```

Chat JSON:

```powershell
$body = '{"message":"Berapa modal awal yang aman?","trendId":"demo-trend-2"}'
curl.exe -s -X POST http://localhost:3001/api/ai/chat -H "Content-Type: application/json" -d $body
```

Trace AI ala Foundry:

```powershell
curl.exe -s http://localhost:3001/api/ai/runs
```

Lakehouse summary ala OneLake/Fabric:

```powershell
curl.exe -s http://localhost:3001/api/ai/lakehouse/summary
```

## 7. Script demo hackathon

Gunakan alur ini saat presentasi:

1. Buka Dashboard.
2. Tunjukkan chart growth momentum bergerak real-time.
3. Buka salah satu produk viral.
4. Tanyakan ke chat Nexo: "Berapa modal awal yang aman?"
5. Buka endpoint atau panel AI insight untuk menunjukkan provider `openai`.
6. Jelaskan bahwa model AI sudah real lewat OpenAI API langsung, sedangkan Foundry/Fabric masih dummy lokal.
7. Tunjukkan `GET /api/ai/runs` sebagai mini Azure AI Foundry trace.
8. Tunjukkan `GET /api/ai/lakehouse/summary` sebagai mini OneLake/Fabric medallion layer.

Kalimat singkat untuk juri:

```text
Untuk demo, Nexo memakai OpenAI API langsung sebagai model AI sungguhan untuk menghasilkan rekomendasi. Azure OpenAI tetap didukung sebagai opsi enterprise, sedangkan Azure AI Foundry dan Microsoft Fabric/OneLake masih dimodelkan sebagai dummy lokal melalui trace store dan medallion lakehouse in-memory.
```

## 8. Checklist sebelum Vercel

Yang aman dilakukan sekarang:
- Build frontend berhasil.
- Backend local berhasil dengan env OpenAI lengkap.
- AI endpoint memakai provider `openai` atau `azure_openai`.
- Dummy Foundry trace dan dummy Fabric lakehouse berhasil.
- Env production disiapkan.
- Repo GitHub siap.

Yang belum boleh dianggap production penuh:
- In-memory chat history.
- In-memory trace.
- In-memory lakehouse.
- SSE realtime untuk Vercel serverless.
- Express `app` sudah dipisah dari `server.listen`, tetapi adapter Vercel API functions belum ditambahkan.

Fase berikutnya untuk siap Vercel production:

1. Tambahkan adapter `api/index.js` untuk Vercel.
2. Pastikan startup validation cocok untuk serverless runtime.
3. Pastikan semua backend dependency ada di root install Vercel.
4. Ganti in-memory state ke database atau Supabase/Neon.
5. Gunakan polling atau Supabase Realtime untuk production, bukan worker in-memory.
6. Set env Vercel:

```env
VITE_API_URL=/api
DEMO_DATA_MODE=demo
AI_PROVIDER=openai
AI_PROVIDER_STRICT=true
AI_OPS_PROVIDER=demo-foundry-trace
LAKEHOUSE_PROVIDER=demo-medallion
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
JWT_SECRET=isi-dengan-secret-panjang-minimal-32-karakter
```

## 9. Pembagian kerja kamu dan AI

Yang AI sudah kerjakan:
- Implementasi AI backend.
- Endpoint AI.
- Provider OpenAI langsung dan Azure OpenAI dengan strict validation.
- Trace dan evaluator demo.
- Lakehouse demo.
- Refactor Express `app` / `server.listen`.
- Smoke script backend.
- Dokumentasi hands-on ini.

Yang kamu kerjakan:
- Jalankan local dengan langkah di atas.
- Isi OpenAI API key asli.
- Tes semua endpoint dengan `npm run smoke:backend`.
- Cek UI chat di dashboard.
- Buat repo GitHub.
- Siapkan akun Vercel.
- Nanti tentukan: deploy frontend dulu, atau lanjut fase adapter backend ke Vercel.

Yang AI bisa kerjakan setelah ini:
- Membuat adapter Vercel production.
- Mengganti trace/lakehouse ke database.
- Membuat panel frontend untuk AI insight.
- Membuat schema Supabase/Neon.
- Membuat script seed/demo production.
