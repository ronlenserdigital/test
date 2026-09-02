import type { Metadata } from "next";
import { HomeHero } from "@/components/sections/home-hero";
import { TrustLayer } from "@/components/sections/trust-layer";
import { Capabilities } from "@/components/sections/capabilities";
import { OperatingModelSection } from "@/components/sections/operating-model-section";
import { IndustriesList } from "@/components/sections/industries-list";
import { GovernmentBand } from "@/components/sections/government-band";
import { ResourcesPreview } from "@/components/sections/resources-preview";
import { CTASection } from "@/components/ui/cta-section";
import { articles } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { graph, webPageJsonLd } from "@/lib/seo/json-ld";
import { site } from "@/content/site";

const title = `${site.name} | Managed IT, Cybersecurity & Secure Engineering`;
const description =
  "Managed IT, cybersecurity and compliance support, cloud and infrastructure, backup and disaster recovery, and secure application engineering for mid-sized and regulated organizations. Based in Woodford, Virginia with onsite support across the US.";

export const metadata: Metadata = {
  ...buildMetadata({ title, description, path: "/" }),
  title: { absolute: title },
};

export default function HomePage() {
  const featured = ["cyber-resilience-readiness-checklist", "managed-it-vs-co-managed-it", "backup-vs-disaster-recovery", "nist-csf-implementation-guide-smb", "hipaa-cybersecurity-considerations"]
    .map((slug) => articles.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/", title, description }))} />
      <HomeHero />
      <TrustLayer />
      <Capabilities />
      <OperatingModelSection />
      <IndustriesList />
      <GovernmentBand />
      <ResourcesPreview articles={featured} />
      <CTASection eventPrefix="service" />
    </>
  );
}
