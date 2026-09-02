import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { ArticleCard } from "@/components/ui/article-card";
import { CTASection } from "@/components/ui/cta-section";
import { articles, articleCategories } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Resources: Guides, Checklists & Decision Frameworks";
const description =
  "Engineer-written guides on managed IT operating models, cybersecurity frameworks, HIPAA and CMMC readiness, backup and disaster recovery, cloud decisions and secure application development.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/resources" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Resources", href: "/resources" },
];

export default function ResourcesPage() {
  const [lead, ...rest] = articles;
  const categoriesWithCount = articleCategories.map((c) => ({ ...c, count: articles.filter((a) => a.category === c.slug).length })).filter((c) => c.count > 0);
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/resources", title, description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Resources"
        title="Written by the engineers who do the work."
        intro="Decision guides, readiness checklists and framework implementation sequences. Each article has a direct answer at the top, a reviewed date, and references you can check."
      />
      <Section theme="light" spacing="default">
        <Container>
          <nav aria-label="Topics" className="mb-10 flex flex-wrap gap-2">
            {categoriesWithCount.map((c) => (
              <Link key={c.slug} href={`/resources/topics/${c.slug}`} className="rounded-md border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-fg-2 hover:border-accent hover:text-accent">
                {c.label} <span className="font-mono text-xs text-fg-muted">{c.count}</span>
              </Link>
            ))}
          </nav>
          <div className="grid gap-6 lg:grid-cols-3">
            {lead ? <ArticleCard article={lead} featured headingLevel="h2" /> : null}
            <div className="grid gap-6 lg:col-span-2 md:grid-cols-2">
              {rest.map((a) => (
                <ArticleCard key={a.slug} article={a} headingLevel="h2" />
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <Section theme="dark" spacing="sm" className="hairline-t">
        <Container>
          <SectionHeading eyebrow="Case studies" title="Verified engagements are published as they are approved." lede="Celestino publishes case studies only with the client's written approval of every detail. The case-study page explains the standard." size="md" />
          <Link href="/case-studies" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover">
            About our case-study standard →
          </Link>
        </Container>
      </Section>
      <CTASection />
    </>
  );
}
