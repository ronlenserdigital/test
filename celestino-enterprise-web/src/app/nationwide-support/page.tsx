import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { CTASection } from "@/components/ui/cta-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { FAQSection } from "@/components/sections/faq-section";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Nationwide Onsite & Remote IT Support";
const description =
  "Celestino delivers remote-first managed IT and security operations with emergency onsite support across the United States, from its base in Woodford, Virginia between Fredericksburg and Richmond.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/nationwide-support" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Nationwide support", href: "/nationwide-support" },
];

const faqs = [
  { question: "How is onsite support delivered outside Virginia?", answer: "Most work is resolved remotely. When hardware, cabling or connectivity requires a person on site, dispatch is arranged under the terms in your agreement, including travel windows and any per-visit costs, so there are no surprises during an outage." },
  { question: "What are the support hours?", answer: "Coverage is contracted per agreement, up to 24/7/365 for monitoring and response. Standard business-hours plans and extended-hours plans are both available." },
  { question: "Do you serve the Fredericksburg and Richmond areas onsite?", answer: "Yes. Celestino is based in Woodford, Virginia, on the I-95 corridor between Fredericksburg and Richmond, and serves Northern Virginia, Central Virginia and the surrounding counties onsite as a matter of course." },
];

export default function NationwideSupportPage() {
  const tiers = [
    { icon: "monitor" as const, title: "Remote operations", detail: "Monitoring, patching, help desk and administration are delivered remotely for every client, wherever they are." },
    { icon: "pin" as const, title: "Regional onsite", detail: "Fredericksburg, Richmond, Northern Virginia and the surrounding counties receive routine onsite visits and rapid dispatch." },
    { icon: "globe" as const, title: "Nationwide onsite", detail: "Emergency onsite response for hardware, connectivity and site events anywhere in the United States, under agreed terms." },
  ];
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/nationwide-support", title, description }), breadcrumbJsonLd(crumbs), faqJsonLd(faqs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Nationwide support"
        title="Remote-first operations. Onsite when it matters."
        intro={`From ${site.address.addressLocality}, Virginia, Celestino runs client environments across the United States. Most issues are resolved remotely within the ticket; when a person is needed on site, emergency onsite support is available nationwide.`}
      />
      <Section theme="light" spacing="default">
        <Container>
          <SectionHeading eyebrow="Coverage model" title="Three tiers of coverage, one service agreement." />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {tiers.map((t, i) => (
              <li key={t.title} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-1 p-6" data-reveal style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}>
                <Icon name={t.icon} size={22} className="text-accent" />
                <h3 className="text-lg">{t.title}</h3>
                <p className="text-sm text-fg-2">{t.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-[70ch] text-sm text-fg-muted">
            Contracted coverage hours, response targets and onsite terms are defined in each service agreement. Published support hours will appear here once confirmed.
          </p>
        </Container>
      </Section>
      <FAQSection faqs={faqs} theme="dark" />
      <RelatedLinks groups={[{ heading: "Services delivered nationwide", links: [{ label: "Managed IT Services", href: "/services/managed-it", icon: "server" }, { label: "Co-Managed IT", href: "/services/co-managed-it", icon: "users" }, { label: "Network Management", href: "/services/network-management", icon: "network" }] }, { heading: "Company", links: [{ label: "About", href: "/about", icon: "flag" }, { label: "Our approach", href: "/approach", icon: "compass" }, { label: "Contact", href: "/contact", icon: "mail" }] }]} />
      <CTASection />
    </>
  );
}
