import type { Solution } from "./types";

export const solutions: Solution[] = [
  {
    slug: "cyber-resilience",
    name: "Cyber Resilience",
    shortDescription:
      "Prevent what you can, detect what you cannot, and recover from the rest within a defined window.",
    icon: "shield",
    seo: {
      title: "Cyber Resilience | Prevent, Detect, Recover",
      description:
        "Celestino's cyber resilience solution combines security hardening, monitoring, tested backups and incident recovery so an attack becomes a managed event instead of a business-ending one.",
      primaryKeyword: "cyber resilience",
    },
    hero: {
      eyebrow: "Solution",
      headline: "An attack should be an incident, not an ending.",
      intro:
        "Cyber resilience assumes a control will eventually fail and designs for it: hardened identity and endpoints, monitoring that turns events into tickets, isolated backups, and a recovery plan that has been rehearsed.",
    },
    problem:
      "Most mid-sized organizations spend on prevention tools and nothing on the question of what happens when one fails. The result is a ransomware event that becomes a multi-week outage because backups were reachable, recovery order was never decided and nobody owned the response.",
    approach: [
      { title: "Harden the basics", detail: "MFA everywhere, patched systems, endpoint detection on every device, privileged access reduced to what is needed." },
      { title: "Instrument for detection", detail: "Security events from identity, endpoints and infrastructure routed into a monitored queue with defined escalation." },
      { title: "Isolate recovery", detail: "Immutable, credential-separated backups with recovery objectives set per system." },
      { title: "Rehearse the response", detail: "Incident response plan and DR runbooks exercised annually, with findings fixed." },
      { title: "Prove it", detail: "Evidence maintained continuously for auditors, insurers and customers." },
    ],
    serviceSlugs: ["cybersecurity", "backup-disaster-recovery", "security-risk-advisory", "managed-it"],
    industrySlugs: ["healthcare", "financial-services", "government-public-sector", "professional-services"],
    articleSlugs: ["cyber-resilience-readiness-checklist", "nist-csf-implementation-guide-smb", "backup-vs-disaster-recovery"],
    faqs: [
      {
        question: "How is cyber resilience different from cybersecurity?",
        answer:
          "Cybersecurity focuses on preventing and detecting attacks. Cyber resilience adds the ability to keep operating and recover when prevention fails. It covers backups, recovery planning, continuity and rehearsal, not just controls.",
      },
      {
        question: "Where should a small organization start?",
        answer:
          "With the controls that stop the most common attacks and the backup isolation that limits their damage: MFA, patching, endpoint detection, and backups an attacker cannot delete. The readiness checklist in our resources walks through the sequence.",
      },
    ],
  },
  {
    slug: "infrastructure-modernization",
    name: "Infrastructure Modernization",
    shortDescription:
      "Replace aging servers, networks and platforms with a designed hybrid environment, in planned waves.",
    icon: "layers",
    seo: {
      title: "Infrastructure Modernization | Hybrid Refresh",
      description:
        "Celestino's infrastructure modernization solution plans and executes server, network and platform refreshes as a designed hybrid environment with security, backup and cost built in.",
      primaryKeyword: "infrastructure modernization",
    },
    hero: {
      eyebrow: "Solution",
      headline: "Modernize in waves, not in a weekend.",
      intro:
        "Aging infrastructure is a security, cost and continuity problem at once. Celestino inventories what you run, designs the target state, and migrates in planned waves so the business keeps operating throughout.",
    },
    problem:
      "End-of-life servers, unsupported operating systems and network equipment that no longer receives firmware are common in organizations that grew faster than their IT planning. Each is an audit finding and an outage waiting to happen, and replacing them piecemeal produces an environment nobody fully understands.",
    approach: [
      { title: "Inventory and dependency mapping", detail: "Every workload, its dependencies and its lifecycle status documented." },
      { title: "Target architecture", detail: "Cloud, on-premises or hybrid placement decided per workload with cost and risk." },
      { title: "Wave planning", detail: "Migration order that minimizes disruption and retires the riskiest systems first." },
      { title: "Execution with rollback", detail: "Each wave tested, cut over in an agreed window, and reversible." },
      { title: "Operate the result", detail: "Ongoing administration, monitoring and lifecycle tracking so the environment does not age out again." },
    ],
    serviceSlugs: ["cloud-infrastructure", "network-management", "managed-it", "backup-disaster-recovery"],
    industrySlugs: ["professional-services", "smb-mid-market", "healthcare", "government-public-sector"],
    articleSlugs: ["cloud-vs-hybrid-infrastructure", "in-house-it-vs-managed-it"],
    faqs: [
      {
        question: "How long does a modernization project take?",
        answer:
          "It depends on the number of workloads and their dependencies. Discovery typically produces a wave plan with dates; most mid-sized environments are migrated over a series of maintenance windows spanning a few months rather than a single cutover.",
      },
    ],
  },
  {
    slug: "business-continuity",
    name: "Business Continuity",
    shortDescription:
      "Keep the organization operating through outages, disasters and cyber events with tested plans and recovery capability.",
    icon: "refresh",
    seo: {
      title: "Business Continuity Planning & Recovery",
      description:
        "Celestino's business continuity solution aligns IT disaster recovery with business priorities: recovery objectives, alternate operations, communication plans and scheduled exercises.",
      primaryKeyword: "business continuity solutions",
    },
    hero: {
      eyebrow: "Solution",
      headline: "Decide the recovery order before you need it.",
      intro:
        "Business continuity is a set of decisions made in advance: which systems come back first, how staff work in the meantime, who communicates with customers. Celestino builds those decisions into tested plans backed by real recovery capability.",
    },
    problem:
      "Many organizations have backups and no plan. When a site loses power, a server fails or ransomware spreads, the recovery order is improvised, staff wait for instructions and customers hear nothing. The technical recovery may be possible while the business still stalls.",
    approach: [
      { title: "Business impact analysis", detail: "Critical processes, their systems and tolerable downtime identified with business owners." },
      { title: "Recovery objectives", detail: "RPO and RTO per system, agreed and documented." },
      { title: "Continuity and DR plans", detail: "Alternate work arrangements, communication trees and technical runbooks." },
      { title: "Capability", detail: "Backup, replication and recovery infrastructure that can meet the objectives." },
      { title: "Exercise", detail: "Tabletop and technical exercises on a schedule, with findings tracked to closure." },
    ],
    serviceSlugs: ["backup-disaster-recovery", "managed-it", "security-risk-advisory", "cloud-infrastructure"],
    industrySlugs: ["healthcare", "financial-services", "professional-services", "government-public-sector"],
    articleSlugs: ["business-continuity-vs-disaster-recovery", "backup-vs-disaster-recovery"],
    faqs: [
      {
        question: "Is business continuity only an IT responsibility?",
        answer:
          "No. IT owns the technical recovery. Business leaders own priorities, alternate processes and communication. Celestino facilitates both sides so the plan reflects the whole organization.",
      },
    ],
  },
  {
    slug: "cloud-security",
    name: "Cloud Security",
    shortDescription:
      "Secure configuration, identity and data protection for Microsoft 365 and cloud workloads.",
    icon: "lock",
    seo: {
      title: "Cloud Security | Microsoft 365 & Cloud Workloads",
      description:
        "Celestino's cloud security solution hardens Microsoft 365 and cloud workloads: identity and conditional access, secure configuration baselines, data protection, backup and monitoring.",
      primaryKeyword: "cloud security services",
    },
    hero: {
      eyebrow: "Solution",
      headline: "Cloud platforms are secure. Cloud configurations often are not.",
      intro:
        "Most cloud incidents trace to identity and configuration: a legacy protocol left enabled, an admin account without MFA, sharing settings nobody reviewed. Celestino brings cloud tenants and workloads to a documented baseline and keeps them there.",
    },
    problem:
      "Cloud adoption often happens faster than cloud governance. Tenants accumulate global admins, unused apps with broad permissions, external sharing and stale accounts. The platform's shared-responsibility model leaves those to the customer, and auditors know it.",
    approach: [
      { title: "Configuration assessment", detail: "Tenant and workload settings reviewed against published security baselines." },
      { title: "Identity hardening", detail: "MFA, conditional access, privileged role reduction and stale account cleanup." },
      { title: "Data protection", detail: "Sharing controls, sensitivity labeling where appropriate, and independent backup of cloud data." },
      { title: "Monitoring", detail: "Sign-in risk, admin activity and configuration drift surfaced as alerts with owners." },
      { title: "Ongoing governance", detail: "Quarterly baseline review as platforms and the organization change." },
    ],
    serviceSlugs: ["cybersecurity", "cloud-infrastructure", "backup-disaster-recovery", "security-risk-advisory"],
    industrySlugs: ["healthcare", "financial-services", "professional-services", "smb-mid-market"],
    articleSlugs: ["nist-csf-implementation-guide-smb", "hipaa-cybersecurity-considerations"],
    faqs: [
      {
        question: "Does Microsoft secure our Microsoft 365 tenant for us?",
        answer:
          "Microsoft secures the platform. Configuration of identity, sharing, retention, device access and administrative roles is the customer's responsibility under the shared-responsibility model. That is where most gaps appear.",
      },
    ],
  },
  {
    slug: "secure-application-engineering",
    name: "Secure Application Engineering",
    shortDescription:
      "Custom software, web and automation delivered with security, performance and maintainability designed in.",
    icon: "code",
    seo: {
      title: "Secure Application Engineering",
      description:
        "Celestino's secure application engineering solution delivers custom web, mobile, ecommerce and automation projects with threat modeling, secure defaults, testing and operational ownership.",
      primaryKeyword: "secure application development",
    },
    hero: {
      eyebrow: "Solution",
      headline: "Software that passes the security review before it ships.",
      intro:
        "Applications built without an operations and security perspective become the next incident. Celestino's engineers design, build and run software with threat modeling, secure defaults, dependency hygiene and monitoring as standard deliverables.",
    },
    problem:
      "Custom applications and ecommerce platforms are frequent entry points: outdated dependencies, injection flaws, weak session handling, secrets in code, and nobody responsible after launch. The vendor moved on; the risk stayed.",
    approach: [
      { title: "Threat model at design", detail: "Data flows, trust boundaries and abuse cases identified before code is written." },
      { title: "Secure defaults", detail: "Authentication, authorization, input validation, secrets handling and headers built into the framework layer." },
      { title: "Dependency and pipeline hygiene", detail: "Locked dependencies, automated vulnerability checks and reviewed deployments." },
      { title: "Performance and accessibility budgets", detail: "Measured against real-user metrics and WCAG, not just a passing build." },
      { title: "Operational ownership", detail: "Monitoring, backups, patching and a named owner after launch." },
    ],
    serviceSlugs: ["software-development", "web-application-engineering", "ai-automation", "cybersecurity"],
    industrySlugs: ["professional-services", "smb-mid-market", "financial-services"],
    articleSlugs: ["secure-application-development-checklist"],
    faqs: [
      {
        question: "Can you review an application another vendor built?",
        answer:
          "Yes. A code, dependency and infrastructure review produces a prioritized findings list. Remediation can be delivered by Celestino or handed to your existing team.",
      },
    ],
  },
  {
    slug: "it-operational-resilience",
    name: "IT Operational Resilience",
    shortDescription:
      "Stable day-to-day operations: documented systems, proactive monitoring, coverage that survives staff turnover.",
    icon: "activity",
    seo: {
      title: "IT Operational Resilience | Documented Operations",
      description:
        "Celestino's IT operational resilience solution delivers documented environments, proactive monitoring, patch and lifecycle discipline, and coverage that does not depend on a single person.",
      primaryKeyword: "IT operations management",
    },
    hero: {
      eyebrow: "Solution",
      headline: "Operations that do not depend on one person's memory.",
      intro:
        "Resilient IT operations are unglamorous: current documentation, patching that happens on schedule, monitoring that pages someone, and coverage when your one IT person is on vacation. Celestino builds and runs that discipline.",
    },
    problem:
      "In many organizations the environment lives in one employee's head. Patches slip, monitoring alerts go to an unread mailbox, and a resignation or illness becomes an operational crisis. Audits surface it as missing evidence; users experience it as recurring outages.",
    approach: [
      { title: "Document", detail: "Systems, credentials, vendors and procedures captured in a maintained documentation platform." },
      { title: "Standardize", detail: "Configuration baselines, naming, patch cadence and change control applied consistently." },
      { title: "Monitor", detail: "Availability, capacity and security alerts routed to a staffed queue." },
      { title: "Cover", detail: "Help desk and engineering coverage that continues through turnover and time off." },
      { title: "Review", detail: "Monthly reporting and quarterly roadmap sessions with leadership." },
    ],
    serviceSlugs: ["managed-it", "co-managed-it", "network-management", "backup-disaster-recovery"],
    industrySlugs: ["professional-services", "smb-mid-market", "healthcare", "financial-services"],
    articleSlugs: ["in-house-it-vs-managed-it", "managed-it-vs-co-managed-it"],
    faqs: [
      {
        question: "We already have an IT person. Why would we need this?",
        answer:
          "One person cannot provide continuous coverage, deep specialization in every area, and documentation discipline at the same time. The co-managed model keeps your IT person in control while Celestino supplies the rest.",
      },
    ],
  },
];

export const solutionMap = new Map(solutions.map((s) => [s.slug, s]));
export function getSolution(slug: string): Solution | undefined {
  return solutionMap.get(slug);
}
