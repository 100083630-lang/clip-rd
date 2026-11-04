-- Columns the app already queries. Existing tables were created before this
-- schema, so CREATE TABLE IF NOT EXISTS never added the missing fields.

alter table clips add column if not exists user_id uuid;
alter table clips add column if not exists provider text;
alter table clips add column if not exists platform_id text;
alter table clips add column if not exists declared_platform text;
alter table clips add column if not exists classification text;
alter table clips add column if not exists external_id text;
alter table clips add column if not exists url text;
alter table clips add column if not exists title text;
alter table clips add column if not exists description text not null default '';
alter table clips add column if not exists channel_name text;
alter table clips add column if not exists published_on date;
alter table clips add column if not exists duration_seconds integer;
alter table clips add column if not exists status text not null default 'pending';
alter table clips add column if not exists availability text not null default 'unknown';
alter table clips add column if not exists stats_source text not null default 'none';
alter table clips add column if not exists stats_verified boolean not null default false;
alter table clips add column if not exists public_views bigint not null default 0;
alter table clips add column if not exists valid_views bigint not null default 0;
alter table clips add column if not exists billed_views bigint not null default 0;
alter table clips add column if not exists views_locked boolean not null default false;
alter table clips add column if not exists likes bigint;
alter table clips add column if not exists comments bigint;
alter table clips add column if not exists shares bigint;
alter table clips add column if not exists flags jsonb not null default '[]'::jsonb;
alter table clips add column if not exists stats_updated_at timestamptz;
alter table clips add column if not exists stats_error text;
alter table clips add column if not exists rejection_reason text;
alter table clips add column if not exists thumbnail_url text;
alter table clips add column if not exists created_at timestamptz not null default now();
alter table clips add column if not exists updated_at timestamptz not null default now();

alter table profiles add column if not exists display_name text not null default '';
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists role text not null default 'clipper';
alter table profiles add column if not exists status text not null default 'pending';
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists terms_version text not null default '1';
alter table profiles add column if not exists accepted_terms_at timestamptz not null default now();
alter table profiles add column if not exists created_at timestamptz not null default now();
alter table profiles add column if not exists updated_at timestamptz not null default now();

alter table earnings add column if not exists clip_id uuid;
alter table earnings add column if not exists user_id uuid;
alter table earnings add column if not exists platform_id text;
alter table earnings add column if not exists views_delta bigint not null default 0;
alter table earnings add column if not exists rate_per_mille numeric(12, 4) not null default 0;
alter table earnings add column if not exists amount numeric(14, 2) not null default 0;
alter table earnings add column if not exists currency text not null default 'USD';
alter table earnings add column if not exists kind text not null default 'accrual';
alter table earnings add column if not exists note text;
alter table earnings add column if not exists created_by text;
alter table earnings add column if not exists created_at timestamptz not null default now();

alter table payout_requests add column if not exists user_id uuid;
alter table payout_requests add column if not exists amount numeric(14, 2) not null default 0;
alter table payout_requests add column if not exists currency text not null default 'USD';
alter table payout_requests add column if not exists status text not null default 'pending';
alter table payout_requests add column if not exists note text;
alter table payout_requests add column if not exists admin_note text;
alter table payout_requests add column if not exists rejection_reason text;
alter table payout_requests add column if not exists created_at timestamptz not null default now();
alter table payout_requests add column if not exists updated_at timestamptz not null default now();

alter table payout_accounts add column if not exists user_id uuid;
alter table payout_accounts add column if not exists holder_name text not null default '';
alter table payout_accounts add column if not exists bank_name text not null default '';
alter table payout_accounts add column if not exists account_type text not null default 'ahorro';
alter table payout_accounts add column if not exists account_number text not null default '';
alter table payout_accounts add column if not exists created_at timestamptz not null default now();
alter table payout_accounts add column if not exists updated_at timestamptz not null default now();

alter table payments add column if not exists request_id integer;
alter table payments add column if not exists user_id uuid;
alter table payments add column if not exists amount numeric(14, 2) not null default 0;
alter table payments add column if not exists currency text not null default 'USD';
alter table payments add column if not exists method text not null default 'bank_transfer_manual';
alter table payments add column if not exists reference text not null default '';
alter table payments add column if not exists receipt_url text;
alter table payments add column if not exists paid_at timestamptz not null default now();
alter table payments add column if not exists recorded_by text;
alter table payments add column if not exists created_at timestamptz not null default now();

alter table notifications add column if not exists user_id uuid;
alter table notifications add column if not exists kind text not null default 'system';
alter table notifications add column if not exists title text not null default '';
alter table notifications add column if not exists body text not null default '';
alter table notifications add column if not exists href text;
alter table notifications add column if not exists read_at timestamptz;
alter table notifications add column if not exists created_at timestamptz not null default now();

alter table rates add column if not exists platform_id text;
alter table rates add column if not exists amount_per_mille numeric(12, 4) not null default 0;
alter table rates add column if not exists currency text not null default 'USD';
alter table rates add column if not exists active boolean not null default true;
alter table rates add column if not exists effective_from timestamptz not null default now();
alter table rates add column if not exists created_by text;
alter table rates add column if not exists note text;

create index if not exists clips_provider_idx on clips (provider, external_id);
