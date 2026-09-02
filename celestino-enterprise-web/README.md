# Celestino Enterprise — Website

Ground-up rebuild of [celestinoenterprise.com](https://celestinoenterprise.com): managed IT, cybersecurity and compliance support, cloud and infrastructure, backup and disaster recovery, and secure application engineering, positioned for mid-market, regulated and public-sector buyers.

## Project overview

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components by default), React 19, TypeScript strict |
| Styling | Tailwind CSS 4 over a CSS-custom-property design-token layer (`src/app/globals.css`) |
| Content | Typed TypeScript in `src/content` (services, solutions, industries, articles, trust, site facts) |
| Data | Supabase Postgres for contact submissions (RLS, service-role writes only) |
| Hosting | Vercel (production from `main`, previews per push) |
| Testing | Playwright (routes, SEO, links, a11y via axe, navigation, forms), ESLint, `tsc` |

Research and decisions that shaped the build are in `docs/`:

- `docs/research/existing-site-audit.md`, `docs/research/cybersecurity-competitive-audit.md`
- `docs/seo/` (keyword map, content gaps, backlinks, measurement plan, migration map, checklists)
- `docs/architecture/information-architecture.md`, `docs/design/design-direction.md`
- `docs/client-information-required.md` (claims that must be verified before launch)
- `docs/deployment.md`

## Architecture

```
src/
  app/                    Routes (server components). One file per route + opengraph-image.tsx
    api/contact/          POST handler: zod validation, honeypot, timing, Turnstile, rate limit, Supabase insert
    sitemap.ts robots.ts manifest.ts icon.tsx apple-icon.tsx opengraph-image.tsx
    llms.txt/route.ts     Optional plain-text index (not an SEO signal)
    .well-known/security.txt/route.ts   Served only when a verified security contact exists
  components/
    layout/               Logo, footer, utility rail
    navigation/           Header (client), mega panel, mobile menu
    sections/             Page-level sections: hero, hero visual, capabilities, operating model, ...
    ui/                   Primitives: Container, Section, Heading, Button/LinkButton, Card, Badge, Breadcrumb,
                          Accordion (native <details>), FormField, Prose, CTASection, LogoStrip, Testimonial, ArticleCard
    motion/               RevealObserver (IntersectionObserver), TiltSurface (pointer tilt)
    forms/                ContactForm (client)
    seo/                  JsonLd
    icons/                Custom 24px/1.5px stroke icon set
  content/                All copy and structured content, typed by content/types.ts
  lib/
    seo/                  buildMetadata, JSON-LD builders, redirects, OG renderer
    analytics/            Event taxonomy + delegated tracker
    supabase/             Server-only service client
    validation/           Contact schema (zod)
supabase/migrations/      SQL migrations (RLS enabled)
tests/                    Playwright specs
scripts/                  Screenshots, placeholder/slop check
docs/                     Research, SEO, architecture, design, deployment
```

**Surface themes.** `Section` sets `.theme-dark` or `.theme-light`; every component uses semantic tokens (`bg-bg`, `text-fg`, `border-line`, `text-accent`, ...) so it renders correctly on either surface.

