import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { FAQSection } from "@/components/sections/faq-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { CTASection } from "@/components/ui/cta-section";
import { solutions, getSolution } from "@/content/solutions";
import { getService } from "@/content/services";
import { getIndustry } from "@/content/industries";
import { getArticle } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";
import Link from "next/link";
import { Icon } from "@/components/icons/icon";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return solutions.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSolution(slug);
  if (!s) return {};
  return buildMetadata({ title: s.seo.title, description: s.seo.description, path: `/solutions/${slug}` });
}

export default async function SolutionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const s = getSolution(slug);
  if (!s) notFound();
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: s.name, href: `/solutions/${s.slug}` },
  ];
  const services = s.serviceSlugs.map(getService).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const industries = s.industrySlugs.map(getIndustry).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const articles = s.articleSlugs.map(getArticle).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/solutions/${s.slug}`, title: s.seo.title, description: s.seo.description }), breadcrumbJsonLd(crumbs), faqJsonLd(s.faqs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow={`${s.hero.eyebrow} · ${s.name}`}
        title={s.hero.headline}
        intro={s.hero.intro}
        actions={[
          { label: "Request an assessment", href: `/contact?intent=assessment&solution=${s.slug}`, event: "service_cta_click" },
          { label: "Talk to an engineer", href: `/contact?intent=expert&solution=${s.slug}`, variant: "secondary", event: "service_cta_click" },
        ]}
      />
      <Section theme="light" spacing="default">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <SectionHeading eyebrow="The problem" title="What usually goes wrong" />
            <p className="mt-6 measure text-md text-fg-2">{s.problem}</p>
          </div>
          <div>
            <p className="mono-label mb-6">The approach</p>
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {s.approach.map((a, i) => (
                <li key={a.title} className="grid gap-2 py-5 sm:grid-cols-[3rem_minmax(0,1fr)]">
                  <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg">{a.title}</h3>
                    <p className="mt-1 text-sm text-fg-2">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>
      <Section theme="dark" spacing="default" grid className="hairline-t">
        <Container>
          <SectionHeading eyebrow="Services in this solution" title="Delivered through these services" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((x) => (
              <li key={x.slug}>
                <Link href={`/services/${x.slug}`} className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface-1 p-5 hover:border-accent">
                  <Icon name={x.icon} size={20} className="text-accent" />
                  <span className="font-display text-base font-semibold text-fg group-hover:text-accent">{x.name}</span>
                  <span className="text-sm text-fg-2">{x.shortDescription}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <FAQSection faqs={s.faqs} />
      <RelatedLinks
        groups={[
          { heading: "Industries", links: industries.map((i) => ({ label: i.name, href: `/industries/${i.slug}`, icon: i.icon })) },
          { heading: "Guides", links: articles.map((a) => ({ label: a.title, href: `/resources/${a.slug}`, description: `${a.readingMinutes} min read` })) },
          { heading: "More solutions", links: solutions.filter((x) => x.slug !== s.slug).slice(0, 4).map((x) => ({ label: x.name, href: `/solutions/${x.slug}`, icon: x.icon })) },
        ]}
      />
      <CTASection />
    </>
  );
}
