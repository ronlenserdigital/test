/**
 * Permanent redirects from the legacy site. Source of truth: docs/seo/url-migration-map.csv.
 * Only rows with redirect_required=yes are listed. Each maps to the closest relevant
 * page, never blanket to the homepage. Keep these in place long term.
 */
type Redirect = { source: string; destination: string; permanent: boolean };

const map: Array<[string, string]> = [
  ["/home", "/"],
  ["/index.html", "/"],
  ["/index.php", "/"],
  ["/services", "/services"],
  ["/it-solutions", "/services"],
  ["/it-support", "/services/managed-it"],
  ["/business-it-support", "/services/managed-it"],
  ["/managed-it", "/services/managed-it"],
  ["/managed-it-services", "/services/managed-it"],
  ["/co-managed-it", "/services/co-managed-it"],
  ["/co-managed-it-services", "/services/co-managed-it"],
  ["/cybersecurity", "/services/cybersecurity"],
  ["/cyber-security", "/services/cybersecurity"],
  ["/compliance", "/services/security-risk-advisory"],
  ["/consultancy", "/services/security-risk-advisory"],
  ["/consulting", "/services/security-risk-advisory"],
  ["/advisory-services", "/services/security-risk-advisory"],
  ["/cloud", "/services/cloud-infrastructure"],
  ["/cloud-services", "/services/cloud-infrastructure"],
  ["/cloud-consulting", "/services/cloud-infrastructure"],
  ["/network-services", "/services/network-management"],
  ["/telecom", "/services/network-management"],
  ["/disaster-recovery", "/services/backup-disaster-recovery"],
  ["/backup", "/services/backup-disaster-recovery"],
  ["/web-development", "/services/web-application-engineering"],
  ["/website-development", "/services/web-application-engineering"],
  ["/ecommerce", "/services/web-application-engineering"],
  ["/ecommerce-development", "/services/web-application-engineering"],
  ["/cms", "/services/web-application-engineering"],
  ["/cms-development", "/services/web-application-engineering"],
  ["/web-integration", "/services/software-development"],
  ["/integration", "/services/software-development"],
  ["/integration-services", "/services/software-development"],
  ["/web-app-development", "/services/software-development"],
  ["/mobile-app-development", "/services/software-development"],
  ["/software-development", "/services/software-development"],
  ["/full-stack-development", "/services/software-development"],
  ["/enterprise-solutions", "/services/software-development"],
  ["/design-animation", "/services/web-application-engineering"],
  ["/ai", "/services/ai-automation"],
  ["/chatbot", "/services/ai-automation"],
  ["/ai-chatbot", "/services/ai-automation"],
  ["/about", "/about"],
  ["/about-us", "/about"],
  ["/company", "/about"],
  ["/contact", "/contact"],
  ["/contact-us", "/contact"],
  ["/portfolio", "/case-studies"],
  ["/our-work", "/case-studies"],
  ["/projects", "/case-studies"],
  ["/blog", "/resources"],
  ["/news", "/resources"],
  ["/insights", "/resources"],
  ["/privacy-policy", "/privacy"],
  ["/terms-of-service", "/terms"],
  ["/terms-and-conditions", "/terms"],
];

export const redirects: Redirect[] = map
  .filter(([from, to]) => from !== to)
  .map(([from, to]) => ({ source: from, destination: to, permanent: true }));
// Trailing-slash variants (e.g. /home/) are normalized by Next.js before matching.