**Claims gating.** `src/content/site.ts` wraps every business fact in a `Claim` with `verified` and `source`. Components render structured placeholders when `verified` is false (phone, email, identifiers, partners, certifications, case studies). Nothing is invented to fill space.

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in what you have; the site runs without any of them
pnpm dev                      # http://localhost:3000
```

Node 22+, pnpm 10+.

## Environment variables

See `.env.example`. Summary:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | all | Canonical origin. Production: `https://celestinoenterprise.com` |
| `NEXT_PUBLIC_SITE_ENV` | all | `production` enables indexing (robots + meta). Anything else = noindex |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | Supabase project (anon key unused by the site today; reserved for future reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Contact form inserts. Never exposed to the browser |
| `NEXT_PUBLIC_GA_ID` | all | GA4 measurement ID; analytics load only when set |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | all / server | Cloudflare Turnstile on the contact form |
| `RATE_LIMIT_SALT` | server | Salt for hashed client keys in rate limiting |

## Supabase setup

1. Create a project. Copy URL and keys into the environment.
2. Apply migrations in order from `supabase/migrations/` (SQL editor or `supabase db push`).
3. Verify: `contact_submissions` has RLS enabled and **no** policies for `anon`/`authenticated`; only the service role can read or write. `0002` adds optional editorial tables with public read of published rows only; the site does not read them yet.
4. Review submissions in the dashboard (Table Editor) or add an authenticated admin role in a later migration.

## Development commands

```bash
pnpm dev                 # development server
pnpm build && pnpm start # production build and server
pnpm typecheck           # next typegen + tsc --noEmit
pnpm lint                # eslint (next core-web-vitals + typescript)
pnpm check:placeholders  # fails on lorem ipsum / forbidden marketing phrases / TODOs in content
pnpm test                # playwright (starts the production server on :3100)
pnpm screenshots         # full-page screenshots at 1440/1024/768/390/320 into ./screenshots
pnpm verify              # typecheck + lint + placeholders + build
```

Playwright uses the bundled Chromium; on machines with a pre-installed browser set `PW_CHROMIUM_PATH=/path/to/chrome`.

## Testing

`tests/seo.spec.ts` visits every indexable route (derived from content) and asserts: 200, unique title, description length, absolute canonical, OG/Twitter tags, exactly one `h1`, no skipped heading levels, JSON-LD present without fake `Review`/`AggregateRating`/`Award`, no forbidden copy, no horizontal overflow, breadcrumb present. It also checks the sitemap, robots, single-hop legacy redirects, security headers and the 404.

`tests/links.spec.ts` crawls all internal links and fails on any broken link or orphan route. `tests/a11y.spec.ts` runs axe (WCAG 2.2 AA tags) on representative pages plus a skip-link check. `tests/navigation.spec.ts` covers the mega menu (hover, Escape, arrow keys), operating-model tabs and the mobile menu. `tests/contact.spec.ts` covers server validation, honeypot, origin check, rate limit and the UI submission path.

## Deployment

See `docs/deployment.md`. Short version: GitHub `main` → Vercel production; every push gets a preview with `noindex`. Do not change DNS until `docs/seo/launch-checklist.md` is complete.

## Content model

- **Services** (`content/services.ts`): 10 services in 5 pillars; each has SEO fields, hero, fit, capabilities, engagement steps, outcomes, FAQs and related slugs.
- **Solutions** (`content/solutions.ts`): outcome-oriented bundles referencing services, industries and articles.
- **Industries** (`content/industries.ts`): challenges, regulatory environment, related solutions/services/articles, FAQs.
- **Articles** (`content/articles/*.ts`): sections with ids, optional lists/tables, direct-answer summary, takeaways, references, author, published/reviewed dates.
- **Trust** (`content/trust.ts`): sections with `published` or `awaiting-client` status.
- **Case studies** (`content/case-studies.ts`): published only when `verified: true`.
- **Site facts** (`content/site.ts`): gated claims.

Adding a page: add the content object; routes, sitemap, navigation, related links and tests pick it up automatically.

## SEO system

- `lib/seo/metadata.ts` → `buildMetadata()` sets title, description, absolute canonical, OG/Twitter, robots. The root layout sets `metadataBase`, title template and environment-aware `robots`.
- JSON-LD builders in `lib/seo/json-ld.ts`; each page emits a single `@graph`. Organization/WebSite are global.
- `app/sitemap.ts` lists indexable routes with content-based `lastmod`. `app/robots.ts` disallows everything outside production.
- Branded OG images per route type via `lib/seo/og.tsx`.
- Documentation: `docs/seo/`.

## Redirect strategy

Legacy URLs are mapped in `docs/seo/url-migration-map.csv` and implemented as permanent redirects in `lib/seo/redirects.ts` (loaded by `next.config.ts`). Each maps to the closest relevant page, never blanket to `/`. Trailing-slash variants are normalized by Next.js. Verify against the client's site export before cutover; only `/` and `/home/` were confirmed indexed at build time.

## Security notes

- Security headers in `next.config.ts`: CSP (no `unsafe-eval` in production), HSTS with preload, nosniff, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy, COOP.
- Contact API: same-origin check, zod schema with length limits, honeypot, minimum fill time, optional Turnstile, per-client rate limit, service-role insert into an RLS-protected table, no form contents in logs or analytics.
- Secrets live only in environment variables; `.env*` is git-ignored; `.env.example` has no values.
- `security.txt` is served only after a verified security contact is configured.
- Dependencies are minimal and pinned via `pnpm-lock.yaml`; run `pnpm audit` before releases.
