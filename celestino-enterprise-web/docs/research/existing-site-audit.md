# Existing Site Audit: celestinoenterprise.com

Audit date: 2026-09-02
Purpose: inventory the current public website and third-party footprint of Celestino Enterprise before migration to the new Next.js site, so that content, claims and URLs can be kept, rewritten or redirected deliberately.

---

## 1. Method and limitations

**What was done**

- Roughly 60 web searches were run against the search index (Google/Bing-style queries) using `site:celestinoenterprise.com`, quoted URL paths (`"celestinoenterprise.com/services"`, `/web-development`, `/contact`, `/about`, `/mobile-app-development`, `/cybersecurity`, `/it-solutions`, `/consultancy`, `/portfolio`, `/blog`, `/home`, `/wp-content`, `/contact-us`, `/about-us`, `/privacy-policy`, etc.), "Celestino Enterprise" plus each service name, plus the founder's name, address, both phone numbers, the Virginia SCC entity number, partner/award terms, and quoted sentence fragments from the site copy (e.g. "Celestino Enterprise understands the value of providing an end-to-end IT support model").
- Search snippets that the index attributes to `celestinoenterprise.com` were treated as "company material (as indexed)". Snippets from ZoomInfo, Selling.com, Yelp, Nextdoor, LinkedIn, RocketReach, OpenGovUS and the Virginia SCC were treated as "third-party directory".

**What could not be done**

- The live site (`celestinoenterprise.com`), the Wayback Machine (`archive.org`), Yelp, ZoomInfo, Nextdoor and LinkedIn are blocked by the outbound proxy in this environment. No page HTML, `sitemap.xml`, `robots.txt`, headers, source, screenshots, or crawl were obtained.
- Consequently, exact page copy, page count, navigation structure, images, forms, tracking scripts, theme/plugin fingerprints and internal link structure are **not verified**. Wording quoted below is as it appeared in search snippets and may be paraphrased by the search engine.
- Only **two** URLs on the domain appear in the search index: `/` and `/home/`. Every other URL in this document is inferred from service names and common CMS conventions, and is marked as such.

**Recommendation**

Before content is finalised, the client (or whoever has admin access) should supply: (a) a full export of the current site (WordPress XML export or equivalent, or a zip of the HTML), (b) full-page screenshots of every page, (c) `sitemap.xml` and Google Search Console page/URL data (Pages report and Performance report, last 16 months), (d) Google Analytics landing-page data, and (e) any DNS/hosting details. Section 8 lists the specific questions.

**Evidence key used below**

| Code | Source | Type |
|---|---|---|
| S1 | `https://celestinoenterprise.com/` — indexed title "Celestino Enterprise : 25+ Experience in IT Solution" | Company material (as indexed) |
| S2 | `https://celestinoenterprise.com/home/` — indexed title "Home" | Company material (as indexed) |
| S3 | ZoomInfo company profile `https://www.zoominfo.com/c/celestino-enterprise-llc/481421359` | Third-party directory |
| S4 | Selling.com profile `https://www.selling.com/company/celestino-enterprise/52482068` | Third-party directory |
| S5 | Yelp listing `https://www.yelp.com/biz/celestino-enterprise-woodford` | Third-party directory |
| S6 | Nextdoor page `https://nextdoor.com/pages/celestino-enterprise-woodford-va/` | Third-party directory |
| S7 | OpenGovUS record `https://opengovus.com/virginia-business/S8616122` | Public record (mirror) |
| S8 | Virginia SCC CIS `https://cis.scc.virginia.gov/EntitySearch/BusinessInformation?businessId=11453218&isSeries+=+false` | Public record (primary) |
| S9 | LinkedIn profile `https://www.linkedin.com/in/celestinoenterprise-96aa4b196/` ("Celestino Enterprise - Staffing Consultant") | Third-party / self-published social |
| S10 | RocketReach `https://rocketreach.co/josefino-celestino-email_120060265` | Third-party data broker |
| S11 | ZoomInfo person profile `https://www.zoominfo.com/p/Josefino-Celestino/2704922325` | Third-party data broker |
| S12 | Homes.com / Redfin listings for 13329 Fredericksburg Tpke, Woodford, VA 22580 | Third-party property listing |

