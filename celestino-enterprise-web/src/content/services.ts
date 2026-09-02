import type { PillarDef, Service } from "./types";

export const pillars: PillarDef[] = [
  {
    id: "protect",
    label: "Protect",
    title: "Cybersecurity & Risk",
    outcome: "Reduce the attack surface and prove it to auditors.",
    description:
      "Security controls, hardening, and compliance support mapped to HIPAA, FINRA and SOX obligations, delivered by the same team that runs your infrastructure.",
    icon: "shield",
    serviceSlugs: ["cybersecurity", "security-risk-advisory"],
  },
  {
    id: "operate",
    label: "Operate",
    title: "Managed IT & Infrastructure",
    outcome: "Keep systems patched, monitored and supported, on-site anywhere in the US.",
    description:
      "Help desk, server, network and endpoint operations under a single accountable team, either fully managed or alongside your internal IT staff.",
    icon: "server",
    serviceSlugs: ["managed-it", "co-managed-it", "network-management"],
  },
  {
    id: "resilience",
    label: "Recover",
    title: "Backup, Recovery & Continuity",
    outcome: "Restore operations within a tested recovery window, not a hopeful one.",
    description:
      "Backup architecture, disaster recovery runbooks and continuity planning that are exercised on a schedule instead of assumed to work.",
    icon: "backup",
    serviceSlugs: ["backup-disaster-recovery"],
  },
  {
    id: "modernize",
    label: "Modernize",
    title: "Cloud & Infrastructure",
    outcome: "Move workloads deliberately, with security and cost designed in.",
    description:
      "Cloud consulting, migration and hybrid infrastructure design for organizations that run a mix of on-premises and cloud systems.",
    icon: "cloud",
    serviceSlugs: ["cloud-infrastructure"],
  },
  {
    id: "build",
    label: "Build",
    title: "Secure Application Engineering",
    outcome: "Ship web, mobile and enterprise software that is maintainable and secure by default.",
    description:
      "Full-stack engineering for custom applications, ecommerce, integrations and automation, built by engineers who also run production infrastructure.",
    icon: "code",
    serviceSlugs: ["software-development", "web-application-engineering", "ai-automation"],
  },
];

