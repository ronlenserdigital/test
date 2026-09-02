# SEO & Analytics Measurement Plan — celestinoenterprise.com

**Prepared:** 2026-09-02 · stack assumption: Next.js on Vercel, GA4 via GTM (or `@next/third-parties`), Google Search Console, Vercel Web Analytics + Speed Insights, optional Bing Webmaster Tools, Semrush or Ahrefs (paid; for rank + AI visibility), Looker Studio for reporting.

## Method & limitations

- Tool capabilities cited (GA4 key events and lead-lifecycle recommended events; Vercel Web Analytics `track()` custom events available on Pro/Enterprise plans, client- and server-side; Speed Insights Real Experience Score; Semrush AI Toolkit and Ahrefs Brand Radar for AI-answer visibility) come from vendor documentation snippets as of mid-2026 and should be confirmed against current plan entitlements.
- Baselines for a rebuilt small-business site will be small; treat month-over-month percentages with skepticism until monthly organic sessions exceed roughly 500 and key events exceed ~20/month.
- **No ranking guarantees:** see section 9.

## 1. Objectives → KPIs

| Objective | Primary KPI | Supporting KPIs | Target window |
|---|---|---|---|
| Generate qualified inbound leads | Key events: `contact_submit`, `assessment_submit`, `phone_click` (from organic + direct + referral) | Lead-to-opportunity rate (CRM), cost per organic lead (staff/content hours) | Monthly; quarterly trend |
| Own regional demand | GSC clicks & impressions for queries containing Fredericksburg / Richmond / Stafford / Spotsylvania / Caroline / Virginia; GBP actions (calls, direction requests, website clicks) | Local pack presence for 10 tracked local terms (position band, not exact rank) | Monthly |
| Build topical authority | Organic sessions to `/resources/` and pillar guides; number of URLs with ≥1 GSC click; AI-answer citations | Internal-link click-through from resources to service pages; `resource_download` | Monthly |
| Public-sector pipeline | `government_capability_download`, GSC clicks on Government pages, referral sessions from eVA/SBSD/locality domains | Bid invitations received (manual log) | Quarterly |
| Technical health | Core Web Vitals pass rate (GSC CWV report + Speed Insights RES): LCP ≤ 2.5 s (note: some 2026 sources report Google tightening to 2.0 s — verify in web.dev), INP ≤ 200 ms, CLS ≤ 0.1 at p75 | Index coverage, crawl errors, 404s, redirect chains | Weekly (automated), monthly (review) |
| Trust & E-E-A-T | Referring domains from Virginia .gov/.edu/.org and chambers; reviews count/rating (Google, Clutch) | Branded search impressions (GSC, query contains "celestino") | Monthly |

## 2. Tools & responsibilities

| Tool | Purpose | Owner | Notes |
|---|---|---|---|
| Google Search Console | Queries, pages, CWV, indexing, sitemaps, manual actions | SEO lead | Verify both `https://celestinoenterprise.com` and domain property; submit `sitemap.xml`; export monthly via API/Looker Studio |
| GA4 | Sessions, engagement, events, key events, attribution | Marketing | One property; two data streams only if a separate staging domain is measured; enable Google Signals only after privacy review; set data retention to 14 months |
| Google Tag Manager | Event deployment, consent handling | Web dev | Use `dataLayer.push` from the app; server-side GTM is optional later |
| Vercel Web Analytics | Privacy-friendly pageviews + custom events (`track()`), no cookies | Web dev | Mirror the key CTA events so there is a second, consent-independent count |
| Vercel Speed Insights | Field CWV per route, Real Experience Score | Web dev | Alert on RES drop > 10 points after a deploy |
| Bing Webmaster Tools | Bing/Copilot index, IndexNow | SEO lead | Low effort; Copilot answers draw on Bing |
| Google Business Profile | Local actions, search terms, photos | Marketing | Monthly export of Performance data |
| Semrush AI Toolkit or Ahrefs Brand Radar (pick one) | Rank tracking (position bands), AI answer mention/citation tracking, backlink audit | SEO lead | Budget item; if unavailable, use manual AI prompt panel (section 7) |
| CRM (HubSpot free tier or equivalent) | Lead source of truth; `qualify_lead`/`close_convert_lead` feedback to GA4 via Measurement Protocol (optional) | Sales | Store `gclid`/`utm` and landing page with each lead |

