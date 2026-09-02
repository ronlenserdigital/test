import type { Industry } from "./types";

/**
 * Industry pages. `experienceVerified` is false everywhere until the client confirms
 * sector experience; pages present sector requirements and relevant services without
 * claiming past performance.
 */
export const industries: Industry[] = [
  {
    slug: "government-public-sector",
    name: "Government & Public Sector",
    shortDescription:
      "IT operations, security and application engineering structured for procurement, compliance and public accountability.",
    icon: "building",
    experienceVerified: false,
    seo: {
      title: "Government & Public Sector IT Services | Virginia",
      description:
        "Celestino Enterprise supports state, local and federal-adjacent organizations with managed IT, cybersecurity, disaster recovery and secure application engineering, structured for public-sector procurement and compliance.",
      primaryKeyword: "government IT services Virginia",
    },
    hero: {
      eyebrow: "Government & Public Sector",
      headline: "Technology operations built for public accountability.",
      intro:
        "Public-sector organizations answer to auditors, legislators and citizens at once. Celestino delivers managed operations, security controls and engineering with the documentation, separation of duties and evidence that public accountability requires.",
    },
    challenges: [
      { title: "Constrained budgets, rising expectations", detail: "Services must expand while staffing and capital budgets stay flat, which pushes agencies toward managed and co-managed models." },
      { title: "Procurement and vendor requirements", detail: "Registrations, small-business classifications, cooperative contracts and documented past performance shape who can even respond." },
      { title: "Records, privacy and public information", detail: "Retention schedules, FOIA obligations and privacy laws apply to every system that holds citizen data." },
      { title: "Legacy systems with no owner", detail: "Critical applications often run on unsupported platforms because the original vendor or staff member is gone." },
      { title: "Continuity of essential services", detail: "Outages affect public safety, payments and permitting, so recovery objectives are non-negotiable." },
    ],
    regulatory: [
      { name: "NIST Cybersecurity Framework", summary: "Common baseline for state and local government security programs and grant requirements." },
      { name: "NIST SP 800-171 / CMMC", summary: "Applies to organizations handling Controlled Unclassified Information for Department of Defense work." },
      { name: "CJIS Security Policy", summary: "Required where systems touch criminal justice information." },
      { name: "State records and privacy statutes", summary: "Virginia and other states impose retention, breach notification and data protection requirements on public bodies." },
    ],
    solutionSlugs: ["cyber-resilience", "business-continuity", "infrastructure-modernization", "it-operational-resilience"],
    serviceSlugs: ["managed-it", "co-managed-it", "cybersecurity", "security-risk-advisory", "backup-disaster-recovery", "software-development"],
    articleSlugs: ["cmmc-readiness-concepts", "virginia-public-sector-procurement-security-guide", "nist-csf-implementation-guide-smb"],
    faqs: [
      {
        question: "Is Celestino registered to do business with government agencies?",
        answer:
          "Procurement registrations, identifiers and classifications are published on our Government & Public Sector page as they are confirmed. Contact us for a current capability statement and registration status.",
      },
      {
        question: "Can you work as a subcontractor to a prime?",
        answer:
          "Yes. Celestino can deliver defined scopes such as managed operations, security hardening or application work under a prime contractor's agreement.",
      },
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    shortDescription:
      "HIPAA-aligned IT operations, security and recovery for practices, clinics and healthcare service organizations.",
    icon: "hospital",
    experienceVerified: false,
    seo: {
      title: "Healthcare IT Services | HIPAA Security Rule Support",
      description:
        "Celestino Enterprise delivers HIPAA-aligned managed IT, cybersecurity, backup and disaster recovery for healthcare practices and service organizations, with documented safeguards and audit support.",
      primaryKeyword: "healthcare IT services HIPAA",
    },
    hero: {
      eyebrow: "Healthcare",
      headline: "Safeguards that hold up in an OCR investigation.",
      intro:
        "Healthcare organizations must keep systems available for patient care while protecting protected health information under the HIPAA Security Rule. Celestino implements and maintains the administrative, physical and technical safeguards, and keeps the evidence.",
    },
    challenges: [
      { title: "PHI across many systems", detail: "EHR, imaging, billing, email and mobile devices all hold protected health information and all need controls." },
      { title: "Ransomware targeting", detail: "Healthcare is a preferred target because downtime directly affects care and payment." },
      { title: "Risk analysis requirements", detail: "The Security Rule requires a documented, current risk analysis, and regulators ask for it first." },
      { title: "Business associates", detail: "Every vendor touching PHI needs an agreement and a reason to be trusted." },
      { title: "Clinical uptime", detail: "Recovery objectives for clinical systems are measured in hours, not days." },
    ],
    regulatory: [
      { name: "HIPAA Security Rule", summary: "Administrative, physical and technical safeguards for electronic protected health information, including risk analysis." },
      { name: "HIPAA Privacy and Breach Notification Rules", summary: "Use and disclosure limits and notification obligations after a breach." },
      { name: "HITECH", summary: "Strengthened enforcement and business associate obligations." },
      { name: "State health privacy laws", summary: "Additional requirements that vary by state and can exceed HIPAA." },
    ],
    solutionSlugs: ["cyber-resilience", "business-continuity", "cloud-security"],
    serviceSlugs: ["managed-it", "cybersecurity", "security-risk-advisory", "backup-disaster-recovery", "cloud-infrastructure"],
    articleSlugs: ["hipaa-cybersecurity-considerations", "backup-vs-disaster-recovery", "cyber-resilience-readiness-checklist"],
    faqs: [
      {
        question: "Will Celestino sign a Business Associate Agreement?",
        answer:
          "Where Celestino's services involve access to protected health information, a Business Associate Agreement is part of the engagement. Terms are reviewed with your compliance officer before onboarding.",
      },
      {
        question: "Do you perform the HIPAA risk analysis?",
        answer:
          "Celestino conducts technical risk assessments and supports the organization-wide risk analysis required by the Security Rule. Formal compliance attestation remains the covered entity's responsibility, with Celestino providing the technical evidence.",
      },
    ],
  },
  {
    slug: "financial-services",
    name: "Financial Services",
    shortDescription:
      "Controls, evidence and continuity for firms subject to FINRA, SEC and SOX expectations.",
    icon: "bank",
    experienceVerified: false,
    seo: {
      title: "Financial Services IT & Cybersecurity | FINRA, SOX",
      description:
        "Celestino Enterprise supports broker-dealers, advisors, lenders and finance teams with managed IT, cybersecurity controls, SOX IT general controls support and tested business continuity.",
      primaryKeyword: "financial services IT support FINRA",
    },
    hero: {
      eyebrow: "Financial Services",
      headline: "IT general controls that survive the examiner's checklist.",
      intro:
        "Regulated financial firms need access control, change management, data protection and business continuity that can be evidenced on demand. Celestino runs the environment and maintains the evidence as one job.",
    },
    challenges: [
      { title: "Examination readiness", detail: "FINRA and SEC examiners expect written cybersecurity programs, tested BCPs and documented vendor oversight." },
      { title: "SOX IT general controls", detail: "Public companies and their subsidiaries need logical access, change management and operations controls that auditors can test." },
      { title: "Email and payment fraud", detail: "Business email compromise targets finance functions specifically, making identity controls and verification procedures essential." },
      { title: "Data retention", detail: "Books-and-records rules require retention and retrievability that ordinary backup does not guarantee." },
      { title: "Third-party risk", detail: "Cloud and fintech vendors must be assessed and monitored, not just onboarded." },
    ],
    regulatory: [
      { name: "FINRA cybersecurity expectations", summary: "Guidance and examination priorities covering governance, access, vendor management and incident response." },
      { name: "SEC Regulation S-P and cybersecurity rules", summary: "Safeguarding customer information and incident response program requirements." },
      { name: "SOX Section 404", summary: "IT general controls supporting financial reporting integrity." },
      { name: "GLBA Safeguards Rule", summary: "Information security program requirements for financial institutions." },
    ],
    solutionSlugs: ["cyber-resilience", "business-continuity", "cloud-security"],
    serviceSlugs: ["managed-it", "cybersecurity", "security-risk-advisory", "backup-disaster-recovery", "co-managed-it"],
    articleSlugs: ["nist-csf-implementation-guide-smb", "business-continuity-vs-disaster-recovery"],
    faqs: [
      {
        question: "Can you help with SOX IT general controls?",
        answer:
          "Yes. Celestino implements and operates logical access, change management and IT operations controls and produces the evidence your auditors test. Audit opinions come from your independent auditor.",
      },
    ],
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    shortDescription:
      "Reliable, secure operations for law firms, accounting practices, engineering firms and consultancies that bill by the hour.",
    icon: "briefcase",
    experienceVerified: false,
    seo: {
      title: "IT Services for Law, Accounting & Engineering Firms",
      description:
        "Celestino Enterprise provides managed IT, security and continuity for law firms, accountants, engineering firms and consultancies, where downtime is lost billable time and client data is the business.",
      primaryKeyword: "IT services for law firms and accounting firms",
    },
    hero: {
      eyebrow: "Professional Services",
      headline: "Every hour of downtime is an hour nobody bills.",
      intro:
        "Professional services firms run on client confidentiality and billable time. Celestino keeps document systems, email and practice applications available and secure, and answers client security questionnaires with implemented controls.",
    },
    challenges: [
      { title: "Client confidentiality obligations", detail: "Ethics rules and engagement letters require reasonable security for client data, and clients increasingly audit it." },
      { title: "Client security questionnaires", detail: "Corporate clients now require vendor security assessments before engagement." },
      { title: "Practice-management dependence", detail: "Document management, time and billing, and case systems must be available and backed up." },
      { title: "Remote and hybrid work", detail: "Staff work from courts, client sites and homes, which stresses identity and device controls." },
      { title: "Small internal IT", detail: "One IT person or an office manager often carries the whole environment." },
    ],
    regulatory: [
      { name: "Professional ethics and confidentiality rules", summary: "Bar and accounting standards requiring competent handling of client data." },
      { name: "State data breach laws", summary: "Notification obligations when client personal data is exposed." },
      { name: "Client contractual requirements", summary: "Security terms flowing down from corporate and regulated clients." },
    ],
    solutionSlugs: ["it-operational-resilience", "cyber-resilience", "cloud-security", "infrastructure-modernization"],
    serviceSlugs: ["managed-it", "co-managed-it", "cybersecurity", "backup-disaster-recovery", "cloud-infrastructure"],
    articleSlugs: ["in-house-it-vs-managed-it", "cyber-resilience-readiness-checklist"],
    faqs: [
      {
        question: "Can you help us respond to a client's security questionnaire?",
        answer:
          "Yes. Celestino reviews the questionnaire against your actual controls, closes gaps where practical, and provides accurate answers with supporting evidence.",
      },
    ],
  },
  {
    slug: "smb-mid-market",
    name: "SMB & Mid-Market",
    shortDescription:
      "Enterprise-grade operations and security scaled for organizations with 20 to 500 employees.",
    icon: "storefront",
    experienceVerified: false,
    seo: {
      title: "Managed IT & Security for SMB & Mid-Market",
      description:
        "Celestino Enterprise brings managed IT, cybersecurity, cloud and application engineering to small and mid-sized businesses that need enterprise discipline without enterprise headcount.",
      primaryKeyword: "managed IT services for small business",
    },
    hero: {
      eyebrow: "SMB & Mid-Market",
      headline: "Enterprise discipline without enterprise headcount.",
      intro:
        "Growing businesses face the same threats and expectations as large enterprises with a fraction of the staff. Celestino provides the operations, security and engineering capacity of an internal IT department on a scale that fits.",
    },
    challenges: [
      { title: "Cyber-insurance requirements", detail: "Carriers now require MFA, endpoint detection, backups and training before they will bind or renew coverage." },
      { title: "Growth outpacing IT", detail: "New offices, hires and systems arrive faster than anyone can document or secure them." },
      { title: "Vendor sprawl", detail: "Multiple providers for internet, phones, software and support with no one accountable for the whole." },
      { title: "Aging equipment", detail: "Servers and network gear purchased at founding are still running years past support." },
      { title: "Web and application needs", detail: "Customer-facing sites, ecommerce and internal tools require engineering the business cannot staff." },
    ],
    regulatory: [
      { name: "State data breach and privacy laws", summary: "Apply to any business holding customer or employee personal data." },
      { name: "PCI DSS", summary: "Applies to businesses that accept card payments, including ecommerce." },
      { name: "Cyber-insurance conditions", summary: "Contractual control requirements that function like regulation for many SMBs." },
    ],
    solutionSlugs: ["it-operational-resilience", "cyber-resilience", "infrastructure-modernization", "secure-application-engineering"],
    serviceSlugs: ["managed-it", "cybersecurity", "cloud-infrastructure", "network-management", "web-application-engineering", "ai-automation"],
    articleSlugs: ["in-house-it-vs-managed-it", "cyber-resilience-readiness-checklist", "cloud-vs-hybrid-infrastructure"],
    faqs: [
      {
        question: "What size organization is the right fit for Celestino?",
        answer:
          "Most engagements are with organizations from roughly 20 to 500 users, either fully managed or co-managed with an internal IT staff. Application engineering projects are scoped independently of headcount.",
      },
    ],
  },
];

export const industryMap = new Map(industries.map((i) => [i.slug, i]));
export function getIndustry(slug: string): Industry | undefined {
  return industryMap.get(slug);
}
