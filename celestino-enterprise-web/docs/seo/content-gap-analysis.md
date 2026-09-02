# Content Gap Analysis — celestinoenterprise.com rebuild

**Prepared:** 2026-09-02 · companion to `keyword-map.md`, `competitive-analysis.md`

## Method & limitations

- Current-site inventory derived from indexed URLs and snippets (`/`, `/home/`, service list: Business IT Support, Co-Managed IT, Cloud, Nationwide onsite, Web/Web app/Mobile app dev, Enterprise solutions, Ecommerce, CMS, Full-stack, System integrations, Cloud consulting). Pages were not fetched; depth of existing copy is inferred from snippets ("award winning IT Solutions Company… 25+ years").
- Competitor gaps observed from indexed URL patterns of JustTech, Rappahannock IT, Fredericksburg Technology, Businets, E-N Computers, BMA Enterprises, Elite IT Group, NTS, Bastionpoint, PCRx, Capital Techies, BELNIS, and national reference sites (Ntiva, Dataprise, Coretelligent).
- Demand tiers are qualitative (see `keyword-map.md`). Regulatory facts cited (CMMC 48 CFR effective 2025-11-10; HIPAA Security Rule NPRM 2025-01-06 with final action pushed toward 2027; Virginia Code § 2.2-5514; VCDPA SB 338 geolocation change effective 2026-07-01; VITA SEC530 based on NIST 800-53 Rev 5) come from search snippets and should be re-verified against primary sources at publication time.

## 1. What the current site lacks

| Gap | Evidence | Why it matters |
|---|---|---|
| No dedicated page per service | Services exist as a list under `/home/`; no `/services/managed-it-services/` style URLs surfaced in search | Google cannot rank a list item; every regional competitor has one URL per service |
| No location/service-area signal beyond NAP | Snippets show address but no "Fredericksburg / Stafford / Spotsylvania / Caroline / Richmond" service-area content | Local pack and "near me" queries depend on GBP + on-page area statements |
| No proof assets | No case studies, client logos, testimonials, portfolio for app/web work, team bios, certifications surfaced | E-E-A-T; also blocks Clutch/GoodFirms verification and procurement past-performance sections |
| No compliance depth | HIPAA/FINRA/SOX appear as a single line ("compliance support") | Competitors (Rappahannock IT, E-N Computers) publish CMMC/HIPAA/NIST content; buyers search these by name |
| No public-sector track | Nothing about eVA, SWaM, SAM.gov, capabilities statement, COOP, SEC530, WCAG 2.2 | Regional demand exists (Caroline/Spotsylvania/Stafford/King George localities; Fort A.P. Hill, Quantico, NSWC Dahlgren contractor ecosystem) and no regional MSP owns it |
| No decision/educational content | No blog/resources indexed | Zero informational footprint means zero AI Overview citations and no internal-link authority for money pages |
| Trust/legal hygiene | Virginia SCC snippet shows entity status INACTIVE; "award winning" claim has no named award | Contradicts any Trust Center; procurement officers check SCC |
| No AI & Automation narrative | Not on current site | Fastest-growing SMB query cluster in the MSP category (Copilot, automation, AI policy) |
| No structured data / technical hygiene visible | Cannot confirm; assume none | Needed for LocalBusiness, Service, FAQ, Article, BreadcrumbList |

## 2. What competitors have that Celestino lacks (regional)

- **Location-modified service pages** (JustTech: 6+ Fredericksburg/Stafford/Northern Neck posts; E-N Computers: `/areas-we-serve/` pages for Fredericksburg, Richmond, Charlottesville, Waynesboro).
- **Compliance vertical content** (Rappahannock IT: CMMC/NIST 800-171/DFARS/ITAR/HIPAA/PCI; E-N Computers: CMMC RPO, GCC High, "best CMMC MSPs" listicles, financial-services page, defense contractors page).
- **Recurring educational events** (Fredericksburg Technology: webinar series on cybersecurity, compliance, cloud migration, AI governance).
- **Adjacent physical services** used as local link/relationship magnets (Businets/Fredericksburg Technology: structured cabling, access control, AV) — not to copy, but shows how they earn local citations.
- **"Best MSPs in Virginia" listicles** (E-N Computers, Capital Techies) that rank for comparison queries.

What none of them have (openings):
1. A public-sector procurement + security explainer for Virginia localities.
2. A combined "we build software and we run your IT" positioning with a secure-SDLC story.
3. Decision-guide content written for the buyer (Managed vs Co-Managed, Backup vs DR, BC vs DR, In-house vs Managed) rather than vendor-centric "what is X" posts.
4. Caroline County presence.
5. An AI readiness / AI governance track for SMBs.

## 3. Pillar / cluster plan

Each pillar is a long-form guide (2,500–4,500 words, updated at least annually, dated, with a named author bio). Clusters are 900–1,800-word pieces that link up to the pillar and across to the money page.

