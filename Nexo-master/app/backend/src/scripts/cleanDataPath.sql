-- Run once in Supabase SQL Editor before enabling the full production data path.

create table if not exists public.ai_runs (
  id text primary key,
  prompt_id text,
  provider text,
  model text,
  status text not null,
  input jsonb,
  output text,
  usage jsonb,
  evaluation jsonb,
  metadata jsonb default '{}'::jsonb,
  payload_url text,
  fallback_reason text,
  error text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  source_url text,
  source_id text,
  label text,
  raw_payload_url text,
  captured_at timestamptz not null default now()
);

create table if not exists public.raw_events (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  event_type text not null,
  source_url text,
  payload_url text not null,
  captured_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  platform text,
  asset_type text not null,
  source_url text,
  public_url text not null,
  r2_key text,
  content_type text,
  captured_at timestamptz not null default now()
);

create index if not exists trends_platform_updated_at_idx
  on public.trends (platform, updated_at desc);

create index if not exists trending_contents_platform_related_updated_idx
  on public.trending_contents (platform, related_trend_id, updated_at desc);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read, created_at desc);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

create index if not exists ai_runs_created_provider_idx
  on public.ai_runs (created_at desc, provider);

grant select, insert, update, delete on public.ai_runs to service_role;
grant select, insert, update, delete on public.research_sources to service_role;
grant select, insert, update, delete on public.raw_events to service_role;
grant select, insert, update, delete on public.media_assets to service_role;