---

## 2. Discovered / likely URL inventory

Status meaning: **Indexed** = URL returned by the search engine for the domain. **Inferred** = no search evidence; guessed from service names shown in snippets and typical WordPress slugs. Everything marked Inferred must be checked against the client export or Search Console before redirects are written.

| URL | Evidence | Page type | Title if known | Notes |
|---|---|---|---|---|
| `/` | Indexed (S1; returned in `site:` query and ~40 other queries) | Home | "Celestino Enterprise : 25+ Experience in IT Solution" | Meta description as indexed: "award winning IT Solutions Company dedicated to providing Technical Innovative services for small, medium or large scale projects". Snippets tie almost all service copy (Business IT Support, Co-Managed IT, Web Development, Enterprise Solutions, Full-Stack, Ecommerce, CMS, Design & Animation, portfolio names) to this URL, which suggests a long single-page home or that subpages are not indexed. |
| `/home/` | Indexed (S2; returned in `site:` query and ~15 other queries) | Home (duplicate) | "Home" | Same content as `/` per snippets. Classic WordPress pattern where the page assigned as "static front page" stays reachable at its own slug. Duplicate-content / canonical issue (see Section 6). |
| `/services/` | Inferred (no search hit; searched directly) | Services hub | unknown | Directory snippets list "services" but no URL appears. |
| `/web-development/` | Inferred (no search hit; searched directly) | Service | unknown | Copy about "engaging and user-friendly websites… from simple blogs to complex e-commerce platforms" is attributed to `/`. |
| `/web-app-development/` | Inferred | Service | unknown | "Web Applications" section exists on home per snippets. |
| `/mobile-app-development/` | Inferred (no search hit; searched directly) | Service | unknown | Mobile app copy attributed to `/` by search engine. |
| `/enterprise-solutions/` | Inferred | Service | unknown | "Enterprise Solutions" section exists on home per snippets. |
| `/it-solutions/` | Inferred (no search hit; searched directly) | Service | unknown | "IT Solutions, Consultancy, and Cybersecurity" is a phrase on the home page. |
| `/consultancy/` | Inferred (no search hit; searched directly) | Service | unknown | As above. |
| `/cybersecurity/` | Inferred (no search hit; searched directly) | Service | unknown | As above; only `/home/` and `/` returned. |
| `/business-it-support/` | Inferred | Service | unknown | Section heading "Business IT Support" quoted in snippets. |
| `/co-managed-it/` | Inferred | Service | unknown | Section heading "Co-Managed IT" quoted in snippets. |
| `/cloud-services/` | Inferred | Service | unknown | Yelp/Nextdoor categorise business as "cloud services and telecom or network services". |
| `/ecommerce/` (or `/e-commerce-development/`) | Inferred | Service | unknown | "E-commerce Development… Magento, Shopify, and BigCommerce" on home. |
| `/cms/` (or `/content-management-system/`) | Inferred | Service | unknown | CMS copy on home. |
| `/full-stack-development/` | Inferred | Service | unknown | "Full-Stack Developers" copy on home. |
| `/design-animation/` | Inferred | Service | unknown | "Design & Animation… award-winning animators and graphic designers" on home. Not in the previously known service list. |
| `/portfolio/` | Inferred (no search hit; searched directly) | Portfolio | unknown | Portfolio items "Phenom Nation (Knights Templar of the Philippine)" and "Aerogin USA" are attributed to `/`. |
| `/about/` and `/about-us/` | Inferred (no search hit; searched directly) | About | unknown | No about-page copy surfaced anywhere; company description in directories is generic. |
| `/contact/` and `/contact-us/` | Inferred (no search hit; searched directly) | Contact | unknown | No contact-page copy surfaced; phone numbers come only from directories. |
| `/blog/` | Inferred (no search hit; searched directly) | Blog index | unknown | Search engine explicitly found nothing; blog probably does not exist or is empty. |
| `/privacy-policy/` | Inferred (no search hit; searched directly) | Legal | unknown | No evidence of any legal page. |
| `/sitemap.xml`, `/robots.txt`, `/feed/`, `/wp-content/…`, `/wp-json/` | Inferred (WordPress guess; no search hit for `/wp-content`) | Technical | n/a | Check in client export / live fetch from an unblocked network. |

