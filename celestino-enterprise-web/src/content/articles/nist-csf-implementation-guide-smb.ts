import type { Article } from "../types";

export const article: Article = {
  slug: "nist-csf-implementation-guide-smb",
  title: "Implementing NIST CSF 2.0 in a Mid-Sized Organization: A 12-Month Sequence",
  description:
    "A practical twelve-month plan for adopting NIST Cybersecurity Framework 2.0 in a mid-sized organization, covering the six functions, a quarter-by-quarter sequence, and the evidence artifacts each function should produce.",
  category: "compliance",
  type: "framework",
  authorId: "celestino-engineering",
  publishedAt: "2026-06-18",
  reviewedAt: "2026-08-30",
  readingMinutes: 13,
  summary:
    "NIST CSF 2.0 organizes cybersecurity into six functions: Govern, Identify, Protect, Detect, Respond and Recover. A mid-sized organization can implement it credibly in twelve months by spending the first quarter on governance and asset inventory, the second on core protective controls, the third on detection and response capability, and the fourth on recovery testing and a measured target profile. The output is a current profile, a target profile, a prioritized gap list and a set of evidence artifacts that satisfy auditors, insurers and customers.",
  sections: [
    {
      id: "what-changed-in-csf-2",
      heading: "What changed in CSF 2.0 and why it matters for mid-sized organizations",
      body: [
        "NIST published Cybersecurity Framework 2.0 in February 2024. The most visible change was the addition of a sixth function, Govern, which sits alongside the original five and covers organizational context, risk management strategy, roles and responsibilities, policy, oversight and supply-chain risk. The framework also dropped the language that limited it to critical infrastructure and now explicitly addresses organizations of every size and sector.",
        "For a mid-sized organization the practical effect is that CSF 2.0 expects leadership involvement from the start. It is no longer possible to treat the framework as a technical checklist owned by IT. Governance outcomes require an accountable executive, a documented risk appetite, and a decision record for how cybersecurity is funded and prioritized.",
        "The framework remains outcome-based rather than prescriptive. It tells you what should be true, not which product to buy. That is why it pairs well with a control catalog such as NIST SP 800-53 or the CIS Controls, and why it works as an umbrella for regulatory obligations such as HIPAA, the FTC Safeguards Rule or CMMC.",
      ],
    },
    {
      id: "the-six-functions",
      heading: "The six functions in plain terms",
      body: [
        "Each function is a set of outcomes grouped into categories and subcategories. Understanding what each function is for makes the sequence below easier to follow.",
        "Govern establishes the context, strategy, policy and oversight that the other five functions operate within. Identify produces an understanding of assets, risks and improvement opportunities. Protect implements safeguards. Detect finds and analyzes possible attacks. Respond takes action on detected incidents. Recover restores capabilities and communicates during recovery.",
      ],
      list: [
        "Govern (GV): organizational context, risk management strategy, roles and responsibilities, policy, oversight, and cybersecurity supply chain risk management.",
        "Identify (ID): asset management, risk assessment, and improvement.",
        "Protect (PR): identity management and access control, awareness and training, data security, platform security, and technology infrastructure resilience.",
        "Detect (DE): continuous monitoring and adverse event analysis.",
        "Respond (RS): incident management, analysis, reporting and communication, and mitigation.",
        "Recover (RC): incident recovery plan execution and incident recovery communication.",
      ],
    },
    {
      id: "profiles-and-tiers",
      heading: "Profiles and tiers: the tools you actually use",
      body: [
        "CSF 2.0 gives you two working instruments. A profile is a statement of outcomes, either current or target. A current profile records which outcomes you achieve today and how well. A target profile records where you intend to be, usually within twelve to twenty-four months. The gap between them is your roadmap.",
        "Tiers describe the rigor of your risk governance and management practices, from Tier 1 (Partial) through Tier 4 (Adaptive). Tiers are not maturity levels to climb for their own sake. Most mid-sized organizations reasonably target Tier 2 or Tier 3, which means risk-informed practices that are documented, repeatable and approved by leadership.",
        "The twelve-month sequence below is built around producing a defensible current profile in the first quarter, a target profile by the end of the second, and measurable movement toward the target by the end of the year. The [security and risk advisory](/services/security-risk-advisory) engagements Celestino delivers typically use this same structure.",
      ],
    },
    {
      id: "quarter-one-govern-and-identify",
      heading: "Quarter one: Govern and Identify",
      body: [
        "The first quarter establishes the foundation. Without an accountable executive, a documented risk process and an asset inventory, every later control is built on guesswork. Resist the urge to buy tooling in this quarter; the work is organizational.",
        "Governance work in this quarter includes naming the executive who owns cybersecurity risk, chartering a small steering group, writing or refreshing the information security policy, setting a risk appetite statement in business terms, and defining how third-party and supplier risk will be evaluated. Identify work includes building the asset inventory for hardware, software, cloud services, data and identities, classifying data by sensitivity, and conducting a risk assessment that maps threats to assets and existing controls.",
        "The quarter ends with a current profile scored against every CSF 2.0 category, a prioritized risk register, and a leadership briefing that approves the risk appetite and funds the plan.",
      ],
    },
    {
      id: "quarter-two-protect",
      heading: "Quarter two: Protect",
      body: [
        "The second quarter implements or hardens the protective controls that reduce the most risk per dollar. For most mid-sized organizations these are identity, endpoint, email and data controls, in that order.",
        "Identity work includes enforcing phishing-resistant or at minimum app-based multi-factor authentication for all users and administrators, removing standing administrative privileges, implementing conditional access, and establishing a joiner-mover-leaver process. Endpoint and platform work includes managed endpoint detection and response, patch management with measured compliance, secure configuration baselines, and encryption of laptops and mobile devices. Data work includes classification labels, data loss prevention for the most sensitive classes, and backup coverage verified against the asset inventory.",
        "Awareness training should launch in this quarter with a baseline phishing simulation and role-based content for finance, HR and executives. By the end of the quarter, publish the target profile and a gap list with owners and dates.",
      ],
    },
    {
      id: "quarter-three-detect-and-respond",
      heading: "Quarter three: Detect and Respond",
      body: [
        "The third quarter builds the capability to find attacks and act on them. This is where most mid-sized organizations are weakest, because detection requires continuous monitoring and response requires practiced procedure, and neither happens by default.",
        "Detection work includes centralizing logs from identity, endpoint, email, network and cloud sources, implementing 24x7 monitoring either internally or through a managed service, defining alert priorities and tuning noise, and establishing baseline behavior for privileged accounts and critical systems. Response work includes writing an incident response plan with severity definitions, roles, communication templates and legal and insurance notification steps, then exercising it with a tabletop that involves executives, not only IT.",
        "The quarter should close with a demonstrated end-to-end path: an alert fires, an analyst triages it, the incident is classified, the right people are engaged, actions are taken and the outcome is documented. The [cybersecurity](/services/cybersecurity) practice at Celestino treats this drill as the acceptance test for detection and response.",
      ],
    },
    {
      id: "quarter-four-recover-and-measure",
      heading: "Quarter four: Recover and measure",
      body: [
        "The final quarter proves the organization can come back from a serious incident and sets up the framework as an ongoing program rather than a project. Recovery work includes documenting recovery time and recovery point objectives per system, validating that backups are immutable and isolated from production credentials, performing full restore tests of critical systems, and writing recovery communications for customers, regulators and staff.",
        "Measurement work includes rescoring the current profile against the target, reporting movement to leadership, updating the risk register, and setting the next year's target profile. Supply-chain outcomes from Govern should be revisited here with a review of critical vendors and their security attestations.",
        "The year ends with a leadership review that approves the program budget, the next target profile and the exercise calendar. From this point the framework runs on a quarterly cadence of profile updates, risk review and exercises.",
      ],
    },
    {
      id: "evidence-artifacts-by-function",
      heading: "Evidence artifacts by function",
      body: [
        "A framework implementation is only as credible as the evidence it produces. Auditors, cyber-insurers, customers and regulators increasingly ask for artifacts rather than assertions. The table lists the minimum set each function should be able to produce on request, with the quarter in which it is first generated.",
        "Store these artifacts in a controlled repository with version history and an owner. Evidence that cannot be found within a business day is, for audit purposes, evidence that does not exist.",
      ],
      table: {
        headers: ["Function", "Evidence artifacts", "First produced"],
        rows: [
          ["Govern", "Information security policy, risk appetite statement, steering group charter and minutes, roles and responsibilities matrix, vendor risk procedure and critical vendor list", "Q1"],
          ["Identify", "Asset inventory (hardware, software, cloud, data, identities), data classification scheme, risk assessment report, risk register, current profile", "Q1"],
          ["Protect", "MFA enforcement report, privileged access review, patch compliance report, configuration baselines, encryption status, training completion and phishing results, backup coverage report", "Q2"],
          ["Detect", "Log source inventory, monitoring coverage statement, alert priority definitions, sample triage records, tuning change log", "Q3"],
          ["Respond", "Incident response plan, severity matrix, contact and notification list, tabletop exercise report with action items, incident records", "Q3"],
          ["Recover", "RTO and RPO register, restore test reports, immutability and isolation verification, recovery communication templates, post-incident review template", "Q4"],
        ],
      },
    },
    {
      id: "common-failure-modes",
      heading: "Common failure modes and how to avoid them",
      body: [
        "The most common failure is treating the framework as a one-time assessment. A profile that is scored once and filed is worth little; the value is in the gap list being worked and rescored. Assign a program owner with time to run the quarterly cadence.",
        "The second failure is tool-first thinking. Buying a security platform in month one without an asset inventory or risk assessment produces expensive coverage of the wrong things. The third is excluding leadership. CSF 2.0's Govern function exists because cybersecurity outcomes depend on funding, priority and accountability decisions that only executives can make.",
        "Finally, do not confuse the framework with compliance. CSF 2.0 does not certify anything. It organizes your program so that regulatory obligations under HIPAA, FINRA, SOX, CMMC or state privacy law can be mapped to controls you already run and evidence you already produce.",
      ],
    },
  ],
  keyTakeaways: [
    "CSF 2.0 has six functions: Govern, Identify, Protect, Detect, Respond and Recover; Govern is new and requires executive ownership from day one.",
    "Spend quarter one on governance and asset inventory, quarter two on identity, endpoint and data protection, quarter three on detection and response, and quarter four on recovery testing and measurement.",
    "Use current and target profiles as the working instruments; the gap between them is your roadmap and should be rescored quarterly.",
    "Each function should produce specific evidence artifacts stored in a controlled repository with an owner.",
    "The framework does not certify anything, but it provides the structure to map HIPAA, FINRA, SOX and CMMC obligations to controls and evidence you already maintain.",
  ],
  references: [
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
    { label: "NIST CSF 2.0 Resource Center", url: "https://www.nist.gov/cyberframework/csf-20" },
    { label: "NIST SP 800-53 Security and Privacy Controls", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" },
    { label: "CISA Cross-Sector Cybersecurity Performance Goals", url: "https://www.cisa.gov/cross-sector-cybersecurity-performance-goals" },
  ],
  relatedServiceSlugs: ["security-risk-advisory", "cybersecurity", "backup-disaster-recovery"],
  relatedArticleSlugs: ["cyber-resilience-readiness-checklist", "hipaa-cybersecurity-considerations", "cmmc-readiness-concepts"],
};
