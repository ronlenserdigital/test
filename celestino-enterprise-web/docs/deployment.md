# Deployment

## Topology

```
GitHub (celestino-enterprise-web)  ──push──▶  Vercel project
   main ────────────────────────────────────▶  Production  (celestinoenterprise.com)
   any other branch / PR ───────────────────▶  Preview     (*.vercel.app, noindex)
```

GitHub Pages is not used: the site relies on server rendering for the contact API, dynamic OG images and server-only secrets.

## Repository

The application lives in `celestino-enterprise-web/` inside the `ronlenserdigital/test` repository on branch `claude/celestino-enterprise-rebuild-3obrp3` (session-scoped GitHub access prevented creating a separate repository). To move it to its own repository, as the directive intends:

```bash
# from the test repo root
git subtree split --prefix=celestino-enterprise-web -b celestino-web-main
gh repo create ronlenserdigital/celestino-enterprise-web --private --source=. --push   # or create in the UI
git push git@github.com:ronlenserdigital/celestino-enterprise-web.git celestino-web-main:main
```

Then set `main` as the production branch and protect it (require PR + CI).

## Vercel project

Team: `ronlenserdigital's projects` (`team_7iDMD0f604trMthifz4L6vi7`, Hobby plan at time of writing).

Project created 2026-09-02: `celestino-enterprise-web` (`prj_lZvzuVwmam2nwkxMggBTEExWMkZx`), linked to `ronlenserdigital/test` with root directory `celestino-enterprise-web`, production branch `main`. Every push to the rebuild branch produces a preview deployment; production deploys once the app is merged to `main` (or the project is re-linked to a dedicated repository).

1. Import the repository (or use `create_git_project` with `rootDirectory: celestino-enterprise-web` if staying in the monorepo).
2. Framework preset: Next.js. Build `pnpm build`, install `pnpm install --frozen-lockfile`. Node 22.
3. Environment variables (Production):
   - `NEXT_PUBLIC_SITE_URL=https://celestinoenterprise.com`
   - `NEXT_PUBLIC_SITE_ENV=production`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server)
   - `RATE_LIMIT_SALT` (random 32+ chars)
   - optional `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
4. Environment variables (Preview): same, but `NEXT_PUBLIC_SITE_ENV=preview` and `NEXT_PUBLIC_SITE_URL` set to the preview origin or left at the apex (canonicals still point to the apex; previews are noindex).
5. Domains: add `celestinoenterprise.com` (primary) and `www.celestinoenterprise.com` (redirect to apex).
6. Enable Web Analytics and Speed Insights (the components are already mounted).
7. Firewall: add a rate-limit rule for `/api/contact` (10 requests / 10 min / IP) and enable bot protection. Deployment Protection on previews.
8. Vercel Hobby plan note: commercial sites should be on Pro for the firewall rules, longer function limits and team features.

## Environments and indexing

| Environment | `NEXT_PUBLIC_SITE_ENV` | robots.txt | meta robots |
| --- | --- | --- | --- |
| Production | `production` | allow all, sitemap | index, follow |
| Preview / local | anything else | disallow all | noindex, nofollow |

Only `NEXT_PUBLIC_SITE_ENV=production` enables indexing. A production deployment on a `*.vercel.app` URL without that variable stays noindex, so nothing is indexed before the domain cutover.

## Release procedure

1. Open a PR into `main`; Vercel builds a preview.
2. Run `pnpm verify` and `pnpm test` locally or in CI against the preview (`BASE_URL=<preview> pnpm exec playwright test`).
3. Complete `docs/seo/launch-checklist.md` section A for the first release; section D after every content release.
4. Merge. Vercel deploys production.

## DNS cutover (first launch only)

Follow `docs/seo/launch-checklist.md` sections B and C. Keep the legacy host reachable (not DNS-published) for 30 days for reference.

## Rollback

Vercel → Deployments → promote the previous production deployment. Redirects and headers are part of the build, so a rollback restores them too.
