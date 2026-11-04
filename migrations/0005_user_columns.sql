-- 0001 already ran against a pre-existing "user" table, so these columns
-- have to be added in a new migration. Names match the admin insert exactly.
alter table "user" add column if not exists "name" text not null default '';
alter table "user" add column if not exists "email" text;
alter table "user" add column if not exists "emailVerified" boolean not null default false;
alter table "user" add column if not exists "image" text;
alter table "user" add column if not exists "createdAt" timestamptz not null default now();
alter table "user" add column if not exists "updatedAt" timestamptz not null default now();
