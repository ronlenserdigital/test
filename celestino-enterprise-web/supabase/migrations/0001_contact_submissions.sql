-- Celestino Enterprise: contact submissions
-- Applies to: Supabase Postgres. Reproducible via `supabase db push` or the SQL editor.
--
-- Security model:
--   * RLS enabled. No policy grants anon or authenticated any access.
--   * Inserts happen ONLY from the server route using the service-role key.
--   * Reads happen from the Supabase dashboard (service role) or a future
--     authenticated admin role added in a later migration.

create extension if not exists pgcrypto;

create table if not exists public.contact_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 1 and 120),
  email         text not null check (char_length(email) between 3 and 254),
  company       text not null check (char_length(company) between 1 and 160),
  phone         text check (phone is null or char_length(phone) <= 40),
  intent        text not null check (intent in ('assessment','expert','general','support','government','security')),
  need          text check (need is null or char_length(need) <= 60),
  message       text not null check (char_length(message) between 1 and 4000),
  source_page   text check (source_page is null or char_length(source_page) <= 200),
  client_hash   text check (client_hash is null or char_length(client_hash) <= 64),
  user_agent    text check (user_agent is null or char_length(user_agent) <= 300),
  status        text not null default 'new' check (status in ('new','in_progress','closed','spam')),
  handled_by    text,
  handled_at    timestamptz
);

comment on table public.contact_submissions is 'Website contact form submissions. Service-role writes only; no public read.';

create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx on public.contact_submissions (status);

alter table public.contact_submissions enable row level security;
alter table public.contact_submissions force row level security;

-- Explicitly revoke default grants so anon/authenticated cannot touch the table
-- even if a permissive policy is added by mistake later.
revoke all on public.contact_submissions from anon, authenticated;