---

## 3. Business facts inventory

Column "Class": **Company** = from company's own material as indexed (S1/S2); **Directory** = third-party directory/data broker; **Record** = government record; **Unverified** = conflicting or unsupported.

| Fact | Value found | Class | Source(s) | Notes |
|---|---|---|---|---|
| Legal name | Celestino Enterprise LLC | Record | S7, S8 | Site uses "Celestino Enterprise" without "LLC" (S1). |
| VA SCC entity ID | S8616122 (CIS businessId 11453218) | Record | S7, S8 | |
| Incorporation date | 2019-10-25, Virginia | Record | S7 | |
| Entity status | INACTIVE, status date 2024-01-31, "Automatically Canceled - Registration Fee - Can Reinstate" | Record (via mirror) | S7 (mirror of S8) | **Must verify** on S8 directly before launch. If still inactive, publishing "LLC" or entity claims is risky; client should reinstate. |
| Registered agent | Josefino Celestino | Record | S7 | |
| Founder | Josefino Celestino, "Founder at Celestino Enterprise", based Washington, DC | Directory | S10, S3 | Not stated on any indexed company page. |
| Founded year | 2017 | Directory / Unverified | S3, S10 | Conflicts with LLC formation 2019-10-25 (S7). Could be sole-prop start vs LLC date. Ask client. |
| Founder background | Corporate IT at American Institutes for Research (2016-2017); The World Bank (2010-2018); Redpoint Cybersecurity; Ventech Solutions; IFC; BS Computer Science, Systems Technological Institute (2000-2003) | Directory / Unverified | S10, S11 | Data-broker data; overlapping dates. Get CV from client before using on About page. |
| Street address | 13329 Fredericksburg Tpke, Woodford, VA 22580 | Directory + Record | S3, S4, S5, S6, S7 | Consistent across all sources. Property listings (S12) show this as a 5-bed residential house, i.e. a home-based business. Decide whether to publish the street address or use a service-area listing. |
| Phone A | (202) 650-8607 | Directory | S4, S5, S6 | Selling.com, Yelp, Nextdoor. DC area code. |
| Phone B | (804) 632-6521 | Directory / Unverified | S3 (ZoomInfo snippets) | Only ZoomInfo-attributed snippets; a direct search for the number returned no match. **Conflict — client must confirm which is live.** |
| Email | JCelestino@Celestinoenterprise.com | Directory | S3/S4 snippet | Not seen on company page. Confirm and decide whether to publish. |
| Hours | Mon-Fri 9:00 AM - 5:00 PM, closed Sat/Sun | Directory | S5, S6 | Conflicts in spirit with "up to 24/7/365 proactive support" claim; reconcile on new Contact page. |
| Employees | 1-10 (S3) / 1-20 (S4) | Directory / Unverified | S3, S4 | Estimates only. |
| Revenue | < $5M (S3) / < $1M (S4) | Directory / Unverified | S3, S4 | Estimates only; do not publish. |
| Industry labels | "Business Services; Custom Software & IT Services" (S3); "Information Technology and Services" (S4); "cloud services and telecom or network services", "computer service" (S5/S6) | Directory | S3-S6 | |
| Service area | "Woodford and the surrounding area" (S5/S6); "Washington DC-Baltimore Area" (S9); "nationwide onsite support" (S1) | Mixed | S1, S5, S6, S9 | Three different framings. Client to define. |
| Social profiles | LinkedIn personal-style profile titled "Celestino Enterprise - Staffing Consultant" (S9); Facebook page reportedly exists (S3 says "has both LinkedIn and Facebook pages") | Directory / Unverified | S3, S9 | Facebook URL not found. LinkedIn is a personal profile, not a Company Page. |
| Review platforms | Yelp listing exists (S5); no BBB, Google Business, Clutch, GoodFirms, DesignRush listing found | Directory | S5; negative searches | No review content surfaced. |
| Awards / partnerships | None found | Unverified | Negative searches for "award", "Microsoft partner", etc. | See Section 5. |
| Government contracting | No SAM/CAGE/DUNS evidence found | Unverified | Negative search | Ask client. |

