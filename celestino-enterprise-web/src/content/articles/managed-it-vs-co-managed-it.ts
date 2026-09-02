import type { Article } from "../types";

export const article: Article = {
  slug: "managed-it-vs-co-managed-it",
  title: "Managed IT vs Co-Managed IT: How to Choose an Operating Model",
  description:
    "A decision guide for organizations weighing fully managed IT against a co-managed model: responsibility matrix, decision criteria by staff count, risk, growth and after-hours coverage, and the contract terms that make either model work.",
  category: "it-operations",
  type: "decision-guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-06-04",
  reviewedAt: "2026-08-30",
  readingMinutes: 10,
  summary:
    "Managed IT means a provider owns the full technology operation: help desk, infrastructure, security tooling, vendor management and planning. Co-managed IT means your internal team keeps ownership of defined functions while the provider fills specific gaps such as after-hours coverage, security operations, projects or tier-3 escalation. Choose fully managed when you have no dedicated IT staff or fewer than two, and choose co-managed when you have a capable internal team that is capacity-constrained or missing specific skills.",
  sections: [
    {
      id: "what-each-model-actually-means",
      heading: "What each model actually means",
      body: [
        "Fully managed IT is an outsourcing arrangement in which the provider is accountable for the entire technology function. The provider runs the service desk, monitors and patches endpoints and servers, operates the security stack, manages vendors and licensing, and brings a roadmap and budget to leadership. The internal side of the relationship is usually an executive sponsor and an operations contact, not a technician.",
        "Co-managed IT is a division of labor. Your internal IT staff remain the owners of the environment and the primary face of IT to employees, while the provider takes on defined responsibilities under a written scope. Common divisions include the provider handling after-hours monitoring and response, security operations, backup and recovery, and project engineering, while the internal team handles user support, business applications and day-to-day decisions.",
        "The difference is not the tooling. Both models typically run on the same remote monitoring, ticketing, endpoint protection and documentation platforms. The difference is who is accountable for each outcome, who is on call when something breaks at 2 a.m., and whose name is on the security controls when an auditor or insurer asks.",
      ],
    },
    {
      id: "responsibility-matrix",
      heading: "Responsibility matrix: who owns what",
      body: [
        "The matrix below is the starting point for every operating-model conversation. Each row is a function that must have an owner. In a fully managed engagement, nearly every row lands in the provider column. In a co-managed engagement, the same rows get split, and the split has to be explicit or the gaps will be discovered during an incident.",
        "Use this as a worksheet. Mark each row with the model you intend to use, then check that the owner has the staffing, tooling, skills and hours to actually deliver it. A function that is nominally owned by a one-person internal team that also covers the help desk is not owned in any practical sense.",
      ],
      table: {
        headers: ["Function", "Internal team", "Provider", "Shared"],
        rows: [
          ["Tier-1 help desk and user support", "Typical in co-managed", "Typical in fully managed", "Split by hours or site"],
          ["Tier-2 and tier-3 escalation", "Rare unless senior staff exist", "Typical in both models", "Internal handles apps, provider handles infrastructure"],
          ["Endpoint patching and configuration", "Possible with a mature team", "Typical in both models", "Shared platform, defined approval windows"],
          ["Server, network and cloud infrastructure", "Co-managed when skills exist", "Typical in both models", "Provider runs, internal approves changes"],
          ["Security monitoring and response (24x7)", "Rarely feasible below 5 staff", "Typical in both models", "Provider detects, joint response plan"],
          ["Backup and disaster recovery", "Often nominal, rarely tested", "Typical in both models", "Provider runs, internal validates restore priorities"],
          ["Identity and access administration", "Common in co-managed", "Fully managed", "Internal approves, provider executes"],
          ["Business application support", "Common in both models", "Rare unless contracted", "Internal owns, provider handles platform"],
          ["Vendor and license management", "Common in co-managed", "Fully managed", "Split by vendor"],
          ["Compliance evidence and audits", "Co-managed with a compliance lead", "Fully managed", "Provider produces evidence, internal owns policy"],
          ["Projects and migrations", "Rarely enough capacity", "Typical in both models", "Internal is product owner, provider is engineering"],
          ["Strategy, budget and roadmap", "Internal leadership", "Fully managed with a vCIO function", "Joint quarterly planning"],
        ],
      },
    },
    {
      id: "decision-criteria",
      heading: "Decision criteria: staff, risk, growth and hours",
      body: [
        "Four variables settle most operating-model decisions. Work through them in order and the answer is usually clear before you reach the fourth.",
        "Staff count is the first filter. With zero or one dedicated IT person, fully managed is almost always the right answer, because one person cannot deliver coverage, depth and continuity at once and every vacation becomes a risk event. With two to four staff, co-managed is viable if the team is strong in user-facing support and the provider takes infrastructure, security and after-hours. With five or more staff, the question shifts to which specialized functions the team should not build internally, typically 24x7 security operations and disaster recovery.",
        "Risk profile is the second filter. Organizations under HIPAA, FINRA, SOX, CMMC or cyber-insurance scrutiny need documented controls, evidence and named owners. A provider can supply those under either model, but under co-managed the division of accountability must be written into the agreement or the audit will surface the gap. Growth and after-hours needs are the third and fourth filters, covered below.",
      ],
      list: [
        "0 to 1 IT staff: fully managed, with the internal contact acting as sponsor and approver.",
        "2 to 4 IT staff: co-managed, with the provider owning infrastructure, security operations, backup and projects.",
        "5 or more IT staff: co-managed for specialized functions, or a fully managed transition if turnover and hiring costs are the dominant problem.",
        "Regulated or high-risk: either model, but demand a written control-ownership matrix and evidence commitments.",
        "Rapid growth or acquisitions: whichever model can absorb new sites and users without hiring lead time, which usually favors the provider owning onboarding and infrastructure.",
        "Extended hours, multiple time zones or field operations: the provider owns monitoring and response outside business hours regardless of model.",
      ],
    },
    {
      id: "when-fully-managed-wins",
      heading: "When fully managed wins",
      body: [
        "Fully managed is the stronger choice when the organization does not want to be in the business of running IT, when hiring and retaining technical staff has been a recurring problem, or when the current internal function has become a single point of failure. It is also the right choice when leadership needs one accountable party for uptime, security posture and budget, with no ambiguity about whose job a problem is.",
        "The tradeoff is proximity. A fully managed provider is not in the hallway, so onsite presence has to be designed in through scheduled visits, dispatch commitments and, for larger environments, a dedicated onsite resource. Ask a prospective provider how they deliver hands-on support at your locations and what the response commitments look like for a hardware failure versus a password reset. [Managed IT](/services/managed-it) engagements should spell this out before signature.",
        "Fully managed also works well as a transitional model. Organizations that lose a long-tenured IT manager often move to fully managed to stabilize, then rebuild an internal function around a co-managed arrangement once the environment is documented and the tooling is standardized.",
      ],
    },
    {
      id: "when-co-managed-wins",
      heading: "When co-managed wins",
      body: [
        "Co-managed is the stronger choice when you already have competent IT staff who know the business, its applications and its people, and the problem is capacity or specialization rather than competence. The internal team keeps the relationships and the application knowledge, and the provider brings the depth that a small team cannot economically maintain: security engineering, cloud architecture, network design, disaster recovery and project delivery.",
        "It is also the right choice when the internal team is stretched across support and projects and neither is getting done well. Moving projects and infrastructure to a provider frees the team to serve users and the business, which is usually where their value is highest. A well-structured [co-managed IT](/services/co-managed-it) engagement should make the internal team look better, not smaller.",
        "The tradeoff is coordination. Two parties touching one environment need shared documentation, a single ticketing system, change-control rules and clear escalation paths. If the provider will not work in a shared toolset or insists on owning everything, it is offering managed IT with a different label.",
      ],
    },
    {
      id: "contract-terms-that-matter",
      heading: "Contract terms that make either model work",
      body: [
        "The operating model is defined by the agreement, not the sales conversation. For both models, the agreement should include a scope schedule that maps to the responsibility matrix, response and resolution targets by severity, a change-management process, documentation ownership, and an exit clause that returns credentials, documentation and data in a usable form.",
        "For co-managed engagements, add an explicit statement of which party owns each security control, which party is the incident commander during a breach, and how after-hours alerts are routed and acknowledged. For fully managed engagements, add onsite dispatch commitments, a named account lead, and quarterly review obligations that cover risk, roadmap and budget.",
        "In both cases, confirm that the tooling is licensed in your name or transferable, that backups are stored in a tenant you control, and that the provider can produce compliance evidence on request. These terms cost nothing at signature and are very expensive to negotiate during a dispute.",
      ],
    },
    {
      id: "a-simple-scoring-approach",
      heading: "A simple scoring approach",
      body: [
        "If the decision is still contested, score it. Rate each of the following on a 1 to 5 scale where 5 favors the provider owning the function: depth of current internal skills, current after-hours coverage, staffing stability over the past three years, regulatory pressure, expected growth in users and sites, and leadership appetite for running IT. A total above 22 points strongly favors fully managed. A total between 14 and 22 favors co-managed with the provider owning the highest-scoring functions. Below 14, the internal team should keep most functions and buy targeted services such as security monitoring and [backup and disaster recovery](/services/backup-disaster-recovery).",
        "Revisit the score annually. Operating models are not permanent, and the right answer changes with headcount, acquisitions, regulatory events and the departure of key staff.",
      ],
    },
  ],
  keyTakeaways: [
    "Fully managed IT makes the provider accountable for the whole technology function; co-managed IT divides accountability under a written scope while your internal team keeps ownership.",
    "Staff count is the first filter: zero to one IT staff favors fully managed, two to four favors co-managed, five or more favors co-managed for specialized functions only.",
    "Regulated organizations can use either model but need a written control-ownership matrix, evidence commitments and a named incident commander.",
    "After-hours monitoring and response belongs with the provider in both models unless the internal team is large enough to staff a rotation.",
    "Contract terms define the model: scope schedule, severity targets, documentation ownership, tooling in your name and a clean exit clause.",
  ],
  references: [
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
    { label: "CISA Cybersecurity Best Practices", url: "https://www.cisa.gov/topics/cybersecurity-best-practices" },
    { label: "NIST Small Business Cybersecurity Corner", url: "https://www.nist.gov/itl/smallbusinesscyber" },
  ],
  relatedServiceSlugs: ["managed-it", "co-managed-it", "backup-disaster-recovery"],
  relatedArticleSlugs: ["in-house-it-vs-managed-it", "cyber-resilience-readiness-checklist", "backup-vs-disaster-recovery"],
};
