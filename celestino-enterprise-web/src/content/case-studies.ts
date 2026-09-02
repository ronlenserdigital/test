import type { CaseStudy } from "./types";

/**
 * Case studies are published ONLY when `verified: true`, meaning the client has confirmed
 * the engagement details and has permission to name (or anonymize) the customer.
 *
 * The existing site references portfolio items ("Phenom Nation", "Aerogin USA") without
 * verifiable detail. They are NOT converted into case studies. See
 * docs/client-information-required.md for the intake template.
 */
export const caseStudies: CaseStudy[] = [];

export const publishedCaseStudies = caseStudies.filter((c) => c.verified);

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return publishedCaseStudies.find((c) => c.slug === slug);
}
