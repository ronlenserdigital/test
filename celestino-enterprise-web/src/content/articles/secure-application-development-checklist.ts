import type { Article } from "../types";

export const article: Article = {
  slug: "secure-application-development-checklist",
  title: "Secure Application Development Checklist for Custom Web and Mobile Projects",
  description:
    "A practical checklist for building secure custom web and mobile applications: threat modeling, authentication and session management, input validation, secrets, dependencies, security headers and CSP, logging, deployment and post-launch ownership, with reference to OWASP Top 10 and ASVS.",
  category: "software-engineering",
  type: "checklist",
  authorId: "celestino-engineering",
  publishedAt: "2026-08-06",
  reviewedAt: "2026-08-30",
  readingMinutes: 13,
  summary:
    "A secure custom application is produced by a small number of practices applied consistently from design through operation: threat modeling before code, a proven identity and session layer rather than a hand-built one, validation and encoding at every trust boundary, secrets kept out of code and configuration files, dependencies inventoried and patched, defensive HTTP headers with a content security policy, logging that supports investigation without leaking data, a hardened deployment pipeline, and a named owner for security after launch. The OWASP Top 10 describes the failures to avoid and the OWASP Application Security Verification Standard describes what to verify; this checklist sequences both into the phases of a real project.",
  sections: [
    {
      id: "how-to-use-this-checklist",
      heading: "How to use this checklist",
      body: [
        "This checklist is organized by project phase rather than by vulnerability class, because that is how development work is actually scheduled. Each item states what should be true and, where useful, how to verify it. The items reference the OWASP Top 10, which catalogs the most common and impactful web application risks, and the OWASP Application Security Verification Standard (ASVS), which defines verifiable requirements at three levels. For most business applications, ASVS Level 2 is the appropriate target; applications handling regulated data or high-value transactions should consider Level 3 for their most sensitive components.",
        "Use the checklist at three points: when scoping a project, to make security requirements explicit in the statement of work; during development, as acceptance criteria for each phase; and at launch and afterward, as the basis for the security review and the operating agreement. Celestino's [secure application engineering](/solutions/secure-application-engineering) practice applies this structure to every custom build.",
        "The checklist assumes a modern stack: a web or mobile front end, an API layer, a managed database and cloud hosting. Adjust for other architectures, but keep the phases and the ownership model.",
      ],
    },
    {
      id: "before-code-threat-modeling",
      heading: "Before code: threat modeling and requirements",
      body: [
        "Threat modeling is the practice of examining a system design to identify what could go wrong before building it. It is the highest-leverage security activity in a project because design flaws are far more expensive to fix after release than implementation bugs. A lightweight session of two to three hours with the architect, the lead developer and the product owner is sufficient for most business applications.",
      ],
      list: [
        "Draw the system: components, data stores, external services, users and administrators, and every trust boundary between them, including the boundary between the mobile client and the API.",
        "Classify the data the application handles, identify regulated classes such as health, financial and personal data, and record where each class is stored, processed and transmitted.",
        "For each component and boundary, ask what an attacker could do with spoofed identity, tampered data, repudiated actions, disclosed information, denied service or elevated privilege, and record the threats that matter.",
        "Decide which threats are mitigated by design, which by controls in later phases, and which are accepted, and record the decisions where the team will see them.",
        "Translate the results into security requirements in the backlog with acceptance criteria, and select the ASVS level and the specific ASVS chapters that apply.",
        "Define the abuse cases: the business logic misuse specific to this application, such as coupon stacking, rate manipulation or access to another tenant's records, because generic scanners never find these.",
      ],
    },
    {
      id: "authentication-and-session-management",
      heading: "Authentication, authorization and session management",
      body: [
        "Broken access control and identification and authentication failures are among the most common categories in the OWASP Top 10, and nearly all of them come from building identity logic by hand. Use a proven identity provider or a well-maintained framework component and configure it correctly.",
      ],
      list: [
        "Delegate authentication to a standards-based identity provider using OpenID Connect or SAML, supporting multi-factor authentication, and never store passwords unless there is no alternative; if you must, use a modern adaptive hashing algorithm with per-user salts.",
        "Enforce authorization on the server for every request, at the object level, not only the route level, so that a user cannot access another user's or another tenant's records by changing an identifier.",
        "Implement role-based or attribute-based access control with deny by default, and centralize the policy so that authorization decisions are made in one place and can be tested.",
        "Use framework session management with secure, HttpOnly, SameSite cookies or short-lived tokens with refresh rotation; regenerate session identifiers on login and privilege change; and provide server-side logout and session revocation.",
        "Protect authentication endpoints with rate limiting, account lockout or progressive delay, and monitoring for credential stuffing.",
        "For mobile clients, store tokens in the platform's secure storage, pin or validate certificates for the API, and never embed long-lived credentials in the application package.",
      ],
    },
    {
      id: "input-validation-and-output-encoding",
      heading: "Input validation, output encoding and data handling",
      body: [
        "Injection, including SQL, NoSQL, command and template injection, and cross-site scripting remain in the OWASP Top 10 because they remain common. The defense is mechanical: treat every input as untrusted, validate it against what is expected, and encode output for the context in which it is rendered.",
      ],
      list: [
        "Validate all input on the server against a positive schema (type, length, range, format), regardless of client-side validation, and reject rather than sanitize where possible.",
        "Use parameterized queries or an ORM for every database access, and never construct queries, shell commands or templates by string concatenation with user input.",
        "Encode output for its context: HTML body, HTML attribute, JavaScript, URL and CSS each require different encoding, and modern frameworks handle this by default only if you do not bypass their templating.",
        "Validate and constrain file uploads by type, size and content, store them outside the web root or in object storage with generated names, and serve them through a controlled path.",
        "Protect against server-side request forgery by validating and allow-listing any URL the server will fetch on behalf of a user.",
        "Encrypt sensitive data at rest using the platform's managed encryption, enforce TLS 1.2 or higher for all transport, and minimize the sensitive data collected and retained in the first place.",
      ],
    },
    {
      id: "secrets-configuration-and-dependencies",
      heading: "Secrets, configuration and dependencies",
      body: [
        "Security misconfiguration and vulnerable and outdated components are two OWASP Top 10 categories that are almost entirely preventable with tooling and discipline. Secrets in source control and unpatched libraries are the most frequent findings in application security reviews of small and mid-sized development teams.",
      ],
      list: [
        "Keep secrets out of code, configuration files and container images; load them at runtime from a secrets manager or the platform's managed identity, and rotate them on a schedule and on personnel change.",
        "Scan the repository history for committed secrets and treat any found as compromised.",
        "Maintain a software bill of materials for every build, run dependency vulnerability scanning in the pipeline, and set a policy for how quickly critical and high findings are patched.",
        "Pin dependency versions, use lockfiles, and pull packages from a controlled registry or with integrity verification to reduce supply-chain exposure.",
        "Separate configuration by environment, disable debug features, verbose errors and default accounts in production, and remove unused features, routes and sample code.",
        "Harden the runtime: run as a non-root user, restrict file system and network access to what the application needs, and apply the platform's baseline for containers or serverless functions.",
      ],
    },
    {
      id: "security-headers-and-content-security-policy",
      heading: "Security headers and content security policy",
      body: [
        "HTTP security headers instruct the browser to enforce protections that the application cannot enforce on its own. They are cheap, effective and frequently missing. A content security policy (CSP) in particular is one of the strongest mitigations against cross-site scripting, and it is best introduced at the start of a project rather than retrofitted onto an application full of inline scripts.",
      ],
      list: [
        "Strict-Transport-Security with a long max-age and includeSubDomains, after confirming all subdomains serve HTTPS.",
        "Content-Security-Policy that restricts script, style, image, font, frame and connection sources to known origins, uses nonces or hashes for necessary inline scripts, and reports violations to an endpoint you monitor; start in report-only mode and move to enforcement before launch.",
        "X-Content-Type-Options set to nosniff, X-Frame-Options or the CSP frame-ancestors directive to prevent clickjacking, and a Referrer-Policy that limits leakage of URLs.",
        "Permissions-Policy to disable browser features the application does not use, such as camera, microphone and geolocation.",
        "Cross-origin resource sharing configured with an explicit allow list of origins, never a wildcard with credentials.",
        "Cache-Control set to prevent caching of authenticated and sensitive responses.",
      ],
    },
    {
      id: "logging-and-monitoring",
      heading: "Logging, monitoring and error handling",
      body: [
        "Security logging and monitoring failures are an OWASP Top 10 category because breaches are routinely discovered months late, by third parties, in applications that logged nothing useful. The application should produce logs that allow an investigator to reconstruct who did what and when, without recording data that would itself become a breach if the logs were exposed.",
      ],
      list: [
        "Log authentication events (success, failure, lockout, MFA challenge), authorization failures, administrative actions, data exports and changes to sensitive records, with timestamp, user identifier, source address and request identifier.",
        "Never log passwords, tokens, session identifiers, full payment card numbers, health data or other sensitive fields; mask or omit them at the logging layer.",
        "Ship logs to a central platform with retention of at least twelve months, protected from modification by the application's own credentials.",
        "Define alerts for patterns that indicate attack: bursts of authentication failures, authorization failures across many records, unusual export volumes and CSP violation spikes.",
        "Return generic error messages to users and record detailed errors server-side; stack traces and database errors in responses are information disclosure.",
        "Integrate application alerts with the operational monitoring and incident response process so that someone is accountable for acting on them.",
      ],
    },
    {
      id: "deployment-pipeline-and-release",
      heading: "Deployment pipeline and release",
      body: [
        "The pipeline is part of the application's attack surface and part of its defense. A pipeline that runs security checks on every change catches most implementation issues before they reach production; a pipeline with weak access control is a path for an attacker to ship code under your name.",
      ],
      list: [
        "Protect the main branch with required reviews and passing checks, and require MFA and least-privilege access for the source repository, the pipeline and the cloud accounts.",
        "Run static analysis, dependency scanning, secret scanning and infrastructure-as-code scanning on every pull request, and block merges on critical findings.",
        "Run dynamic testing against a staging environment before release, and commission a manual penetration test for the initial launch and after significant changes.",
        "Deploy from immutable, versioned artifacts built once and promoted through environments, with infrastructure defined as code and reviewed like application code.",
        "Use the platform's managed identity for pipeline access to cloud resources rather than long-lived keys, and scope those identities to the minimum required.",
        "Maintain a tested rollback path and a documented release checklist that includes verifying headers, CSP enforcement, TLS configuration and that debug features are disabled in production.",
      ],
    },
    {
      id: "post-launch-ownership",
      heading: "Post-launch ownership",
      body: [
        "Most application security failures happen after launch, when the project team has moved on and nobody is responsible for patching, monitoring or reviewing access. The project is not complete until ownership of the running application is assigned and funded.",
        "The operating agreement should name who monitors alerts and on what schedule, who patches dependencies and the runtime and within what timeframe, who reviews access to the application, the repository and the cloud account, who responds to a vulnerability report from a researcher or customer, and who re-runs the security review when features change. It should also include a data retention and deletion schedule, so that the application does not accumulate sensitive data it no longer needs.",
        "For organizations without an internal engineering function, this ownership is typically contracted to the firm that built the application or to a managed provider. Celestino's [web application engineering](/services/web-application-engineering) and [software development](/services/software-development) engagements include this operating phase because an unowned application becomes a liability within a year.",
      ],
      table: {
        headers: ["Ownership item", "Cadence", "Evidence"],
        rows: [
          ["Dependency and runtime patching", "Critical within days, others monthly", "Scan reports, change records"],
          ["Alert monitoring and triage", "Continuous, reviewed weekly", "Alert log, triage notes"],
          ["Access review (app, repo, cloud)", "Quarterly", "Signed review record"],
          ["Secret rotation", "Scheduled and on personnel change", "Rotation log"],
          ["Security regression review", "Every significant release", "Review checklist"],
          ["Penetration test", "Annually and after major change", "Test report and remediation record"],
          ["Data retention enforcement", "Per schedule", "Deletion job records"],
          ["Vulnerability disclosure handling", "As received, acknowledged within days", "Disclosure log"],
        ],
      },
    },
  ],
  keyTakeaways: [
    "Threat model before writing code; design flaws are the most expensive class of vulnerability to fix later.",
    "Use a standards-based identity provider and framework session management; enforce authorization on the server at the object level for every request.",
    "Validate input against positive schemas, parameterize every query and encode output for its context; these three practices eliminate most injection and scripting flaws.",
    "Keep secrets in a secrets manager, inventory and scan dependencies on every build, and harden production configuration.",
    "Ship defensive headers and an enforced content security policy, and log security events centrally without recording sensitive data.",
    "Assign and fund post-launch ownership for patching, monitoring, access review and vulnerability response before the project is considered complete.",
  ],
  references: [
    { label: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" },
    { label: "OWASP Application Security Verification Standard", url: "https://owasp.org/www-project-application-security-verification-standard/" },
    { label: "OWASP Cheat Sheet Series", url: "https://cheatsheetseries.owasp.org/" },
    { label: "NIST SP 800-218, Secure Software Development Framework", url: "https://csrc.nist.gov/pubs/sp/800/218/final" },
  ],
  relatedServiceSlugs: ["software-development", "web-application-engineering", "cybersecurity"],
  relatedArticleSlugs: ["cyber-resilience-readiness-checklist", "nist-csf-implementation-guide-smb", "cloud-vs-hybrid-infrastructure"],
};
