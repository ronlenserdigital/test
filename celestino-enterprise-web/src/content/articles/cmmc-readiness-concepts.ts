import type { Article } from "../types";

export const article: Article = {
  slug: "cmmc-readiness-concepts",
  title: "CMMC 2.0 Readiness Concepts for Small Defense Suppliers",
  description:
    "The core concepts a small defense supplier needs to understand before pursuing CMMC 2.0: the three levels, the relationship to NIST SP 800-171, SPRS scoring, plans of action and milestones, the role of C3PAOs, and the gaps that most commonly delay readiness.",
  category: "government-technology",
  type: "guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-07-30",
  reviewedAt: "2026-08-30",
  readingMinutes: 12,
  summary:
    "CMMC 2.0 is the Department of Defense program that verifies contractors protect Federal Contract Information and Controlled Unclassified Information, with three levels: Level 1 (17 basic practices, annual self-assessment), Level 2 (the 110 requirements of NIST SP 800-171, assessed by a C3PAO for most contracts) and Level 3 (additional requirements from NIST SP 800-172, assessed by the government). A small supplier prepares by scoping where CUI lives, implementing the 800-171 requirements, scoring itself in SPRS, closing gaps with a time-bound plan of action, and assembling the evidence an assessor will examine. Celestino helps suppliers prepare their environments and evidence but is not a C3PAO and does not certify anyone.",
  sections: [
    {
      id: "what-cmmc-is-and-why-it-exists",
      heading: "What CMMC is and why it exists",
      body: [
        "The Cybersecurity Maturity Model Certification (CMMC) is the Department of Defense mechanism for verifying that contractors and subcontractors actually implement the cybersecurity requirements they have been contractually obligated to meet since DFARS clause 252.204-7012 took effect. That clause required contractors handling Controlled Unclassified Information (CUI) to implement NIST SP 800-171, but compliance was self-attested and, in the Department's assessment, widely incomplete.",
        "CMMC 2.0, finalized through rulemaking in 2024 and phased into contracts beginning in 2025, replaces self-attestation with a tiered verification model. The level required is specified in each solicitation based on the sensitivity of the information the contractor will handle. Suppliers that cannot demonstrate the required level at the required time become ineligible for those awards.",
        "For a small supplier, the practical consequence is that CMMC is a business continuity issue rather than a compliance nicety. Prime contractors are flowing the requirements down and asking subcontractors for their status, and a supplier without a credible readiness position risks being removed from the supply chain. The [government and public sector](/industries/government-public-sector) work Celestino delivers includes preparing exactly these environments.",
      ],
    },
    {
      id: "the-three-levels",
      heading: "The three levels",
      body: [
        "CMMC 2.0 defines three levels, each tied to a type of information and a form of assessment.",
      ],
      list: [
        "Level 1 (Foundational): applies to contractors handling only Federal Contract Information (FCI). It requires the 17 basic safeguarding practices from FAR 52.204-21, which correspond to a subset of NIST SP 800-171. Verified by annual self-assessment with an affirmation by a senior company official.",
        "Level 2 (Advanced): applies to contractors handling CUI. It requires all 110 security requirements of NIST SP 800-171 Revision 2. For most contracts, verified by a triennial assessment conducted by a CMMC Third-Party Assessment Organization (C3PAO), with annual affirmations in between. A subset of contracts involving less sensitive CUI may allow self-assessment.",
        "Level 3 (Expert): applies to contractors handling the most sensitive CUI on the highest-priority programs. It requires Level 2 plus selected requirements from NIST SP 800-172, and is assessed by the Defense Industrial Base Cybersecurity Assessment Center (DIBCAC) rather than a C3PAO.",
      ],
    },
    {
      id: "the-relationship-to-nist-sp-800-171",
      heading: "The relationship to NIST SP 800-171",
      body: [
        "NIST SP 800-171 is the control set; CMMC is the verification program. Level 2 does not add requirements beyond 800-171 Revision 2; it verifies that the 110 requirements across 14 families are implemented. The families cover access control, awareness and training, audit and accountability, configuration management, identification and authentication, incident response, maintenance, media protection, personnel security, physical protection, risk assessment, security assessment, system and communications protection, and system and information integrity.",
        "Each requirement is assessed using the objectives in NIST SP 800-171A, which breaks the 110 requirements into roughly 320 assessment objectives. A requirement is met only if every one of its objectives is met. This is where many suppliers misjudge their position: a requirement that is partially implemented, or implemented without the documentation to prove it, scores as not met.",
        "Suppliers should also be aware that NIST has published 800-171 Revision 3, which reorganizes and updates the requirements. The CMMC program specified Revision 2 in its rule, and the Department has indicated how and when the transition will occur through its own rulemaking. Track the current CMMC program guidance from the DoD CIO rather than assuming the latest NIST revision applies.",
      ],
    },
    {
      id: "scoping-and-the-cui-boundary",
      heading: "Scoping and the CUI boundary",
      body: [
        "Scoping is the most important preparatory decision. The assessment covers every asset that processes, stores or transmits CUI, every asset that provides security protection to those assets, and every asset that could affect them. A supplier that allows CUI to flow through the entire corporate environment has scoped the entire environment into the assessment.",
        "Most small suppliers benefit from an enclave: a defined set of systems, identities, networks and cloud services where CUI is permitted, separated from the rest of the business by technical and administrative controls. The enclave might be a dedicated cloud tenant such as a government cloud environment, a segmented network with dedicated workstations, or a virtual desktop environment through which CUI is accessed but never downloaded.",
        "The CMMC scoping guidance defines asset categories, including CUI assets, security protection assets, contractor risk managed assets, specialized assets and out-of-scope assets. Documenting each asset's category, the boundary and the data flows is a required part of the system security plan and is the first thing an assessor will examine.",
      ],
    },
    {
      id: "sprs-scores-and-plans-of-action",
      heading: "SPRS scores and plans of action",
      body: [
        "The Supplier Performance Risk System (SPRS) is where contractors record their NIST SP 800-171 self-assessment score. The DoD assessment methodology starts at 110 and subtracts points for each unmet requirement, weighted one, three or five points by severity, so scores range from 110 down to negative 203. A current score in SPRS has been a contractual requirement under DFARS 252.204-7019 and 7020 since 2020, and primes routinely check it.",
        "A plan of action and milestones (POA&M) documents unmet requirements, the actions to close them, the responsible party and the target date. Under CMMC 2.0, a Level 2 assessment can result in a conditional certification if the score is at least 80 percent, meaning 88 of 110, and no requirement in the highest-weighted category is open, with the POA&M items closed within 180 days. Certain requirements cannot be placed on a POA&M at all. Suppliers should treat the POA&M as a closing schedule, not a permanent parking place.",
        "An honest self-assessment is the foundation. Suppliers that overstate their SPRS score expose themselves to False Claims Act liability, which the Department of Justice has pursued through its Civil Cyber-Fraud Initiative. The score should reflect what an assessor would find, objective by objective.",
      ],
    },
    {
      id: "the-c3pao-role-and-what-celestino-does",
      heading: "The C3PAO role and what Celestino does and does not do",
      body: [
        "A CMMC Third-Party Assessment Organization (C3PAO) is an organization accredited by the Cyber AB, the accreditation body for the CMMC ecosystem, to conduct Level 2 certification assessments. The C3PAO's assessors examine the system security plan, interview staff, test controls and review evidence against every 800-171A objective, then issue findings and, if the supplier meets the threshold, a certification recorded in the Department's systems.",
        "The C3PAO must be independent. It cannot assess an environment it helped build. This creates a clear division of roles: consultants, managed providers and internal teams prepare the environment and the evidence; a separate, accredited C3PAO assesses it. Suppliers should select a C3PAO from the Cyber AB marketplace and engage early, because assessment capacity is limited and lead times are long.",
        "Celestino is not a C3PAO, is not accredited to conduct CMMC assessments, and does not certify anyone. What Celestino does is prepare environments for assessment: scoping and enclave design, implementing the technical requirements, producing the system security plan and evidence, and operating the controls on an ongoing basis through [managed IT](/services/managed-it) and [cybersecurity](/services/cybersecurity) services. The certification decision belongs entirely to the accredited assessor.",
      ],
    },
    {
      id: "common-gaps-in-small-suppliers",
      heading: "Common gaps in small suppliers",
      body: [
        "The gaps below appear repeatedly in small supplier readiness reviews. Most are documentation and scope problems rather than technology problems, which is good news, because they are cheaper to fix than they look.",
      ],
      list: [
        "No system security plan, or a plan written from a template that does not describe how each requirement is actually implemented in the supplier's environment.",
        "Undefined CUI scope: CUI in personal email, in unmanaged file shares, on personal devices or in commercial cloud services not approved for it.",
        "Multi-factor authentication missing for local access, privileged accounts or the CUI enclave, or implemented with methods the assessor will not accept.",
        "Audit logging that is not centralized, not retained, not protected from modification and never reviewed.",
        "No configuration baselines, no change control, and no documented process for restricting nonessential programs, ports and services.",
        "Incident response plan that exists but has never been exercised, and no process for reporting cyber incidents to the Department within 72 hours as DFARS 7012 requires.",
        "Media protection and physical security gaps: unencrypted removable media, no sanitization process, no visitor control at locations where CUI is handled.",
        "Cloud services that do not meet the FedRAMP Moderate equivalency requirement for CUI, or that have not been documented as meeting it.",
        "Evidence that exists in someone's head rather than in a repository, so that a personnel change erases the supplier's ability to demonstrate compliance.",
      ],
    },
    {
      id: "a-readiness-sequence",
      heading: "A readiness sequence",
      body: [
        "A small supplier starting from a low SPRS score can typically reach assessment readiness in nine to eighteen months, depending on how much of the environment must be rebuilt. The sequence is: determine the level required by current and expected contracts; identify where CUI enters, flows and rests; design the enclave and move CUI into it; implement the 800-171 requirements against the 800-171A objectives; write the system security plan as the implementation proceeds, not afterward; conduct a rigorous self-assessment and record the score in SPRS; close POA&M items in priority order; assemble the evidence repository; run a mock assessment; then engage the C3PAO.",
        "Two practices make the difference between suppliers that pass and suppliers that stall. The first is treating documentation as a deliverable of every implementation task, so that the system security plan and the evidence grow with the environment. The second is operating the controls continuously, because an assessor examines whether logs were reviewed last month and whether access reviews happened last quarter, not whether the capability exists.",
        "Suppliers should also prepare for what happens after certification: annual affirmations, maintaining the score, and re-assessment every three years. The controls have to keep running, which is why many small suppliers move the operation of the enclave to a provider that can produce the ongoing evidence.",
      ],
    },
  ],
  keyTakeaways: [
    "CMMC 2.0 has three levels: Level 1 for FCI with self-assessment, Level 2 for CUI with the 110 NIST SP 800-171 requirements assessed by a C3PAO for most contracts, and Level 3 for the most sensitive programs assessed by the government.",
    "Level 2 verifies NIST SP 800-171 Revision 2 using the roughly 320 objectives in 800-171A; a requirement is met only if every objective is met and documented.",
    "Scope determines cost: an enclave that confines CUI to a defined set of systems and identities keeps the assessment boundary small.",
    "Record an honest SPRS score, use the POA&M as a closing schedule, and be aware that overstated scores carry False Claims Act exposure.",
    "The C3PAO must be independent of whoever prepared the environment; Celestino prepares environments and evidence and does not certify anyone.",
    "Most small supplier gaps are documentation, scope and operational discipline, not missing technology.",
  ],
  references: [
    { label: "DoD CIO CMMC Program", url: "https://dodcio.defense.gov/CMMC/" },
    { label: "NIST SP 800-171 Rev. 2, Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations", url: "https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final" },
    { label: "NIST SP 800-171A, Assessing Security Requirements for Controlled Unclassified Information", url: "https://csrc.nist.gov/pubs/sp/800/171/a/final" },
    { label: "NIST SP 800-172, Enhanced Security Requirements for Protecting Controlled Unclassified Information", url: "https://csrc.nist.gov/pubs/sp/800/172/final" },
  ],
  relatedServiceSlugs: ["security-risk-advisory", "cybersecurity", "managed-it", "cloud-infrastructure"],
  relatedArticleSlugs: ["nist-csf-implementation-guide-smb", "virginia-public-sector-procurement-security-guide", "cyber-resilience-readiness-checklist"],
};
