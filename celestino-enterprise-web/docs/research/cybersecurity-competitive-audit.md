# Cybersecurity & Managed IT Web Presence: Competitive Design Audit

**Prepared for:** celestinoenterprise.com rebuild
**Role:** Principal product design + UX research
**Date:** September 2026
**Status:** Working document, v1

---

## 0. How to read this document

This audit exists to answer one question: *what should the Celestino Enterprise website do, and not do, given what the rest of the market is doing?*

Celestino is a small Virginia IT services firm. It sells managed IT, co-managed IT, cybersecurity, cloud, disaster recovery, compliance support (HIPAA, FINRA, SOX), and custom web/app/software development. It claims 25+ years in business and nationwide onsite support. Its realistic competitors are regional MSPs and MSSP-adjacent firms, not CrowdStrike. But the buyer who lands on celestinoenterprise.com has already been trained by CrowdStrike, Huntress, Arctic Wolf, and Microsoft about what a "credible security company" looks like on the web. So we audit both tiers: the 58 national/global brands that set buyer expectations, and the 9 regional MSPs that Celestino will actually lose or win deals against.

The document is organized as:

1. Method & limitations
2. Comparison matrix (58 organizations, three tables)
3. Pattern analysis (what nearly everyone does, what only the best do, what has become cliché)
4. Weaknesses, buried information, trust signals, missed conversions, market gaps
5. Celestino differentiation opportunities
6. Regional MSP/MSSP tier addendum (9 firms)
7. Appendix: prioritized recommendations for the rebuild

Every claim about a competitor's site is either (a) drawn from search-index snippets of the site captured during this audit, or (b) drawn from prior familiarity with the site. Where (b) applies and the detail could have changed, the cell is marked **(approx.)**.

---

## 1. Method & limitations

### 1.1 What was done

- Ran roughly 60 targeted web searches (September 2026) against each brand's homepage, platform page, navigation, primary calls to action, pricing pages, and trust/proof pages. Queries were of the form "`<brand>` homepage headline", "`<brand>` website navigation solutions industries", "`<brand>` 'Request a demo'", "`<brand>` pricing page", and similar.
- Recorded the headline text, hero structure, primary CTA, navigation model, and proof elements surfaced in the search-index snippets (title tags, meta descriptions, page excerpts).
- Cross-checked those snippets against prior working knowledge of each site's information architecture, visual language, and motion design.
- Synthesized patterns across the set, then derived lessons specific to Celestino's positioning and audience.

### 1.2 What was not done

- **No live crawls.** The network environment used for this audit blocks direct fetches of competitor domains. No page was loaded in a browser, no screenshots were taken, and no DOM was inspected.
- **No performance measurement.** Core Web Vitals, bundle sizes, and accessibility scores were not measured. Statements about "heavy" or "slow" sites are qualitative impressions, not data.
- **No A/B or analytics data.** Nothing here says what converts. It says what is visible and what is plausibly effective given known UX research.

### 1.3 How to treat each cell in the matrix

- **Quoted headlines** (in "quotes") were captured verbatim from a search-index snippet of the brand's own domain during this audit. They are accurate as of the index date, which may lag the live site by days or weeks.
- **(approx.)** marks a cell built from prior familiarity with the site rather than a fresh snippet, or where the snippet was ambiguous. Treat as directionally right, not exact.
- **Metrics** (customer counts, event volumes, response times) are only included where the brand itself publishes the number on its site or in a press release captured during the audit, and are labeled "site claims". No metric in this document was invented or estimated.
- Column definitions:
  - **Positioning:** the category the brand is trying to own, in its own words.
  - **Hero:** headline and structure of the first viewport.
  - **Primary CTA:** the most prominent button in the hero and/or header.
  - **Nav Structure:** top-level menu model.
  - **Proof:** trust and credibility elements surfaced above or near the fold.
  - **Visual Approach:** dominant visual language.
  - **Animation:** degree and type of motion.
  - **Resources:** how content marketing is organized.
  - **Strength / Weakness:** the single most instructive positive and negative from a UX standpoint.
  - **Relevant Celestino Lesson:** what a small regional firm should copy, adapt, or avoid.

### 1.4 Bias disclosure

The author is designing Celestino's site. The "lessons" column is therefore opinionated toward Celestino's strategy (clarity, craft, public-sector readiness, transparency over visual noise). Readers evaluating a different strategy should weight the descriptive columns more than the prescriptive one.

---

## 2. Comparison matrix

### 2.1 Table A: Platform leaders and large vendors (20)

| Brand | Positioning | Hero | Primary CTA | Nav Structure | Proof | Visual Approach | Animation | Resources | Strength | Weakness | Relevant Celestino Lesson |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CrowdStrike | AI-native platform that "stops breaches" | "We Stop Breaches" plus Falcon platform statement; dark, cinematic | "Request a demo"; secondary "Start free trial" (approx.) | Mega menu: Platform, Services, Why CrowdStrike, Resources, Partners (approx.) | Analyst badges, customer logos, Fal.Con event, threat reports | Dark red/black, glowing UI renders, adversary art | Heavy: hero video, scroll reveals (approx.) | Huge library: reports, adversary universe, blog, glossary | Three-word promise everyone remembers | Menu depth overwhelms non-enterprise buyers | One plain outcome sentence beats a feature list |
| Palo Alto Networks | "Platformization": one vendor across network, cloud, SOC | Rotating hero tied to launches and acquisitions (Console, CyberArk) (approx.) | "Get a demo" / event registration (approx.) | Mega menu by Products, Solutions, Services, Industries, Partners, Resources (approx.) | Gartner/Forrester badges, Fortune 500 counts (approx.) | Bright orange on black, abstract network motifs | Moderate: hero carousel, hover reveals | Deep: Unit 42 research, webinars, cyberpedia | Consistent brand color and confident tone | Homepage is a news feed, not a buyer path | Homepage should route buyers, not announce news |
| Fortinet | "Security Fabric": AI-driven, unified networking + security | Product-launch heroes (FortiOS 8.0, FortiSOC, FortiAIGate) (approx.) | "Contact us" / "Free product demo" (approx.) | Deep menu: Secure Networking, SASE, Cloud, SecOps, by industry | FortiGuard Labs research, analyst report counts | Red/white corporate; hardware photography | Light-to-moderate | Massive glossary and threat research | Broad, well-indexed IA for SEO | Density; hard to know where to start | Segment entry points by buyer, not product family |
| Zscaler | "Zero Trust + AI"; Zero Trust Exchange | "Zero Trust + AI" framing; platform diagram (approx.) | "Get started" / "Request a demo" | Products, Solutions, Industries, Partners, Resources, Company (approx.) | "500 trillion daily signals" style claims; customer logos | Blue/white clean; architecture diagrams | Moderate: animated exchange diagram (approx.) | Blog, ThreatLabz, Zenith Live sessions | Single architectural idea repeated everywhere | Jargon density ("SSE", "ZTNA") assumes expertise | Explain the architecture in one diagram, plain words |
| Okta | "The World's Identity Company"; secures AI, machine, human identity | "Okta secures AI" with agent-identity subhead | "Try Okta" / "Contact sales" (approx.) | Products, Solutions, Customers, Developers, Resources (approx.) | Forrester Wave leader, customer stories | Clean white, blue accent, product UI shots | Light | Developer docs, Oktane sessions, guides | Clear split: workforce vs customer vs developer | Homepage now leads with AI, delaying core use cases | Do not let trend messaging displace core promise |
| Cloudflare | "Connectivity cloud"; connect, protect, build | "Connect, protect, and build everywhere" | "Get started" (self-serve) + "Contact sales" | Products by category, Solutions, Developers, Pricing, Resources | Scale claims, public plans, network map | Orange on white, technical, developer-friendly | Light; globe/network illustrations | Learning Center is a major SEO asset | Public pricing tiers; self-serve path | Breadth makes it unclear what to buy first | Publish plan structure; "Get started" beats "Contact us" |
| SentinelOne | "Autonomous Security Platform Built for Advantage" | Platform headline + "New Standard for Security Operations" | "Get a demo" | Platform, Services, Why SentinelOne, Resources, Partners (approx.) | MITRE results, analyst badges, customer logos | Purple/black, futuristic gradients | Moderate-heavy: scroll-triggered animations (approx.) | Labs research, blog, cybersecurity 101 | Strong "why us" comparison pages | "Advantage" headline is abstract | Prefer concrete outcome language over abstract nouns |
| Wiz | Cloud security; "Secure everything you build and run in the cloud" | Single left-aligned headline, whitespace, line illustration | "Get a demo" | Platform, Solutions, Customers, Resources, Company (approx.) | "30%+ of Fortune 100" site claim; logos | Light, illustrative, friendly; unusual for security | Light and purposeful | Wiz Academy (learning), research blog | Approachable clarity for a complex product | Less proof depth for skeptical enterprise buyers | Whitespace and a plain headline read as confidence |
| Rapid7 | "Command Platform": unified exposure, detection, response | "Command Your Attack Surface" | "Request a demo" / "Take a tour" (approx.) | Platform, Services, Solutions, Resources, Customers (approx.) | Labs research, Metasploit heritage, analyst badges | Orange/dark; command-center imagery | Moderate | Blog, research, Metasploit community | Verb-driven headline | Two product brands (Insight/Command) confuse | One product naming system; no legacy names |
| Arctic Wolf | "The Leader in Security Operations"; Concierge model | Leader claim + "End cyber risk" subhead | "Explore Solutions"; also "Calculate Your Security ROI" | Solutions, Bundles, Industries (12 verticals), Resources | "3 trillion events weekly" site claim; industry pages | Dark navy, wolf motif, bold type | Moderate | Industry-specific content, Aurora interactive tour | Vertical pages for SLED, healthcare, finance, credit unions | "End cyber risk" promises more than anyone can | Build industry pages; avoid absolute promises |
| Sophos | "Defeat Cyberattacks with Cybersecurity as a Service" | Service-first headline; MDR emphasis | "Free trial" (many products) / "Talk to an expert" | Products, Services, Solutions, Partners, Support, Free Trials | G2/Gartner Peer Insights rankings, Active Adversary report | Blue/white, product-boxed layout | Light | Free tools page, research, threat reports | Free trials everywhere reduce friction | Product catalog sprawl | A "free tools / free assessment" page earns trust |
| Trend Micro | "Trend Vision One": all-in-one AI-powered platform | "Thrive in the AI age – securely" | "Request a demo" / "Free trial" (approx.) | Business, Small Business, Partners, Support split at top | Zero Day Initiative research, analyst reports | Red/white, corporate | Light | Research, threat encyclopedia | Separate SMB path with its own platform page | SMB page still enterprise-toned | Serve SMB buyers with their own language, not a cut-down page |
| Check Point | "Cyber Security Platform" (formerly Infinity) | "Simplify Your Security Strategy…" | "Request a demo" / "Contact sales" (approx.) | Products, Solutions, Support, Partners, Resources (approx.) | Miercom rankings, GovRAMP authorization for gov platform | Pink/purple gradients, corporate | Light-moderate | Research, CheckMates community | Government authorizations surfaced | Renaming (Infinity → Platform) leaves stale pages | Public-sector credentials belong on the homepage |
| CyberArk | "Identity security for the AI enterprise"; Idira platform | Post-acquisition hero introduces new platform name | "Request a demo" (approx.) | Products, Solutions, Services, Resources, Company (approx.) | "Powered by Palo Alto Networks" framing; Gartner badges | Blue/green, abstract identity graphics | Moderate | Blog, playbooks, white papers | Clear "what changed" messaging after acquisition | New name (Idira) forces relearning | When something changes, explain it in one line up top |
| Proofpoint | "Human-centric" security for people, data, AI | People/agent-centric platform statement | "Request a demo" (approx.) | Products, Solutions, Partners, Resources, Company (approx.) | Threat research, State of the Phish report | Navy/teal, people photography | Light | Very deep threat reference library | A single organizing idea (humans are the target) | Homepage copy is long and abstract | Pick one organizing idea and repeat it |
| Darktrace | "ActiveAI Security Platform"; self-learning AI | Platform headline; AI visualization (approx.) | "Get a demo" | Products, Solutions, Resources, Company (approx.) | Customer stories, analyst reports | Dark, glowing network visualizations | Heavy: animated threat visualizer (approx.) | Blog, research, threat reports | Distinctive visual identity | Motion-heavy hero slows message uptake | Motion should illustrate, not decorate |
| Trellix | "Living security" (XDR); intelligence-led resilience | Brand-metaphor headline (trellis) | "Request a demo" (approx.) | Platform, Solutions, Services, Resources (approx.) | Advanced Research Center, public-sector references | Bright multicolor gradients | Moderate | Threat research | Metaphor gives brand memorability | Metaphor obscures what is sold | Metaphors are fine only after the literal promise |
| Netskope | "Netskope One": converged SASE, AI, data security | "Security & Networking ReAImagined" (pun headline) | "Request a demo" (approx.) | Products, Solutions, Customers, Partners, Resources | Gartner MQ Leader (SASE, SSE) | Teal/dark, network diagrams | Moderate | Threat Labs, glossary "Security Defined" | Glossary hub drives SEO | Pun headline reads as gimmick | Avoid clever spelling; plain beats punny |
| Snyk | Developer security; "AI Trust Platform" | Developer-first, AI-era framing | "Start free" / "Book a demo" | Products, Solutions, Developers, Pricing, Resources | Open-source adoption, customer logos | Purple/white, dev-tool aesthetic | Light | Docs, Learn platform, blog | Free tier + public pricing | Rapid rebrand of platform name | Public pricing lowers buyer anxiety |
| Tenable | "The Exposure Management Company"; Tenable One | AI-powered exposure management headline | "Request a demo" / "Try for free" (approx.) | Products, Solutions, Services, Resources (approx.) | Research (Nessus heritage), analyst reports | Blue/white, dashboards | Light | Cyber Exposure Alerts, blog, webinars | Category ownership through repetition | Multiple product SKUs blur the "One" story | Own a small category (e.g., "compliance-ready IT for VA") |