## 3. Event taxonomy

Conventions: snake_case; verb-object where possible; every event carries `page_path`, `page_type` (`home | service | solution | industry | government | trust | resource | contact | article`), and `cta_location` where relevant (`header | hero | inline | sidebar | footer | sticky`). Do not send PII in parameters.

| Event name | Fires when | Parameters | GA4 key event? | Vercel `track()` mirror | Notes |
|---|---|---|---|---|---|
| `nav_cta_click` | Header/footer CTA click ("Get an assessment", "Contact") | `cta_text`, `cta_location`, `destination` | No | Yes | Micro-conversion; funnel step |
| `service_cta_click` | CTA within a service/solution/industry page body | `service_slug`, `cta_text`, `cta_location` | No | Yes | Attribute which pages drive intent |
| `assessment_start` | User begins the IT/security readiness assessment (first field focus or step 1 submit) | `assessment_type` (`it_readiness | security_readiness | cloud_readiness | ai_readiness`) | No | Yes | Funnel start |
| `assessment_submit` | Assessment completed and submitted | `assessment_type`, `score_band` (`low | medium | high`, never raw answers), `lead_id_hash` | **Yes** | Yes | Also fire GA4 recommended `generate_lead` with `value` and `currency` |
| `contact_start` | First interaction with the contact form | `form_id` | No | Yes | |
| `contact_submit` | Contact form successfully submitted (server-confirmed) | `form_id`, `inquiry_type` (`managed_it | cybersecurity | cloud | development | government | other`), `org_size_band` | **Yes** | Yes (server-side `track` from the Server Action) | Fire `generate_lead` too |
| `phone_click` | `tel:` link tap/click | `phone_location` (`header | contact | footer | gbp_deeplink`) | **Yes** | Yes | Weight lower than form submits in reporting |
| `email_click` | `mailto:` link click | `email_location` | Yes (secondary) | Yes | |
| `case_study_view` | Case study page viewed ≥ 15 s or 50% scroll | `case_study_slug`, `industry` | No | Yes | Engagement proxy for proof content |
| `resource_download` | Gated/ungated PDF, DOCX, XLSX download completed | `resource_slug`, `resource_type` (`checklist | template | guide | worksheet`), `gated` (bool) | Yes (gated only) | Yes | Serve files via a route handler so the event is server-confirmed |
| `outbound_partner_click` | Click to a partner/vendor/association site (Microsoft, Clutch, chamber, eVA, SBSD) | `partner_domain`, `link_location` | No | Yes | Also useful for auditing which trust links get used |
| `government_capability_download` | Capabilities statement PDF downloaded | `version`, `source_page` | **Yes** | Yes | Distinct from `resource_download` so public-sector interest is visible on its own |
| `search_site` (optional) | On-site search used | `search_term` | No | No | Only if site search exists |
| `video_progress` (optional) | 25/50/75/100% | `video_title`, `percent` | No | No | If webinars are embedded |

Key-event values (for GA4 `value` on `generate_lead`): `contact_submit` = 100, `assessment_submit` = 80, `government_capability_download` = 60, gated `resource_download` = 20, `phone_click` = 40. These are relative weights for reporting, not revenue.

Consent: load GA4 only after consent where required; Vercel Web Analytics runs cookie-less. Document the mode in the privacy policy (VCDPA-aware; the site itself will not meet VCDPA thresholds but the policy should still be accurate).

## 4. Baseline capture (before and at launch)

1. **Pre-launch (current site):** export GSC last 16 months (queries, pages, countries, devices), GBP performance last 6 months, any existing GA/Universal data, current backlink profile (Ahrefs/Semrush or GSC Links report), current index count (`site:` is approximate; use GSC Pages report), current CWV status. Save to `docs/seo/baselines/YYYY-MM/`.
2. **URL inventory + redirect map:** every old URL → new URL (301). Keep `/home/` → `/`. Verify no chains.
3. **Launch-day checklist:** robots.txt, XML sitemap submitted, canonical tags, `noindex` removed from staging, schema validated (Organization, LocalBusiness/ProfessionalService with `areaServed`, Service, BreadcrumbList, Article, FAQPage where visible), GA4/GTM/Vercel events tested in DebugView, GSC ownership on new property, Bing IndexNow key.
4. **T+30 / T+90 snapshots:** same exports; annotate GA4 and GSC (launch date, major content drops, GBP changes, core updates).

