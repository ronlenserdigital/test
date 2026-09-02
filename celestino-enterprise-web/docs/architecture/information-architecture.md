# Information Architecture

Status: locked for build (2026-09-02). Derived from `docs/research/existing-site-audit.md`, `docs/research/cybersecurity-competitive-audit.md` and `docs/seo/keyword-map.md`.

## 1. What Celestino actually sells

The existing site lists fourteen loosely related offerings. Verified capability groups, in the order a buyer evaluates them:

| Pillar | Label on site | Verified services behind it |
| --- | --- | --- |
| Protect | Cybersecurity & Risk | Cybersecurity services; Security & Risk Advisory (HIPAA/FINRA/SOX compliance support) |
| Operate | Managed IT & Infrastructure | Managed IT (business IT support); Co-Managed IT; Network Management |
| Recover | Backup, Recovery & Continuity | Backup & Disaster Recovery |
| Modernize | Cloud & Infrastructure | Cloud services / consulting, hybrid infrastructure |
| Build | Secure Application Engineering | Software & application development; Web & ecommerce engineering; AI & automation |

Positioning: one operating team that protects, runs, recovers, modernizes and builds. The Assess → Design → Secure → Operate → Monitor → Improve model connects the pillars.

Not claimed (no verification): SOC/MDR/SIEM as named products, penetration testing as a product, Zero Trust programs, any certification, any partnership tier, any customer.

## 2. Route map

```
/                                   Home
/services                           Services hub (pillar-organized)
/services/managed-it
/services/co-managed-it
/services/cybersecurity
/services/cloud-infrastructure
/services/network-management
/services/backup-disaster-recovery
/services/security-risk-advisory
/services/software-development
/services/web-application-engineering
/services/ai-automation
/solutions                          Solutions hub (by outcome)
/solutions/cyber-resilience
/solutions/infrastructure-modernization
/solutions/business-continuity
/solutions/cloud-security
/solutions/secure-application-engineering
/solutions/it-operational-resilience
/industries
/industries/government-public-sector
/industries/healthcare
/industries/financial-services
/industries/professional-services
/industries/smb-mid-market
/government                         Public-sector capabilities + procurement data (config-driven)
/about
/approach                           Operating model
/nationwide-support
/trust                              Trust Center hub
/trust/[section]                    security-practices, privacy, data-handling, responsible-disclosure,
                                    compliance, certifications, accessibility, security-advisories
/resources                          Insights hub
/resources/topics/[category]        8 categories
/resources/[slug]                   Articles
/authors/[slug]
/case-studies                       Hub (renders verified only; empty-state explains process)
/case-studies/[slug]
/contact                            ?intent=assessment|expert|general|support|security
/contact/thanks
/privacy
/terms
/404
/sitemap.xml  /robots.txt  /manifest.webmanifest  /llms.txt (optional, accurate)
/.well-known/security.txt           served only when security contact is verified
/api/contact                        POST only
```

## 3. Navigation

Primary: Services · Solutions · Industries · Why Celestino · Resources · [Request an assessment]
Secondary header link: Contact. Utility rail renders only verified items (none at launch until phone/portal confirmed).

Mega menu groups (desktop): see `src/content/navigation.ts`. Mobile: full-screen panel with grouped accordions, primary CTA pinned, search not included at launch (no search backend).

## 4. Internal link clusters

- Cybersecurity cluster: /services/cybersecurity ↔ /services/security-risk-advisory ↔ /solutions/cyber-resilience ↔ /solutions/cloud-security ↔ NIST/HIPAA/CMMC/readiness articles ↔ healthcare, financial, government industries.
- Managed IT cluster: /services/managed-it ↔ /services/co-managed-it ↔ /services/network-management ↔ /services/cloud-infrastructure ↔ /services/backup-disaster-recovery ↔ /solutions/it-operational-resilience ↔ operating-model decision guides.
- Application cluster: /services/software-development ↔ /services/web-application-engineering ↔ /services/ai-automation ↔ /solutions/secure-application-engineering ↔ secure-development checklist.
- Every service page links: pillar siblings, 2 solutions, 3 industries, 2–3 articles, contact. Every article links 2–4 services and 2–3 articles. No orphans; verified by the link-check test.

## 5. Content decisions

- Content lives in typed TypeScript under `src/content` (Git-managed). Rationale: low change frequency, engineering-led editorial workflow, zero runtime dependency, full type safety for SEO fields. Supabase holds only runtime data (contact submissions) and an optional articles table for a future editorial workflow (migration included, unused by the site until enabled).
- Claims are gated by `verified` flags in `src/content/site.ts`. Unverified values render structured placeholders, never invented content.
- Case studies: none published until verified. Hub explains the standard.

## 6. Conversion paths

1. Header CTA → /contact?intent=assessment (form pre-selects "Request an assessment").
2. Service page → mid-page CTA band → assessment.
3. Article → related services → contact.
4. Government page → capability statement download (when supplied) → contact?intent=government.
5. Utility rail (when verified): phone click, support link.

## 7. Measurement hooks

`data-event` attributes on CTAs feed the analytics event taxonomy in `docs/seo/measurement-plan.md`.
