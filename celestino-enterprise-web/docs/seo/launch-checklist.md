# Launch Checklist

Use in order. Items marked ⛔ block DNS cutover.

## A. Pre-cutover (staging on Vercel preview URL)

- [ ] ⛔ `pnpm typecheck && pnpm lint && pnpm build` pass on the release commit
- [ ] ⛔ Playwright suite green (`pnpm test`): routes, nav, forms, axe, links
- [ ] ⛔ Client-verified values entered in `src/content/site.ts` for every ⛔ row in `docs/client-information-required.md`
- [ ] ⛔ Redirects verified: every `redirect_required=yes` row in `url-migration-map.csv` returns 301 to the mapped destination (script: `pnpm check:redirects <base-url>`)
- [ ] ⛔ No redirect chains (`/home/` → `/` in one hop)
- [ ] ⛔ Preview deployment returns `X-Robots-Tag`-equivalent `noindex` (meta robots) and `robots.txt` disallows all
- [ ] Forms submit to Supabase from preview with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` set; row visible in dashboard; anon key cannot read the table
- [ ] Honeypot and timing rejections confirmed (submit with `website` filled → 200, no row)
- [ ] Turnstile keys set if used; widget renders; invalid token returns 400
- [ ] Rate limit: 6th submission in 10 minutes returns 429
- [ ] Security headers present on every response (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors none); no CSP violations in console across all templates
- [ ] Lighthouse mobile on home, a service page, an article, contact: Performance ≥ 95, A11y ≥ 95, Best Practices ≥ 95, SEO 100
- [ ] Manual keyboard pass: skip link, mega menu (arrows, Enter, Escape), mobile menu (focus, Escape, scroll lock), operating model tabs, accordions, contact form
- [ ] Screen reader pass (VoiceOver + NVDA) on home, service, article, contact
- [ ] Reduced-motion check: hero and reveals static, content complete
- [ ] Responsive pass at 320/375/390/430/768/1024/1280/1440/1920: no horizontal scroll, tables scroll internally, tap targets ≥ 44px
- [ ] Cross-browser: Chrome, Edge, Safari, Firefox (desktop and mobile)
- [ ] Structured data validated (Rich Results Test + Schema Markup Validator) on home, service, article, FAQ pages; no warnings for invented fields
- [ ] Every page: unique `<title>`, meta description, canonical (absolute, apex domain), OG image renders
- [ ] `sitemap.xml` lists only indexable URLs; `lastmod` matches content dates
- [ ] `security.txt` served only if security contact verified
- [ ] No placeholder or lorem text in HTML (`pnpm check:placeholders`)
- [ ] No secrets in repo (`git log -p | grep -i "service_role"` empty; `.env.local` ignored)

## B. Vercel production configuration

- [ ] ⛔ Project linked to GitHub repo, production branch `main`
- [ ] ⛔ Environment variables (Production): `NEXT_PUBLIC_SITE_URL=https://celestinoenterprise.com`, `NEXT_PUBLIC_SITE_ENV=production`, Supabase vars, `RATE_LIMIT_SALT`, optional GA/Turnstile
- [ ] ⛔ Preview environment has `NEXT_PUBLIC_SITE_ENV=preview` (never production)
- [ ] Domains: `celestinoenterprise.com` primary, `www` → apex 308 redirect
- [ ] Vercel Web Analytics and Speed Insights enabled
- [ ] Vercel Firewall: rate-limit rule on `/api/contact` (e.g. 10 req / 10 min per IP), bot protection on
- [ ] Deployment Protection on previews (password or Vercel auth)

## C. Cutover

- [ ] ⛔ Backup of current site (export/screenshots) archived in `docs/research/legacy-archive/` (client to supply)
- [ ] Lower DNS TTL 24h before
- [ ] Point apex + www to Vercel; confirm HTTPS certificate issued
- [ ] Verify canonical tags now resolve to production domain (not `*.vercel.app`)
- [ ] Verify `robots.txt` on production allows crawling and references sitemap
- [ ] Verify `<meta name="robots">` is `index, follow` on production home

## D. Post-launch (first 14 days)

- [ ] Search Console: verify domain property, submit `sitemap.xml`, inspect `/`, top services, top articles
- [ ] Bing Webmaster Tools: verify, submit sitemap
- [ ] Watch Coverage/Pages report for 404s and redirect errors daily for 7 days
- [ ] Check Core Web Vitals report and Vercel Speed Insights after 7 days of field data
- [ ] Confirm GA4 events firing: `nav_cta_click`, `contact_submit`, `assessment_submit`
- [ ] Google Business Profile: website URL updated, NAP consistent with site
- [ ] Update directory listings (Yelp, Nextdoor, ZoomInfo) to the confirmed phone/address
- [ ] Begin backlink program month 1 (`docs/seo/backlink-opportunities.md`)
- [ ] Capture baseline per `docs/seo/measurement-plan.md`