---

## 4. Services inventory (wording as indexed)

Wording below is quoted from search snippets attributed to `celestinoenterprise.com` (S1/S2) unless noted. Treat as close-to-verbatim, not verbatim.

| # | Service / section | Wording found | Source |
|---|---|---|---|
| 1 | Tagline / positioning | "award winning IT Solutions Company dedicated to providing Technical Innovative services for small, medium or large scale projects" | S1 meta description |
| 2 | Headline trio | "IT Solutions, Consultancy, and Cybersecurity" | S1/S2 |
| 3 | Business IT Support | "customized IT solutions, up to 24/7/365 proactive support, support of cloud and on-premise IT, emergency onsite support, and compliance support (HIPAA, FINRA, SOX, etc.)" — note several copies read "HIPPA", suggesting the site itself contains the misspelling | S1; echoed by S3, S5 |
| 4 | Co-Managed IT | "Celestino Enterprise understands the value of providing an end-to-end IT support model, along with the ability to scale with your business." / "Celestino Enterprise IT Solutions has the engineering depth, flexible service models, and leading edge solutions to maintain and support your IT infrastructure as an extension of your existing IT team." / "co-managed IT solutions range from helpdesk, server, network, disaster recovery and advisory services" | S1; echoed by S3, S5, S6 |
| 5 | Benefits list | "receive nationwide onsite support, access to broad engineering talent and scalable solutions to meet business demands" | S1 |
| 6 | Infrastructure claim | "manages infrastructure affordably and seamlessly by applying award-winning IT solutions" | S1 |
| 7 | Web Development | "website development services can create your dream website"; "engaging and user-friendly websites that improve the customer experience"; "from simple blogs to complex e-commerce platforms" | S1 |
| 8 | Web Applications | "wide range of web applications, from simple web apps to complex enterprise solutions, using the latest development tools and frameworks to design fast, reliable, and secure web applications"; "customize applications for Enterprise Resource Planning (ERP), E-Commerce, Interactive Gaming, Online Training & Courses, and Customer Relationship Management (CRM)" | S1 |
| 9 | Enterprise Solutions | "custom APIs and web services knowledge to build Enterprise Web Applications for digital marketing, CRM, inventory control, expedited workflows, and more" | S1 |
| 10 | Full-Stack Development | "diverse team of Full-Stack Developers with expertise in database design, web app development, system integrations, and cloud consulting"; "highly skilled in Java and SQL programming languages with experience in leading 12-factor applications and cloud platform implementation"; languages listed: "Java, JavaScript, PHP, Python, Objective-C, Ruby on Rails, jQuery, AngularJS, Node.js, and .NET Framework"; also "C++ is one of their primary programming languages for mobile and custom web development, video games, operating systems, machine learning, AI" | S1 |
| 11 | Integration services | "Data Integration Services, Enterprise Application Integrations, Data Migrations & Upgrades, Implementation & Deployment, API Development & Integration, and Quality Assurance" | S1 |
| 12 | Web maintenance | "Web Development Support and Maintenance Services include testing and debugging, updates and maintenance on security protocols, and database maintenance" | S1 |
| 13 | Mobile App Development | "custom mobile app development with years of expertise in creating seamless and fluid experiences across various mobile devices"; Java "to develop custom mobile and web applications, embedded systems, and big data processing" | S1 |
| 14 | E-commerce Development | "experience with various e-commerce platforms, including Magento, Shopify, and BigCommerce, and can help clients choose the best platform"; "built large-scale, enterprise eCommerce solutions" | S1 |
| 15 | CMS | "content management system (CMS) solutions that are user-friendly, reliable, and flexible, allowing clients to add and edit web content without needing code modifications" | S1 |
| 16 | Design & Animation | "award-winning animators and graphic designers create beautiful logos, branding materials, illustrations, infographics, motion graphics, and more"; also "landing pages, logo designs, web banners, and video editing" | S1 |
| 17 | Portfolio | "Phenom Nation (Knights Templar of the Philippine)" and "Aerogin USA"; "website development services utilizing multiple software platforms"; "CMS-based websites" | S1 |
| 18 | Cloud / telecom / network | "cloud services and telecom or network services" | S5, S6 (directory category, not site copy) |
| 19 | Staffing | "Staffing Consultant" | S9 only (LinkedIn headline) |

