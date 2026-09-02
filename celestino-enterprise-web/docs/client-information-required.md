# Client Information Required Before Launch

Every item below is either unverified or conflicting in public sources. The site is built so that each renders a clean placeholder until confirmed; nothing here blocks development, but several items block **launch** (marked ⛔). Where a value is confirmed, update `src/content/site.ts` and flip `verified: true`.

| # | Item | Why we need it | Where it appears | Current state | Blocks launch |
| --- | --- | --- | --- | --- | --- |
| 1 | Official legal company name | Organization schema, footer, terms | `site.legalName` | Public record shows "Celestino Enterprise LLC" (VA SCC S8616122) with status **INACTIVE, auto-cancelled 2024-01-31**. Must confirm current registration or corrected entity. | ⛔ |
| 2 | Public business address | Footer, Organization schema, Google Business Profile NAP | `site.address` | 13329 Fredericksburg Tpke, Woodford VA 22580 appears in directories but property listings suggest a residence. Site publishes **city-level only** until told otherwise. | No |
| 3 | Primary phone number | Utility rail, footer, contact page, ContactPoint schema | `site.phone` | Directories conflict: (202) 650-8607 vs (804) 632-6521. Neither published. | ⛔ |
| 4 | Sales / general email | Footer, contact page, schema | `site.email` | Directory lists JCelestino@celestinoenterprise.com (unconfirmed). Not published. | ⛔ |
| 5 | Security disclosure email | `/.well-known/security.txt`, responsible-disclosure page | `site.securityContactEmail` | Not supplied. security.txt returns 404 until set. | No (recommended) |
| 6 | Support hours & coverage tiers | Nationwide support page, FAQ, managed IT page | `site.support.hours` | Directories say Mon–Fri 9–5; existing site says "up to 24/7/365". Confirm contracted tiers. | No |
| 7 | Leadership names, roles, bios, photos | About page, author profiles, Person schema | `site.people`, `src/content/authors.ts` | Registered agent is Josefino Celestino; background per RocketReach unverified. Articles attributed to "Celestino Engineering Team" until named authors are confirmed. | No |
| 8 | Founding year / "25+ years" basis | Hero trust element, About | `site.experienceYears` | Existing site title says 25+; LLC formed 2019; ZoomInfo says founded 2017. Site phrases it as "years of IT engineering experience". Confirm wording. | ⛔ |
| 9 | "Award-winning" | Existing site copy | not rendered | No award named anywhere. Not published. Supply award name, issuer, year to add. | No |
| 10 | Government / public-sector past performance | Government page, industry page, utility rail | `site.government.servesPublicSector` | Unknown. Page is a capabilities framework only. | No |
| 11 | UEI, CAGE, DUNS | Government page | `site.government.uei/cage/duns` | Unknown | No |
| 12 | NAICS codes | Government page, schema | `site.government.naics` | Candidates to confirm in SAM.gov: 541512, 541513, 541519, 541511, 541690, 518210 | No |
| 13 | SAM.gov, Virginia eVA, SWaM status | Government page, backlink program | `site.government.*` | Unknown | No |
| 14 | Business classifications (small, minority-owned, veteran-owned, etc.) | Government page | `site.government.businessClassifications` | Unknown | No |
| 15 | Contract vehicles / cooperative contracts | Government page | `site.government.contractVehicles` | Unknown | No |
| 16 | Capability statement PDF | Government page download | `site.government.capabilityStatementUrl` | Not supplied | No |
| 17 | Staff certifications (CompTIA, Microsoft, Cisco, CISSP, etc.) | Trust Center → Certifications, About | `site.certifications` | None documented | No |
| 18 | Technology partnerships and tiers (Microsoft, Datto, ConnectWise, Fortinet, etc.) | Trust layer logo strip, Trust Center, footer | `site.partners` | None documented; Magento/Shopify/BigCommerce are experience claims only | No |
| 19 | Company attestations (SOC 2, ISO 27001, cyber-insurance) | Trust Center → Compliance | `src/content/trust.ts` | None documented | No |
| 20 | Case studies (per template below) | Case-study system, industry pages, home | `src/content/case-studies.ts` | None verified. Existing portfolio items "Phenom Nation", "Aerogin USA" lack detail and permission. | No |
| 21 | Testimonials with named, consenting sources | Case studies | `CaseStudy.testimonial` | None | No |
| 22 | Customer logos with permission | Trust layer | `site.partners` / case studies | None | No |
| 23 | Social profile URLs (LinkedIn company page, Facebook) | Footer, Organization sameAs | `site.social` | Personal-style LinkedIn URL exists; company page unconfirmed | No |
| 24 | Client portal / incident line URLs | Utility rail | `site.utility` | Unknown | No |
| 25 | Privacy contact | Privacy page | Privacy page copy | Not supplied | No |
| 26 | Brand assets (logo files, colors) | Logo, favicon, OG images | `src/components/layout/logo.tsx` | Original mark designed for rebuild; replace if official artwork exists | No |
| 27 | Team / environment photography | About, industry pages | none rendered | Not supplied; no stock used | No |
| 28 | Google Business Profile ownership | Local SEO | docs/seo | Unknown | No |
| 29 | Google Search Console & GA4 access | Analytics, launch | env vars | Not supplied | ⛔ for measurement |
| 30 | Domain registrar / DNS access | Cutover | Vercel | Not supplied | ⛔ |
| 31 | Existing site export or screenshots | Migration completeness | docs/seo/url-migration-map.csv | Live crawl blocked in build environment; only `/` and `/home/` confirmed indexed | ⛔ for redirect verification |
| 32 | Confirmation of service claims: 24/7/365 model, nationwide onsite delivery method, emergency onsite terms, penetration testing, SOC/MDR | Service pages | `src/content/services.ts` | Published in hedged form from existing site copy | ⛔ (review) |

## Case study intake template

For each engagement to publish: client name (or anonymization), industry, services, environment (users, sites, platforms), challenge, risk, solution, implementation steps, measured outcomes (with the client's sign-off on every figure), technologies, optional testimonial with name and role, written permission on file.

## Author intake template

Name, role, credentials (with issuing body), short bio, headshot with usage rights, LinkedIn URL.
