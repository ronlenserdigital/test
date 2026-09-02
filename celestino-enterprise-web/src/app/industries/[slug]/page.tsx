import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { FAQSection } from "@/components/sections/faq-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { CTASection } from "@/components/ui/cta-section";
import { industries, getIndustry } from "@/content/industries";
import { getSolution } from "@/content/solutions";
import { getService } from "@/content/services";
import { getArticle } from "@/content/articles";
import { publishedCaseStudies } from "@/content/case-studies";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return {};
  return buildMetadata({ title: ind.seo.title, description: ind.seo.description, path: `/industries/${slug}` });
}

export default async function IndustryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Industries", href: "/industries" },
    { label: ind.name, href: `/industries/${ind.slug}` },
  ];
  const solutions = ind.solutionSlugs.map(getSolution).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const services = ind.serviceSlugs.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const articles = ind.articleSlugs.map(getArticle).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const cases = publishedCaseStudies.filter((c) => c.industrySlug === ind.slug);

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/industries/${ind.slug}`, title: ind.seo.title, description: ind.seo.description }), breadcrumbJsonLd(crumbs), faqJsonLd(ind.faqs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow={`Industry · ${ind.hero.eyebrow}`}
        title={ind.hero.headline}
        intro={ind.hero.intro}
        actions={[
          { label: "Request an assessment", href: `/contact?intent=assessment&industry=${ind.slug}`, event: "service_cta_click" },
          { label: "Talk to an engineer", href: `/contact?intent=expert&industry=${ind.slug}`, variant: "secondary", event: "service_cta_click" },
        ]}
        aside={
          <div className="rounded-lg border border-line bg-surface-1 p-6">
            <p className="mono-label mb-4">Regulatory environment</p>
            <ul className="flex flex-col divide-y divide-line">
              {ind.regulatory.map((r) => (
                <li key={r.name} className="py-3">
                  <p className="text-sm font-semibold text-fg">{r.name}</p>
                  <p className="mt-0.5 text-xs text-fg-2">{r.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section theme="light" spacing="default">
        <Container>
          <SectionHeading eyebrow="Sector challenges" title={`Where ${ind.name.toLowerCase()} organizations carry operational risk`} />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ind.challenges.map((c, i) => (
              <li key={c.title} className="flex flex-col gap-2 rounded-lg border border-line bg-surface-1 p-6" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 60}ms` }}>
                <span className="font-mono text-xs tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-lg">{c.title}</h3>
                <p className="text-sm text-fg-2">{c.detail}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section theme="dark" spacing="default" grid className="hairline-t">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Relevant solutions" title="Outcomes this sector buys" />
            <ul className="mt-8 flex flex-col divide-y divide-line border-y border-line">
              {solutions.map((s) => (
                <li key={s.slug}>
                  <Link href={`/solutions/${s.slug}`} className="group flex items-start gap-3 py-4 hover:text-accent">
                    <Icon name={s.icon} size={18} className="mt-0.5 text-accent" />
                    <span className="flex flex-col">
                      <span className="font-medium text-fg group-hover:text-accent">{s.name}</span>
                      <span className="text-sm text-fg-2">{s.shortDescription}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Related services" title="Services that deliver them" />
            <ul className="mt-8 flex flex-col divide-y divide-line border-y border-line">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="group flex items-start gap-3 py-4 hover:text-accent">
                    <Icon name={s.icon} size={18} className="mt-0.5 text-accent" />
                    <span className="flex flex-col">
                      <span className="font-medium text-fg group-hover:text-accent">{s.name}</span>
                      <span className="text-sm text-fg-2">{s.shortDescription}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {cases.length ? (
        <Section theme="light" spacing="default" className="hairline-t">
          <Container>
            <SectionHeading eyebrow="Case studies" title={`${ind.name} engagements`} />
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {cases.map((c) => (
                <li key={c.slug}>
                  <Link href={`/case-studies/${c.slug}`} className="block rounded-lg border border-line bg-surface-1 p-6 hover:border-accent">
                    <span className="font-display text-lg font-semibold text-fg">{c.title}</span>
                    <p className="mt-2 text-sm text-fg-2">{c.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <FAQSection faqs={ind.faqs} title={`${ind.name}: questions buyers ask`} />
      <RelatedLinks
        groups={[
          { heading: "Guides for this sector", links: articles.map((a) => ({ label: a.title, href: `/resources/${a.slug}`, description: `${a.readingMinutes} min read` })) },
          { heading: "Other industries", links: industries.filter((x) => x.slug !== ind.slug).map((x) => ({ label: x.name, href: `/industries/${x.slug}`, icon: x.icon })) },
          ind.slug === "government-public-sector"
            ? { heading: "Public sector", links: [{ label: "Government capabilities & procurement", href: "/government", icon: "building" as const }] }
            : { heading: "Trust", links: [{ label: "Trust Center", href: "/trust", icon: "shield-check" as const }, { label: "Data handling", href: "/trust/data-handling", icon: "lock" as const }] },
        ]}
      />
      <CTASection />
    </>
  );
}
