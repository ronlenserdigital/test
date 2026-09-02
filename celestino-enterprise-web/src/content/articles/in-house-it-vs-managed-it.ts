import type { Article } from "../types";

export const article: Article = {
  slug: "in-house-it-vs-managed-it",
  title: "In-House IT vs Managed IT: A Cost and Risk Model for 20–500 Person Organizations",
  description:
    "A qualitative cost and risk model comparing an internal IT function with a managed IT engagement for organizations of 20 to 500 people, covering labor, tooling, coverage, key-person risk, security depth and the hybrid option.",
  category: "it-operations",
  type: "decision-guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-06-11",
  reviewedAt: "2026-08-30",
  readingMinutes: 11,
  summary:
    "For organizations between 20 and 500 people, the total cost of in-house IT is dominated by fully loaded salaries, tooling that is bought for a small user base, and the coverage gaps that come with a team of one to five people. Managed IT converts most of that into a per-user or per-device fee that includes tooling, 24x7 monitoring and specialist depth. In-house typically wins on business-application knowledge and physical presence; managed IT typically wins on coverage, security depth, key-person risk and predictable cost, and most organizations in this range end up with a blend.",
  sections: [
    {
      id: "why-headcount-is-the-wrong-starting-point",
      heading: "Why headcount is the wrong starting point",
      body: [
        "Most cost comparisons start with a salary and a managed-service quote and stop there. That comparison is wrong in both directions. The internal salary omits benefits, tooling, training, recruiting, turnover and the cost of the work that does not get done because one person cannot be in two places. The managed-service quote often omits onsite hardware handling, projects and business-application support that still have to be staffed somewhere.",
        "The right comparison is total cost of ownership across the full set of functions the organization needs, plus the risk carried under each model. This article lays out both in categories rather than dollar figures, because the figures vary by region, industry and the size of the environment. Where ranges appear, they are illustrative and should be replaced with your own numbers.",
        "The organizations this guide addresses, 20 to 500 people, share a common trait: they are large enough to need real IT operations and security, and too small to justify the seven to twelve specialized roles that a complete internal function requires.",
      ],
    },
    {
      id: "cost-categories-compared",
      heading: "Cost categories compared",
      body: [
        "The table below compares the major cost categories qualitatively. Read each row as 'where does this cost land, and how predictable is it' rather than as a scorecard. Illustrative ranges are labeled as such and are intended for orientation only.",
        "A useful exercise is to fill in your own last twelve months against each row. Most organizations discover that unplanned spend, project labor and tooling bought per-seat for a small team are a larger share of the in-house cost than the salary line.",
      ],
      table: {
        headers: ["Cost category", "In-house IT", "Managed IT", "Notes"],
        rows: [
          ["Labor", "Fully loaded salaries, typically 1.25 to 1.4 times base (illustrative)", "Included in per-user or per-device fee", "In-house labor cost is fixed regardless of workload"],
          ["Recruiting and turnover", "Recruiting fees, ramp time, knowledge loss on departure", "Absorbed by the provider", "Turnover is the largest hidden in-house cost"],
          ["Monitoring, endpoint and security tooling", "Bought per-seat at small-volume pricing", "Included, priced at provider volume", "Providers typically run the same platforms at lower unit cost"],
          ["After-hours and holiday coverage", "Overtime, on-call stipends or no coverage", "Included for monitoring and response", "Coverage is where small teams fail first"],
          ["Training and certifications", "Annual budget per person, time away from work", "Provider responsibility", "Skills decay quickly without investment"],
          ["Specialist expertise (security, cloud, network)", "Consultants at hourly rates or not available", "Included or scoped as projects", "Depth is expensive to hire and hard to keep busy"],
          ["Projects and migrations", "Internal time plus contractors", "Scoped separately or included in a project allowance", "Ask how projects are priced before signing"],
          ["Documentation and process", "Depends on individual discipline", "Contractual deliverable", "Documentation quality determines exit cost"],
          ["Management overhead", "A manager or executive supervising IT", "Account management included", "Someone still owns the relationship internally"],
          ["Predictability", "Lumpy: hiring, emergencies, hardware failures", "Mostly fixed monthly, with variable project spend", "Budget owners value predictability"],
        ],
      },
    },
    {
      id: "risk-categories-compared",
      heading: "Risk categories compared",
      body: [
        "Cost is only half the model. The risk side is where the models diverge most sharply, because risk is a function of coverage, depth and redundancy, and a small internal team has little of any of them.",
        "Key-person risk is the most common failure mode in this size range. A single administrator who holds the passwords, the vendor relationships and the undocumented knowledge of how the environment works is a business continuity risk regardless of how capable they are. Their departure, illness or vacation creates an immediate gap. Providers mitigate this with teams, documentation standards and shared tooling, which is a structural advantage rather than a matter of individual skill.",
        "Security depth is the second divergence. Effective security operations require 24x7 monitoring, threat intelligence, incident response experience and regular tuning. An internal team of one to five people cannot deliver that consistently while also running the help desk. A provider delivering [cybersecurity](/services/cybersecurity) as a managed function can, and can also produce the evidence that insurers and auditors now demand.",
      ],
      table: {
        headers: ["Risk category", "In-house IT", "Managed IT", "Mitigation"],
        rows: [
          ["Key-person dependency", "High with teams under five", "Low, provider staffs as a team", "Require documentation and credential escrow in either model"],
          ["Coverage gaps (nights, weekends, leave)", "High unless a rotation exists", "Low for monitoring and response", "Define response targets by severity and hour"],
          ["Security detection and response", "Limited, often reactive", "24x7 monitoring is standard", "Confirm who is incident commander"],
          ["Backup and recovery validation", "Often configured, rarely tested", "Restore testing is a deliverable", "Require documented restore tests"],
          ["Compliance evidence", "Depends on individual discipline", "Produced from provider tooling", "Map controls to owners in writing"],
          ["Vendor lock-in and exit", "Low", "Moderate if tooling is in provider's name", "Require licensing in your name and clean exit terms"],
          ["Business-application knowledge", "High, close to the business", "Lower unless scoped", "Keep an internal owner for line-of-business systems"],
          ["Physical presence", "High", "Depends on dispatch and onsite terms", "Negotiate onsite commitments per location"],
        ],
      },
    },
    {
      id: "what-in-house-does-better",
      heading: "What in-house IT does better",
      body: [
        "An internal team knows the business. They understand which application matters to the finance close, which executive travels every week, and which manufacturing line cannot go down during a shift. That context makes them faster at prioritization and more effective at supporting line-of-business applications that no outside provider will know as well.",
        "An internal team is also physically present. Hands-on hardware work, conference-room support, new-hire setup and walking the floor after an outage are easier with someone on site. For organizations with a single large location, a good internal generalist paired with outside depth is often the most effective arrangement.",
        "The honest limitation is that these strengths are strengths of individuals, and organizations in this size range rarely have enough of them to cover the full function. The goal of the decision is to keep what the internal team does best and move the rest to a structure that can deliver it reliably.",
      ],
    },
    {
      id: "what-managed-it-does-better",
      heading: "What managed IT does better",
      body: [
        "A managed provider delivers scale that a small organization cannot build: monitoring around the clock, a bench of specialists, standardized tooling bought at volume, documented processes and the experience of running many environments. That experience shows up as faster diagnosis of unfamiliar problems, tested playbooks for common failures, and a security posture that reflects current threats rather than the threats of the year the internal team last trained.",
        "A provider also converts unpredictable spend into a mostly fixed monthly cost. Budget owners in this size range consistently rate predictability highly, because a single emergency hardware replacement or a mid-year hire can consume the entire discretionary IT budget under an in-house model.",
        "The limitation is distance from the business. A provider needs an internal counterpart who can say what matters and approve changes, and the agreement needs onsite terms that fit your locations. A [managed IT](/services/managed-it) engagement without a defined internal owner tends to drift toward generic service.",
      ],
    },
    {
      id: "the-blend-most-organizations-choose",
      heading: "The blend most organizations choose",
      body: [
        "In practice, organizations of 50 to 500 people rarely choose a pure model. The common pattern is an internal generalist or small team focused on users, business applications and onsite work, with a provider owning infrastructure, security operations, backup and recovery, and projects. This is the co-managed structure, and it captures most of the cost and risk advantages of managed IT while keeping the business context of in-house staff.",
        "Below 50 people, the internal role often shrinks to an operations or office manager who acts as the sponsor, and the provider runs the function end to end. Above 500, internal teams grow toward full coverage and providers are engaged for specialized functions, typically security operations and disaster recovery, rather than general operations.",
        "The decision is therefore less about in-house versus managed and more about which functions belong on which side. The companion guide on [managed IT versus co-managed IT](/services/co-managed-it) covers how to draw that line function by function.",
      ],
    },
    {
      id: "building-your-own-model",
      heading: "Building your own model",
      body: [
        "To make the decision with real numbers, collect twelve months of actual spend across the cost categories above, including salaries and benefits, tooling subscriptions, contractor invoices, hardware emergencies, training and recruiting. Add the hours of executive time spent supervising IT. Then request managed-service proposals scoped to the same functions, with onsite terms and project pricing made explicit.",
        "Score risk separately using the risk table. Assign each row a severity based on your regulatory exposure and operational tolerance for downtime, then note which model reduces it and at what cost. The cheapest option on the cost table is rarely the cheapest once the risk rows are priced in, particularly for organizations subject to HIPAA, FINRA, SOX or cyber-insurance requirements.",
        "Finally, model the transition. Moving from in-house to managed, or restructuring into a blend, takes a quarter or two of documentation, tooling migration and process change. Budget for the overlap, and require the provider to deliver documentation as part of onboarding so the exit is as clean as the entry.",
      ],
    },
  ],
  keyTakeaways: [
    "Compare total cost of ownership across all IT functions, not salary against a managed-service quote; turnover, tooling and coverage are the hidden in-house costs.",
    "Key-person dependency and after-hours coverage are the dominant risks for internal teams of one to five people.",
    "In-house teams win on business-application knowledge and physical presence; managed IT wins on coverage, security depth, specialist access and cost predictability.",
    "Most organizations between 50 and 500 people land on a blend: internal staff for users and applications, a provider for infrastructure, security, recovery and projects.",
    "Whatever model you choose, require documentation, tooling licensed in your name, written control ownership and clean exit terms.",
  ],
  references: [
    { label: "NIST Small Business Cybersecurity Corner", url: "https://www.nist.gov/itl/smallbusinesscyber" },
    { label: "CISA Cyber Guidance for Small Businesses", url: "https://www.cisa.gov/cyber-guidance-small-businesses" },
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
  ],
  relatedServiceSlugs: ["managed-it", "co-managed-it", "cybersecurity"],
  relatedArticleSlugs: ["managed-it-vs-co-managed-it", "cyber-resilience-readiness-checklist", "backup-vs-disaster-recovery"],
};