Observations: the current site is developer/agency-heavy (web, mobile, e-commerce, design, animation) with MSP-style services as a secondary block. The new IA is MSP-first (managed IT, co-managed IT, cybersecurity, cloud, network, BDR, advisory) with software/web engineering and AI automation as secondary. Design & Animation, Mobile App, E-commerce platform work, and Staffing have no direct home in the new IA and need a decision (Section 7).

---

## 5. Claims inventory

Status key: **VERIFIED-SOURCE** = independently corroborated by a primary source; **CLIENT-CLAIM** = appears only in the company's own material (and copies of it); **UNVERIFIED** = no support found, or contradicted.

| Claim | Where it appears | Status | Safe to publish? | Notes / required action |
|---|---|---|---|---|
| "Award winning IT Solutions Company" / "award-winning IT solutions" / "award-winning animators and graphic designers" | S1 meta description and body; copied by S3, S5 | UNVERIFIED | **No**, not as-is | Searches for "Celestino Enterprise" + award/awards/recognition returned nothing. Ask client to name the award, awarding body and year; otherwise drop. Repeating "award-winning" for the design team is a second, separate claim. |
| "25+ Experience in IT Solution" (title tag) / "over 25 years of experience" | S1 title; S3, S4, S5 | CLIENT-CLAIM | Only if reframed | Company formed 2017 (S3/S10) or 2019 (S7). Founder's education per S10 ends 2003, so 25+ years of personal experience is also not obviously supported. Ask what "25+" refers to (founder years, team combined years). Safest wording: "founder-led, with X years of enterprise IT experience" once X is confirmed. |
| "up to 24/7/365 proactive support" | S1; S3, S5 | CLIENT-CLAIM | Conditional | Directory hours are Mon-Fri 9-5 (S5/S6). "Up to" hedges it. Publish only if there is an actual after-hours arrangement (NOC/helpdesk partner, on-call). Otherwise state real hours plus emergency line. |
| "nationwide onsite support" | S1 | CLIENT-CLAIM | Conditional | 1-20 person firm in Woodford, VA. Plausible only through a dispatch partner network; confirm and, if kept, phrase as "nationwide onsite dispatch through partners". |
| "emergency onsite support" | S1; S3, S5 | CLIENT-CLAIM | Conditional | Define service area and response SLA. |
| "compliance support (HIPAA, FINRA, SOX, etc.)" | S1; S3, S5 (some copies "HIPPA") | CLIENT-CLAIM | Conditional | Must not imply certification/attestation. Reword to "helps clients meet HIPAA, FINRA and SOX-related IT controls". Fix the "HIPPA" misspelling. |
| "engineering depth… broad engineering talent" / "diverse team of Full-Stack Developers" | S1 | CLIENT-CLAIM | Conditional | Directories estimate 1-10 employees. Ask about subcontractor/offshore bench; avoid implying large in-house team. |
| "large-scale, enterprise eCommerce solutions" | S1 | UNVERIFIED | No, without a case study | Portfolio names found (Phenom Nation, Aerogin USA) are small sites. Need at least one referenceable e-commerce build. |
| Languages/framework list (Java, PHP, Python, .NET, Ruby on Rails, AngularJS, Objective-C, C++ …) | S1 | CLIENT-CLAIM | Conditional | Very broad; several are dated (AngularJS EOL, Objective-C). Trim to what the team actually ships today. |
| "12-factor applications and cloud platform implementation" | S1 | CLIENT-CLAIM | Yes if true | Fine to keep in software page if accurate. |
| "Microsoft partner" or any vendor partnership | Nowhere | UNVERIFIED | **No** | No partner evidence found. Only publish partner logos with a partner ID / portal proof. |
| Client portfolio: Phenom Nation (Knights Templar of the Philippine), Aerogin USA | S1 | CLIENT-CLAIM | Yes with permission | Confirm the client permits naming; get current URLs/screenshots. |
| "founded 2017" | S3, S10 | UNVERIFIED | Not until reconciled | Conflicts with LLC date 2019. |
| Entity "LLC" in good standing | S7 says INACTIVE | UNVERIFIED (contradicted) | **No** until reinstated | Verify on S8. |

