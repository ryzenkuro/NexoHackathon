-- ─────────────────────────────────────────────────────────────────────────────
--  Nexo — fix "permission denied for table" untuk service_role
--  Jalankan SEKALI di Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────
--
--  Konteks: Supabase memakai PostgREST yang otentikasi setiap request menjadi
--  salah satu role Postgres (`anon`, `authenticated`, `service_role`). Backend
--  Nexo memakai secret key (`sb_secret_*`) yang dipetakan ke `service_role`.
--  Tabel custom yang dibuat di skema `public` butuh GRANT eksplisit supaya
--  bisa diakses, kalau tidak akan muncul error 42501 "permission denied".
--
--  Idempoten: aman dijalankan berkali-kali.

-- 1) Pastikan service_role bisa pakai schema public
GRANT USAGE ON SCHEMA public TO service_role;

-- 2) Beri akses CRUD penuh ke seluruh tabel di public (tabel saat ini)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO service_role;

-- 3) Beri akses sequence (kalau ada serial/identity)
GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA public
  TO service_role;

-- 4) Default privileges: tabel/sequence yang dibuat ke depan otomatis ter-grant
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO service_role;

-- 5) Optional: kalau Anda ingin akses langsung dari frontend (anon/authenticated)
--    via Supabase JS, aktifkan baris di bawah dan ATUR RLS sesuai kebutuhan.
--    Untuk Nexo, frontend lewat backend Express, jadi tidak perlu.
--
-- GRANT SELECT ON public.trends TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
--  Verifikasi
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT grantee, privilege_type, table_name
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee = 'service_role'
-- ORDER BY table_name, privilege_type;
