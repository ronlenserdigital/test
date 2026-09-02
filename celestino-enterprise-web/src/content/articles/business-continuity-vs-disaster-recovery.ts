import type { Article } from "../types";

export const article: Article = {
  slug: "business-continuity-vs-disaster-recovery",
  title: "Business Continuity vs Disaster Recovery: Scope, Ownership and How They Fit Together",
  description:
    "How business continuity and disaster recovery differ in scope and ownership, what a business impact analysis produces, the components of each plan, and the tabletop, functional and full exercises that prove they work together.",
  category: "resilience",
  type: "decision-guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-07-23",
  reviewedAt: "2026-08-30",
  readingMinutes: 10,
  summary:
    "Business continuity is the organization's plan to keep delivering its critical products and services during a disruption of any kind, owned by executive leadership and operations. Disaster recovery is the technology plan to restore systems and data within defined objectives, owned by IT. They fit together through the business impact analysis, which identifies critical processes and their tolerable downtime, and that analysis sets the recovery objectives disaster recovery must meet. An organization needs both: continuity keeps the business running on workarounds while recovery brings the technology back.",
  sections: [
    {
      id: "scope-and-ownership",
      heading: "Scope and ownership",
      body: [
        "Business continuity (BC) covers the whole organization: people, facilities, suppliers, communications, processes and technology. Its purpose is to continue delivering critical products and services at an acceptable level during any disruption, whether a cyber incident, a building loss, a pandemic, a key supplier failure or a utility outage. It is owned by executive leadership, usually with a continuity coordinator in operations or risk, and each business unit owns its part of the plan.",
        "Disaster recovery (DR) covers technology: the systems, data, networks and infrastructure that the business depends on. Its purpose is to restore those systems within the recovery time and recovery point objectives that the business has set. It is owned by IT, or by the managed provider under contract, and it is a component of the broader continuity program rather than a substitute for it.",
        "The distinction becomes clear during an event. When ransomware takes down the environment, DR is the effort to restore identity, servers and applications from clean backups. BC is everything else: deciding whether to notify customers and regulators, running the business on paper or alternate tools while systems are down, paying staff, managing suppliers, communicating with the board, and deciding when to declare recovery complete.",
      ],
    },
    {
      id: "the-business-impact-analysis",
      heading: "The business impact analysis",
      body: [
        "The business impact analysis (BIA) is the connective tissue between continuity and recovery. It is a structured assessment of each business process to determine its criticality, the impact of its disruption over time, its dependencies and the resources needed to recover it. The BIA produces the two numbers that drive everything else: the maximum tolerable period of disruption for each process, and from it, the recovery time and recovery point objectives for the systems that support it.",
        "A practical BIA for an organization of 20 to 500 people interviews process owners in each department, documents the processes they run, rates the financial, operational, regulatory and reputational impact of losing each process at intervals such as four hours, one day, three days and one week, and records the systems, people, facilities, suppliers and data each process depends on. The output is a ranked list of processes with recovery objectives, and a dependency map from processes to systems.",
        "Without a BIA, disaster recovery is built on IT's assumptions about what matters, which are frequently wrong. Finance may tolerate a three-day outage of the ERP except during the five days of month-end close; the phone system may be the single most critical service for a clinic; the file server nobody thinks about may hold the only copy of the shipping manifests. The BIA surfaces these before the event.",
      ],
    },
    {
      id: "components-of-a-business-continuity-plan",
      heading: "Components of a business continuity plan",
      body: [
        "A usable continuity plan is short, current and accessible when systems are down. It is not a binder. The components below are the minimum for a mid-sized organization.",
      ],
      list: [
        "Activation criteria and authority: who can declare a disruption, on what basis, and how the decision is communicated.",
        "Roles and the continuity team: named individuals and alternates for coordination, communications, each business unit, facilities, HR, legal and IT liaison, with contact details stored outside the production environment.",
        "Critical process list from the BIA, with the maximum tolerable downtime for each and the recovery priority order.",
        "Workarounds per process: how each critical process runs without its normal systems, facilities or people, including manual procedures, alternate tools and pre-authorized spending.",
        "Communications plan: templates and channels for staff, customers, suppliers, regulators, insurers, the board and the public, with an alternate channel that does not depend on corporate email or phones.",
        "Supplier and dependency arrangements: alternate suppliers, pre-negotiated recovery services, and contact points at critical vendors.",
        "Facilities and workforce: alternate work locations, remote work provisions, and safety procedures.",
        "Recovery and return to normal: criteria for standing down, data reconciliation after manual operations, and the post-incident review.",
      ],
    },
    {
      id: "components-of-a-disaster-recovery-plan",
      heading: "Components of a disaster recovery plan",
      body: [
        "The disaster recovery plan is the technical counterpart, and it should be executable by a competent engineer who has never seen the environment, because the person who knows it best may be unavailable.",
      ],
      list: [
        "System inventory with recovery objectives: every in-scope system with its RTO, RPO, business owner, dependencies and recovery priority, derived from the BIA.",
        "Recovery architecture: where each system is restored, whether to standby hardware, a secondary site, a cloud landing zone or a provider's recovery environment, and which systems are replicated rather than restored.",
        "Backup and replication design: the 3-2-1-1-0 arrangement, immutability configuration, credential isolation, and how to reach the offsite copy when the primary environment is compromised.",
        "Restore order and runbooks: step-by-step procedures in dependency order, typically identity, network and core services, then databases, then applications, with validation steps for each.",
        "Access and credentials: break-glass credentials, backup console access and vendor support contacts stored outside the production environment.",
        "Roles and escalation: who leads technical recovery, who validates each restored system with its business owner, and how IT reports status to the continuity team.",
        "Cyber-specific procedures: forensic preservation, clean-room rebuilding, verification that restored data predates the compromise, and re-credentialing before reconnection.",
        "Testing records: results of the most recent restore tests and exercises, with open findings.",
      ],
    },
    {
      id: "how-the-two-plans-fit-together",
      heading: "How the two plans fit together",
      body: [
        "The plans connect at three points. First, the BIA sets the recovery objectives that DR must meet, so DR investment follows business priority rather than IT preference. Second, during an event, the continuity team runs the business while the technical team runs recovery, and the DR plan reports status into the continuity team's decision cycle. Third, after the event, the post-incident review updates both plans and the BIA together.",
        "The most common failure is treating the DR plan as the continuity plan. IT restores the systems, but nobody decided how to serve customers in the meantime, whether to notify regulators, or who talks to the press. The second most common failure is the reverse: a continuity plan that assumes systems will be back in a day when the DR capability actually needs a week.",
        "A simple check is to take the top five processes from the BIA and trace each one: what is its maximum tolerable downtime, which systems does it depend on, what is the documented RTO of each system, when was that RTO last proven by a test, and what is the workaround while recovery runs? If any link in the chain is missing, the plans are not yet connected. The [business continuity](/solutions/business-continuity) work Celestino delivers is organized around closing those links.",
      ],
    },
    {
      id: "exercise-types",
      heading: "Exercise types: tabletop, functional and full",
      body: [
        "Plans that are not exercised are not plans. Three exercise types build capability progressively, and a mature program uses all three on a cycle.",
        "A tabletop exercise is a facilitated discussion of a scenario. Participants walk through their roles, decisions and communications without touching any systems. It takes two to four hours, involves executives and business unit leads as well as IT, and is the best tool for validating decision authority, communications and the fit between the continuity and recovery plans. Run at least one annually, and run one after any significant change in leadership, systems or suppliers.",
        "A functional exercise tests a specific capability under realistic conditions: restoring a critical application onto recovery infrastructure and having its business owner validate it, running a department on its manual workaround for a morning, or failing over the phone system. It takes hours to a day, involves the people who would actually perform the work, and produces measured results against the recovery objectives. Run one per quarter, rotating through critical systems and processes.",
        "A full exercise simulates a major disruption end to end: activating the continuity team, restoring the top-priority systems in order onto isolated recovery infrastructure, running critical processes on workarounds, executing communications and standing down. It takes a day or more, is disruptive by design, and is the only test that proves the whole chain works. Run one annually, planned well in advance with executive sponsorship.",
      ],
    },
    {
      id: "a-comparison-at-a-glance",
      heading: "A comparison at a glance",
      body: [
        "The table summarizes the differences and the connections. Use it in leadership briefings to clarify which plan is being discussed and who owns it.",
      ],
      table: {
        headers: ["Dimension", "Business continuity", "Disaster recovery"],
        rows: [
          ["Scope", "Whole organization: people, facilities, suppliers, processes, communications, technology", "Technology: systems, data, networks, infrastructure"],
          ["Owner", "Executive leadership with a continuity coordinator; business units own their sections", "IT leadership or the managed provider under contract"],
          ["Driven by", "Business impact analysis: critical processes and maximum tolerable downtime", "Recovery objectives (RTO and RPO) derived from the BIA"],
          ["Primary output", "Workarounds, decisions and communications that keep the business operating", "Restored systems within objectives"],
          ["Key documents", "Continuity plan, BIA, communications plan, supplier arrangements", "DR plan, system inventory, runbooks, backup design, test records"],
          ["Proof it works", "Tabletop and full exercises with executives", "Functional restore tests and full recovery exercises"],
          ["Typical failure", "Assumes IT will be back faster than DR can deliver", "Restores what IT thinks matters, not what the business needs first"],
        ],
      },
    },
    {
      id: "getting-started",
      heading: "Getting started",
      body: [
        "Organizations without either plan should start with a lightweight BIA covering the top ten processes, then write the DR plan for the systems those processes depend on, then write the continuity workarounds and communications for those same processes. That sequence produces a connected, if incomplete, capability in a quarter, and it can be expanded from there.",
        "Organizations with a DR plan but no continuity plan should run a tabletop exercise with executives using a ransomware scenario. The gaps in decision authority, communications and workarounds will surface within the first hour, and they become the continuity plan's first draft. Organizations with a continuity plan but untested DR should run a functional restore of their most critical system against its documented RTO; the result will either validate the plan or reset expectations.",
        "In every case, assign an owner for each plan, put both on an annual review cycle tied to the exercise calendar, and store both where they can be reached when the network is down. Celestino's [backup and disaster recovery](/services/backup-disaster-recovery) engagements include the DR components and the functional testing; the continuity components require business leadership, and the two are designed together.",
      ],
    },
  ],
  keyTakeaways: [
    "Business continuity covers the whole organization and is owned by leadership; disaster recovery covers technology and is owned by IT; neither substitutes for the other.",
    "The business impact analysis connects the two by identifying critical processes, their tolerable downtime and the systems they depend on, which sets the recovery objectives DR must meet.",
    "A continuity plan needs activation authority, roles, workarounds, communications and supplier arrangements; a DR plan needs recovery architecture, restore order, runbooks, isolated credentials and test records.",
    "Use tabletop exercises annually for decisions and communications, functional exercises quarterly for specific capabilities, and a full exercise annually to prove the whole chain.",
    "Trace the top five processes from tolerable downtime through system RTOs to proven test results and workarounds; any missing link means the plans are not yet connected.",
  ],
  references: [
    { label: "NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems", url: "https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final" },
    { label: "NIST SP 800-84, Guide to Test, Training, and Exercise Programs for IT Plans and Capabilities", url: "https://csrc.nist.gov/pubs/sp/800/84/final" },
    { label: "CISA #StopRansomware Guide", url: "https://www.cisa.gov/stopransomware/ransomware-guide" },
  ],
  relatedServiceSlugs: ["backup-disaster-recovery", "security-risk-advisory", "managed-it"],
  relatedArticleSlugs: ["backup-vs-disaster-recovery", "cyber-resilience-readiness-checklist", "nist-csf-implementation-guide-smb"],
};
