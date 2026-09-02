import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { ArticleCard } from "@/components/ui/article-card";
import { authors, getAuthor } from "@/content/authors";
import { articles } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, personJsonLd, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return authors.filter((a) => a.verified).map((a) => ({ slug: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const a = authors.find((x) => x.slug === slug);
  if (!a) return {};
  return buildMetadata({ title: `${a.name} | Author`, description: a.bio, path: `/authors/${slug}`, type: "website", image: "/resources/opengraph-image" });
}

export default async function AuthorPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const a = authors.find((x) => x.slug === slug);
  if (!a || !getAuthor(a.id)) notFound();
  const list = articles.filter((x) => x.authorId === a.id);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    { label: a.name, href: `/authors/${a.slug}` },
  ];
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/authors/${a.slug}`, title: `${a.name} | Author`, description: a.bio, type: "ProfilePage" }), breadcrumbJsonLd(crumbs), personJsonLd(a))} />
      <PageHero crumbs={crumbs} eyebrow="Author" title={a.name} intro={a.bio} grid={false} />
      <Section theme="light" spacing="default">
        <Container>
          <p className="mono-label mb-6">{list.length} articles</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((x) => (
              <ArticleCard key={x.slug} article={x} headingLevel="h2" />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
