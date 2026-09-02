import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { ArticleCard } from "@/components/ui/article-card";
import { CTASection } from "@/components/ui/cta-section";
import { articleCategories, getArticlesByCategory } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { category: string };

/** Only categories with content are indexable pages; empty categories 404 rather than publish thin pages. */
export function generateStaticParams(): Params[] {
  return articleCategories.filter((c) => getArticlesByCategory(c.slug).length > 0).map((c) => ({ category: c.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const c = articleCategories.find((x) => x.slug === category);
  if (!c) return {};
  return buildMetadata({ title: `${c.label} Resources`, description: c.description, path: `/resources/topics/${c.slug}`, image: "/resources/opengraph-image" });
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const c = articleCategories.find((x) => x.slug === category);
  if (!c) notFound();
  const list = getArticlesByCategory(c.slug);
  if (!list.length) notFound();
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    { label: c.label, href: `/resources/topics/${c.slug}` },
  ];
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/resources/topics/${c.slug}`, title: `${c.label} Resources`, description: c.description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow="Topic" title={c.label} intro={c.description} />
      <Section theme="light" spacing="default">
        <Container>
          <nav aria-label="Topics" className="mb-10 flex flex-wrap gap-2">
            {articleCategories.filter((x) => getArticlesByCategory(x.slug).length).map((x) => (
              <Link key={x.slug} href={`/resources/topics/${x.slug}`} aria-current={x.slug === c.slug ? "page" : undefined} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${x.slug === c.slug ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface-1 text-fg-2 hover:border-accent hover:text-accent"}`}>
                {x.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <ArticleCard key={a.slug} article={a} headingLevel="h2" />
            ))}
          </div>
        </Container>
      </Section>
      <CTASection />
    </>
  );
}