## 5. Reporting cadence

| Cadence | Audience | Contents |
|---|---|---|
| Weekly (automated, 10 min) | Web dev + SEO lead | GSC indexing errors, CWV regressions, Speed Insights RES, 404s, uptime, form test submission |
| Monthly | Owner/leadership | Key events by source; organic clicks/impressions/CTR by page group (service, solution, industry, government, resources); local query cluster performance; GBP actions; new referring domains; AI-visibility panel; top 5 wins / top 5 issues; next month's content and outreach |
| Quarterly | Leadership | Trend vs baseline; content ROI (leads per pillar); backlink program status vs `backlink-opportunities.md`; technical audit summary; keyword-map refresh; budget/tool decisions |
| Annually | Leadership | Full re-baseline; keyword map and competitor refresh; regulatory content re-verification (CMMC, HIPAA, VCDPA, § 2.2-5514) |

Looker Studio template pages: (1) Leads & key events, (2) Organic by page group, (3) Local & GBP, (4) Content & resources, (5) Technical health, (6) AI visibility.

## 6. Page-group segmentation (GA4 + GSC regex)

- Services: `^/services/`
- Solutions: `^/solutions/`
- Industries: `^/industries/`
- Government: `^/government/|^/industries/government`
- Resources: `^/resources/`
- Trust/Contact: `^/trust|^/contact`
- Local queries (GSC regex): `fredericksburg|richmond|stafford|spotsylvania|caroline|woodford|bowling green|king george|northern virginia|\bva\b|virginia`

## 7. AI-search visibility tracking

Google states generative features (AI Overviews, AI Mode) draw on the same index and ranking systems as classic Search, that there is no special markup, and that `llms.txt` has no effect on rankings or AI Overviews. Tracking therefore focuses on whether the brand is *cited or mentioned* in answers, not on a separate optimization track.

1. **Prompt panel (manual, monthly, free):** 25 fixed prompts run in Google AI Mode/AI Overviews, ChatGPT, Perplexity, Copilot, Gemini, and Claude, e.g. "best managed IT providers near Fredericksburg VA", "co-managed IT provider Richmond Virginia", "who can help a Virginia county with SEC530 alignment", "HIPAA compliant IT support Fredericksburg", "custom CRM developer Richmond VA". Record: brand mentioned (Y/N), cited URL, competitors named, answer summary. Store in a sheet; chart mention rate over time.
2. **Tool-based (if budget):** Semrush AI Toolkit or Ahrefs Brand Radar for share-of-voice across engines and which URLs get cited; Ahrefs' web-analytics channel split for ChatGPT/Perplexity/Claude/Gemini referrals.
3. **GA4 referral segment:** custom channel group "AI assistants" matching source regex `chatgpt|openai|perplexity|copilot|bing.*chat|gemini|claude|you\.com`; report sessions and key events from that group.
4. **GSC signal:** GSC does not separate AI Overview clicks; watch impressions-up/clicks-flat patterns on informational queries as a proxy and prioritize answer-first formatting on those pages.
5. **Entity hygiene:** consistent NAP, Organization schema with `sameAs` (GBP, LinkedIn, Clutch, SBSD directory when certified), author pages, and a Trust Center — these are what current guidance says helps AI systems ground the entity.

## 8. Alerts

- GA4: key events = 0 for 3 consecutive days (form breakage).
- GSC: new manual action, coverage errors +25% week over week, CWV "poor" URLs > 0 on service pages.
- Vercel: RES drop > 10 points or LCP p75 > 2.5 s on Home/Managed IT/Contact after a deploy.
- Uptime monitor on `/`, `/contact/`, and the form endpoint.

## 9. Explicit note on ranking promises

Nobody can promise a #1 ranking, a guaranteed local-pack position, or guaranteed inclusion in AI Overviews. Google's systems change continuously (core updates, spam updates such as June 2026, and rewritten AI-feature guidance in May 2026), and rankings are per-query, per-location, per-device, and personalized. This plan commits to **inputs and leading indicators** (technical health, published content quality, earned citations, measured engagement) and reports **outcomes as ranges and trends** (position bands, click share, lead volume). Any vendor or internal proposal that guarantees rankings should be treated as a red flag.