export const services: Service[] = [
  {
    slug: "managed-it",
    name: "Managed IT Services",
    navLabel: "Managed IT Services",
    shortDescription:
      "End-to-end IT operations: help desk, servers, endpoints, cloud and on-premises systems, with up to 24/7/365 proactive support.",
    pillar: "operate",
    icon: "server",
    verifiedOnExistingSite: true,
    seo: {
      title: "Managed IT Services | Proactive, Nationwide",
      description:
        "Managed IT services from Celestino Enterprise: help desk, server and endpoint management, cloud and on-prem support, and emergency onsite response across the US.",
      primaryKeyword: "managed IT services",
    },
    hero: {
      eyebrow: "Managed IT Services",
      headline: "One accountable team for the systems your business runs on.",
      intro:
        "Celestino runs help desk, servers, endpoints, cloud and on-premises infrastructure as a single service. Support is proactive by design, up to 24/7/365, with emergency onsite response available nationwide.",
    },
    fit: [
      "Organizations with 20 to 500 users that have outgrown break-fix support",
      "Businesses with regulatory obligations (HIPAA, FINRA, SOX) that need documented controls, not just uptime",
      "Multi-site companies that need onsite response outside a single metro area",
      "Leadership teams that want one vendor responsible for the whole environment",
    ],
    capabilities: [
      {
        title: "Help desk and end-user support",
        description:
          "Ticketed support with defined response targets, remote resolution first, and onsite dispatch when hardware or connectivity fails.",
      },
      {
        title: "Server and endpoint management",
        description:
          "Patching, configuration baselines, monitoring and lifecycle planning for Windows and Linux servers, workstations and laptops.",
      },
      {
        title: "Cloud and on-premises administration",
        description:
          "Microsoft 365, identity, file services, virtualization and hybrid environments administered under one change process.",
      },
      {
        title: "Proactive monitoring",
        description:
          "Alerting on availability, capacity and security events so problems are worked before users report them.",
      },
      {
        title: "Emergency onsite support",
        description:
          "Field response for outages that cannot be resolved remotely, available across the United States.",
      },
      {
        title: "Compliance support",
        description:
          "Evidence collection, policy alignment and technical controls that support HIPAA, FINRA and SOX obligations.",
      },
    ],
    engagement: [
      { step: "Assess", detail: "Inventory of systems, risks, licensing and current support gaps." },
      { step: "Stabilize", detail: "Patch backlog, backups, MFA and monitoring brought to baseline in the first 30 days." },
      { step: "Operate", detail: "Ongoing support, monthly reporting and a named point of contact." },
      { step: "Improve", detail: "Quarterly roadmap reviews covering security, lifecycle and cost." },
    ],
    outcomes: [
      "Fewer recurring tickets because root causes are fixed, not reset",
      "Documented environment that survives staff turnover",
      "Audit-ready evidence for regulated workloads",
      "Predictable monthly cost instead of emergency invoices",
    ],
    faqs: [
      {
        question: "What does 'up to 24/7/365 proactive support' mean in practice?",
        answer:
          "Coverage hours are set per agreement. Monitoring runs continuously; the response window for human intervention depends on the plan you select. Contracted hours and response targets are written into the service agreement before onboarding begins.",
      },
      {
        question: "Do you support both cloud and on-premises systems?",
        answer:
          "Yes. Most clients run a hybrid of Microsoft 365 or other cloud platforms alongside on-premises servers and network equipment. Both are managed under the same ticketing, patching and change process.",
      },
      {
        question: "How does emergency onsite support work outside Virginia?",
        answer:
          "Onsite response is available nationwide. Dispatch details, travel windows and any per-visit terms are defined in your agreement so there are no surprises during an outage.",
      },
      {
        question: "Can you work with our existing IT staff instead of replacing them?",
        answer:
          "Yes. That is the co-managed model. See Co-Managed IT for how responsibilities are split.",
      },
    ],
    relatedServiceSlugs: ["co-managed-it", "cybersecurity", "backup-disaster-recovery", "network-management"],
    relatedSolutionSlugs: ["it-operational-resilience", "infrastructure-modernization"],
    relatedIndustrySlugs: ["healthcare", "financial-services", "professional-services", "smb-mid-market"],
    relatedArticleSlugs: ["managed-it-vs-co-managed-it", "in-house-it-vs-managed-it"],
  },
  {
    slug: "co-managed-it",
    name: "Co-Managed IT",
    navLabel: "Co-Managed IT",
    shortDescription:
      "Engineering depth for internal IT teams: help desk overflow, server, network, disaster recovery and advisory on a flexible model.",
    pillar: "operate",
    icon: "users",
    verifiedOnExistingSite: true,
    seo: {
      title: "Co-Managed IT Services for Internal IT Teams",
      description:
        "Co-managed IT from Celestino Enterprise adds help desk, server, network, disaster recovery and advisory capacity to your internal IT team without replacing it.",
      primaryKeyword: "co-managed IT services",
    },
    hero: {
      eyebrow: "Co-Managed IT",
      headline: "Your IT team, with more engineering depth behind it.",
      intro:
        "Internal IT staff know the business. Celestino adds the specialists, tooling and after-hours capacity they cannot justify hiring for. Responsibilities are split explicitly, so nothing falls between two teams.",
    },
    fit: [
      "Companies with one to five internal IT staff carrying too many roles",
      "IT leaders who need project capacity without losing control of the environment",
      "Organizations that want coverage during vacations, turnover and after hours",
      "Teams preparing for an audit, migration or infrastructure refresh",
    ],
    capabilities: [
      {
        title: "Help desk overflow and escalation",
        description: "Tier 1 through tier 3 support that plugs into your existing ticket queue, with your team keeping the relationships.",
      },
      {
        title: "Server and infrastructure engineering",
        description: "Virtualization, storage, Active Directory, Microsoft 365 and hybrid identity handled by engineers who do this daily.",
      },
      {
        title: "Network management",
        description: "Firewall policy, switching, wireless and remote access managed to a documented standard.",
      },
      {
        title: "Disaster recovery ownership",
        description: "Backup verification, recovery testing and runbooks so DR is someone's job, not everyone's afterthought.",
      },
      {
        title: "Advisory and roadmap",
        description: "A senior engineer in your planning meetings for budgeting, vendor decisions and security posture.",
      },
      {
        title: "Shared tooling",
        description: "Monitoring, patching and documentation platforms your team can use directly, with clear ownership of each.",
      },
    ],
    engagement: [
      { step: "Responsibility matrix", detail: "Every function assigned to your team, Celestino, or shared, in writing." },
      { step: "Access and tooling", detail: "Least-privilege access, shared documentation, agreed escalation paths." },
      { step: "Operate together", detail: "Weekly sync, shared queue visibility, joint change approval." },
      { step: "Review", detail: "Quarterly review of what should move between teams as the business changes." },
    ],
    outcomes: [
      "Internal staff freed for business-facing work",
      "After-hours and vacation coverage without contractor scramble",
      "Documentation and standards that outlast individual employees",
      "Specialist skills on demand for projects and incidents",
    ],
    faqs: [
      {
        question: "How is co-managed different from fully managed IT?",
        answer:
          "In a fully managed model Celestino owns the entire environment. In a co-managed model your internal team retains ownership and Celestino takes specific functions, such as server engineering, after-hours support or disaster recovery, under a written responsibility matrix.",
      },
      {
        question: "Will your team have admin access to everything?",
        answer:
          "Access is scoped to the functions in the responsibility matrix, follows least privilege, and is logged. You decide what stays internal.",
      },
      {
        question: "Can the split change over time?",
        answer:
          "Yes. The responsibility matrix is reviewed quarterly. Functions move between teams as staffing, projects and risk change.",
      },
    ],
    relatedServiceSlugs: ["managed-it", "network-management", "backup-disaster-recovery", "security-risk-advisory"],
    relatedSolutionSlugs: ["it-operational-resilience"],
    relatedIndustrySlugs: ["professional-services", "healthcare", "financial-services", "government-public-sector"],
    relatedArticleSlugs: ["managed-it-vs-co-managed-it", "in-house-it-vs-managed-it"],
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity Services",
    navLabel: "Cybersecurity Services",
    shortDescription:
      "Security controls, hardening and monitoring for identity, endpoints, network and cloud, integrated with the operations team that maintains them.",
    pillar: "protect",
    icon: "shield-check",
    verifiedOnExistingSite: true,
    seo: {
      title: "Cybersecurity Services for Regulated Organizations",
      description:
        "Cybersecurity services from Celestino Enterprise: security assessments, hardening, identity and endpoint protection, monitoring and incident recovery, with HIPAA, FINRA and SOX compliance support.",
      primaryKeyword: "cybersecurity services",
    },
    hero: {
      eyebrow: "Cybersecurity Services",
      headline: "Security controls that are maintained, not just installed.",
      intro:
        "Most breaches in mid-sized organizations exploit gaps in basics: unpatched systems, weak identity, untested backups, unmanaged devices. Celestino closes those gaps and keeps them closed, because the same engineers run the environment day to day.",
    },
    fit: [
      "Organizations subject to HIPAA, FINRA or SOX that must show working controls",
      "Companies whose cyber-insurance renewal now requires MFA, EDR and tested backups",
      "Businesses that had a security incident and need the environment rebuilt properly",
      "IT teams that need a security partner who will also do the operational work",
    ],
    capabilities: [
      {
        title: "Security assessment",
        description:
          "Structured review of identity, endpoints, network, cloud configuration, backups and policies against a recognized framework, with a prioritized remediation plan.",
      },
      {
        title: "Identity and access hardening",
        description:
          "MFA enforcement, conditional access, privileged account cleanup and least-privilege role design across Microsoft 365 and on-premises directories.",
      },
      {
        title: "Endpoint protection and management",
        description:
          "Deployment and tuning of endpoint detection tools, device encryption, application control and patch compliance across servers and workstations.",
      },
      {
        title: "Network and perimeter security",
        description:
          "Firewall policy review, segmentation, secure remote access and wireless hardening for offices and remote staff.",
      },
      {
        title: "Security monitoring and response",
        description:
          "Alerting on security events from endpoints, identity and infrastructure as part of proactive support, with defined escalation and containment steps.",
      },
      {
        title: "Incident recovery",
        description:
          "Containment, eradication and clean rebuild after ransomware or account compromise, coordinated with your backup and DR plan.",
      },
      {
        title: "Compliance support",
        description:
          "Mapping technical controls and evidence to HIPAA, FINRA and SOX requirements, and supporting auditor requests.",
      },
      {
        title: "Security awareness",
        description:
          "Phishing simulation and role-based training so staff become a detection layer instead of the primary attack vector.",
      },
    ],
    engagement: [
      { step: "Assess", detail: "Baseline against a framework such as NIST CSF or CIS Controls, scored and prioritized." },
      { step: "Harden", detail: "Close the highest-risk gaps first: identity, patching, backups, endpoint coverage." },
      { step: "Monitor", detail: "Instrument the environment so security events become tickets with owners." },
      { step: "Prove", detail: "Maintain evidence for auditors, insurers and customers on an ongoing basis." },
    ],
    outcomes: [
      "Measurable reduction in exploitable gaps, tracked against a baseline",
      "Controls documented in the form auditors and insurers ask for",
      "Faster containment because response steps are defined before an incident",
      "Security and operations changes made by one team, without hand-off delays",
    ],
    faqs: [
      {
        question: "Is this a managed SOC or MDR service?",
        answer:
          "Celestino provides security monitoring and response as part of its managed and co-managed operations. If you require a dedicated 24/7 security operations center with named analyst coverage, the specific coverage model, tooling and response commitments are defined in the service agreement. Ask for the exact scope rather than relying on labels.",
      },
      {
        question: "Which frameworks do you assess against?",
        answer:
          "Assessments are typically structured around NIST CSF or CIS Controls, then mapped to the regulation that applies to you, such as HIPAA Security Rule safeguards, FINRA cybersecurity expectations, or SOX IT general controls.",
      },
      {
        question: "Can you help with a cyber-insurance questionnaire?",
        answer:
          "Yes. Most questionnaires ask about MFA, endpoint detection, backup isolation, patching cadence and privileged access. Celestino implements those controls and provides the evidence the carrier expects.",
      },
      {
        question: "Do you provide penetration testing?",
        answer:
          "Formal third-party penetration testing is scoped separately and, where independence is required by your auditor, coordinated with a qualified testing firm. Celestino performs vulnerability assessment and remediation as part of its security services.",
      },
    ],
    relatedServiceSlugs: ["security-risk-advisory", "managed-it", "backup-disaster-recovery", "cloud-infrastructure"],
    relatedSolutionSlugs: ["cyber-resilience", "cloud-security"],
    relatedIndustrySlugs: ["healthcare", "financial-services", "government-public-sector"],
    relatedArticleSlugs: ["nist-csf-implementation-guide-smb", "cyber-resilience-readiness-checklist", "hipaa-cybersecurity-considerations"],
  },
  {
    slug: "cloud-infrastructure",
    name: "Cloud & Infrastructure",
    navLabel: "Cloud & Infrastructure",
    shortDescription:
      "Cloud consulting, migration and hybrid infrastructure design for organizations running both on-premises and cloud workloads.",
    pillar: "modernize",
    icon: "cloud",
    verifiedOnExistingSite: true,
    seo: {
      title: "Cloud & Infrastructure Services | Hybrid Cloud",
      description:
        "Cloud and infrastructure services from Celestino Enterprise: cloud consulting, migration planning, hybrid infrastructure design and ongoing administration for cloud and on-premises systems.",
      primaryKeyword: "cloud infrastructure services",
    },
    hero: {
      eyebrow: "Cloud & Infrastructure",
      headline: "Hybrid infrastructure designed on purpose.",
      intro:
        "Few organizations are all-cloud or all-on-premises. Celestino designs, migrates and operates the mix that fits your workloads, with identity, backup and security treated as part of the architecture rather than add-ons.",
    },
    fit: [
      "Companies with aging on-premises servers deciding what to move and what to keep",
      "Teams whose cloud costs grew faster than their cloud governance",
      "Organizations consolidating after an acquisition or office change",
      "Regulated businesses that need data location and access controls documented",
    ],
    capabilities: [
      {
        title: "Cloud consulting and readiness",
        description: "Workload inventory, dependency mapping, cost modeling and a migration order that minimizes business disruption.",
      },
      {
        title: "Migration execution",
        description: "Email, file services, identity, line-of-business applications and servers moved in planned waves with rollback points.",
      },
      {
        title: "Hybrid infrastructure design",
        description: "Virtualization, storage, networking and identity across on-premises and cloud, designed as one system.",
      },
      {
        title: "Microsoft 365 and cloud administration",
        description: "Tenant configuration, licensing optimization, security baselines and ongoing administration.",
      },
      {
        title: "Cost and capacity governance",
        description: "Right-sizing, reserved capacity decisions and monthly cost review so spending stays tied to need.",
      },
      {
        title: "Infrastructure lifecycle",
        description: "Hardware refresh planning, warranty tracking and end-of-life remediation for what stays on-premises.",
      },
    ],
    engagement: [
      { step: "Discover", detail: "Inventory of workloads, data flows, licensing and constraints." },
      { step: "Design", detail: "Target architecture with security, backup and cost built into the diagram." },
      { step: "Migrate", detail: "Wave-based moves with testing and rollback points." },
      { step: "Operate", detail: "Ongoing administration, cost review and lifecycle planning." },
    ],
    outcomes: [
      "A written architecture that explains where every workload lives and why",
      "Migrations that finish on the planned cutover date",
      "Cloud spend governed monthly instead of discovered annually",
      "Security and backup coverage that carries over as workloads move",
    ],
    faqs: [
      {
        question: "Should we move everything to the cloud?",
        answer:
          "Usually not all at once, and sometimes not everything. Latency-sensitive systems, specialized hardware and some licensing models favor on-premises. The readiness assessment gives a workload-by-workload answer with cost and risk for each option.",
      },
      {
        question: "Which cloud platforms do you work with?",
        answer:
          "Most client environments are built around Microsoft 365 and mainstream infrastructure providers. Platform choice follows your existing licensing, application requirements and staff skills rather than a vendor preference.",
      },
      {
        question: "How is downtime handled during migration?",
        answer:
          "Each wave has a tested cutover plan, a maintenance window agreed with the business, and a rollback path if validation fails.",
      },
    ],
    relatedServiceSlugs: ["managed-it", "network-management", "backup-disaster-recovery", "cybersecurity"],
    relatedSolutionSlugs: ["infrastructure-modernization", "cloud-security"],
    relatedIndustrySlugs: ["professional-services", "smb-mid-market", "healthcare"],
    relatedArticleSlugs: ["cloud-vs-hybrid-infrastructure"],
  },
  {
    slug: "network-management",
    name: "Network Management",
    navLabel: "Network Management",
    shortDescription:
      "Firewalls, switching, wireless, remote access and connectivity managed to a documented standard across every site.",
    pillar: "operate",
    icon: "network",
    verifiedOnExistingSite: true,
    seo: {
      title: "Network Management Services | Firewall & Wireless",
      description:
        "Network management from Celestino Enterprise: firewall administration, switching and wireless, secure remote access, connectivity and telecom coordination for single and multi-site organizations.",
      primaryKeyword: "network management services",
    },
    hero: {
      eyebrow: "Network Management",
      headline: "Networks that are documented, segmented and monitored.",
      intro:
        "An undocumented network is a security finding waiting to happen. Celestino manages firewalls, switching, wireless and remote access to a written standard, and keeps the diagram current as the business changes.",
    },
    fit: [
      "Multi-site organizations with inconsistent network equipment and configuration",
      "Companies whose firewall rules have never been reviewed since installation",
      "Businesses adding remote staff, VoIP or cloud services that stress existing connectivity",
      "Teams that need a single point of contact for carriers and telecom vendors",
    ],
    capabilities: [
      { title: "Firewall administration", description: "Rule review, change control, firmware currency and logging on the perimeter." },
      { title: "Switching and wireless", description: "VLAN design, segmentation, access control and wireless coverage planning." },
      { title: "Secure remote access", description: "VPN and modern remote-access design with MFA and device checks." },
      { title: "Connectivity and telecom coordination", description: "Circuit ordering, carrier escalation and failover design for internet and voice." },
      { title: "Monitoring and capacity", description: "Availability, latency and utilization monitoring with alerting tied to the help desk." },
      { title: "Documentation", description: "Current diagrams, IP schemes and configuration backups kept under version control." },
    ],
    engagement: [
      { step: "Audit", detail: "Discovery of every device, circuit and rule, compared against the standard." },
      { step: "Remediate", detail: "Segmentation, firmware, rule cleanup and monitoring brought to baseline." },
      { step: "Manage", detail: "Change control, monitoring and vendor coordination as ongoing service." },
    ],
    outcomes: [
      "A network diagram that matches reality",
      "Segmentation that limits what an attacker can reach from one compromised device",
      "Faster carrier resolution because someone owns the escalation",
      "Capacity problems identified before users feel them",
    ],
    faqs: [
      {
        question: "Do you supply network hardware?",
        answer:
          "Equipment can be sourced through Celestino or purchased directly by you. Recommendations are based on your requirements and existing standards, not on a single vendor line.",
      },
      {
        question: "Can you manage networks at sites outside Virginia?",
        answer:
          "Yes. Management is remote-first, with nationwide onsite dispatch for physical work such as hardware replacement or cabling coordination.",
      },
    ],
    relatedServiceSlugs: ["managed-it", "co-managed-it", "cybersecurity", "cloud-infrastructure"],
    relatedSolutionSlugs: ["infrastructure-modernization", "it-operational-resilience"],
    relatedIndustrySlugs: ["professional-services", "healthcare", "smb-mid-market"],
    relatedArticleSlugs: ["cloud-vs-hybrid-infrastructure"],
  },
  {
    slug: "backup-disaster-recovery",
    name: "Backup & Disaster Recovery",
    navLabel: "Backup & Disaster Recovery",
    shortDescription:
      "Backup architecture, disaster recovery runbooks and scheduled recovery testing with defined recovery objectives.",
    pillar: "resilience",
    icon: "backup",
    verifiedOnExistingSite: true,
    seo: {
      title: "Backup & Disaster Recovery Services | Tested",
      description:
        "Backup and disaster recovery from Celestino Enterprise: immutable backups, defined RPO and RTO, documented runbooks and scheduled recovery tests for servers, cloud and endpoints.",
      primaryKeyword: "backup and disaster recovery services",
    },
    hero: {
      eyebrow: "Backup & Disaster Recovery",
      headline: "Recovery that has been rehearsed.",
      intro:
        "A backup that has never been restored is a hypothesis. Celestino designs backup and recovery around the recovery objectives your business actually needs, isolates copies from ransomware, and tests restores on a schedule you can show an auditor.",
    },
    fit: [
      "Organizations that have never completed a full restore test",
      "Businesses whose backups sit on the same network as production",
      "Regulated companies that must document recovery capability",
      "Teams recovering from a data-loss or ransomware event that exposed gaps",
    ],
    capabilities: [
      { title: "Recovery objective definition", description: "RPO and RTO set per system with the business, so backup design follows a real requirement." },
      { title: "Backup architecture", description: "Local, offsite and cloud copies with immutability and separation from production credentials." },
      { title: "Cloud and SaaS data protection", description: "Microsoft 365 and other SaaS data covered, since platform retention is not a backup." },
      { title: "Disaster recovery runbooks", description: "Step-by-step recovery procedures with owners, order of operations and communication plans." },
      { title: "Scheduled recovery testing", description: "Restore tests and DR exercises documented with results and remediation." },
      { title: "Continuity planning support", description: "Alignment of IT recovery with business continuity priorities and alternate work arrangements." },
    ],
    engagement: [
      { step: "Define", detail: "Recovery objectives agreed per system with business owners." },
      { step: "Build", detail: "Backup architecture implemented with isolation and monitoring." },
      { step: "Document", detail: "Runbooks written and reviewed with the people who would execute them." },
      { step: "Test", detail: "Quarterly restore tests and an annual recovery exercise." },
    ],
    outcomes: [
      "Written recovery objectives instead of assumptions",
      "Backups that survive a ransomware event because they are isolated",
      "Test results you can hand to an auditor or insurer",
      "Shorter outages because the recovery order was decided in advance",
    ],
    faqs: [
      {
        question: "What is the difference between backup and disaster recovery?",
        answer:
          "Backup is a copy of data. Disaster recovery is the tested ability to bring systems and people back to work within a defined time using that data. Many organizations have the first and assume the second. See our decision guide, Backup vs Disaster Recovery.",
      },
      {
        question: "Is Microsoft 365 already backed up by Microsoft?",
        answer:
          "Microsoft provides platform resilience and limited retention, not a customer-controlled backup. Deleted mailboxes, overwritten SharePoint files and ransomware-encrypted OneDrive data can fall outside those windows. Independent backup of Microsoft 365 is standard practice for regulated organizations.",
      },
      {
        question: "How often are restores tested?",
        answer:
          "File-level restores are verified routinely. Full system restores and DR exercises are scheduled per agreement, typically quarterly and annually, and documented each time.",
      },
    ],
    relatedServiceSlugs: ["managed-it", "cybersecurity", "cloud-infrastructure", "co-managed-it"],
    relatedSolutionSlugs: ["business-continuity", "cyber-resilience"],
    relatedIndustrySlugs: ["healthcare", "financial-services", "professional-services"],
    relatedArticleSlugs: ["backup-vs-disaster-recovery", "business-continuity-vs-disaster-recovery"],
  },
  {
    slug: "security-risk-advisory",
    name: "Security & Risk Advisory",
    navLabel: "Security & Risk Advisory",
    shortDescription:
      "Advisory, policy and compliance support for HIPAA, FINRA and SOX, delivered by engineers who implement what they recommend.",
    pillar: "protect",
    icon: "advisory",
    verifiedOnExistingSite: true,
    seo: {
      title: "Security & Risk Advisory | HIPAA, FINRA, SOX Support",
      description:
        "Security and risk advisory from Celestino Enterprise: risk assessments, policy development, compliance support for HIPAA, FINRA and SOX, and IT strategy for leadership teams.",
      primaryKeyword: "IT security and compliance consulting",
    },
    hero: {
      eyebrow: "Security & Risk Advisory",
      headline: "Advice from people who will also do the work.",
      intro:
        "Assessments that end in a PDF change nothing. Celestino's advisory work produces a prioritized plan, the policies to back it, and the engineering to implement it, with compliance evidence maintained along the way.",
    },
    fit: [
      "Leadership teams that need a security roadmap tied to budget",
      "Compliance officers preparing for HIPAA, FINRA or SOX audits",
      "Organizations answering customer or partner security questionnaires",
      "Boards asking what the organization's cyber risk actually is",
    ],
    capabilities: [
      { title: "Risk assessment", description: "Framework-based assessment with likelihood, impact and prioritized treatment." },
      { title: "Policy and procedure development", description: "Security, acceptable use, incident response and access policies written for your organization." },
      { title: "Compliance support", description: "Control mapping, evidence collection and audit coordination for HIPAA, FINRA and SOX." },
      { title: "Vendor and questionnaire response", description: "Accurate, defensible answers to customer, partner and insurer security questionnaires." },
      { title: "Virtual security leadership", description: "Recurring executive-level security guidance for organizations without a full-time security lead." },
      { title: "IT strategy and budgeting", description: "Multi-year technology roadmap aligned with growth, risk and lifecycle." },
    ],
    engagement: [
      { step: "Assess", detail: "Interviews, technical review and control testing against the applicable framework." },
      { step: "Plan", detail: "Prioritized roadmap with cost, effort and risk reduction per item." },
      { step: "Implement", detail: "Engineering work executed by Celestino or coordinated with your team." },
      { step: "Sustain", detail: "Quarterly reviews, policy updates and evidence maintenance." },
    ],
    outcomes: [
      "A risk register leadership can actually read",
      "Policies that reflect how the organization works",
      "Audit preparation measured in days, not months",
      "Questionnaire answers backed by implemented controls",
    ],
    faqs: [
      {
        question: "Are you a certified HIPAA, FINRA or SOX auditor?",
        answer:
          "Celestino provides compliance support: implementing controls, maintaining evidence and preparing you for audits. Formal attestation or audit opinions come from independent auditors. Celestino works alongside them.",
      },
      {
        question: "Do you provide CMMC readiness support?",
        answer:
          "Organizations pursuing Department of Defense work can engage Celestino for readiness planning against NIST SP 800-171 controls. Celestino does not issue CMMC certifications; those come from authorized assessment organizations.",
      },
    ],
    relatedServiceSlugs: ["cybersecurity", "managed-it", "backup-disaster-recovery"],
    relatedSolutionSlugs: ["cyber-resilience", "business-continuity"],
    relatedIndustrySlugs: ["healthcare", "financial-services", "government-public-sector"],
    relatedArticleSlugs: ["nist-csf-implementation-guide-smb", "cmmc-readiness-concepts", "hipaa-cybersecurity-considerations"],
  },
  {
    slug: "software-development",
    name: "Software & Application Development",
    navLabel: "Software Development",
    shortDescription:
      "Custom web applications, mobile apps, enterprise systems and integrations built by full-stack engineers.",
    pillar: "build",
    icon: "code",
    verifiedOnExistingSite: true,
    seo: {
      title: "Custom Software & Application Development",
      description:
        "Software and application development from Celestino Enterprise: custom web applications, mobile apps, enterprise systems, APIs and integrations engineered for security and maintainability.",
      primaryKeyword: "custom software development services",
    },
    hero: {
      eyebrow: "Software & Application Development",
      headline: "Applications engineered by people who also run production.",
      intro:
        "Celestino builds web applications, mobile apps and enterprise systems with the same discipline it applies to infrastructure: documented architecture, secure defaults, tested deployments and a clear plan for who maintains the result.",
    },
    fit: [
      "Businesses replacing spreadsheets and manual processes with purpose-built applications",
      "Companies that need a customer-facing web or mobile application delivered end to end",
      "Organizations integrating CRM, ERP, marketing and line-of-business systems",
      "Teams inheriting legacy software that needs modernization without a rewrite",
    ],
    capabilities: [
      { title: "Web application development", description: "Custom applications from internal tools to customer portals, built on modern frameworks." },
      { title: "Mobile application development", description: "iOS and Android applications designed for consistent experience across devices." },
      { title: "Enterprise solutions", description: "Custom APIs and web services for digital marketing, CRM and operational systems." },
      { title: "System integration", description: "Connecting platforms through APIs, middleware and event-driven workflows." },
      { title: "Database design", description: "Data models, migrations and performance tuning for relational and cloud databases." },
      { title: "Modernization", description: "Incremental replacement of legacy components with tested, maintainable services." },
    ],
    engagement: [
      { step: "Discovery", detail: "Requirements, users, data and constraints captured before estimates." },
      { step: "Architecture", detail: "Technical design, security model and hosting plan reviewed with you." },
      { step: "Build", detail: "Iterative delivery with demonstrations and testable increments." },
      { step: "Launch and support", detail: "Deployment, monitoring and a maintenance plan with named ownership." },
    ],
    outcomes: [
      "Software with an architecture document, not just a codebase",
      "Security reviewed during design rather than after launch",
      "Integrations that fail visibly and recover, instead of silently dropping data",
      "A maintenance path that does not depend on one developer",
    ],
    faqs: [
      {
        question: "Which technologies do you build with?",
        answer:
          "Stack selection follows the problem, your existing systems and who will maintain the software. Celestino's engineers work across modern web frameworks, mobile platforms, relational databases and cloud services.",
      },
      {
        question: "Do you take over applications built by other vendors?",
        answer:
          "Yes, after a code and infrastructure review that identifies risks and documents the system. Modernization is planned incrementally so the business keeps running.",
      },
    ],
    relatedServiceSlugs: ["web-application-engineering", "ai-automation", "cloud-infrastructure", "cybersecurity"],
    relatedSolutionSlugs: ["secure-application-engineering"],
    relatedIndustrySlugs: ["professional-services", "smb-mid-market", "financial-services"],
    relatedArticleSlugs: ["secure-application-development-checklist"],
  },
  {
    slug: "web-application-engineering",
    name: "Web & Ecommerce Engineering",
    navLabel: "Web & Ecommerce Engineering",
    shortDescription:
      "Custom websites, ecommerce platforms, CMS integration and web integrations built for performance, accessibility and security.",
    pillar: "build",
    icon: "layers",
    verifiedOnExistingSite: true,
    seo: {
      title: "Web Development & Ecommerce Engineering",
      description:
        "Web and ecommerce engineering from Celestino Enterprise: custom websites, ecommerce on Magento, Shopify and BigCommerce, CMS development and web integrations built for speed and security.",
      primaryKeyword: "web development services",
    },
    hero: {
      eyebrow: "Web & Ecommerce Engineering",
      headline: "Websites and stores built to perform under load and audit.",
      intro:
        "From content sites to high-volume ecommerce, Celestino engineers web properties with measurable performance, accessibility and security, and integrates them with the systems behind them.",
    },
    fit: [
      "Businesses whose current site is slow, insecure or impossible to update",
      "Retailers launching or replatforming an online store",
      "Organizations that need content management their staff can actually use",
      "Companies connecting web properties to CRM, ERP, payment and marketing systems",
    ],
    capabilities: [
      { title: "Custom website engineering", description: "Hand-built sites with measured Core Web Vitals, accessibility and structured data." },
      { title: "Ecommerce development", description: "Storefronts and integrations on Magento, Shopify and BigCommerce, with experience across each platform." },
      { title: "CMS development and integration", description: "Content management integrated into existing sites or built custom when off-the-shelf does not fit." },
      { title: "Web integration", description: "Payment, shipping, inventory, CRM and marketing platform integrations that operate across devices." },
      { title: "Performance and security hardening", description: "Caching, image and script optimization, security headers, dependency hygiene and monitoring." },
      { title: "Hosting and operations", description: "Deployment pipelines, backups and uptime monitoring for the web properties Celestino builds." },
    ],
    engagement: [
      { step: "Define", detail: "Goals, audiences, content model and integrations documented." },
      { step: "Design and build", detail: "Iterative development with performance and accessibility budgets." },
      { step: "Launch", detail: "Redirect mapping, analytics, monitoring and search-engine configuration." },
      { step: "Operate", detail: "Updates, security patches and performance review on a schedule." },
    ],
    outcomes: [
      "Sites that score well on real-user performance metrics, not just lab tests",
      "Ecommerce integrations that keep inventory and orders consistent",
      "Content updates that do not require a developer",
      "A launch that preserves search rankings through proper redirects",
    ],
    faqs: [
      {
        question: "Which ecommerce platform should we use?",
        answer:
          "It depends on catalog complexity, integration needs, transaction volume and who will operate the store. Celestino has delivered on Magento, Shopify and BigCommerce and recommends based on those factors rather than a default platform.",
      },
      {
        question: "Can you improve an existing site without rebuilding it?",
        answer:
          "Often yes. A performance and security review identifies fixes with the best return, such as image optimization, caching, script cleanup, security headers and accessibility corrections.",
      },
    ],
    relatedServiceSlugs: ["software-development", "ai-automation", "cloud-infrastructure"],
    relatedSolutionSlugs: ["secure-application-engineering"],
    relatedIndustrySlugs: ["smb-mid-market", "professional-services"],
    relatedArticleSlugs: ["secure-application-development-checklist"],
  },
  {
    slug: "ai-automation",
    name: "AI & Automation",
    navLabel: "AI & Automation",
    shortDescription:
      "Chatbots, workflow automation and AI-assisted tooling integrated with your data and systems, with governance built in.",
    pillar: "build",
    icon: "automation",
    verifiedOnExistingSite: true,
    seo: {
      title: "AI & Automation Services | Chatbots & Workflows",
      description:
        "AI and automation from Celestino Enterprise: customer and internal chatbots, workflow automation and AI-assisted tooling integrated with your systems and governed for data security.",
      primaryKeyword: "AI automation services for business",
    },
    hero: {
      eyebrow: "AI & Automation",
      headline: "Automation that respects your data boundaries.",
      intro:
        "AI tools deliver value when they are connected to real systems and governed like any other software. Celestino builds chatbots, workflow automation and AI-assisted tooling with data access, logging and review designed in from the start.",
    },
    fit: [
      "Service businesses handling repetitive customer questions and intake",
      "Operations teams with manual hand-offs between systems",
      "Organizations that want AI tools without exposing sensitive data",
      "Companies that tried a generic chatbot and found it disconnected from their business",
    ],
    capabilities: [
      { title: "Customer and internal chatbots", description: "Assistants grounded in your content and systems, with escalation to humans and full logging." },
      { title: "Workflow automation", description: "Automated intake, routing, approvals and reporting across the platforms you already use." },
      { title: "Integration with business systems", description: "Connections to CRM, ticketing, document and ERP systems through supported APIs." },
      { title: "Data governance for AI", description: "Access scoping, retention, review and policy so AI tools meet the same standards as other software." },
      { title: "Evaluation and monitoring", description: "Measurement of accuracy, cost and usage so automation is improved on evidence." },
    ],
    engagement: [
      { step: "Identify", detail: "Processes ranked by volume, error rate and business impact." },
      { step: "Design", detail: "Data access, guardrails and human escalation defined before build." },
      { step: "Build and test", detail: "Iterative delivery measured against accuracy and time-saved targets." },
      { step: "Govern", detail: "Monitoring, review cadence and policy maintenance." },
    ],
    outcomes: [
      "Fewer manual hand-offs in intake, scheduling and reporting",
      "AI assistants that answer from your data, not the open internet",
      "Documented data boundaries that satisfy compliance review",
      "Usage and accuracy measured, so automation earns its keep",
    ],
    faqs: [
      {
        question: "Will our data be used to train public AI models?",
        answer:
          "Solutions are designed so that your data stays within services and configurations you control. Provider terms, data residency and retention are reviewed and documented before anything is connected.",
      },
      {
        question: "Where should we start with automation?",
        answer:
          "With a high-volume, well-understood process that has a clear owner, such as intake forms, appointment scheduling or ticket triage. Early wins fund the harder work.",
      },
    ],
    relatedServiceSlugs: ["software-development", "web-application-engineering", "security-risk-advisory"],
    relatedSolutionSlugs: ["secure-application-engineering"],
    relatedIndustrySlugs: ["professional-services", "smb-mid-market", "healthcare"],
    relatedArticleSlugs: ["secure-application-development-checklist"],
  },
];

export const serviceMap = new Map(services.map((s) => [s.slug, s]));

export function getService(slug: string): Service | undefined {
  return serviceMap.get(slug);
}

export function getServicesByPillar(pillar: PillarDef): Service[] {
  return pillar.serviceSlugs.map((s) => serviceMap.get(s)).filter((s): s is Service => Boolean(s));
}
