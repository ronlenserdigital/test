import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { OperatingModelSection } from "@/components/sections/operating-model-section";
import { CTASection } from "@/components/ui/cta-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "About Celestino Enterprise";
const description =
  "Celestino Enterprise is a Virginia technology firm delivering managed IT, cybersecurity, recovery and application engineering with 31 years of engineering experience and onsite support across the United States.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/about" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

const principles = [
  { icon: "target" as const, title: "One team, whole environment", detail: "Security, operations, recovery and engineering are delivered by the same people. Findings do not fall between vendors." },
  { icon: "document" as const, title: "Evidence over assurance", detail: "Every stage of an engagement produces something an auditor, insurer or board can read. We do not ask clients to take our word for it." },
  { icon: "shield-check" as const, title: "Claims we can defend", detail: "Certifications, partnerships and customer references appear on this site only when documented. Where we lack proof, we say so." },
  { icon: "activity" as const, title: "Operations first", detail: "Patches on schedule, backups tested, alerts owned. The unglamorous discipline is the product." },
];

export default function AboutPage() {
  const people = site.people.filter((p) => p.verified);
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/about", title, description, type: "AboutPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="About"
        title="Engineers who run infrastructure, secure it, and build on it."
        intro={`Celestino Enterprise is a technology services firm based in ${site.address.addressLocality}, Virginia. The team brings ${site.experienceYears.value} years of experience across infrastructure operations, cybersecurity and compliance support, and full-stack software engineering, delivered to organizations across the United States.`}
      />
      <Section theme="light" spacing="default">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <SectionHeading eyebrow="What we stand behind" title="Four commitments that shape every engagement." />
          <ul className="grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <li key={p.title} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-1 p-6">
                <Icon name={p.icon} size={22} className="text-accent" />
                <h3 className="text-lg">{p.title}</h3>
                <p className="text-sm text-fg-2">{p.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <Section theme="dark" spacing="default" className="hairline-t">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Company facts" title="What is verified, and what is on request." lede="Facts published here are limited to what Celestino has confirmed in writing. This is deliberate for a firm that sells trust." />
          </div>
          <dl className="divide-y divide-line rounded-lg border border-line bg-surface-1">
            {[
              { k: "Location", v: `${site.address.addressLocality}, Virginia (Fredericksburg–Richmond corridor)` },
              { k: "Service area", v: "Remote-first across the United States; nationwide onsite response" },
              { k: "Experience", v: `${site.experienceYears.value} years of IT engineering experience` },
              { k: "Compliance support", v: site.complianceSupport.value.join(", ") },
              { k: "Support model", v: `${site.support.proactiveSupport.value}; emergency onsite support` },
              { k: "Leadership", v: people.length ? people.map((p) => `${p.name}, ${p.role}`).join("; ") : "Profiles published on confirmation" },
              { k: "Certifications & partners", v: site.certifications.some((c) => c.verified) ? site.certifications.filter((c) => c.verified).map((c) => c.name).join(", ") : "Listed in the Trust Center as verified" },
            ].map((row) => (
              <div key={row.k} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <dt className="mono-label">{row.k}</dt>
                <dd className="text-sm text-fg">{row.v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>
      <OperatingModelSection />
      <RelatedLinks groups={[{ heading: "Why Celestino", links: [{ label: "Our approach", href: "/approach", icon: "compass" }, { label: "Nationwide support", href: "/nationwide-support", icon: "globe" }, { label: "Trust Center", href: "/trust", icon: "shield-check" }, { label: "Government & public sector", href: "/government", icon: "building" }] }, { heading: "Start here", links: [{ label: "Services", href: "/services", icon: "server" }, { label: "Solutions", href: "/solutions", icon: "layers" }, { label: "Resources", href: "/resources", icon: "document" }] }]} theme="light" />
      <CTASection />
    </>
  );
}
