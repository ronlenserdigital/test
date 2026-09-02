import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Testimonial } from "@/components/ui/testimonial";
import { RelatedLinks } from "@/components/sections/related-links";
import { CTASection } from "@/components/ui/cta-section";
import { publishedCaseStudies, getCaseStudy } from "@/content/case-studies";
import { getIndustry } from "@/content/industries";
import { getService } from "@/content/services";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return publishedCaseStudies.map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) return {};
  return buildMetadata({ title: c.title, description: c.summary, path: `/case-studies/${slug}`, type: "article", publishedTime: c.publishedAt, image: "/resources/opengraph-image" });
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) notFound();
  const ind = getIndustry(c.industrySlug);
  const services = c.serviceSlugs.map(getService).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Case studies", href: "/case-studies" },
    { label: c.title, href: `/case-studies/${c.slug}` },
  ];
  const blocks: { label: string; body: string | string[] }[] = [
    { label: "Challenge", body: c.challenge },
    { label: "Environment", body: c.environment },
    { label: "Risk", body: c.risk },
    { label: "Solution", body: c.solution },
    { label: "Implementation", body: c.implementation },
    { label: "Outcome", body: c.outcome },
  ];
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/case-studies/${c.slug}`, title: c.title, description: c.summary, datePublished: c.publishedAt }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow={`Case study · ${ind?.name ?? ""}`} title={c.title} intro={c.summary} />
      <Section theme="light" spacing="default">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex max-w-[68ch] flex-col gap-10">
            {blocks.map((b) => (
              <section key={b.label} aria-labelledby={`cs-${b.label}`}>
                <h2 id={`cs-${b.label}`} className="text-2xl">{b.label}</h2>
                {Array.isArray(b.body) ? (
                  <ul className="mt-4 list-disc pl-5 text-fg-2">{b.body.map((x) => <li key={x} className="mt-1.5">{x}</li>)}</ul>
                ) : (
                  <p className="mt-4 text-md text-fg-2">{b.body}</p>
                )}
              </section>
            ))}
            {c.testimonial ? <Testimonial {...c.testimonial} /> : null}
          </div>
          <aside className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
            <div className="rounded-lg border border-line bg-surface-1 p-5">
              <p className="mono-label mb-2">Client</p>
              <p className="text-sm text-fg">{c.client}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-1 p-5">
              <p className="mono-label mb-2">Technology</p>
              <ul className="flex flex-wrap gap-1.5">{c.technology.map((t) => <li key={t} className="rounded-sm border border-line bg-surface-2 px-2 py-0.5 text-xs text-fg-2">{t}</li>)}</ul>
            </div>
          </aside>
        </Container>
      </Section>
      <RelatedLinks groups={[{ heading: "Services used", links: services.map((s) => ({ label: s.name, href: `/services/${s.slug}`, icon: s.icon })) }, ind ? { heading: "Industry", links: [{ label: ind.name, href: `/industries/${ind.slug}`, icon: ind.icon }] } : { heading: "", links: [] }]} theme="dark" />
      <CTASection />
    </>
  );
}