### 2.2 Table B: Specialists, data/identity, app and OT security (21)

| Brand | Positioning | Hero | Primary CTA | Nav Structure | Proof | Visual Approach | Animation | Resources | Strength | Weakness | Relevant Celestino Lesson |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HackerOne | CTEM; AI + researcher community | "Not every vulnerability matters. Fix the ones that do." | "Contact sales" / "Get a demo" (approx.) | Platform, Solutions, Customers, Hackers, Resources (approx.) | Fortune 500 trust, researcher community size | Black/white with bold type; human photography | Light | Blog, reports, hacker community pages | Headline names buyer pain in plain words | Dual audience (customers vs hackers) splits nav | Plain-spoken headline about prioritization works |
| Bugcrowd | "#1 Crowdsourced Cybersecurity Platform"; "Ingenuity Unleashed" | Superlative headline | "Get started" / "Contact us" (approx.) | Platform, Solutions, Resources, Researchers (approx.) | Customer logos, program counts (approx.) | Orange/dark, energetic | Moderate | Glossary, reports | Energetic brand voice | "#1" claims without visible basis | Never claim "#1" without a citation |
| Bishop Fox | "Leading authority in offensive security since 2005" | Authority + date headline; "Attack to Protect" | "Contact us" / "Request a quote" (approx.) | Services, Platform, Labs, Resources, Company | Founding year, Labs research, advisories | Dark with fox motif, editorial | Light | Labs, advisories, tool releases | Tenure used as credibility, not nostalgia | Service scope buried behind "Labs" content | "Since 2005" model: date + domain claim works for Celestino's 25 years |
| Dragos | "Leader in OT cybersecurity"; safeguard civilization | Report-launch hero (Year in Review) | "Request a demo" / "Download report" | Platform, Services, Industries, Resources, Community | Annual Year in Review report, public-sector page | Dark blue, industrial photography | Light | Community hub, reports, datasheets | Flagship annual report anchors credibility | Mission statement outweighs buyer outcomes | An annual regional report could anchor Celestino's authority |
| Claroty | Cyber-physical systems (CPS) across XIoT | "Secure Your Cyber-Physical Systems Across the XIoT"; "See Everything. Secure Anything." | "Request a demo" (approx.) | Platform, Industries, Public Sector, Resources | 2026 Gartner MQ Leader (CPS) | Blue/white, infrastructure imagery | Light | Reports, industry pages | Public sector has its own nav entry | Acronym load (CPS, XIoT) | Public sector deserves a first-class nav item |
| Vectra AI | "Attack Signal Intelligence" for hybrid cloud | Coverage claim across four attack surfaces | "Request a demo" (approx.) | Platform, Solutions, Resources, Partners (approx.) | Customer stories, MITRE references | Green/black, signal graphics | Moderate | Research, resource library | Trademark term repeated consistently | Invented term needs constant explanation | Do not invent proprietary terms for common services |
| Abnormal AI | Behavioral AI email security; "We Stop Attacks Others Can't" | Bold competitive claim | "Get a demo" (approx.) | Platform, Solutions, Customers, Resources (approx.) | "4,500 customers, 25%+ Fortune 500" site claims | White/black, clean, big numbers | Light | Blog, learning hub, reports | Numbers-forward proof strip | Claim is confrontational and unverifiable | Use numbers you can prove (years, clients, response SLAs) |
| Axonius | Asset intelligence; Asset Cloud | "Transform asset intelligence into intelligent action" | "Request a demo" (approx.) | Platform, Solutions, Resources, Company (approx.) | "1.1K+ integrations" site claim, growth accolades | Dark blue/orange, data visuals | Moderate | Newsroom, reports | Integration count is concrete proof | Headline is a noun pile | Count something real (systems supported, sites served) |
| Qualys | "Enterprise TruRisk Platform" | Risk-management platform headline (approx.) | "Try it free" / "Request a demo" (approx.) | Platform, Products, Solutions, Community, Support | 20+ year heritage, government sector expansion | Red/white, dashboard screenshots | Light | Blog, docs, community | Free-trial culture; docs are public | Legacy naming (QualysGuard) still floats | Retire legacy names before launch |
| Varonis | Data + AI security platform | "AI runs on data. Varonis keeps it secure." | "Request a demo" / "Free risk assessment" (approx.) | Platform, Coverage, Solutions, Industry, Trust | Forrester Wave Leader; Trust Center page | Blue/white, data diagrams | Light | Blog, industry pages (incl. federal) | Free risk assessment as lead magnet; Trust page | Copy stacks superlatives | Offer a real, scoped free assessment |
| Mimecast | "Human Risk Management & Advanced Email Security" | Category headline | "Get a demo" (approx.) | Products, Solutions, Partners, Resources (approx.) | Forrester HRM Wave mention | Blue, people-centric photos | Light | Blog, HRM explainer content | Category education content | Homepage explains category before product | Explain what you do before the industry trend |
| Akamai Security | Cloud/security platform; Guardicore segmentation | Peer-Insights award callout in security hero | "Talk to an expert" (approx.) | Products, Solutions, Why Akamai, Resources | Gartner Peer Insights Customers' Choice | Blue/white, enterprise | Light | Research, State of the Internet reports | Customer-review proof used up front | Security is one wing of a larger site | Customer reviews (Google, Clutch) as hero proof |
| Imperva (Thales) | App + data security under Thales | Thales-integrated hero (approx.) | "Request a demo" (approx.) | Products, Solutions, Resources (approx.) | Thales parent brand | Purple/red gradient | Light | Threat research, Learning Center | Parent-brand halo | Acquisition transition muddles identity | Keep one identity; never split brand on site |
| F5 | Application Delivery and Security Platform | "Next-gen Application Delivery … in a Single Platform" | "Contact sales" / "Try free" (approx.) | Products, Solutions, Learn, Support | Learn hub, reference architectures | Red/white, technical diagrams | Light | Extensive "Learn" glossary | Reference architectures shown openly | Enterprise jargon | Publish a reference architecture for your standard stack |
| Forcepoint | "Data Security Everywhere" | "Empower people to work anywhere, with data everywhere." | "Request a demo" (approx.) | Products, Solutions, Resources, Partners | Government/defense heritage (approx.) | Green/dark | Light | Spotlight video series | Simple "single policy" promise | Heavy demo gating | Explain the one policy/process you follow |
| Rubrik | "Agentic Cyber Resilience"; "Securing the world's data" | Platform-unification headline | "Request a demo" / event registration | Products, Solutions, Why Rubrik, Resources | Customer counts, MSP program | Teal/dark, motion graphics | Moderate-heavy | Insights glossary, summit sessions | "Why Rubrik" page directly addresses objections | Event promotion dominates hero | Build a "Why Celestino" page that handles objections |
| SailPoint | "Adaptive identity" for humans, machines, AI | "The new era of adaptive identity" | "Request a demo" (approx.) | Products, Solutions, Resources, Company | Analyst leadership, Navigate event | Blue/white, clean | Light | Product announcement hub | Product announcement hub is a good changelog | "New era" headline is empty | Ban "new era", "next-gen" from hero copy |
| Tanium | Autonomous Endpoint Management | AEM + real-time data headline | "Request a demo" / "Take a tour" (approx.) | Platform, Solutions, Resources, Partners | Mission-critical institution references | Dark, dashboard imagery | Light-moderate | Blog, overviews | "Take a tour" self-guided demo option | Category term is new; needs explaining | Offer a self-guided walkthrough of your service |
| Cyera | AI-native data security; "Protect your data. Secure AI." | Two-clause imperative headline | "Get a demo" (approx.) | Platform, Solutions, Resources, Company | Funding/growth signals (approx.) | White, minimal, bold type | Light | Videos, blog | Shortest hero in the set | Little visible proof beyond funding | Short imperative headline; proof must follow immediately |
| Armis | Cyber exposure management; Centrix | "See, Protect and Manage Your Entire Attack Surface" | "Request a demo" (approx.) | Platform, Solutions, Industries, Resources | RSAC awards, IT/OT/IoT/IoMT coverage | Purple/dark | Moderate | Solution briefs, brochures | Verb-triplet headline | Award clutter | Three verbs, one line: "Manage. Secure. Support." style is fine |
| Island | Enterprise Browser | "Access, security, and experience. Empowering every user on any device." | "Request a demo" | Product, Solutions, Customers, Resources (approx.) | "World's leading enterprises run on Island" | White, product-centric, calm | Light | Press, use cases | Calm, product-first presentation | Vague nouns in headline | Calm layout is credible; nouns alone are not |

### 2.3 Table C: Managed security, services firms, and hyperscaler security arms (17)