| Pillar (URL) | Money page it supports | Clusters |
|---|---|---|
| **P1. The SMB Guide to Managed IT in Virginia** `/resources/guides/managed-it-services-guide/` | Managed IT, Co-Managed IT, SMB industry | Managed vs Co-Managed decision guide · In-house vs Managed cost model · What an MSP SLA should contain · Managed IT pricing models · Questions to ask an MSP before signing · IT budget benchmarks for 10–250 employees |
| **P2. NIST CSF 2.0 Implementation Guide for Small and Mid-Sized Businesses** `/resources/guides/nist-csf-2-0-smb/` | Cybersecurity, Cyber Resilience, Compliance | Govern function explained · Cybersecurity readiness checklist · Cyber insurance readiness checklist · Incident response plan template · Tabletop exercise kit · Microsoft 365 security hardening checklist · MFA rollout plan |
| **P3. Backup, Disaster Recovery and Business Continuity: The Complete SMB Guide** `/resources/guides/backup-dr-business-continuity/` | Backup & DR, Business Continuity, IT Operational Resilience | Backup vs DR · BC vs DR · RTO/RPO worksheet · Does Microsoft 365 back up my data? · Backup testing schedule · BIA worksheet · Ransomware recovery runbook |
| **P4. Compliance-Driven IT: HIPAA, CMMC, FINRA/SEC, SOX, FTC Safeguards** `/resources/guides/compliance-it-guide/` | Compliance, Healthcare, Financial Services | HIPAA cybersecurity considerations (2025 NPRM) · HIPAA risk analysis checklist · CMMC readiness concepts (scoping, CUI, 800-171 vs CMMC) · FTC Safeguards for CPA/tax firms · FINRA Rule 4370 BCP basics · SOX ITGC primer · VCDPA: does it apply to my business? |
| **P5. Selling IT to Virginia's Public Sector: Procurement, Security and Accessibility** `/resources/guides/virginia-public-sector-it-guide/` | Government industry, Government capabilities page, Web & App Engineering | eVA explained for vendors · SWaM certification: eligibility & benefits (eVA fee cap $500 vs $1,500) · SAM.gov/UEI/NAICS for IT firms · VITA SEC530 in plain language · Virginia § 2.2-5514 24-hour incident reporting · COOP planning for localities · WCAG 2.2 / ADA Title II for county sites |
| **P6. Cloud & Infrastructure Modernization Playbook** `/resources/guides/cloud-infrastructure-modernization/` | Cloud & Infrastructure, Infrastructure Modernization, Cloud Security, Network Management | Cloud migration readiness checklist · Cloud vs on-prem TCO · Windows Server lifecycle planning · Shared responsibility model · Office network design checklist · 3-year technology roadmap template |
| **P7. Custom Software, Integrations and AI for Growing Businesses** `/resources/guides/custom-software-ai-guide/` | Software & App Dev, Web & App Engineering, AI & Automation, Secure Application Engineering | Custom vs off-the-shelf decision guide · Build vs buy scorecard · API integration primer · Secure SDLC checklist (OWASP/SSDF) · AI readiness checklist · AI acceptable-use policy template · Copilot readiness: data hygiene first |

## 4. Prioritized content pieces (28)

Priority: **P0** = pre-launch/launch, **P1** = first 90 days, **P2** = 90–180 days, **P3** = 6–12 months. Formats: Guide (pillar), Decision guide, Checklist (gated or ungated PDF + HTML), Template, Explainer, Case study, Capabilities doc.

