alter table clips add column if not exists thumbnail_url text;

create table if not exists oauth_states (
  state text primary key,
  user_id text not null,
  provider text not null,
  code_verifier text not null,
  expires_at timestamptz not null
);

create table if not exists tiktok_connections (
  user_id text primary key references profiles (user_id) on delete cascade,
  open_id text,
  display_name text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  updated_at timestamptz not null default now()
);