| Brand | Positioning | Hero | Primary CTA | Nav Structure | Proof | Visual Approach | Animation | Resources | Strength | Weakness | Relevant Celestino Lesson |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cato Networks | "AI-Native SASE"; "Secure Your Tomorrow" | Category + aspiration headline | "Get a demo" | Platform, Use Cases, Solutions, Resources, Partners | GigaOm Radar Leader 2026 | Green/dark, diagrams | Moderate | SASE explainer hub, SASEfy event | Use-case navigation ("I need to…") | Aspirational tagline adds nothing | Use-case nav is ideal for SMB buyers |
| Huntress | Managed security platform; "Wrecking Hackers 24/7" | Endpoint, email, employees + 24/7 SOC; "deploy in minutes" | "Start Free Trial" (no credit card) | Platform, Solutions, Partners, Resources, Pricing (approx.) | SOC staffing, MSP partner base | Green/black, irreverent tone | Light-moderate | Tradecraft blog, webinars, trial tours | Frictionless trial; SMB-appropriate voice | Tone may read juvenile to gov/finance buyers | Voice must match regulated buyers; keep trial-level friction low |
| eSentire | "MDR That Moves First"; 24/7 SOC | Preemptive MDR headline; "Build a Quote" | "Build a Quote" (self-serve estimate) | What We Do, Who We Serve, Resources, Company | Case studies library, "vs everyone" comparison | Blue/white, clean | Light | Case studies, solution briefs | Self-serve quote builder | Comparison pages get aggressive | A guided quote/estimate tool is a real differentiator |
| Expel | MDR with "transparent service"; 14-minute MTTR site claim | Transparency + response-time headline | "Get a demo"; public "MDR Packages" page | Products, Services, Resources, Company | Published packages, MTTR metric | Cream/black, illustrated, humane | Light | "Cyberspeak" blog incl. MDR pricing explainer | Publishes package tiers and a pricing explainer | Package page still lacks dollar figures | Publish tiers and what's included; write the pricing explainer |
| ReliaQuest | GreyMatter agentic SecOps platform | "Contain threats in <5 minutes" style claim | "Request a demo" (approx.) | Platform, Solutions, Integrations, Resources | Response-time claims, integration list | Dark/teal | Moderate | Solution briefs, videos | Integration page shows vendor neutrality | Enterprise-only tone | List every tool you integrate with or support |
| LevelBlue / Trustwave | "World's largest pure-play MSSP" (post-merger) | Scale/merger headline (approx.) | "Contact us" (approx.) | Services, Solutions, Industries, Resources (approx.) | FedRAMP/StateRAMP via Trustwave, SpiderLabs | Blue/white corporate | Light | Threat research, blog | Government authorizations named | Merged sites; inconsistent brand | Name specific frameworks and authorizations you support |
| Coalfire | Compliance + cyber; "100+ frameworks" | Controls/compliance engineering headline | "Contact us" / "Talk to an expert" (approx.) | Services, Industries, Insights, Company | Framework count, FedRAMP assessor status (approx.) | Blue/white, professional | Light | Compliance outlook reports | Frameworks listed explicitly | Long, jargon-laden copy | List HIPAA/FINRA/SOX/CMMC plainly with what you do for each |
| NCC Group | "People-powered, tech-enabled" cyber + escrow | Tagline hero (approx.) | "Get in touch" (approx.) | Services, Sectors, Insights, About | Threat Pulse monthly report | Blue/white, people photography | Light | Monthly Threat Pulse | Monthly cadence content builds habit | Escrow and cyber mix confuses | Monthly regional threat note is doable at Celestino scale |
| Orange Cyberdefense | "Build a safer digital society" | Mission headline | "Contact us" (approx.) | Services, Insights, About, per-country sites | Security Navigator annual report | Orange/black, editorial | Light | Annual Security Navigator | Country-level localization | Mission over buyer outcome | Localize: "Virginia" in the hero is an asset |
| WithSecure | European cybersecurity for MSPs and midmarket; Elements | Proactive, AI-native platform framing (approx.) | "Free trial" / "Contact" (approx.) | Products, Services, Partners, Resources | Regional positioning (Europe) | Blue/white, minimal | Light | Blog, research | Region as identity | Less known outside Europe | Region can be a brand, not a limitation |
| Bitdefender Business | GravityZone; SMB through enterprise tiers | Product-tier hero (approx.) | "Free Trial" on every tier | Business, Home, Partners split; product tiers | Independent test results (AV-Comparatives etc.) (approx.) | Blue/white, boxed tiers | Light | Free trial pages per product | Tiered product ladder is easy to compare | Consumer/business split can confuse | Present service tiers as a ladder |
| Acronis | "AI-Powered Cybersecurity, Data Protection & IT Automation" | Unified backup + security + automation | "Try now" / "Contact sales" (approx.) | Products, Solutions (MSP-first), Partners, Resources | "21,000+ service providers" site claim; G2 #1 claim | Blue/white, MSP-oriented | Light | Monthly "What's New" release notes | Public release cadence builds trust | Feature lists run long | Publish a changelog of service improvements |
| Barracuda | "BarracudaONE" platform; email, apps, network, data | "Cyberattacks can come from anywhere… protects you everywhere." | "Get a demo" / "Free trial" (approx.) | Products, Solutions, Partners, Support, Resources | Managed XDR, MSP program | Blue/white, product screenshots | Light | Campus docs (public) | Public product documentation | Everywhere/anywhere headline is generic | Public docs and SLAs are trust signals |
| Microsoft Security | "AI-powered, end-to-end security" | End-to-end + Copilot messaging | "Contact sales" / "Try for free" (approx.) | Products by family (Defender, Entra, Intune, Purview), Solutions, Partners, Resources | Scale claims, compliance offerings | White/purple, product UI | Light | Enormous docs and blog | Compliance and gov cloud pages exist | Product-family nav requires prior knowledge | Explain Microsoft 365 security in your client's terms |
| Cisco Security | Cloud Control; hybrid mesh firewall; Talos | Event-driven (Cisco Live) hero (approx.) | "Contact Cisco" / "Watch demo" (approx.) | Products, Solutions, Support, Learn | Talos threat intelligence | Blue/white | Light | Talos blog, docs | Talos as research brand | Sprawling site, hard to find security entry | One clear "Security" entry for visitors |
| IBM Security | AI-powered security; Autonomous Security | Agentic-era security headline (approx.) | "Book a consultation" / "Explore" (approx.) | Products, Services, Consulting, Think (content) | Cost of a Data Breach report, X-Force | Blue/white, Carbon design system | Light | Think insights, annual reports | Annual benchmark report is a reference asset | Consulting vs product paths unclear | A consultation CTA fits a services firm better than "demo" |
| Google Cloud Security | Google Unified Security + Mandiant | Converged security; Gemini AI; Mandiant expertise | "Contact sales" / "Try free" (approx.) | Products, Solutions (incl. Government), Resources | Mandiant incident response brand | White/blue, Material design | Light | Threat intelligence, docs | Government solutions page | Gets lost inside Google Cloud site | Dedicated government/public-sector page with named programs |

### 2.4 Headline audit

Every headline below was captured from a search-index snippet of the brand's own site during this audit unless marked (approx.). The verdict column is a UX judgment against four tests: (a) contains a verb, (b) names an outcome or object, (c) understandable on first read by a non-specialist, (d) under twelve words.

| Brand | Headline (quoted for analysis) | Verb | Outcome/object | Plain | Short | Verdict |
|---|---|---|---|---|---|---|
| CrowdStrike | "We Stop Breaches" | yes | yes | yes | yes | Model of the form; too absolute for Celestino |
| Cloudflare | "Connect, protect, and build everywhere" | yes | partial | yes | yes | Strong; "everywhere" is vague but earned by scale |
| HackerOne | "Not every vulnerability matters. Fix the ones that do." | yes | yes | yes | yes | Best in set: names a pain, states a stance |
| Cyera | "Protect your data. Secure AI." | yes | yes | yes | yes | Clean; needs proof immediately after |
| Rapid7 | "Command Your Attack Surface" | yes | yes | partial | yes | "Attack surface" is jargon to SMB buyers |
| Arctic Wolf | "The Leader in Security Operations" | no | partial | yes | yes | Claim, not promise; relies on badges |
| Armis | "See, Protect and Manage Your Entire Attack Surface" | yes | yes | partial | yes | Verb triplet works; jargon again |
| Claroty | "See Everything. Secure Anything." | yes | vague | yes | yes | Memorable; says nothing specific |
| Abnormal AI | "We Stop Attacks Others Can't" | yes | yes | yes | yes | Confrontational; unverifiable |
| Sophos | "Defeat Cyberattacks with Cybersecurity as a Service" | yes | yes | partial | yes | "As a Service" is category-speak |
| Huntress | "Wrecking Hackers 24/7" (page title) | yes | yes | yes | yes | Fits MSP/startup audience; not regulated buyers |
| eSentire | "MDR That Moves First" | yes | partial | partial | yes | Assumes reader knows MDR |
| Okta | "Okta secures AI" | yes | yes | yes | yes | Clear but narrows the brand to the trend |
| Varonis | "AI runs on data. Varonis keeps it secure." | yes | yes | yes | yes | Good two-beat structure |
| Trend Micro | "Thrive in the AI age – securely." | yes | vague | yes | yes | Aspirational; no object |
| SentinelOne | "The Autonomous Security Platform Built for Advantage" | no | partial | partial | yes | Abstract noun ("advantage") |
| SailPoint | "The new era of adaptive identity" | no | no | partial | yes | Empty; "new era" cliché |
| Netskope | "Security & Networking ReAImagined" | no | partial | no | yes | Pun costs comprehension |
| Cato Networks | "AI-Native SASE" / "Secure Your Tomorrow" | partial | no | no | yes | Category label + aspiration; neither helps a buyer |
| Check Point | "Simplify Your Security Strategy with the Check Point Cyber Security Platform" | yes | yes | yes | no | Right idea, too long |
| Forcepoint | "Empower people to work anywhere, with data everywhere." | yes | partial | yes | yes | Reads well; benefit is implicit |
| Island | "Access, security, and experience. Empowering every user on any device." | partial | no | yes | no | Noun list; calm design carries it |
| Axonius | "Transform asset intelligence into intelligent action" | yes | vague | no | yes | Noun pile; "intelligence" twice |
| Bishop Fox | "The leading authority in offensive security since 2005" | no | partial | yes | yes | Tenure claim done right |
| Dragos | "Launched: 9th Annual Dragos OT Cybersecurity Year in Review" (current hero) | n/a | n/a | yes | no | Report-launch hero; not a positioning line |
| Rubrik | "Agentic Cyber Resilience: One platform that unifies data, identity, and AI" | yes | yes | partial | no | "Agentic" is 2026 jargon |
| Barracuda | "Cyberattacks can come from anywhere. BarracudaONE protects you everywhere." | yes | yes | yes | no | Generic anywhere/everywhere pairing |
| Mimecast | "Human Risk Management & Advanced Email Security" | no | yes | partial | yes | Category label as headline |
| Marco (regional) | "Technology Made Clear" | partial | yes | yes | yes | Right promise for the tier |
| Ntiva (regional) | "Managed IT Services Built Around Your Business" | yes | yes | yes | yes | Keyword-led; competent, generic |
| Dataprise (regional) | "Exceptional Teams, Exceptional Outcomes: Smarter IT That Powers Growth" | yes | vague | yes | no | Adjective stack |
| Corsica (regional) | "We empower midmarket and enterprise companies with next-gen managed services." | yes | yes | partial | no | "Empower" + "next-gen" clichés; names segment well |
| Magna5 (regional) | "Our team is always on, and always watching." | yes | partial | yes | yes | Vivid but unverified |
| ITS (regional) | "Future-Proof IT Support That Scales With Your Success" | yes | yes | yes | yes | "Future-proof" cliché; otherwise clear |
| Framework IT (regional) | "Helping You Get IT Right" | yes | yes | yes | yes | Simple; leans on "#1" award nearby |
| TeamLogic IT (regional) | "Our Mission Is Your Success" | no | no | yes | yes | Mission statement; says nothing |
| Thrive (regional) | "Your NextGen Managed Cloud Services Provider" (cloud page) | no | yes | partial | yes | "NextGen" cliché |

Takeaways for Celestino's headline:

