import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { FAQSection } from "@/components/sections/faq-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { CTASection } from "@/components/ui/cta-section";
import { services, getService, pillars } from "@/content/services";
import { getSolution } from "@/content/solutions";
import { getIndustry } from "@/content/industries";
import { getArticle } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, graph, serviceJsonLd, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return buildMetadata({ title: service.seo.title, description: service.seo.description, path: `/services/${slug}` });
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const pillar = pillars.find((p) => p.id === service.pillar);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: service.name, href: `/services/${service.slug}` },
  ];
  const related = service.relatedServiceSlugs.map(getService).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const solutions = service.relatedSolutionSlugs.map(getSolution).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const industries = service.relatedIndustrySlugs.map(getIndustry).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const articles = service.relatedArticleSlugs.map(getArticle).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <JsonLd
        data={graph(
          webPageJsonLd({ path: `/services/${service.slug}`, title: service.seo.title, description: service.seo.description }),
          breadcrumbJsonLd(crumbs),
          serviceJsonLd(service),
          faqJsonLd(service.faqs),
        )}
      />
      <PageHero
        crumbs={crumbs}
        eyebrow={`${pillar?.label ?? "Service"} · ${service.hero.eyebrow}`}
        title={service.hero.headline}
        intro={service.hero.intro}
        actions={[
          { label: "Request an assessment", href: `/contact?intent=assessment&service=${service.slug}`, event: "service_cta_click" },
          { label: "Talk to an engineer", href: `/contact?intent=expert&service=${service.slug}`, variant: "secondary", event: "service_cta_click" },
        ]}
        aside={
          <div className="rounded-lg border border-line bg-surface-1 p-6">
            <p className="mono-label mb-4">Who this is for</p>
            <ul className="flex flex-col gap-3">
              {service.fit.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-fg-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section theme="light" spacing="default">
        <Container>
          <SectionHeading eyebrow="Capabilities" title={`What ${service.name.toLowerCase()} includes`} />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.capabilities.map((c, i) => (
              <li key={c.title} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-1 p-6" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 60}ms` }}>
                <span className="font-mono text-xs tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-lg">{c.title}</h3>
                <p className="text-sm text-fg-2">{c.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section theme="dark" spacing="default" grid className="hairline-t">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="How the engagement works" title="In sequence, with evidence at each step." />
            <ol className="mt-10 relative flex flex-col gap-0 border-l border-line pl-8">
              {service.engagement.map((e, i) => (
                <li key={e.step} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[2.35rem] top-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-bg font-mono text-[11px] text-accent">
                    {i + 1}
                  </span>
                  <h3 className="text-lg">{e.step}</h3>
                  <p className="mt-1 text-sm text-fg-2">{e.detail}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeading eyebrow="Outcomes" title="What changes for your organization." />
            <ul className="mt-10 flex flex-col divide-y divide-line border-y border-line">
              {service.outcomes.map((o) => (
                <li key={o} className="flex gap-3 py-4 text-fg-2">
                  <Icon name="arrow-right" size={18} className="mt-0.5 shrink-0 text-accent-2" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <FAQSection faqs={service.faqs} title={`${service.name}: questions buyers ask`} />

      <RelatedLinks
        groups={[
          { heading: "Related services", links: related.map((s) => ({ label: s.name, href: `/services/${s.slug}`, icon: s.icon })) },
          { heading: "Solutions", links: solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}`, icon: s.icon })) },
          { heading: "Industries", links: industries.map((i) => ({ label: i.name, href: `/industries/${i.slug}`, icon: i.icon })) },
          { heading: "Guides", links: articles.map((a) => ({ label: a.title, href: `/resources/${a.slug}`, description: `${a.readingMinutes} min read` })) },
        ]}
      />
      <CTASection />
    </>
  );
}
