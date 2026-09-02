-- Optional editorial tables for a future lightweight CMS workflow.
-- The website reads content from typed TypeScript in src/content today; these
-- tables are provided so an authenticated editor workflow can be added without
-- redesigning the schema. Public read is allowed ONLY for published rows.

create table if not exists public.authors (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  role        text,
  bio         text,
  credentials text[] not null default '{}',
  is_organization boolean not null default false,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.article_categories (
  slug        text primary key,
  label       text not null,
  description text
);

create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  description   text not null,
  category      text not null references public.article_categories(slug),
  type          text not null check (type in ('guide','decision-guide','checklist','framework','commentary')),
  author_id     uuid not null references public.authors(id),
  published_at  date,
  reviewed_at   date,
  reading_minutes int,
  summary       text,
  body          jsonb not null default '[]'::jsonb,
  key_takeaways text[] not null default '{}',
  references_   jsonb not null default '[]'::jsonb,
  status        text not null default 'draft' check (status in ('draft','review','published','archived')),
  updated_at    timestamptz not null default now()
);

create table if not exists public.case_studies (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  client        text not null,
  industry_slug text not null,
  service_slugs text[] not null default '{}',
  summary       text not null,
  body          jsonb not null default '{}'::jsonb,
  verified      boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','review','published','archived')),
  published_at  date,
  updated_at    timestamptz not null default now()
);

create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  verified    boolean not null default false,
  source      text,
  updated_at  timestamptz not null default now()
);

alter table public.authors enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.case_studies enable row level security;
alter table public.site_settings enable row level security;

-- Public (anon) may read only published/verified rows. No writes from anon or authenticated.
create policy "public read verified authors" on public.authors for select to anon, authenticated using (verified = true);
create policy "public read categories" on public.article_categories for select to anon, authenticated using (true);
create policy "public read published articles" on public.articles for select to anon, authenticated using (status = 'published');
create policy "public read published case studies" on public.case_studies for select to anon, authenticated using (status = 'published' and verified = true);
create policy "public read verified settings" on public.site_settings for select to anon, authenticated using (verified = true);

revoke insert, update, delete on public.authors, public.article_categories, public.articles, public.case_studies, public.site_settings from anon, authenticated;

-- Seed the eight public categories (public, non-sensitive).
insert into public.article_categories (slug, label, description) values
  ('cybersecurity', 'Cybersecurity', 'Controls, detection, response and evidence.'),
  ('it-operations', 'IT Operations', 'Operating models, staffing, cost and risk.'),
  ('cloud', 'Cloud and Infrastructure', 'Workload placement and hybrid design.'),
  ('compliance', 'Compliance and Frameworks', 'NIST, HIPAA, FINRA, SOX and related obligations.'),
  ('resilience', 'Resilience and Recovery', 'Backup, disaster recovery and continuity.'),
  ('government-technology', 'Government Technology', 'Procurement, security standards and readiness.'),
  ('software-engineering', 'Software Engineering', 'Secure design and operation of custom applications.'),
  ('ai-automation', 'AI and Automation', 'Practical automation and its governance.')
on conflict (slug) do nothing;