- The four that pass all tests (CrowdStrike, HackerOne, Cyera, Varonis) share a structure: a short declarative or imperative sentence with a concrete object, optionally followed by a second beat.
- None of the regional headlines pass all four tests. The bar is low; passing it is a visible advantage.
- A tenure claim (Bishop Fox) is the only credibility device that works inside the headline itself without a badge.
- Recommended form: **[verb phrase] + [concrete object] + [for whom/where]** with tenure in a sub-line rather than the headline, so the headline stays under ten words.

### 2.5 CTA inventory

Primary CTA labels observed across the 67 sites, grouped by friction. Counts are approximate tallies from the matrices, not exact measurements.

| Friction | CTA label pattern | Observed at (examples) | Approx. count | Notes |
|---|---|---|---|---|
| Lowest | "Start free trial" / "Try free" / "Free trial" (no card) | Huntress, Sophos, Bitdefender, Snyk, Cloudflare, Trend Micro, Qualys, Tenable, Acronis | 10-12 | Software-only pattern; the services analog is a free scoped assessment |
| Low | "Get started" (self-serve) | Cloudflare, Zscaler (get-started page), Bugcrowd, Magna5 | 4-5 | Works only if the next page actually lets the visitor start |
| Low | "See pricing" / pricing in nav / estimator | Cloudflare, Snyk, Expel (packages), Ntiva, Dataprise, ITS, eSentire (build a quote) | 7 | Rare; strongly differentiating in both tiers |
| Medium | "Take a tour" / interactive tour | Tanium, Arctic Wolf (Aurora), Rapid7, Huntress (trial tour) | 4 | Self-guided proof before contact |
| Medium | "Explore solutions" | Arctic Wolf | 1 | Sends the visitor deeper without asking anything |
| Medium-high | "Get a demo" / "Request a demo" | CrowdStrike, SentinelOne, Wiz, Cato, Darktrace, and most of Table A/B | 30+ | Category default; implies software and a sales cycle |
| High | "Talk to an expert" / "Schedule a consultation" / "Book a consultation" | Sophos (secondary), Akamai, Coalfire, Corsica, IBM, Dataprise | 6-8 | Appropriate for services; better when a scheduler is embedded |
| Highest | "Contact us" / "Get in touch" / "Contact sales" | Coalfire, NCC, Orange, LevelBlue, Marco, Thrive, TeamLogic, Microsoft, Google | 12+ | Offers nothing in exchange for the visitor's time |

Implications:

- "Request a demo" is wrong for Celestino. It signals a software product and a long sales cycle. IBM's "Book a consultation" and Dataprise's "Talk to an expert" are closer, but still high-friction.
- The winning combination for a services firm, supported by the regional-tier leaders, is a low-friction primary ("See pricing" or "1-minute estimate") plus a scheduler-backed secondary ("Book a 20-minute fit call").
- Every CTA should say what happens next in a sub-label (for example, "No sales pitch. We'll tell you if we're not a fit.").

### 2.6 Navigation models observed

| Model | Description | Examples | Fit for Celestino |
|---|---|---|---|
| Product-family mega menu | Top level by product line; requires knowing the names | Microsoft, Cisco, Fortinet, Palo Alto | Poor; Celestino has services, not SKUs |
| Platform + Solutions + Industries + Resources | The enterprise-security default | CrowdStrike, SentinelOne, Zscaler, Netskope, Tenable | Partial; drop "Platform", keep Services/Industries/Resources |
| Use-case first | "I need to…" entry alongside product entry | Cato (Use Cases), Arctic Wolf (Bundles) | Good; a "Common needs" mega-menu column is cheap and effective |
| What we do / Who we serve | Services-firm pattern with plain labels | eSentire, Coalfire (Services/Industries), NCC (Services/Sectors) | Best fit; plain labels for plain buyers |
| Audience split at top | Business vs SMB vs Partners toggle | Trend Micro, Bitdefender, Sophos (partial) | Useful idea: a "Public sector" entry serves the same purpose |
| Location-led | Locations as a top-level item | TeamLogic, Magna5, ITS | Good for a regional firm; Virginia regions plus nationwide onsite |
| Pricing in nav | Pricing/Plans as a top-level item | Cloudflare, Snyk, Ntiva, Dataprise, ITS (approx.) | Strongly recommended |
| Dual-audience nav | Customers vs community/researchers | HackerOne, Bugcrowd | Not applicable |

Recommended top-level nav for Celestino, derived from the above:

`Services` (mega menu: Managed IT, Co-Managed IT, Cybersecurity, Cloud, Backup & DR, Compliance, Software & Web Development, Onsite Support; second column "Common needs") · `Industries` · `Public Sector` · `Pricing` · `Resources` · `About` · persistent `Support` link and phone · filled CTA.

### 2.7 Visual language and motion audit

This table is built almost entirely from prior familiarity with the sites rather than fresh snippets (search indexes do not describe color or motion), so treat every row as **(approx.)**. It is included because the visual decision is one Celestino must make deliberately, and the field splits cleanly into two camps.

| Brand | Background | Accent | Typography feel | Imagery | Motion | Camp |
|---|---|---|---|---|---|---|
| CrowdStrike | Dark | Red | Heavy grotesk, all-caps labels | Rendered UI, adversary art | Video hero, scroll reveals | Dark/cinematic |
| SentinelOne | Dark | Purple | Geometric sans | Gradients, abstract | Scroll-triggered | Dark/cinematic |
| Darktrace | Dark | Cyan/teal | Sans | Animated network visualizer | Continuous | Dark/cinematic |
| Arctic Wolf | Dark navy | White/teal | Bold condensed | Wolf motif, photography | Moderate | Dark/cinematic |
| Rapid7 | Dark | Orange | Sans | Command-center imagery | Moderate | Dark/cinematic |
| Vectra AI | Dark | Green | Sans | Signal graphics | Moderate | Dark/cinematic |
| Armis | Dark | Purple | Sans | Abstract | Moderate | Dark/cinematic |
| Rubrik | Dark/teal | Teal | Sans | Motion graphics | Moderate-heavy | Dark/cinematic |
| Palo Alto Networks | Black | Orange | Sans | Network abstraction | Carousel | Dark/cinematic |
| Zscaler | White | Blue | Sans | Architecture diagrams | Animated diagram | Light/diagrammatic |
| Cloudflare | White | Orange | Humanist sans | Globe/network illustrations | Light | Light/diagrammatic |
| Wiz | White | Blue/multicolor | Friendly sans | Line illustration | Light | Light/calm |
| Cyera | White | Black/one accent | Large display type | Minimal | Light | Light/calm |
| Island | White | Blue | Product-centric sans | Product screenshots | Light | Light/calm |
| Expel | Cream | Black/coral | Editorial serif + sans | Illustration, people | Light | Light/calm |
| Okta | White | Blue | Clean sans | Product UI | Light | Light/calm |
| Snyk | White | Purple | Dev-tool sans/mono | Code and UI | Light | Light/calm |
| HackerOne | White/black blocks | Black | Bold editorial | Human photography | Light | Light/editorial |
| Bishop Fox | Dark | Orange (fox) | Editorial | Research imagery | Light | Dark/editorial |
| Huntress | Black/green | Green | Bold sans | Illustration, memes | Light-moderate | Dark/irreverent |
| Sophos | White | Blue | Corporate sans | Product boxes | Light | Light/corporate |
| Microsoft Security | White | Purple/blue | Segoe-style sans | Product UI | Light | Light/corporate |
| IBM Security | White | Blue | Carbon (Plex) | Editorial photography | Light | Light/corporate |
| Google Cloud Security | White | Blue | Google Sans | Material components | Light | Light/corporate |
| Ntiva / Dataprise / ITS (regional) | White | Blue (+orange at ITS) | Theme defaults | Stock office photography | Light | Light/template |
| Corsica / Thrive / Magna5 (regional) | White or dark navy | Orange/green/blue | Theme defaults | Stock photography, shields | Light | Mixed/template |

Observations:

- The dark/cinematic camp is now the category default for endpoint, detection, and "platform" vendors. Because it is the default, it has stopped signaling anything except "security vendor."
- The light/calm camp (Wiz, Cyera, Island, Expel, Okta) is where design press points when it wants an example of a security company that looks trustworthy and modern. It is also cheaper to execute well: fewer renders, no video, no particle systems.
- The hyperscalers and IBM are light/corporate by design-system mandate, and they read as stable rather than exciting. That is acceptable for a services firm whose buyers value stability.
- The regional tier is uniformly template-driven. The single most visible way for Celestino to separate from Ntiva, Dataprise, Corsica, and Thrive in a Virginia search result is a typographically confident, light, photography-led site with no stock imagery.
- Motion should be limited to: hover states, a single purposeful reveal per section, and state changes inside diagrams (for example, a "what we manage / what you keep" toggle on the co-managed IT page). No autoplay video in the hero, no continuous background animation.

Recommendation: light/calm camp, one accent color drawn from Celestino's existing brand, an editorial serif or humanist display face for headlines paired with a workhorse sans for body, real photography of the team and Virginia locations, and diagrams drawn in the site's own line style rather than vendor-supplied graphics.

---

## 3. Patterns nearly all successful firms use

These are near-universal across the 58. Absence of any of these on Celestino's site will read as amateur to a buyer trained on this set.

### 3.1 A single-sentence promise in the hero