| # | Title | Intent | Cluster | Format | Why | Priority |
|---|---|---|---|---|---|---|
| 1 | Managed IT vs Co-Managed IT: A Decision Guide for Virginia Businesses with 10–300 Employees | C/I | P1 | Decision guide + comparison table + 8-question self-scorer | Directly supports two money pages; site already offers both; few regional competitors have a co-managed page | P0 |
| 2 | Government & Public Sector Capabilities Statement (HTML + 1-page PDF) | T/N | P5 | Capabilities doc | Required artifact for eVA/SAM/procurement outreach; unlocks `government_capability_download` event | P0 |
| 3 | Cybersecurity Readiness Checklist for Small Businesses (NIST CSF 2.0-aligned, 40 items) | I/C | P2 | Checklist (HTML + PDF) | Top-of-funnel asset for Cybersecurity page; feeds `assessment_start` flow | P0 |
| 4 | Backup vs Disaster Recovery: What Each One Actually Restores | I | P3 | Explainer + diagram + RTO/RPO table | High PAA demand; anchors Backup & DR page | P0 |
| 5 | Business Continuity vs Disaster Recovery (and Where COOP Fits for Local Government) | I | P3 | Explainer | Pairs with #4; the COOP angle is unique regionally | P0 |
| 6 | NIST CSF 2.0 Implementation Guide for SMBs (Govern → Recover, with a 12-month roadmap) | I | P2 pillar | Guide | Framework most SMB buyers and insurers reference; NIST's own SP 1300 is the citation | P1 |
| 7 | HIPAA Cybersecurity Considerations for Practices in 2026: What the Proposed Security Rule Changes Mean | I/C | P4 | Explainer + prep checklist | NPRM mandates MFA, encryption, asset inventory, annual risk analysis, 6-month vuln scans; status must be re-verified at publish | P1 |
| 8 | CMMC Readiness Concepts: Scoping, CUI, and NIST 800-171 vs CMMC Level 2 | I | P4 | Explainer | High regional demand (Quantico/Dahlgren/NoVA); position as concept education, not certification services | P1 |
| 9 | Selling IT to Virginia's Public Sector: eVA, SWaM, SAM.gov and What Localities Expect | I | P5 pillar | Guide | Unoccupied regional niche; earns links from SBDC/economic-development sites | P1 |
| 10 | In-House IT vs Managed IT: A Cost Model You Can Copy (spreadsheet) | C/I | P1 | Decision guide + downloadable model | Non-commodity; supports Managed IT + Professional Services | P1 |
| 11 | IT Budget Benchmarks for Virginia Businesses with 10–250 Employees | I | P1 | Explainer with method note | Fills "how much should I spend" PAA; cite sources, avoid invented numbers | P1 |
| 12 | Cyber Insurance Readiness Checklist: The 12 Controls Underwriters Ask About | I/C | P2 | Checklist | Insurers drive SMB security purchases more than regulation does | P1 |
| 13 | Ransomware Incident Response Plan Template for Small Businesses | I | P2/P3 | Template (DOCX/PDF) | Strong download asset; links to Backup & DR and Cyber Resilience | P1 |
| 14 | Microsoft 365 Security Hardening Checklist (Entra Conditional Access, Defender, Secure Score) | I | P2/P6 | Checklist | Most SMB clients are on M365; supports Cloud Security solution | P1 |
| 15 | Virginia's 24-Hour Cyber Incident Reporting Rule (§ 2.2-5514): What Public Bodies Must Do | I | P5 | Explainer | Specific, citable, evergreen with annual review; links Government + Compliance | P1 |
| 16 | Case study: [Client sector] — co-managed helpdesk + DR for a [size] organization | C | P1/P3 | Case study | First proof asset; needed for Clutch/GoodFirms and procurement past performance | P1 |
| 17 | Case study: Custom CRM/API integration for [sector] | C | P7 | Case study | Proof for the dev side of the business | P1 |
| 18 | Cloud Migration Readiness Checklist (identity, data, apps, network, security, cost) | I/C | P6 | Checklist | Supports Cloud & Infrastructure + Infrastructure Modernization | P2 |
| 19 | Cloud vs On-Prem TCO for a 25-Person Office: Worked Example | I | P6 | Explainer + worksheet | Decision content that vendors rarely publish honestly | P2 |
| 20 | Custom vs Off-the-Shelf Software: A Build-vs-Buy Scorecard | C/I | P7 | Decision guide | Supports Software & App Dev; low regional competition | P2 |
| 21 | AI Readiness Checklist for SMBs (data, identity, policy, use cases, Copilot prerequisites) | I/C | P7 | Checklist | Rising demand; no regional MSP owns it | P2 |
| 22 | AI Acceptable-Use Policy Template for Small Businesses | I | P7 | Template | High download intent; positions AI & Automation page | P2 |
| 23 | FTC Safeguards Rule Checklist for CPA, Tax and Mortgage Firms | I/C | P4 | Checklist | Financial Services page support; applies to many Fredericksburg/Richmond firms | P2 |
| 24 | WCAG 2.2 and ADA Title II: What Virginia Local Government Websites Must Fix | I/C | P5/P7 | Explainer + audit checklist | Bridges Web & App Engineering and Government page; deadlines create urgency | P2 |
| 25 | Business Impact Analysis Worksheet (with RTO/RPO by system) | I | P3 | Template | Feeds Business Continuity solution | P2 |
| 26 | Secure SDLC Checklist for Small Dev Teams (OWASP Top 10 2025, NIST SSDF) | I | P7 | Checklist | Supports Secure Application Engineering; citable | P2 |
| 27 | Windows Server and Windows 10 End-of-Support Planning for SMBs | I/C | P6 | Explainer | Drives Infrastructure Modernization conversations; refresh annually | P3 |
| 28 | 3-Year Technology Roadmap Template for Growing Businesses and Localities | I | P6/P1 | Template | vCIO/advisory positioning; ties Co-Managed IT advisory service | P3 |

## 5. Editorial standards that protect rankings

- **Author + reviewer bylines** with credentials on every guide (E-E-A-T; required for AI Overview trust signals).
- **Dated, versioned, and re-verified**: compliance pieces carry "last reviewed" and a change log. CMMC phase status and HIPAA final-rule status change; stale claims are a liability.
- **Cite primary sources** (NIST SP 1300, HHS OCR, DoD CIO, VITA PSGs, SBSD, eVA, Virginia Code) — not competitor blogs.
- **No scaled/templated town pages.** One service-area block + real proof beats ten "IT support in [town]" pages (Google's scaled-content and site-reputation policies, enforced algorithmically since Aug 2025).
- **Answer-first structure**: definition in the first 60 words, then detail; H2s phrased as the questions in `keyword-map.md`; FAQ schema only where the FAQ is visible on the page.
- **Gating**: ungate HTML versions; gate only PDF/DOCX templates behind a light form (name, email, org). Gated pages still need substantive on-page summaries so they can rank.
