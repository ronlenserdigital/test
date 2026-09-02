import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { IndustriesList } from "@/components/sections/industries-list";
import { GovernmentBand } from "@/components/sections/government-band";
import { CTASection } from "@/components/ui/cta-section";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Industries Served";
const description =
  "Celestino Enterprise serves government and public-sector bodies, healthcare, financial services, professional services and SMB/mid-market organizations with sector-specific controls, evidence and recovery objectives.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/industries" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Industries", href: "/industries" },
];

export default function IndustriesPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/industries", title, description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Industries"
        title="The regulator decides the controls. The sector decides the recovery window."
        intro="Each industry page maps the regulatory environment, the operational risks and the recovery expectations of that sector to the services and evidence that satisfy them."
      />
      <IndustriesList />
      <GovernmentBand />
      <CTASection />
    </>
  );
}