CrowdStrike ("We Stop Breaches"), Cloudflare ("Connect, protect, and build everywhere"), Cyera ("Protect your data. Secure AI."), HackerOne ("Not every vulnerability matters. Fix the ones that do."). The best are under ten words and contain a verb. Weaker heroes (Netskope's pun, SailPoint's "new era", SentinelOne's "advantage") are abstract nouns.

### 3.2 One dominant CTA, one secondary

Almost every site has a filled button (demo, trial, get started) and a ghost button (contact, tour, learn). The filled button is repeated in the sticky header. Nobody successful puts three equal CTAs in the hero.

### 3.3 Mega-menu navigation organized by more than product

At minimum: Products/Platform, Solutions (by need), Industries (by vertical), Resources, Company. Arctic Wolf, Claroty, Dragos, Coalfire, and LevelBlue all expose an Industries or Sectors entry. This matters because buyers self-identify by industry before they self-identify by product.

### 3.4 A proof strip immediately below the hero

Logos, analyst badges, review-site ratings, or a headline metric. The pattern is consistent: hero, then proof, then explanation. Sites that delay proof (Cyera, Island) feel thinner.

### 3.5 A "Why us" page

Rubrik, CrowdStrike, SentinelOne, Magna5 (regional) all have a dedicated page that handles objections, comparisons, and differentiators. It is one of the most-visited pages on B2B sites because it is where late-stage buyers go to confirm a decision.

### 3.6 A resource library with a glossary or learning hub

Cloudflare Learning Center, Netskope "Security Defined", F5 "Learn", Rubrik Insights, Wiz Academy. These are SEO engines and they position the vendor as a teacher. Regional MSPs mostly have a blog; very few have a glossary.

### 3.7 Analyst and review-site validation

Gartner, Forrester, GigaOm, G2, Gartner Peer Insights. The larger the company, the more of these appear. Regional firms substitute Clutch, Google reviews, and local business awards.

### 3.8 Industry-specific landing pages

Arctic Wolf lists twelve. Claroty and Dragos have public-sector pages. Varonis has a federal page. Each vertical page repeats the hero-proof-explanation structure with vertical vocabulary.

### 3.9 Dark-mode or dark-hero visual language for "security"

CrowdStrike, SentinelOne, Darktrace, Arctic Wolf, Rapid7, ReliaQuest, Vectra, Armis all use dark heroes with saturated accent colors. The reverse (Wiz, Cyera, Island, Expel, Okta) uses light backgrounds and reads calmer and more approachable. Both work; the dark pattern is now the default and the light pattern stands out.

### 3.10 Threat research as a brand

Unit 42, Talos, X-Force, Mandiant, SpiderLabs, ThreatLabz, FortiGuard, Sophos X-Ops, Huntress Tradecraft. Even mid-size firms name their research arm. It converts "we sell software" into "we know attackers."

### 3.11 Annual or periodic flagship report

Dragos Year in Review, IBM Cost of a Data Breach, Sophos Active Adversary, Orange Security Navigator, NCC Threat Pulse (monthly), Cloudflare Threat Intelligence Report. A recurring dated publication builds return traffic and press citations.

### 3.12 Sticky header with CTA and search

Universal. Search is often behind an icon. The sticky CTA persists through long scrolls.

### 3.13 Customer stories with a metric

Case studies are framed by an outcome (time saved, incidents contained, cost avoided). Many sites filter case studies by industry and company size.

### 3.14 Partner/channel section

Every vendor in Tables A-C has a partner program page. For a services firm the analog is "technology partners" (Microsoft, Fortinet, Datto, etc.) which doubles as a proof strip.

### 3.15 Footer as a secondary sitemap

Four to six columns, legal links, trust center link, social. Trust center links (Snyk, Varonis) are increasingly common.

---

## 4. Patterns only the best firms use

These separate the top decile. Most regional MSPs have none of them; most national vendors have two or three.

### 4.1 Published pricing, packages, or a quote builder

- Cloudflare and Snyk publish plan tiers with prices.
- Expel publishes MDR package tiers with inclusions and a long-form explainer on what MDR costs.
- eSentire offers a self-serve "Build a Quote" flow.
- Among regional MSPs, Ntiva has a pricing page in main nav, Dataprise publishes plan structures, ITS promotes "Managed IT Pricing in 1 Minute", and Framework IT publishes a Chicago cost-range blog and explains a fee model that decreases as the environment standardizes.

The mechanism is simple: pricing transparency pre-qualifies buyers, signals confidence, and removes the number-one reason SMB buyers stall (fear of a sales call just to learn the ballpark).

### 4.2 Use-case navigation ("I need to…")

Cato's Use Cases hub and Arctic Wolf's Bundles let a buyer enter by problem rather than by product. The best implementations pair this with industry entry points, giving two ways in.

### 4.3 Self-guided product or service tours

Tanium's "Take a tour", Arctic Wolf's Aurora interactive journey, Huntress's trial tour, Rapid7's tour. For a services firm this becomes "what your first 90 days look like" as a scrollable walkthrough.

### 4.4 Free, scoped assessments and free tools

Sophos Free Tools page, Varonis free risk assessment, Huntress no-card trial, Bitdefender per-tier trials. These lower the commitment threshold below "talk to sales."

### 4.5 A public "What's new" or release cadence

Acronis monthly What's New, SailPoint product announcement hub, Okta quarterly release overview. It signals a living service. Almost no MSP publishes a service changelog.

### 4.6 Objection-handling comparison pages

eSentire "vs everyone", SentinelOne and CrowdStrike "why us" and competitor comparison pages. Done respectfully, these capture late-funnel search traffic ("X vs Y").

### 4.7 Response-time and operational metrics on the homepage

Expel's MTTR figure, ReliaQuest's containment-time claim, Arctic Wolf's event volume. Only a handful of firms publish an operational number in the hero. When it is real and defensible, it is the strongest proof available.

### 4.8 Public-sector credentials as first-class content

Check Point's GovRAMP authorization, LevelBlue/Trustwave FedRAMP and StateRAMP, Claroty and Dragos public-sector pages, Google's government solutions page, Varonis federal page. Public-sector buyers scan for these tokens (FedRAMP, StateRAMP, CMMC, NIST 800-171, SWaM/eVA in Virginia) before reading anything else.

### 4.9 Calm, whitespace-driven design in a loud category

Wiz, Cyera, Island, Expel. Their restraint stands out precisely because everyone else is dark and glowing. Design press consistently cites Wiz as a reference for making a technical product approachable.

### 4.10 Glossary and learning hubs treated as products

Cloudflare's Learning Center and F5's Learn hub are structured with their own IA, search, and internal linking. They outrank vendor product pages in organic search for definitional queries.

### 4.11 Trust center

Snyk (trust.snyk.io), Varonis (/trust) publish sub-processors, certifications, security practices, and status. For a firm selling compliance support, a trust page is table stakes but rarely present in the regional tier.

### 4.12 Honest "how we price / how we work" explainers

Expel's "How much does MDR cost?" and Ntiva's and Framework IT's "managed IT cost" articles are long-form, candid, and rank well. They pre-empt the sales call's first question.

---

## 5. Patterns that have become cliché

Presence of these will not hurt, but they no longer differentiate and some actively date a site.

1. **"Next-gen", "new era", "reimagined", "AI-native" in the headline.** Fortinet, SailPoint, Netskope, Cato, Cyera, WithSecure, Thrive (regional) all use some variant. Buyers have stopped reading these words.
2. **"Stop breaches / defeat cyberattacks / end cyber risk."** Absolute outcome promises (CrowdStrike, Sophos, Arctic Wolf). CrowdStrike can afford it; a regional MSP cannot, and regulated buyers distrust absolutes.
3. **Dark hero with glowing network/particle graphics.** Darktrace, SentinelOne, Vectra, Armis, Trellix. The "cyber blue glow" now signals "security vendor template."
4. **Padlock and shield iconography.** Present on nearly every regional MSP site. It communicates nothing specific.
5. **Rotating hero carousels.** Palo Alto, Cisco (event-driven). Carousels split attention and are known to underperform a static hero.
6. **Superlative-only claims ("#1", "world's leading", "leader in").** Bugcrowd, Arctic Wolf, Acronis, LevelBlue. Without a cited source they erode trust.
7. **Stock photography of hooded hackers or server rooms with blue light.** Common in the regional tier.
8. **"Contact us" as the only CTA.** Coalfire, NCC, Orange, and most regional MSPs. It is the highest-friction ask and offers nothing in return.
9. **Gated everything.** Datasheets, white papers, even pricing explainers behind forms. The best firms gate less.
10. **Trademark symbols on every product noun.** Trend Vision One™, Armis Centrix™, Attack Signal Intelligence™. Legally motivated, visually noisy, and irrelevant at Celestino's scale.
11. **Puns and wordplay in headlines.** Netskope's "ReAImagined". Clever costs comprehension.
12. **Platform-unification diagrams with 12+ boxes.** Every large vendor has one. It communicates breadth, not fit.
13. **"Peace of mind."** Magna5 and most regional MSPs. It is the single most overused phrase in MSP marketing.
14. **Mission statements as headlines.** Dragos ("safeguard civilization"), Orange ("safer digital society"). Inspiring internally; inert for buyers.
15. **"24/7/365" as the primary differentiator.** Every MSSP claims it, so it no longer differentiates; it is now a requirement.

---

## 6. Weaknesses in competing sites

Observed across the set. Each is an opening for a site that does the opposite.

### 6.1 Navigation depth assumes prior expertise

Fortinet, Palo Alto, Microsoft, Cisco require the visitor to already know the product family names. A non-technical office manager or a county IT director evaluating a vendor cannot find "help me with HIPAA" in a menu organized by SKU.

### 6.2 Homepages that behave like newsrooms

Palo Alto, Cisco, Rubrik, Dragos rotate the hero to whatever launched this week. First-time visitors get the press release, not the value proposition.

### 6.3 Rebrands and acquisitions leave scar tissue

Check Point (Infinity → Platform), CyberArk (Idira, now under Palo Alto), Imperva (Thales), LevelBlue (AT&T Cybersecurity + Trustwave), Rapid7 (Insight → Command), Qualys (QualysGuard). Stale URLs, mixed names, and duplicate pages persist for years.

### 6.4 Proprietary vocabulary

"Attack Signal Intelligence", "TruRisk", "XIoT", "CPS", "SSE", "CTEM", "AEM", "Human Risk Management". Each term costs an explanation. At the regional tier, vendors borrow these terms without the marketing budget to explain them.

### 6.5 Demo-gating with no self-serve path

Forcepoint, Vectra, Trellix, Proofpoint, and most consulting-style firms give the visitor no way to learn scope, timeline, or ballpark without a sales conversation.

### 6.6 Absolutes that regulated buyers distrust

"End cyber risk", "We stop attacks others can't", "Defeat cyberattacks." A compliance officer knows these are not literally true and discounts the rest of the page accordingly.

### 6.7 Motion that delays comprehension

Darktrace's animated hero, SentinelOne's scroll effects, Rubrik's motion graphics. On a mid-range laptop over a hotel connection, the message arrives after the visitor has already scrolled.

### 6.8 Tone mismatch with regulated audiences

Huntress's "Wrecking Hackers" voice is effective for MSP partners and startups, and less so for a hospital compliance committee or a county procurement officer.

### 6.9 Missing "who is this for"

Many sites do not say whether they serve 20-seat firms or 20,000-seat enterprises until deep in a pricing or packaging page. Trend Micro and Bitdefender are exceptions with explicit SMB paths.

### 6.10 Thin "About" pages

Founding year, leadership, location, and ownership are often buried or absent. Bishop Fox ("since 2005") and TeamLogic (350+ offices) are exceptions that turn tenure and scale into proof.

### 6.11 Regional-tier specific: template sameness

Most regional MSP sites (see Section 12) are built on the same handful of WordPress/HubSpot themes, use the same stock imagery, and open with the same "peace of mind" or "IT that works for you" headline. They are interchangeable, which means price becomes the only differentiator.

### 6.12 Notes by brand: the twenty most instructive sites

Longer notes on the sites that carry the most transferable lessons. Facts are snippet-derived unless marked (approx.).

**CrowdStrike.** The homepage title is literally the promise ("We Stop Breaches with AI-native Cybersecurity"). The platform page frames Falcon as "one unified platform to secure the agentic enterprise." Everything else on the site is subordinate to those two lines. The weakness is depth: the Platform mega menu (approx.) lists more than a dozen modules, which is right for a CISO and wrong for anyone else. Lesson: a three-word promise is more valuable than any amount of feature listing, but the promise has to be one the firm can defend.

**Wiz.** Repeatedly cited in 2026 design roundups as the reference for making a technical product approachable: left-aligned headline, open whitespace, playful line illustration. The site claim "more than 30% of Fortune 100" appears in partner and solution-brief copy. Lesson: in a dark, glowing category, restraint reads as confidence. This is the closest visual reference for Celestino's tone, adjusted for a services firm.

**Huntress.** The trial is the product marketing: "Start Free Trial," no credit card, "deploy in minutes," with dedicated trial pages per product (EDR, ITDR, SIEM, SAT, ISPM). The homepage promises to secure "endpoints, email, and employees" with a 24/7 SOC. Voice is deliberately irreverent. Lesson: the trial mechanics are worth copying as a scoped free assessment; the voice is not, for Celestino's regulated audience.

**Arctic Wolf.** The most complete industry navigation in the set: twelve verticals including State & Local Government, Education, Healthcare, Financial Services, Legal, Credit Unions. Bundles page and an ROI calculator sit in the header. The "3 trillion security events weekly" claim and the Concierge Security Team framing do the proof work. Lesson: industry pages plus a named delivery model (who is your person) is the pattern for a services buyer.

**Expel.** The homepage leads with "transparent service" and a 14-minute MTTR claim for high/critical incidents; a public MDR Packages page lists what each package includes; a long-form article answers "How much does MDR cost?" Third-party reviews note the package page still omits dollar figures. Lesson: publishing tiers and an honest cost explainer is achievable and differentiating even without exact prices. Celestino can go one step further and publish ranges.

**eSentire.** "Build a Quote" is a self-serve estimator; "Switch to eSentire" and "eSentire MDR vs everyone" pages capture replacement and comparison intent. Lesson: three page types Celestino should have (estimator, switching, comparison), executed without the combative tone.

**Cato Networks.** A Use Cases hub sits alongside the platform nav, so a buyer can enter by problem. The headline ("AI-Native SASE" / "Secure Your Tomorrow") is the weakest part of an otherwise well-structured site. Lesson: use-case navigation; ignore the tagline.

**Cloudflare.** Public plan tiers with prices, a self-serve "Get started," and a Learning Center that ranks for definitional queries. Lesson: the combination of public pricing and an educational hub is the strongest organic-growth engine in the set. Scaled down, that is a pricing page and a plain-English glossary.

**Bishop Fox.** "The leading authority in offensive security since 2005." Tenure sits in the headline and Labs research backs it. Lesson: Celestino's 25+ years is its Bishop Fox move, provided the exact founding year is stated and verifiable.

**HackerOne.** "Not every vulnerability matters. Fix the ones that do." The headline names a real buyer frustration (alert fatigue, unprioritized findings) in plain words. Lesson: a headline that takes a stance on a problem outperforms a headline that describes a product.

**Coalfire.** Frameworks are the product: "100+ Frameworks. One place to understand global cybersecurity compliance." Services and Industries nav, an annual compliance outlook. Copy is long and technical. Lesson: name frameworks explicitly; then, unlike Coalfire, write for the practice administrator rather than the auditor.

**LevelBlue / Trustwave.** Post-merger positioning is scale ("world's largest pure-play MSSP"). The most useful detail for Celestino is that Trustwave's FedRAMP and StateRAMP credentials are called out as the reason the merger expands public-sector reach. Lesson: public-sector authorizations are a headline-level asset; Celestino's regional equivalents (state registrations, SWaM, cooperative contracts) should be treated the same way.

**Dragos.** The hero currently promotes the 9th annual OT Year in Review. A public-sector industries page exists. Lesson: a recurring, dated flagship publication anchors authority; a Virginia SMB brief can play the same role at small scale.

**Claroty.** Public Sector has its own nav item and page; a 2026 Gartner MQ Leader badge sits near the hero. Lesson: public sector as first-class navigation.

**Varonis.** Homepage offers a free risk assessment (approx.) and a dedicated Trust section with security standards and practices; a federal government industry page exists. Lesson: the trust page and the scoped free assessment are both within Celestino's reach.

**Acronis.** Publishes monthly "What's New" release notes and cites "more than 21,000 service providers" and a G2 ranking on site. Lesson: a visible cadence of improvement is a trust signal; a quarterly service changelog is the services-firm equivalent.

**Sophos.** Free trials on nearly every product page, a Free Tools page, and G2 / Gartner Peer Insights rankings cited directly. Lesson: reduce commitment at every step; use review-site proof rather than self-declared superlatives.

**Ntiva.** Homepage H1 "Managed IT Services Built Around Your Business"; a pricing page in the main nav explaining per-user pricing and what it includes; a long-form "managed IT services cost" article. Serves the Virginia/DC market directly. Lesson: this is the local benchmark for transparency; Celestino must at least match it.

**Dataprise.** Publishes managed IT plans and pricing and gives co-managed IT its own service page alongside fully managed and end-user support. Headline is generic ("Exceptional Teams, Exceptional Outcomes"). Lesson: copy the IA, not the copy.

**Intelligent Technical Solutions (ITS).** "Managed IT Pricing in 1 Minute" is the homepage CTA, and the site publishes candid competitor comparison articles (for example, ITS vs Framework IT). Lesson: a one-minute estimator is the best CTA observed in the regional tier, and honest comparison content is a viable regional play.

---

## 7. Important information competitors bury

What buyers want early and usually cannot find without a call.

| Information | Who buries it | Who surfaces it | Celestino action |
|---|---|---|---|
| Pricing model (per user / per device / flat) | Nearly everyone | Ntiva, Dataprise, Framework IT, ITS, Expel (packages), Cloudflare, Snyk | Publish model, ranges, and what is included; keep exact quotes for the call |
| What is *not* included | Everyone | Expel's explainer comes closest | Publish an "included / not included / add-on" table per tier |
| Response-time commitments (SLA/SLO) | Most MSPs and MSSPs | Expel (MTTR), ReliaQuest (containment claim) | Publish response targets by severity, and how they are measured |
| Onboarding timeline and process | Nearly everyone | Huntress ("deploy in minutes") for software; few services firms | Publish a "first 90 days" walkthrough |
| Contract length and exit terms | Everyone | Sophos ("no contracts" for trials) | State minimum term, notice period, and data hand-back policy |
| Who does the work (in-house vs subcontracted, onshore vs offshore) | Nearly everyone | Arctic Wolf (Concierge model), Huntress (SOC) | Say plainly: who answers the phone, where they sit, who dispatches onsite |
| Compliance frameworks actually supported | Most | Coalfire (100+ frameworks), LevelBlue (FedRAMP/StateRAMP) | List HIPAA, FINRA, SOX, CMMC/NIST 800-171, PCI with what Celestino does for each |
| Company facts (founded, HQ, ownership, size) | Most | Bishop Fox, TeamLogic, Marco (approx.) | Founded year, Virginia HQ, ownership, headcount band, service radius |
| Insurance and certifications (cyber liability, SOC 2, partner tiers) | Nearly everyone | Trust centers (Snyk, Varonis) | A trust page with certificates, insurance summary, and partner tiers |
| Technology stack used to deliver service | Most MSPs | ReliaQuest (integrations), F5 (reference architectures) | Publish the standard stack (RMM, EDR, backup, email security) by name |
| Case studies with client names | Most regional firms | National vendors | Even three named, permissioned Virginia case studies beat twenty anonymous ones |
| How to reach support right now | Buried in footer | Barracuda/Acronis (docs and portals) | Support phone, portal link, and after-hours path in header or a persistent bar |
| Public-sector procurement vehicles (eVA, SWaM, GSA, cooperative contracts) | Almost everyone outside gov-focused firms | Carahsoft-style listings, Marco (E&I contract listing) | A procurement page listing vehicles, DUNS/UEI, NAICS, and certifications |

---

## 8. Trust signals that should appear sooner

Ordered by how early they should appear on Celestino's homepage. Most competitors put these in the footer, the About page, or nowhere.

1. **Founding year and location in the hero or immediately beneath it.** "Serving Virginia since [year]" is a verifiable claim that outperforms "trusted partner." Bishop Fox's "since 2005" model.
2. **Named compliance frameworks in the first screen.** HIPAA, FINRA, SOX at minimum; CMMC/NIST 800-171 if Celestino serves defense supply chain. Coalfire and LevelBlue do this; regional MSPs mostly do not.
3. **Review-site ratings with counts.** Google Business rating, Clutch, and G2 if applicable. Akamai leads a security hero with a Peer Insights award; Sophos cites G2 grids. The regional analog is a Google rating badge with a live count.
4. **Response commitments.** "Critical issues acknowledged within N minutes, 24/7" with the definition of "critical." Expel proves this works.
5. **Who answers.** A photo strip of the actual support and engineering team, with first names and roles. Regional buyers are buying people; national vendors cannot do this credibly and regional ones rarely do.
6. **Technology partner tiers.** Microsoft partner designation, Fortinet/Cisco/Datto/etc. tiers, shown as logos with the tier named. This is the regional equivalent of Gartner badges.
7. **Insurance and security posture.** Cyber liability coverage exists, SOC 2 or equivalent status if held, MFA/EDR on Celestino's own fleet. A one-line trust summary linking to a trust page.
8. **Public-sector readiness tokens.** SWaM certification, eVA registration, cooperative contract memberships, UEI/CAGE. These are scanned for by procurement staff and are almost never on a regional MSP homepage.
9. **Named clients or permissioned logos.** Even five Virginia organizations with consent. If consent is limited, use descriptors ("a 140-bed hospital in the Shenandoah Valley") with the metric.
10. **Physical address and a real phone number in the header.** Not a form. Regional buyers check that the firm is local before anything else.
11. **A dated, recent piece of content.** A monthly note or quarterly report with a visible date proves the firm is alive and paying attention. NCC's monthly Threat Pulse is the model.
12. **A plain statement of size and scope.** "We are a [N]-person team supporting roughly [N] organizations and [N] endpoints." Honesty about size is a trust signal for buyers who are afraid of being too small for a big vendor.

---

## 9. Conversion opportunities competitors miss

Concrete mechanisms Celestino can implement that most of the 67 audited firms do not.

### 9.1 A lower-friction primary CTA than "Contact us"

Options ranked by friction, low to high:

1. "See pricing and packages" (page, no form)
2. "Get a 1-minute estimate" (three-question calculator: users, locations, compliance needs → range)
3. "Book a 20-minute fit call" (embedded scheduler, no sales-speak)
4. "Request a free security posture review" (scoped, with what the client receives listed)
5. "Contact us" (fallback only)

eSentire's quote builder and ITS's "pricing in 1 minute" prove the first two work for security and managed IT respectively.

### 9.2 Persistent, quiet support access

A slim bar or header link: support phone, client portal, after-hours path. It converts existing clients into references and reassures prospects that support is findable.

### 9.3 Industry entry points that speak the buyer's language

Healthcare (HIPAA, BAAs, EHR vendors), financial/advisory (FINRA, SEC, SOX), local government and education (procurement vehicles, budget cycles, records retention), professional services (law firms, CPA firms), nonprofits (grant compliance). Arctic Wolf's twelve verticals are the enterprise version. Five well-written vertical pages beat a generic "industries we serve" list.

### 9.4 Co-managed IT as its own front door

Most MSPs bury co-managed IT under "services." Dataprise gives it a page. Internal IT leads searching "co-managed IT Virginia" are a distinct, high-intent audience with different objections (job security, control, tooling). A dedicated page with a "what we do / what your team keeps" split addresses them directly.

### 9.5 Development services as a differentiator, not an afterthought

Few MSPs offer software engineering. Almost none present it well. A section that shows real work (screens, architecture summaries, stack) and explains how development and managed IT combine (build it, host it, secure it, support it) is uncommon in this market.

### 9.6 "Switching from another MSP" flow

eSentire has "Switch to eSentire." Magna5 has "Why choose Magna5 as your new MSP." Most buyers are replacing a provider, not buying for the first time. A page that addresses transition risk (overlap period, documentation capture, credential handover, no-downtime cutover) captures that intent.

### 9.7 Exit-intent honesty

Instead of a discount popup, a one-line "Not ready? Here's what to check about any MSP before you sign" leading to a checklist. It positions Celestino as the honest advisor and captures email without a gimmick.

### 9.8 Proof placed at the decision point

Put a relevant case study or review next to each CTA, not in a separate "Customers" page. National vendors separate proof from action; regional buyers need both in the same viewport.

### 9.9 Making the phone number a CTA

Regional buyers, especially in government and healthcare, still call. A click-to-call number in the sticky header, answered by a human, is a conversion path most sites treat as an afterthought.

### 9.10 Post-conversion clarity

After the form or booking, show exactly what happens next (who calls, when, what to prepare). Nearly every audited site ends at "Thanks, we'll be in touch."

---

## 10. Market gaps

Gaps in the market as visible through websites, not necessarily in delivery.

### 10.1 The transparency gap

Only a handful of firms across both tiers publish pricing structure, response targets, and contract terms together. The gap is widest in the regional MSP tier where sales cycles depend on the discovery call. A firm that publishes all three will be distinct in every Virginia search result.

### 10.2 The public-sector-ready small firm gap

Public-sector web presence is dominated by large vendors and resellers (Carahsoft-style listings, FedRAMP/StateRAMP badges). Small local firms rarely present procurement vehicles, SWaM status, or government-specific service descriptions. County governments, school divisions, and authorities in Virginia are underserved by firms that speak their language on the web.

### 10.3 The compliance-plus-development gap

Compliance consultancies (Coalfire) do not build software. Development shops do not do compliance. MSPs do neither well on the web. A firm presenting "we build it, host it, secure it, and keep it compliant" for regulated SMBs fills a gap that is visible in search results.

### 10.4 The calm-design gap in the regional tier

Wiz, Cyera, Expel, and Island prove calm, well-typeset design reads as competence. The regional MSP tier is uniformly loud, stock-photo-driven, and template-based. Craft alone will separate Celestino from every other Virginia MSP result.

### 10.5 The "who actually does the work" gap

Almost no site says whether support is in-house, onshore, subcontracted, or outsourced overnight. Buyers who have been burned by a previous provider want this answered before the call.

### 10.6 The onsite-support gap

Cloud-first vendors have made "onsite" sound old-fashioned. But healthcare, manufacturing, government, and multi-site firms still need hands on hardware. Celestino's nationwide onsite claim is unusual for its size and is almost never presented as a product (dispatch SLA, coverage map, what onsite includes).

### 10.7 The plain-English glossary gap for SMB buyers

National vendors' glossaries are written for security practitioners. There is no widely-linked, plain-English glossary for SMB executives ("What is MDR and do I need it?", "What does HIPAA actually require of my IT?"). A regional firm can own this in its state.

### 10.8 The service changelog gap

Software vendors publish release notes. Service firms publish nothing about how their service improves. A quarterly "what we changed in how we deliver" note would be unique in the regional tier.

---

## 11. Celestino differentiation opportunities

Celestino should not try to look like CrowdStrike. It should look like the most trustworthy, clear, and competent small firm in Virginia, and be visibly ready for regulated and public-sector buyers. Ranked by expected impact.

### 11.1 Lead with verifiable facts, not adjectives

Hero pattern: **[what we do] for [whom] in [where], since [year].** Example structure (copy to be written separately): "Managed IT, cybersecurity, and software for regulated organizations in Virginia. Since [year]." Then a proof strip: founded year, Google rating with count, named frameworks, partner tiers, onsite coverage.

Avoid: "peace of mind", "next-gen", "trusted partner", "we stop breaches."

### 11.2 Publish the three things everyone hides

1. **Pricing model and ranges** per tier, with an included/not-included table.
2. **Response targets** by severity with definitions.
3. **Contract terms** (minimum term, notice, hand-back).

This is the single highest-leverage differentiator available and is directly supported by what Ntiva, Dataprise, Framework IT, ITS, and Expel already do at their tiers.

### 11.3 A first-class Public Sector section

Nav item, not a footer link. Contents: procurement vehicles and registrations (eVA, SWaM if held, cooperative contracts), UEI/CAGE, NAICS codes, government-specific services (records retention, CJIS-adjacent needs, election-season readiness for localities), reference to NIST 800-171/CMMC where relevant, a named public-sector point of contact, and a downloadable capability statement. Claroty, Dragos, Google, and Check Point show the enterprise version; nobody does it at regional scale.

### 11.4 Compliance pages that say what Celestino does, not what the law says

One page each for HIPAA, FINRA/SEC, SOX, and (if applicable) CMMC/NIST 800-171 and PCI. Each page: who it applies to, the IT controls it implies, what Celestino delivers against each control, what remains the client's responsibility, evidence produced (reports, logs, attestations). Coalfire lists frameworks; Celestino should list deliverables.

### 11.5 Co-managed IT as a distinct offer

Page structure: who it is for (internal IT of 1-5 people), the split (what your team keeps / what we take), tooling and access model, escalation path, pricing model. Address the job-security objection directly.

### 11.6 Software and app development shown as real work

Portfolio-style section with three to six projects: problem, stack, outcome, screenshots or diagrams. Explain the combined model: build, host, secure, support. This is a genuine market gap (Section 10.3).

### 11.7 Onsite support as a product

Coverage map, dispatch targets, what onsite includes (hardware, network, structured cabling, site surveys, hands for remote engineers), how nationwide coverage is delivered (own staff vs vetted partners, stated honestly). Turn a claim into a described service.

### 11.8 Calm, typographic design

Light background, one accent color, real photography of the team and Virginia locations, generous whitespace, clear hierarchy, no particle animations. Motion limited to purposeful reveals and diagram state changes. Reference points: Wiz, Expel, Island, Cyera for restraint; Bishop Fox for editorial confidence.

### 11.9 A "how we work" walkthrough

Scrollable "first 90 days" page: discovery, documentation, onboarding, stabilization, quarterly business reviews. Include what the client must provide at each stage. Tanium and Arctic Wolf do product tours; almost nobody does a service tour.

### 11.10 A trust page

Certificates, insurance summary, partner tiers, internal security practices (MFA, EDR, backup, vendor management), sub-processors and tools used, incident-response contact. Snyk and Varonis are the models. It doubles as a procurement attachment.

### 11.11 A dated, recurring publication

Quarterly "Virginia SMB Security Brief" or monthly one-page threat note. Cheap to produce, proves the firm is alive, gives sales a reason to email. NCC (monthly) and Dragos (annual) are the models at different scales.

### 11.12 Switching page

"Moving from another provider" with a transition plan, overlap period, and documentation-capture checklist. Captures replacement intent (Section 9.6).

### 11.13 Honesty about size

State team size, client count band, and endpoint count band. Buyers of Celestino's size are often afraid of being the smallest client of a big vendor. Being explicitly "right-sized" is a differentiator.

### 11.14 Voice

Plain, specific, second person, short sentences. No jargon without a one-line definition. No absolutes. The test for every headline: would a county IT director and a medical practice administrator both understand it on first read?

### 11.15 Homepage section specification derived from the audit

A section-by-section spec for the Celestino homepage. Each section names the competitor pattern it borrows and the one it deliberately avoids. Copy is placeholder structure, not final text.

| # | Section | Purpose | Borrowed from | Avoids | Notes |
|---|---|---|---|---|---|
| 1 | Header | Orientation and always-available action | Universal sticky header (3.12); location-led nav (12.2) | Product-family menus (6.1) | Logo, Services, Industries, Public Sector, Pricing, Resources, About; Support link; phone; filled CTA |
| 2 | Hero | One-sentence promise + two CTAs | CrowdStrike, HackerOne, Cyera headline form (2.4) | Carousel, particles, "next-gen" (5) | Headline under ten words; sub-line with tenure and geography; primary "See pricing" or estimator, secondary "Book a fit call"; one real photograph |
| 3 | Proof strip | Verify the hero within one scroll | Abnormal numbers strip, Akamai review-award hero, Sophos G2 citations (3.4, 8) | Uncited "#1" (5) | Founded year; Google rating + count; HIPAA / FINRA / SOX; partner tiers; onsite coverage statement |
| 4 | Who we serve | Self-identification by industry | Arctic Wolf twelve verticals (3.8) | Generic "industries" list | Five cards: healthcare, financial/advisory, local gov & education, professional services, nonprofits; each links to a vertical page |
| 5 | Services overview | Map of the offer | eSentire "What we do" (2.6) | Twelve-box platform diagram (5) | Six to eight plain-label cards; co-managed IT and development get equal weight |
| 6 | How we work | Reduce fear of switching and onboarding | Tanium/Arctic Wolf tours (4.3); Magna5 switching page (9.6) | "Contact us to learn more" | Four-step strip (discover, document, onboard, review) linking to the first-90-days page |
| 7 | Transparency block | Answer the hidden questions | Expel packages + cost explainer; Ntiva/Dataprise pricing pages (4.1) | Gated pricing (6.5) | Three tiles: pricing model, response targets, contract terms; link to pricing page |
| 8 | Public sector | Signal readiness to procurement staff | Claroty/Dragos public-sector pages; LevelBlue authorizations (4.8) | Burying in footer (7) | Vehicles, registrations, capability statement download, named contact |
| 9 | Proof at the decision point | Case study next to action | 9.8 | Separate "customers" page only | One Virginia case study with a metric, adjacent to a CTA |
| 10 | Team | Show who answers | 8 item 5 | Stock photography (5) | Photo strip with first names and roles; statement of size (11.13) |
| 11 | Recent brief | Prove the firm is alive | NCC monthly, Dragos annual (3.11) | Undated blog list | Latest quarterly brief with date; link to archive |
| 12 | Final CTA | Convert with clarity on next steps | 9.10 | "We'll be in touch" | Restate the two CTAs; say who calls and when |
| 13 | Footer | Secondary sitemap and trust | 3.15; trust centers (4.11) | Legal-only footer | Address, phone, hours, trust page, procurement page, certifications, partner logos |

### 11.16 Recommended sitemap

Derived from the page types that recur among the strongest sites in both tiers (Sections 3, 4, 12). Page names are working labels.

```
/                               Homepage (spec in 11.15)
/services/                      Services overview
/services/managed-it/           Fully managed IT
/services/co-managed-it/        Co-managed IT (11.5)
/services/cybersecurity/        Security services (MDR partner, EDR, email, awareness)
/services/cloud/                Microsoft 365, Azure, migrations
/services/backup-dr/            Backup and disaster recovery
/services/compliance/           Compliance overview
/services/compliance/hipaa/     HIPAA (11.4)
/services/compliance/finra/     FINRA / SEC
/services/compliance/sox/       SOX
/services/compliance/cmmc/      CMMC / NIST 800-171 (if offered)
/services/development/          Software, web, and app development (11.6)
/services/development/work/     Portfolio
/services/onsite-support/       Onsite and nationwide dispatch (11.7)
/industries/                    Overview
/industries/healthcare/
/industries/financial-services/
/industries/local-government-education/
/industries/professional-services/
/industries/nonprofits/
/public-sector/                 Procurement vehicles, registrations, capability statement (11.3)
/pricing/                       Model, ranges, included/not-included, terms (11.2)
/pricing/estimate/              One-minute estimator (9.1)
/how-we-work/                   First 90 days (11.9)
/switching/                     Moving from another provider (11.12)
/why-celestino/                 Objection handling, comparisons (3.5)
/resources/                     Hub
/resources/brief/               Quarterly Virginia SMB security brief (11.11)
/resources/glossary/            Plain-English glossary (10.7)
/resources/changelog/           Quarterly service changelog (10.8)
/resources/case-studies/
/about/                         Founding year, ownership, team, size (11.13)
/about/trust/                   Trust page (11.10)
/locations/                     Virginia regions + nationwide onsite
/support/                       Support phone, portal, after-hours path (9.2)
/contact/                       Fallback contact with scheduler
```

Thirty-odd pages at launch is more than most regional competitors publish, and fewer than any national vendor. The value is not in the count; it is that each page answers a question buyers are shown to have and competitors are shown to dodge.

---

## 12. Regional MSP/MSSP tier addendum

These are Celestino's realistic competitors: regional and mid-market managed IT and security providers. Same columns as the main matrix, with a longer lesson column. Snippet-derived facts are stated; everything else is (approx.).

### 12.1 Matrix

| Brand | Positioning | Hero | Primary CTA | Nav Structure | Proof | Visual Approach | Animation | Resources | Strength | Weakness | Relevant Celestino Lesson |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ntiva (VA/DC metro, national) | "Managed IT Services Built Around Your Business" | Service-keyword H1 + customer-focused value line | "Get a quote" / pricing page in main nav (approx.) | Services, Industries, Pricing, Resources, About (approx.) | Clutch reviews, client logos, per-user pricing explanation | Blue/white, HubSpot-style, photography | Light | Blog incl. "managed IT services cost" article | Pricing page in main nav; per-user model explained | Large-MSP tone; less local feel | Direct local competitor. Match pricing transparency, beat on local specificity and craft |
| Dataprise (MD/DC, national) | "Exceptional Teams, Exceptional Outcomes: Smarter IT That Powers Growth" | Outcome headline + "we transform it" tagline | "Talk to an expert" (approx.) | Services (Fully Managed, Co-Managed, End-User Support), Technology, Industries, Plans & Pricing | Plan/price page, sitemap-visible service depth | Blue/teal corporate | Light | Blog, resources | Publishes managed IT plans and pricing; co-managed IT has its own page | Headline is generic; "transform" is filler | Copy the plan-page pattern and co-managed page; avoid the abstract headline |
| Corsica Technologies (Mid-Atlantic/Southeast) | "Next-gen managed services" for midmarket and enterprise | Segment-targeted headline; "Corsica Secure" bundled IT + security | "Schedule a consultation" (approx.) | Services (Managed IT, Cybersecurity, Digital Transformation), Industries, Resources | "73 million cyber threats blocked per month" site claim; Cybersecurity Service Guarantee page; unmetered pricing page | Dark blue/orange | Light-moderate | Blog, guides | Service guarantee page and unmetered pricing concept | "Next-gen" cliché; midmarket-up tone excludes small buyers | A written service guarantee is a strong, rare trust device; state it in plain terms |
| TeamLogic IT (national franchise) | "Our Mission Is Your Success"; local SMB IT via 350+ offices | Franchise-wide mission headline; local office pages | "Contact your local office" (approx.) | Services, Industries, Locations, About, Franchise (approx.) | Office count, national scale, local presence | Blue/white franchise template | None-light | Blog | Local office pages give "near me" SEO | Mission-statement headline; template sameness across offices | Being independent and local is an asset; say "one team, one owner, one phone number" |
| Framework IT (Chicago) | "Helping You Get IT Right"; "Voted #1 Chicago IT Company"; Business Optimization Process | Award + process-led headline | "Get a quote" / "Book a call" (approx.) | Managed IT, Services, Industries, Blog (approx.) | Clutch reviews, local award, published Chicago cost ranges | Clean, light, modern | Light | Cost-of-managed-IT articles, comparison content | Fee model that decreases as environment standardizes; publishes local price ranges | "#1" claim depends on a vote source | Publish Virginia cost ranges; consider an incentive-aligned pricing model and explain it |
| Marco (Midwest, multi-region) | "Technology Made Clear"; managed print, IT, voice | Three-word clarity promise | "Contact us" / "Get support" (approx.) | Solutions (IT, Print, Voice, AV), Industries, Support, About | Cooperative contract listings (E&I), scale | Blue/white corporate | Light | Blog, guides | Headline literally promises clarity; contract-vehicle listings visible | Print-heavy heritage muddies IT story | "Made clear" is the right instinct; Celestino can execute clarity better in one domain |
| Thrive (Northeast, national) | "NextGen Managed IT Services"; Thrive Platform, ThriveCloud | Platform-centric headline | "Contact us" / "Request assessment" (approx.) | Services (Cloud, Managed IT, Cybersecurity), Platform, Industries, Resources | Data center tiers, global footprint, platform brand | Green/dark, enterprise MSP look | Light-moderate | Blog, case studies | Owns its platform and cloud brand | "NextGen" cliché; enterprise tone | Do not brand the stack; describe it. Buyers care what runs, not what it is called |
| Magna5 (multi-region US) | "Our team is always on, and always watching"; "Get complete peace of mind" | Vigilance headline + peace-of-mind subhead | "Get Started" page | Services (Managed IT, Cybersecurity, Backup/DR, SD-WAN, Cloud), Locations, Why Magna5 | "Why choose Magna5 as your new MSP" page; location pages | Blue/white | Light | Blog | Dedicated switching/"why us" page; per-city pages | "Peace of mind" cliché; vigilance claim unverified | Build the switching page; replace "peace of mind" with measurable commitments |
| Intelligent Technical Solutions (ITS; West/Chicago, multi-city) | "Future-Proof IT Support That Scales With Your Success" | Outcome headline + "Secure, Manage, and Support" triad; "Managed IT Pricing in 1 Minute" | "Managed IT Pricing in 1 Minute" (estimator) | Services, Industries, Locations, Learning Center, Pricing (approx.) | Clutch reviews, objective competitor comparison articles | Blue/orange, HubSpot-style | Light | Large learning center; "ITS vs [competitor]" articles | One-minute pricing estimator; candid comparison content | "Future-proof" cliché | The estimator is the best CTA in this tier; Celestino should ship one |

### 12.2 What the regional tier gets right (and Celestino must match)

- **Pricing pages and estimators** (Ntiva, Dataprise, Framework IT, ITS). This is now expected among the better regional MSPs. Not having one is a visible gap.
- **Co-managed IT pages** (Dataprise). Internal-IT buyers are a separate audience.
- **Switching/"why us" pages** (Magna5, ITS comparison content).
- **Location and "near me" pages** (TeamLogic, Magna5, ITS). For Celestino: Northern Virginia, Richmond, Hampton Roads, Shenandoah Valley, Southwest Virginia, plus a nationwide onsite page.
- **Service guarantees** (Corsica). A written guarantee with terms is rare and credible.
- **Local reviews and Clutch profiles** as proof.

### 12.3 What the regional tier gets wrong (and Celestino should avoid)

- Cliché headlines: "peace of mind", "next-gen", "future-proof", "IT that works for you", mission statements.
- Template sameness: same themes, same stock imagery, same shield icons.
- Absent public-sector content despite many of these firms serving local government.
- No development services, or development buried as a line item.
- No trust page, no stated stack, no response targets.
- "Contact us" as the only conversion path (Marco, Thrive, TeamLogic).
- Corporate tone borrowed from enterprise vendors, which alienates the 20-150 seat buyer.

### 12.4 Direct implication for Celestino

Ntiva and Dataprise are the in-market benchmarks: they publish pricing structure, have clear service IA, and serve the same geography. Celestino cannot outspend them on content volume. It can beat them on:

1. **Specificity** (Virginia, named frameworks, named procurement vehicles, named stack).
2. **Transparency** (pricing, response targets, contract terms, who does the work).
3. **Craft** (calmer, better-typeset, faster site with real photography).
4. **Breadth of a different kind** (managed IT + compliance + development in one small team).
5. **Public-sector readiness** presented as a first-class offer.

---

## 13. Appendix: prioritized recommendations for the rebuild

Grouped by phase. Each item references the section that justifies it.

### 13.1 Must ship at launch

| # | Recommendation | Justification |
|---|---|---|
| 1 | Hero: one plain sentence naming service, audience, place, and tenure; one filled CTA (estimate or pricing), one ghost CTA (book a call) | 3.1, 3.2, 11.1 |
| 2 | Proof strip directly beneath hero: founded year, Google rating with count, frameworks, partner tiers, onsite coverage | 3.4, 8 |
| 3 | Navigation: Services, Industries, Public Sector, Pricing, Resources, About, plus persistent Support link and phone | 3.3, 9.2, 11.3 |
| 4 | Pricing page: model, tier ranges, included/not-included table, contract terms, FAQ | 4.1, 7, 11.2 |
| 5 | Compliance pages: HIPAA, FINRA/SEC, SOX (add CMMC/NIST 800-171, PCI if offered) with Celestino deliverables per control | 11.4 |
| 6 | Co-managed IT page | 9.4, 11.5 |
| 7 | Public Sector section with procurement vehicles, registrations, capability statement | 4.8, 10.2, 11.3 |
| 8 | Development portfolio section with 3-6 real projects | 9.5, 11.6 |
| 9 | Onsite support page with coverage map and dispatch targets | 10.6, 11.7 |
| 10 | Trust page | 4.11, 11.10 |
| 11 | About page with founding year, ownership, team photos, size statement | 6.10, 8, 11.13 |
| 12 | Calm light design system, one accent, real photography, restrained motion | 4.9, 11.8 |

### 13.2 Ship within 90 days of launch

| # | Recommendation | Justification |
|---|---|---|
| 13 | One-minute estimator (users, locations, compliance → range) | 9.1, 12.1 (ITS) |
| 14 | "First 90 days" service walkthrough | 4.3, 11.9 |
| 15 | Switching-from-another-MSP page | 9.6, 11.12 |
| 16 | Five industry pages: healthcare, financial/advisory, local government & education, professional services, nonprofits | 3.8, 9.3 |
| 17 | Named or descriptor-based Virginia case studies with a metric each | 3.13, 8 |
| 18 | Regional location pages (NoVA, Richmond, Hampton Roads, Valley, SWVA) plus nationwide onsite page | 12.2 |

### 13.3 Ongoing

| # | Recommendation | Justification |
|---|---|---|
| 19 | Quarterly Virginia SMB security brief (dated, one page) | 3.11, 4.5, 11.11 |
| 20 | Plain-English glossary for SMB executives | 3.6, 10.7 |
| 21 | Quarterly service changelog | 4.5, 10.8 |
| 22 | Written service guarantee with terms | 12.1 (Corsica) |
| 23 | Review collection routine (Google, Clutch) feeding the proof strip | 3.7, 8 |

### 13.4 Do not do

- No hero carousel. (5)
- No particle/network animation, no glowing padlocks. (5, 6.7)
- No "peace of mind", "next-gen", "future-proof", "we stop breaches", "#1". (5, 6.6)
- No proprietary names for standard services. (6.4)
- No form-gated pricing or datasheets. (5, 6.5)
- No "Contact us" as the sole CTA. (5, 9.1)
- No stock hacker imagery. (5)

---

## 14. Source notes

Snippet-derived facts in this document were captured from search results for the brands' own domains and, where noted, from press releases and third-party listings (Clutch, G2, Gartner Peer Insights, Colorlib, Worksent, ITS's comparison article on Framework IT). Representative pages consulted via snippet include: crowdstrike.com (homepage, platform), wiz.io, catonetworks.com (homepage, use cases), huntress.com (homepage, trial pages), arcticwolf.com (homepage, solutions, bundles, industry pages), sentinelone.com, cloudflare.com, okta.com, expel.com (homepage, MDR packages, MDR pricing article), esentire.com (build-a-quote, MDR, switch pages), ntiva.com (homepage, pricing), dataprise.com (homepage, plans & pricing, co-managed), corsicatech.com (homepage, Corsica Secure, guarantee), thrivenextgen.com, bishopfox.com, coalfire.com, darktrace.com, rubrik.com, fortinet.com, rapid7.com, sophos.com, trendmicro.com, checkpoint.com, cyberark.com, proofpoint.com, trellix.com, netskope.com, snyk.io, tenable.com, hackerone.com, bugcrowd.com, dragos.com, claroty.com, vectra.ai, abnormal.ai, axonius.com, qualys.com, varonis.com, mimecast.com, akamai.com, imperva.com, f5.com, forcepoint.com, sailpoint.com, tanium.com, cyera.com, armis.com, island.io, reliaquest.com, levelblue.com, nccgroup.com, orangecyberdefense.com, withsecure.com, bitdefender.com, acronis.com, barracuda.com, microsoft.com/security, cisco.com, ibm.com, cloud.google.com/security, teamlogicit.com, frameworkit.com, marconet.com, magna5.com, itsasap.com.

Nothing in this document should be treated as a live-site fact without verification against the current page. Cells marked (approx.) should be spot-checked in a browser before any competitor-specific claim is made externally.
