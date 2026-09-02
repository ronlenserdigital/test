import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/icons/icon";
import { solutions } from "@/content/solutions";
import { getService } from "@/content/services";
import { CTASection } from "@/components/ui/cta-section";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Solutions by Outcome";
const description =
  "Celestino solutions organized by the outcome you need: cyber resilience, infrastructure modernization, business continuity, cloud security, secure application engineering and IT operational resilience.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/solutions" });

const crumbs = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/solutions" },
];

export default function SolutionsPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/solutions", title, description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Solutions"
        title="Start from the outcome. The services follow."
        intro="Buyers rarely shop for a service; they have a problem with a deadline. Each solution combines the services that solve it, in the order that works."
      />
      <Section theme="light" spacing="default">
        <Container>
          <ul className="grid gap-5 md:grid-cols-2">
            {solutions.map((s, i) => {
              const svc = s.serviceSlugs.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
              return (
                <li key={s.slug} data-reveal style={{ ["--reveal-delay" as string]: `${(i % 2) * 60}ms` }}>
                  <Link href={`/solutions/${s.slug}`} className="group flex h-full flex-col rounded-lg border border-line bg-surface-1 p-7 transition-colors duration-[var(--duration-base)] hover:border-accent">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-2 text-accent">
                        <Icon name={s.icon} size={20} />
                      </span>
                      <span className="mono-label">Solution</span>
                    </div>
                    <h2 className="mt-6 text-2xl group-hover:text-accent">{s.name}</h2>
                    <p className="mt-3 flex-1 text-fg-2">{s.shortDescription}</p>
                    <p className="mt-6 flex flex-wrap gap-1.5">
                      {svc.map((x) => (
                        <span key={x.slug} className="rounded-sm border border-line bg-surface-2 px-2 py-0.5 text-xs text-fg-2">
                          {x.navLabel}
                        </span>
                      ))}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>
      <CTASection />
    </>
  );
}
