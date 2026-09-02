import type { TrustSection } from "./types";

/**
 * Trust Center content. Sections with status "awaiting-client" render a structured
 * placeholder explaining what will be published, never an invented claim.
 */
export const trustSections: TrustSection[] = [
  {
    slug: "security-practices",
    title: "Security practices",
    summary: "How Celestino secures its own operations and the access it holds to client environments.",
    status: "published",
    body: [
      "Celestino holds privileged access to client systems. That access is treated as the most sensitive asset in the business, and the controls around it are the ones a prospective client should ask about first.",
      "The practices below describe how this website and Celestino's internal tooling are operated. Client-specific controls are defined in each service agreement.",
    ],
    bullets: [
      "Multi-factor authentication is required on all administrative and client-facing accounts.",
      "Access to client environments follows least privilege, is scoped to the responsibility matrix in the agreement, and is removed when an engagement ends.",
      "Credentials for client systems are stored in an access-controlled, audited vault, never in email, chat or documents.",
      "This website is served over HTTPS only with HTTP Strict Transport Security, a content security policy, and restrictive referrer and permissions policies.",
      "Public forms on this site are validated on the server, rate-limited, protected against automated submission, and stored with row-level security that prevents public read access.",
      "No third-party tracking scripts are loaded before the analytics configuration in the privacy policy is met.",
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    summary: "What this website collects, why, and how long it is kept.",
    status: "published",
    body: [
      "This website collects the information you submit through contact forms (name, work email, company, phone if provided, and your message) for the purpose of responding to your inquiry. Submissions are stored in an access-controlled database and are not sold or shared with third parties for marketing.",
      "Analytics on this site are limited to aggregate usage measurement. Where Google Analytics is enabled, IP anonymization and consent settings are configured as described in the privacy policy page, and no form contents or sensitive security details are sent to analytics.",
      "Requests to access or delete information you have submitted can be made through the contact page.",
    ],
  },
  {
    slug: "data-handling",
    title: "Data handling",
    summary: "How client data encountered during service delivery is treated.",
    status: "published",
    body: [
      "During managed services, security work and application engineering, Celestino engineers may encounter client data including personal information, protected health information and financial records. That data is accessed only as required to deliver the contracted service.",
      "Data handling obligations, including Business Associate Agreements for healthcare clients and confidentiality terms for financial and legal clients, are executed before access is granted.",
    ],
    bullets: [
      "Client data is not copied to engineer-owned devices or personal cloud accounts.",
      "Backups of client systems are stored according to the client's retention and residency requirements.",
      "At engagement end, credentials are revoked and any Celestino-held copies of client data are returned or destroyed as the agreement specifies.",
    ],
  },
  {
    slug: "responsible-disclosure",
    title: "Responsible disclosure",
    summary: "How to report a security issue in this website or a Celestino-operated service.",
    status: "awaiting-client",
    body: [
      "Celestino welcomes reports from security researchers. A dedicated security contact and a published disclosure process, including a security.txt file at /.well-known/security.txt, will be activated once the security contact mailbox is confirmed.",
      "Until then, security reports can be submitted through the contact page with 'Security report' as the subject. Please do not include exploit details in the initial message; a secure channel will be arranged.",
    ],
  },
  {
    slug: "compliance",
    title: "Compliance",
    summary: "Frameworks Celestino supports for clients, and Celestino's own attestations.",
    status: "awaiting-client",
    body: [
      "Celestino provides compliance support for HIPAA, FINRA and SOX obligations as part of its managed IT, cybersecurity and advisory services. Compliance support means implementing controls and maintaining evidence; it is not a certification of the client or of Celestino.",
      "Celestino's own third-party attestations, if any, will be listed here with the issuing body and date once documentation is supplied. No certification is claimed on this site without that documentation.",
    ],
  },
  {
    slug: "certifications",
    title: "Certifications & partners",
    summary: "Professional certifications held by Celestino staff and verified technology partnerships.",
    status: "awaiting-client",
    body: [
      "Staff certifications and technology partnerships are published here with the issuing organization once verified. The existing Celestino website did not name specific certifications or partner programs, and none are claimed until documentation is provided.",
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    summary: "This site's accessibility commitment and how to report a barrier.",
    status: "published",
    body: [
      "This website is built to meet WCAG 2.2 Level AA. That includes semantic structure, keyboard operability of all navigation and forms, visible focus indicators, sufficient color contrast, descriptive labels and alternatives, and respect for reduced-motion preferences.",
      "Accessibility is verified with automated testing during development and manual keyboard and screen-reader review of key journeys. If you encounter a barrier, report it through the contact page and it will be treated as a defect.",
    ],
  },
  {
    slug: "security-advisories",
    title: "Security advisories",
    summary: "Notices affecting Celestino-operated services or this website.",
    status: "published",
    body: [
      "No advisories are currently published. When an advisory is issued, it will appear here with the affected service, impact, remediation status and date.",
    ],
  },
];

export function getTrustSection(slug: string): TrustSection | undefined {
  return trustSections.find((s) => s.slug === slug);
}
