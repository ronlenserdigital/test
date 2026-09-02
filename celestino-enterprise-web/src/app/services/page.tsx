import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/icons/icon";
import { pillars, getServicesByPillar } from "@/content/services";
import { OperatingModelSection } from "@/components/sections/operating-model-section";
import { CTASection } from "@/components/ui/cta-section";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "IT & Cybersecurity Services";
const description =
  "Celestino Enterprise services: managed and co-managed IT, cybersecurity, security and risk advisory, cloud and infrastructure, network management, backup and disaster recovery, and software, web and AI engineering.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/services" });

const crumbs = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/services", title, description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Services"
        title="Ten services. Five capability groups. One team accountable for all of it."
        intro="Each service below is delivered by the same engineers who run the rest of your environment, under one change process and one set of reports."
        actions={[
          { label: "Request an assessment", href: "/contact?intent=assessment", event: "service_cta_click" },
          { label: "Talk to an engineer", href: "/contact?intent=expert", variant: "secondary" },
        ]}
      />
      <Section theme="light" spacing="default">
        <Container className="flex flex-col gap-16">
          {pillars.map((p, i) => {
            const services = getServicesByPillar(p);
            return (
              <div key={p.id} className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" id={p.id}>
                <div className="flex flex-col gap-4">
                  <p className="eyebrow">
                    {String(i + 1).padStart(2, "0")} · {p.label}
                  </p>
                  <h2 className="text-2xl">{p.title}</h2>
                  <p className="font-medium text-fg">{p.outcome}</p>
                  <p className="measure text-fg-2">{p.description}</p>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/services/${s.slug}`} className="group flex h-full flex-col rounded-lg border border-line bg-surface-1 p-6 transition-colors duration-[var(--duration-base)] hover:border-accent">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-accent">
                          <Icon name={s.icon} size={18} />
                        </span>
                        <h3 className="mt-5 text-lg group-hover:text-accent">{s.name}</h3>
                        <p className="mt-2 flex-1 text-sm text-fg-2">{s.shortDescription}</p>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                          Service details
                          <Icon name="arrow-right" size={16} className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Container>
      </Section>
      <OperatingModelSection />
      <CTASection />
    </>
  );
}