---

## 6. Technical observations (guesses marked)

| Observation | Confidence | Basis | Implication |
|---|---|---|---|
| Platform is most likely **WordPress** | Guess (medium) | Separate indexed `/home/` page titled "Home" alongside `/` is the classic WP "static front page assigned to a page with slug home" artefact; trailing-slash URLs; agency-style multi-section home typical of WP themes. A search for `/wp-content` returned nothing, so there is no direct confirmation. | Expect a WP export (XML), media under `/wp-content/uploads/`, possible `?p=` IDs, `/feed/`, `/wp-json/`, and page-builder markup. Plan redirects for uploads if any images are linked externally. |
| `/` and `/home/` are duplicates with different titles | High | Both indexed (S1, S2) with same snippet content but different `<title>` | Canonical / duplicate-content issue today. New site: 301 `/home/` to `/`, and set `rel=canonical` on `/`. |
| Only 2 URLs indexed for the whole domain | High | `site:` query and ~15 quoted-path queries returned only `/` and `/home/` | Either the site is effectively a single long page, or subpages are noindexed/orphaned/unsubmitted. Either way there is little existing organic equity beyond the home page; redirects for inferred subpages are low-cost insurance rather than critical. |
| Title tag is weak and ungrammatical | High | "Celestino Enterprise : 25+ Experience in IT Solution" (S1) | Rewrite. Also contains an unverified claim (Section 5). |
| Meta description contains a capitalised, unverified claim | High | "award winning… Technical Innovative services" (S1) | Rewrite. |
| No blog, no legal pages, no case-study pages found in index | Medium | Negative searches | New site should add Privacy Policy, Terms, and Accessibility statement (not in provided IA — see migration table). |
| Spelling error "HIPPA" likely present in site copy | Medium | Several third-party copies of the site text use "HIPPA" (S3, S5 snippets) | Fix in rewrite. |
| No evidence of HTTPS status, schema.org markup, analytics, forms, or page speed | n/a | Blocked | Obtain from client or run Lighthouse from an unblocked network. |
| No Google Business Profile / BBB found in search | Medium | Negative searches | Set up GBP as part of launch (address vs service-area decision, Section 3). |
| Directory data is inconsistent (two phones, two founding years, two headcounts, two revenue bands) | High | S3 vs S4 vs S5/S6 vs S7 | Establish one canonical NAP (name, address, phone) on the new site with `LocalBusiness`/`Organization` schema, then update Yelp, Nextdoor, ZoomInfo, LinkedIn. |

---

## 7. Content migration table

Decision key: KEEP (reuse largely as-is), REWRITE (keep topic, new copy), MERGE (fold into another page), REDIRECT (URL only), ARCHIVE (do not carry forward), VERIFY (blocked pending client answer).

