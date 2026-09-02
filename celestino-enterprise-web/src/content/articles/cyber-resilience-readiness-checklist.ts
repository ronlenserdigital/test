import type { Article } from "../types";

export const article: Article = {
  slug: "cyber-resilience-readiness-checklist",
  title: "Cyber Resilience Readiness Checklist: 15 Controls in the Order They Matter",
  description:
    "A sequenced checklist of the fifteen controls that determine whether an organization can withstand and recover from a cyber incident, with the rationale for each control's position and the evidence you should be able to produce.",
  category: "cybersecurity",
  type: "checklist",
  authorId: "celestino-engineering",
  publishedAt: "2026-06-25",
  reviewedAt: "2026-08-30",
  readingMinutes: 12,
  summary:
    "Cyber resilience is the ability to keep operating through an attack and recover quickly afterward, and it depends on a small number of controls implemented in the right order. Start with the controls that stop the most common intrusions, multi-factor authentication, privileged access reduction, endpoint detection and patching, then build the controls that limit damage, immutable backups, segmentation and logging, and finish with the controls that turn a breach into a recoverable event, an exercised response plan and tested restores. Each control should produce evidence you can hand to an auditor or insurer on request.",
  sections: [
    {
      id: "why-order-matters",
      heading: "Why the order matters",
      body: [
        "Security budgets and attention are finite. A control implemented before its prerequisites either fails to deliver its value or produces noise that nobody acts on. Advanced detection tooling deployed before identity is under control generates alerts about compromised accounts that should never have been compromisable. A disaster recovery plan written before backups are immutable describes a recovery that a ransomware operator can prevent.",
        "The fifteen controls below are ordered by the ratio of risk reduction to effort, adjusted for dependencies. The first five stop most intrusions. The middle five limit what an intruder can do once inside. The last five make the difference between an incident and a catastrophe. Organizations that work the list in order get value at every step rather than at the end.",
        "For each control the checklist gives a short statement of what 'done' looks like, why it sits where it does, and the evidence you should be able to produce. The evidence column is not optional; insurers, auditors, customers and regulators now ask for artifacts, and a control without evidence is indistinguishable from a control that does not exist.",
      ],
    },
    {
      id: "controls-1-to-5-stop-the-intrusion",
      heading: "Controls 1 to 5: stop the intrusion",
      body: [
        "These five controls address the initial access techniques behind most incidents: credential theft, phishing, exploitation of unpatched software and abuse of administrative accounts. Nothing else on the list is effective without them.",
      ],
      list: [
        "1. Multi-factor authentication on every account, with phishing-resistant methods for administrators and remote access. Why it comes here: stolen or guessed passwords remain the most common initial access path, and MFA is the single highest-yield control available. Evidence you should be able to produce: an identity provider report showing MFA enforcement by user, exceptions with expiry dates, and the conditional access policies that block legacy authentication.",
        "2. Privileged access reduction: no standing domain or global administrator rights for daily-use accounts, separate admin accounts, and just-in-time elevation where the platform supports it. Why it comes here: an attacker who lands on an admin's workstation with standing privileges owns the environment within minutes. Evidence: a privileged account inventory, a quarterly access review with sign-off, and configuration showing elevation is time-bound.",
        "3. Endpoint detection and response on every workstation and server, monitored 24x7 with a defined response path. Why it comes here: EDR is where most active intrusions are first visible, and unmonitored EDR is only a log. Evidence: deployment coverage compared against the asset inventory, monitoring service agreement, and sample alert-to-action records.",
        "4. Patch and vulnerability management with measured compliance, covering operating systems, browsers, productivity applications and internet-facing services, with emergency patching for actively exploited vulnerabilities. Why it comes here: exploitation of known vulnerabilities is the second most common initial access path after credentials. Evidence: monthly patch compliance reports, vulnerability scan results with remediation dates, and the emergency patch procedure.",
        "5. Email security and user awareness: advanced phishing protection, attachment and link scanning, DMARC enforcement on your domains, and recurring simulated phishing with role-based training. Why it comes here: email remains the primary delivery channel for credential theft and malware. Evidence: DMARC policy at enforcement, phishing simulation results over time, and training completion by department.",
      ],
    },
    {
      id: "controls-6-to-10-limit-the-damage",
      heading: "Controls 6 to 10: limit the damage",
      body: [
        "Some intrusions will succeed despite the first five controls. The next five determine how far an intruder can move, how much they can encrypt or exfiltrate, and how quickly you can see what happened.",
      ],
      list: [
        "6. Immutable, isolated backups following the 3-2-1-1-0 pattern, with at least one copy that cannot be altered or deleted using production credentials. Why it comes here: ransomware operators target backups first, and backups that share credentials with production are not backups. Evidence: backup job reports, immutability or object-lock configuration, an isolation diagram showing credential separation, and the most recent restore test.",
        "7. Network segmentation separating user, server, management, guest and operational technology networks, with firewall rules that deny by default between segments. Why it comes here: flat networks turn one compromised workstation into a domain-wide event. Evidence: network diagram with segments, firewall rule review, and evidence that management interfaces are reachable only from a management network.",
        "8. Centralized logging and retention for identity, endpoint, email, network, cloud and backup systems, with at least twelve months of retention and protection against tampering. Why it comes here: response and forensics are impossible without logs, and attackers delete local logs. Evidence: a log source inventory mapped to the asset inventory, retention configuration, and a sample query that reconstructs a user's sign-in history.",
        "9. Secure configuration baselines for endpoints, servers, cloud tenants and network devices, applied through management tooling and checked for drift. Why it comes here: default configurations expose services, protocols and settings that attackers rely on for lateral movement. Evidence: the baseline documents, a compliance report from the management platform, and the exception register.",
        "10. Data classification and protection: sensitive data identified, labeled, encrypted at rest and in transit, with data loss prevention rules for the highest classes. Why it comes here: knowing where regulated and confidential data lives determines breach scope, notification obligations and where controls must be strongest. Evidence: the classification scheme, a data inventory for regulated classes, encryption status, and DLP policy configuration.",
      ],
    },
    {
      id: "controls-11-to-15-recover-and-improve",
      heading: "Controls 11 to 15: recover and improve",
      body: [
        "The final five controls are the ones that distinguish resilient organizations from merely defended ones. They assume an incident will happen and make sure the organization can respond in an orderly way, restore operations within a known time, and learn from the event.",
        "These controls are also the ones most often missing in otherwise well-run environments, because they require coordination beyond IT and produce no visible benefit until the day they are needed. The [cyber resilience](/solutions/cyber-resilience) solution work Celestino delivers is built around closing exactly these gaps.",
      ],
      list: [
        "11. An incident response plan with severity definitions, roles, decision authority, communication templates, and legal, insurance, regulator and law-enforcement contacts, exercised at least annually with executives present. Why it comes here: response under pressure follows practice, not documents, and the first hours of a breach are where the most costly mistakes are made. Evidence: the plan, the contact list with verification dates, tabletop exercise reports with action items and closure.",
        "12. Documented recovery objectives per system: recovery time objective, recovery point objective, restore order and dependencies, agreed with the business owners of each system. Why it comes here: without agreed objectives, recovery is improvised and the business discovers its true tolerances during the outage. Evidence: the RTO and RPO register signed by system owners, and the restore sequence diagram.",
        "13. Tested restores: full restore of critical systems at least quarterly, and a complete environment recovery exercise at least annually, with results measured against the objectives in control 12. Why it comes here: backup jobs that succeed are not evidence of recoverability; only restores are. Evidence: restore test reports showing system, duration, data currency and issues found.",
        "14. Third-party and supply-chain risk management: an inventory of vendors with access to your systems or data, security requirements in contracts, review of attestations, and offboarding of vendor access. Why it comes here: a meaningful share of incidents now originate through vendors, managed service providers and software supply chains. Evidence: the vendor inventory with risk tiers, contract security clauses, and the vendor access review.",
        "15. Governance and measurement: an accountable executive, a risk register reviewed quarterly, metrics reported to leadership, and a cycle that feeds exercise findings and incident lessons back into the controls above. Why it comes here: resilience decays without ownership and measurement, and this control is what keeps the other fourteen working next year. Evidence: steering group minutes, the risk register with dates, metric dashboards or reports, and closed action items from exercises.",
      ],
    },
    {
      id: "how-to-use-the-checklist",
      heading: "How to use the checklist",
      body: [
        "Score each control as absent, partial or complete, and note whether the evidence exists in a form you could hand over within a day. Most organizations find that they have implemented several controls in the second and third groups while still having gaps in the first group, usually MFA exceptions and standing administrative privileges. Fix the earlier gaps first regardless of how much has been invested later in the list.",
        "Treat partial as absent for the first five controls. Multi-factor authentication with a dozen exceptions, or EDR deployed on 85 percent of endpoints, leaves exactly the gap an attacker will find. For controls six through fifteen, partial implementation still delivers value and can be improved incrementally.",
        "Revisit the score every quarter and after every incident or exercise. The goal is not a perfect score but a documented, evidenced state that improves over time and can be shown to anyone who asks.",
      ],
    },
    {
      id: "what-insurers-and-auditors-ask-for",
      heading: "What insurers and auditors ask for",
      body: [
        "Cyber-insurance applications have converged on a set of questions that map closely to the first ten controls on this list: MFA on email, remote access and privileged accounts; EDR coverage; backup immutability and isolation; patching cadence; email filtering; segmentation; and logging. Carriers increasingly verify answers with external scans and evidence requests, and misstatements on the application can void coverage.",
        "Auditors under HIPAA, SOX, FINRA and CMMC ask for the same artifacts with different labels. Building the evidence set once, as part of implementing each control, means the same repository serves the insurer, the auditor, the customer questionnaire and the board. A [security and risk advisory](/services/security-risk-advisory) engagement typically starts by assembling that repository against this list.",
      ],
    },
    {
      id: "summary-table",
      heading: "Summary table",
      body: [
        "The table condenses the fifteen controls into a single view suitable for a leadership briefing or a project tracker.",
      ],
      table: {
        headers: ["#", "Control", "Purpose", "Primary evidence"],
        rows: [
          ["1", "Multi-factor authentication", "Stop credential-based access", "MFA enforcement report, exception register"],
          ["2", "Privileged access reduction", "Prevent instant domain takeover", "Privileged account inventory, access review"],
          ["3", "Monitored EDR", "See and stop active intrusions", "Coverage report, alert-to-action records"],
          ["4", "Patch and vulnerability management", "Close exploited vulnerabilities", "Patch compliance, scan results"],
          ["5", "Email security and awareness", "Reduce phishing success", "DMARC status, simulation and training results"],
          ["6", "Immutable isolated backups", "Guarantee recoverable data", "Immutability config, restore test"],
          ["7", "Network segmentation", "Contain lateral movement", "Segment diagram, firewall review"],
          ["8", "Centralized logging", "Enable investigation", "Log source inventory, retention config"],
          ["9", "Secure configuration baselines", "Remove default exposure", "Baseline docs, drift report"],
          ["10", "Data classification and protection", "Know and protect what matters", "Classification scheme, data inventory"],
          ["11", "Incident response plan and exercise", "Respond in order, not in panic", "Plan, tabletop report"],
          ["12", "Recovery objectives", "Agree what recovery means", "RTO and RPO register"],
          ["13", "Tested restores", "Prove recoverability", "Restore test reports"],
          ["14", "Third-party risk management", "Close the vendor path", "Vendor inventory, access review"],
          ["15", "Governance and measurement", "Keep the program alive", "Steering minutes, risk register, metrics"],
        ],
      },
    },
  ],
  keyTakeaways: [
    "Implement controls in dependency order: identity and endpoint controls first, containment and visibility second, recovery and governance third.",
    "Treat partial implementation of the first five controls as absent; exceptions are exactly where intrusions begin.",
    "Immutable, isolated backups and tested restores are the difference between a ransomware incident and a business-ending event.",
    "Every control must produce evidence that can be handed over within a business day; insurers and auditors verify artifacts, not assertions.",
    "Governance and quarterly measurement keep the other fourteen controls effective over time.",
  ],
  references: [
    { label: "CISA Cross-Sector Cybersecurity Performance Goals", url: "https://www.cisa.gov/cross-sector-cybersecurity-performance-goals" },
    { label: "CISA #StopRansomware Guide", url: "https://www.cisa.gov/stopransomware/ransomware-guide" },
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
    { label: "NIST SP 800-61 Computer Security Incident Handling Guide", url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final" },
  ],
  relatedServiceSlugs: ["cybersecurity", "backup-disaster-recovery", "security-risk-advisory", "network-management"],
  relatedArticleSlugs: ["nist-csf-implementation-guide-smb", "backup-vs-disaster-recovery", "business-continuity-vs-disaster-recovery"],
};
