import { SITE_URL, site } from "@/content/site";
import { services } from "@/content/services";
import { solutions } from "@/content/solutions";
import { industries } from "@/content/industries";
import { articles } from "@/content/articles";

/**
 * Optional, experimental convenience file for LLM-based tools. It is NOT a search
 * ranking signal and is not advertised as one. Content mirrors the public site exactly.
 */
export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `Location: ${site.address.addressLocality}, Virginia, United States. Service area: United States (remote-first, nationwide onsite support).`,
    `Compliance support: ${site.complianceSupport.value.join(", ")}. Claims on this site are limited to verified information; see ${SITE_URL}/trust.`,
    "",
    "## Services",
    ...services.map((s) => `- [${s.name}](${SITE_URL}/services/${s.slug}): ${s.shortDescription}`),
    "",
    "## Solutions",
    ...solutions.map((s) => `- [${s.name}](${SITE_URL}/solutions/${s.slug}): ${s.shortDescription}`),
    "",
    "## Industries",
    ...industries.map((i) => `- [${i.name}](${SITE_URL}/industries/${i.slug}): ${i.shortDescription}`),
    `- [Government & public sector capabilities](${SITE_URL}/government)`,
    "",
    "## Resources",
    ...articles.map((a) => `- [${a.title}](${SITE_URL}/resources/${a.slug}): ${a.description}`),
    "",
    "## Company",
    `- [About](${SITE_URL}/about)`,
    `- [Our approach](${SITE_URL}/approach)`,
    `- [Trust Center](${SITE_URL}/trust)`,
    `- [Contact](${SITE_URL}/contact)`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