| Item (old) | Decision | Rationale | New destination |
|---|---|---|---|
| Home page `/` | REWRITE | Positioning changes from dev-agency-first to MSP-first; claims need cleanup; title/description weak. | `/` |
| `/home/` duplicate | REDIRECT | Duplicate of `/`; consolidate equity. | 301 to `/` |
| Title tag "Celestino Enterprise : 25+ Experience in IT Solution" | REWRITE | Grammar; unverified "25+" claim. | `/` metadata |
| Meta description "award winning IT Solutions Company…" | REWRITE | Unverified "award winning"; odd capitalisation. | `/` metadata |
| "IT Solutions, Consultancy, and Cybersecurity" headline trio | REWRITE | Maps cleanly to new services; keep the three concepts as hero pillars. | `/`, linking to `/services/managed-it`, `/services/security-risk-advisory`, `/services/cybersecurity` |
| Business IT Support section | REWRITE + MERGE | Core MSP offer; fix HIPPA; hedge 24/7/365 and compliance wording per Section 5. | `/services/managed-it` |
| Co-Managed IT section (helpdesk, server, network, DR, advisory) | KEEP (light rewrite) | Strong, on-strategy copy; "end-to-end IT support model… extension of your existing IT team" is reusable. Split its sub-bullets to their dedicated pages. | `/services/co-managed-it`; sub-bullets cross-link to `/services/network-management`, `/services/backup-disaster-recovery`, `/services/security-risk-advisory` |
| "Cybersecurity" mention (no detail found) | REWRITE | Only a heading exists today; new page needs full content. | `/services/cybersecurity` |
| Cloud and on-premise support; cloud consulting; cloud platform implementation | MERGE + REWRITE | Scattered across IT support and full-stack copy. | `/services/cloud-infrastructure` |
| "network" in co-managed list; "telecom or network services" directory category | REWRITE | Only a keyword today. | `/services/network-management` |
| "disaster recovery" in co-managed list | REWRITE | Only a keyword today. | `/services/backup-disaster-recovery` |
| "Consultancy" / "advisory services" | REWRITE | Only keywords today; new IA frames it as security & risk advisory. | `/services/security-risk-advisory` |
| Web Applications / Enterprise Solutions (custom APIs, CRM, inventory, workflows, ERP customisation) | REWRITE | Good substance; trim tech list; drop "Interactive Gaming" unless real. | `/services/software-development` |
| Web Development (websites, blogs to e-commerce) + CMS section | MERGE + REWRITE | Combine into one engineering-focused page; e-commerce platforms (Magento/Shopify/BigCommerce) become a sub-section only if client still sells this. | `/services/web-application-engineering` |
| Full-Stack Developers section (database design, integrations, 12-factor, languages) | MERGE + REWRITE | Split: integration/data content to software page; web stack to web engineering page. | `/services/software-development`, `/services/web-application-engineering` |
| Integration services list (Data Integration, Enterprise Application Integrations, Data Migrations & Upgrades, Implementation & Deployment, API Development & Integration, QA) | KEEP (as bullet list) | Concrete and reusable. | `/services/software-development` |
| Web maintenance/support (testing, security updates, database maintenance) | MERGE | Fits managed-services framing. | `/services/web-application-engineering` (care plan section) |
| Mobile App Development | VERIFY | Not in new IA. Ask whether still offered; if yes, MERGE into software page; if no, ARCHIVE with redirect. | `/services/software-development` (fallback) |
| Design & Animation (logos, branding, motion graphics, video editing) | VERIFY | Not in new IA; "award-winning animators" claim unverified. Likely ARCHIVE; redirect any URL to web engineering. | `/services/web-application-engineering` (redirect fallback) |
| E-commerce platforms (Magento, Shopify, BigCommerce) | VERIFY | Keep only if there is a referenceable build. | `/services/web-application-engineering` |
| "AI, machine learning" mentions (inside C++ language blurb) | REWRITE | New IA has an AI automation page; current mention is token only. | `/services/ai-automation` |
| Staffing Consultant (LinkedIn only) | VERIFY | Never on the site; ask whether staffing is an offer. | none (or `/about` mention) |
| Portfolio: Phenom Nation, Aerogin USA | VERIFY then REWRITE | Convert to case studies only with client permission and current screenshots. | `/case-studies` |
| Benefits list ("nationwide onsite support, broad engineering talent, scalable solutions") | REWRITE | Keep hedged versions per Section 5. | `/services/managed-it`, `/` |
| About content (none found) | REWRITE (new) | Founder story, reconciled founding year, verified credentials. | `/about` |
| Contact info (two phones, email, address, hours) | VERIFY then REWRITE | One canonical NAP; decide on address display; add form. | `/contact` |
| Blog (not found) | ARCHIVE + REDIRECT | No content to move; catch stray URL. | 301 `/blog/` to `/resources` |
| Privacy policy (not found) | REWRITE (new) | Legal page required; not in provided IA. Recommend adding `/privacy` (and `/terms`); interim map to `/trust`. | `/privacy` (recommended) or `/trust` |
| Trust / compliance narrative | REWRITE (new) | Home for HIPAA/FINRA/SOX wording, entity status, insurance, SLAs. | `/trust` |
| Directory listings (Yelp, Nextdoor, ZoomInfo, LinkedIn, Facebook) | VERIFY | Update NAP after launch; convert LinkedIn personal profile to a Company Page. | n/a |

