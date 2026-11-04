-- CLIPRD ledger. Authorization is enforced in server functions with the
-- verified session user id (Better Auth). The app connects as the database
-- owner, so Supabase-style RLS is not the control plane here: every read and
-- write is scoped in the server. Do not query these tables from the browser.

create table if not exists profiles (
  user_id uuid primary key references "user" ("id") on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null check (role in ('admin', 'clipper')),
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive', 'suspended')),
  phone text,
  terms_version text not null,
  accepted_terms_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platforms (
  id text primary key,
  label text not null
);

create table if not exists rates (
  id serial primary key,
  platform_id text not null references platforms (id),
  amount_per_mille numeric(12, 4) not null check (amount_per_mille >= 0),
  currency text not null default 'USD',
  active boolean not null default true,
  effective_from timestamptz not null default now(),
  created_by text,
  note text
);

create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (user_id),
  provider text not null check (provider in ('tiktok', 'youtube')),
  platform_id text not null references platforms (id),
  declared_platform text not null,
  classification text not null check (classification in ('confirmed', 'unconfirmed', 'conflict')),
  external_id text not null,
  url text not null,
  title text not null,
  description text not null default '',
  channel_name text,
  published_on date,
  duration_seconds integer,
  status text not null default 'pending' check (status in (
    'pending', 'in_review', 'verified', 'approved', 'rejected', 'suspended', 'settled'
  )),
  availability text not null default 'unknown' check (availability in (
    'unknown', 'public', 'unlisted', 'private', 'deleted'
  )),
  stats_source text not null default 'none' check (stats_source in (
    'none', 'oembed', 'youtube_api', 'tiktok_api', 'admin_adjustment'
  )),
  stats_verified boolean not null default false,
  public_views bigint not null default 0,
  valid_views bigint not null default 0,
  billed_views bigint not null default 0,
  views_locked boolean not null default false,
  likes bigint,
  comments bigint,
  shares bigint,
  flags jsonb not null default '[]'::jsonb,
  stats_updated_at timestamptz,
  stats_error text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists clip_statistics (
  id serial primary key,
  clip_id uuid not null references clips (id) on delete cascade,
  public_views bigint not null,
  valid_views bigint not null,
  likes bigint,
  comments bigint,
  shares bigint,
  source text not null,
  note text,
  recorded_by text,
  recorded_at timestamptz not null default now()
);

create table if not exists earnings (
  id serial primary key,
  clip_id uuid references clips (id) on delete restrict,
  user_id uuid not null,
  platform_id text,
  views_delta bigint not null default 0,
  rate_per_mille numeric(12, 4) not null default 0,
  amount numeric(14, 2) not null,
  currency text not null default 'USD',
  kind text not null check (kind in ('accrual', 'adjustment', 'bonus')),
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists payout_accounts (
  id serial primary key,
  user_id uuid not null unique references profiles (user_id) on delete cascade,
  holder_name text not null,
  bank_name text not null,
  account_type text not null check (account_type in ('ahorro', 'corriente')),
  account_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payout_requests (
  id serial primary key,
  user_id uuid not null references profiles (user_id),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in (
    'pending', 'approved', 'processing', 'paid', 'rejected'
  )),
  note text,
  admin_note text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id serial primary key,
  request_id integer not null unique references payout_requests (id),
  user_id uuid not null,
  amount numeric(14, 2) not null,
  currency text not null default 'USD',
  method text not null default 'bank_transfer_manual',
  reference text not null,
  receipt_url text,
  paid_at timestamptz not null default now(),
  recorded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id serial primary key,
  user_id uuid not null,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id serial primary key,
  actor_id text,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table if not exists api_integrations (
  id text primary key,
  label text not null,
  enabled boolean not null default false,
  public_config jsonb not null default '{}'::jsonb,
  status_note text,
  updated_at timestamptz not null default now()
);

create table if not exists agency_settings (
  id integer primary key default 1 check (id = 1),
  agency_name text not null default 'Origen Simple',
  brand_name text not null default 'CLIPRD',
  slogan text not null default 'CONVIERTE VISUALIZACIONES EN DINERO.',
  currency text not null default 'USD',
  sync_interval_minutes integer not null default 360 check (sync_interval_minutes >= 15),
  min_payout numeric(14, 2) not null default 10,
  youtube_quota_used integer not null default 0,
  youtube_quota_day date,
  updated_at timestamptz not null default now()
);

create table if not exists invites (
  code text primary key,
  created_by text not null,
  expires_at timestamptz not null,
  used_by text,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ranking_prizes (
  id serial primary key,
  scope text not null,
  place integer not null check (place between 1 and 20),
  title text not null,
  amount numeric(14, 2),
  active boolean not null default true,
  unique (scope, place)
);

alter table clips add column if not exists status text not null default 'pending';
alter table payout_requests add column if not exists status text not null default 'pending';

create index if not exists clips_user_idx on clips (user_id, status);
create index if not exists clips_status_idx on clips (status, created_at desc);
create index if not exists earnings_user_idx on earnings (user_id, created_at desc);
create index if not exists earnings_clip_idx on earnings (clip_id);
create index if not exists stats_clip_idx on clip_statistics (clip_id, recorded_at desc);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create index if not exists payouts_user_idx on payout_requests (user_id, status);
create index if not exists rates_platform_idx on rates (platform_id, active, effective_from desc);
create index if not exists audit_created_idx on audit_logs (created_at desc);

insert into platforms (id, label) values
  ('tiktok', 'TikTok'),
  ('youtube_shorts', 'YouTube Shorts'),
  ('youtube_video', 'YouTube Videos')
on conflict (id) do nothing;

insert into rates (platform_id, amount_per_mille, note)
select v.platform_id, v.amount, 'Tarifa inicial'
from (
  values
    ('tiktok'::text, 0.3000::numeric),
    ('youtube_shorts', 0.8000),
    ('youtube_video', 1.5000)
) as v(platform_id, amount)
where not exists (select 1 from rates);

insert into agency_settings (id, agency_name, brand_name, slogan)
values (1, 'Origen Simple', 'CLIPRD', 'CONVIERTE VISUALIZACIONES EN DINERO.')
on conflict (id) do nothing;

insert into api_integrations (id, label, enabled, status_note) values
  (
    'youtube',
    'YouTube Data API v3',
    false,
    'La clave vive solo en la variable de servidor YOUTUBE_API_KEY. El método usado es videos.list (snippet, contentDetails, statistics, status).'
  ),
  (
    'tiktok',
    'TikTok API',
    false,
    'Sin OAuth de la cuenta no hay reproducciones oficiales. CLIPRD valida el enlace y puede guardar el oEmbed público (título y autor), que no es una estadística de vistas.'
  ),
  (
    'cron',
    'Sincronización programada',
    false,
    'POST /api/cron/sync con Authorization: Bearer y la variable CRON_SECRET. Si no existe, el endpoint responde 503.'
  )
on conflict (id) do nothing;