---

## 8. Open questions for client

1. **Site access and export**: Can you provide WordPress admin access (or confirm the platform) and a full export (XML plus `/wp-content/uploads`), plus Search Console and Analytics access? Which pages exist besides the home page?
2. **Entity status**: Virginia SCC shows Celestino Enterprise LLC (S8616122) as INACTIVE since 2024-01-31 ("Automatically Canceled - Registration Fee - Can Reinstate"). Has it been reinstated, or is there a different active entity we should name on the site?
3. **Founding date**: Directories say 2017; the LLC was formed 2019-10-25. Which should we publish?
4. **"25+ years"**: What does this refer to (founder's personal experience, team combined)? Please give the exact number and basis.
5. **"Award-winning"**: Which award(s), from whom, and when? For both the company and the "award-winning animators and graphic designers". If none can be named, we will remove the claim.
6. **Phone**: Which is the live business line, (202) 650-8607 or (804) 632-6521? Any fax, SMS, or after-hours line?
7. **Email**: Publish `JCelestino@celestinoenterprise.com`, a role address (e.g. `hello@`), or form-only?
8. **Address**: 13329 Fredericksburg Tpke appears to be a residence. Publish the street address, list as a service-area business, or use a mailing address / virtual office?
9. **Hours vs 24/7/365**: What is the real support coverage (helpdesk hours, on-call, NOC partner)? What SLA can we state?
10. **Nationwide onsite / emergency onsite**: Is this delivered through a dispatch partner? What geography is genuinely covered?
11. **Compliance**: Are there any attestations (SOC 2, HIPAA assessments, cyber-insurance) or is this "we help clients meet controls"? Any frameworks to add (CMMC, NIST CSF)?
12. **Vendor partnerships**: Any Microsoft/CSP, Google, AWS, Datto, SentinelOne, etc. partner IDs we can verify and display?
13. **Team**: Headcount, in-house vs contractors, any named staff/photos for About.
14. **Founder bio**: Please confirm/correct the career history from data brokers (World Bank, IFC, AIR, Redpoint Cybersecurity, Ventech Solutions; BS CS 2000-2003).
15. **Services to drop or keep**: Mobile app development, Design & Animation (logos, motion graphics, video editing), e-commerce platform builds (Magento/Shopify/BigCommerce), staffing consulting. Which are still sold?
16. **Case studies**: May we name Phenom Nation (Knights Templar of the Philippine) and Aerogin USA? Do you have current URLs, screenshots, results and a contact who will approve a write-up? Any managed-IT clients willing to be referenced?
17. **Social**: URLs of the Facebook page and any other profiles; can we create a LinkedIn Company Page?
18. **Government work**: Any SAM.gov/UEI/CAGE registration, SWaM or 8(a)/veteran certifications to display?
19. **Legal pages**: Do you have existing privacy/terms text, or should we draft new ones? (Not in the provided IA; we recommend `/privacy` and `/terms`.)
20. **Old URL list**: Please export the current sitemap or list of page URLs so the redirect map (`docs/seo/url-migration-map.csv`) can be moved from "probable" to "confirmed".
