import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons/icon";
import { RelatedLinks } from "@/components/sections/related-links";
import { CTASection } from "@/components/ui/cta-section";
import { ArticleCard } from "@/components/ui/article-card";
import { articles, getArticle, articleCategories } from "@/content/articles";
import { getAuthor } from "@/content/authors";
import { getService } from "@/content/services";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/format";
import { inlineMarkdown } from "@/lib/inline-markdown";
import { JsonLd } from "@/components/seo/json-ld";
import { articleJsonLd, breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  const author = getAuthor(a.authorId);
  const meta = buildMetadata({ title: a.title, description: a.description, path: `/resources/${slug}`, type: "article", publishedTime: a.publishedAt, modifiedTime: a.reviewedAt, authors: author ? [author.name] : undefined });
  // Articles carry their headline as the full <title>; the brand is in the OG site name.
  return { ...meta, title: { absolute: a.title } };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const author = getAuthor(a.authorId);
  if (!author) notFound();
  const category = articleCategories.find((c) => c.slug === a.category);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    ...(category ? [{ label: category.label, href: `/resources/topics/${category.slug}` }] : []),
    { label: a.title, href: `/resources/${a.slug}` },
  ];
  const services = a.relatedServiceSlugs.map(getService).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const related = a.relatedArticleSlugs.map(getArticle).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/resources/${a.slug}`, title: a.title, description: a.description, datePublished: a.publishedAt, dateModified: a.reviewedAt }), breadcrumbJsonLd(crumbs), articleJsonLd(a, author))} />
      <Section theme="light" spacing="none">
        <Container className="pt-8 md:pt-10">
          <Breadcrumb items={crumbs.slice(0, -1)} />
        </Container>
        <Container className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16 md:py-16">
          <article className="min-w-0">
            <header className="max-w-[68ch]">
              <p className="mono-label flex flex-wrap items-center gap-x-2">
                <span className="text-accent">{a.type.replace("-", " ")}</span>
                <span aria-hidden="true">·</span>
                {category ? <Link href={`/resources/topics/${category.slug}`} className="hover:text-fg">{category.label}</Link> : null}
                <span aria-hidden="true">·</span>
                <span>{a.readingMinutes} min read</span>
              </p>
              <h1 className="mt-5 text-4xl">{a.title}</h1>
              <p className="mt-5 text-lg text-fg-2">{a.description}</p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-line py-4 text-sm">
                <div className="flex gap-2">
                  <dt className="text-fg-muted">By</dt>
                  <dd>
                    <Link href={`/authors/${author.slug}`} className="font-medium text-fg hover:text-accent">{author.name}</Link>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-fg-muted">Published</dt>
                  <dd><time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time></dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-fg-muted">Last reviewed</dt>
                  <dd><time dateTime={a.reviewedAt}>{formatDate(a.reviewedAt)}</time></dd>
                </div>
              </dl>
            </header>

            <div className="mt-8 max-w-[68ch] rounded-lg border border-accent/30 bg-accent-soft p-6">
              <p className="mono-label mb-2 text-accent">Short answer</p>
              <p className="text-md leading-relaxed text-fg">{a.summary}</p>
            </div>

            <nav aria-label="On this page" className="mt-8 max-w-[68ch] rounded-lg border border-line bg-surface-1 p-5 lg:hidden">
              <p className="mono-label mb-3">Contents</p>
              <ol className="flex flex-col gap-1.5 text-sm">
                {a.sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-fg-2 hover:text-accent"><span className="font-mono text-xs text-fg-muted">{String(i + 1).padStart(2, "0")}</span> {s.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="prose-c mt-10 max-w-[68ch]">
              {a.sections.map((s) => (
                <section key={s.id} aria-labelledby={`h-${s.id}`}>
                  <h2 id={s.id}>
                    <span id={`h-${s.id}`}>{s.heading}</span>
                  </h2>
                  {s.body.map((p, i) => (
                    <p key={i}>{inlineMarkdown(p)}</p>
                  ))}
                  {s.list?.length ? (
                    <ul>
                      {s.list.map((li) => (
                        <li key={li}>{inlineMarkdown(li)}</li>
                      ))}
                    </ul>
                  ) : null}
                  {s.table ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>{s.table.headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {s.table.rows.map((row, ri) => (
                            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{inlineMarkdown(cell)}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>

            <section className="mt-12 max-w-[68ch] rounded-lg border border-line bg-surface-1 p-6" aria-labelledby="takeaways">
              <h2 id="takeaways" className="text-xl">Key takeaways</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {a.keyTakeaways.map((t) => (
                  <li key={t} className="flex gap-3 text-fg-2">
                    <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </section>

            {a.references?.length ? (
              <section className="mt-10 max-w-[68ch]" aria-labelledby="references">
                <h2 id="references" className="text-lg">References</h2>
                <ol className="mt-3 list-decimal pl-5 text-sm text-fg-2">
                  {a.references.map((r) => (
                    <li key={r.url} className="mt-1.5">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">{r.label}</a>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <aside className="mt-12 max-w-[68ch] flex gap-4 rounded-lg border border-line bg-surface-1 p-6" aria-label="About the author">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-accent"><Icon name="users" size={20} /></span>
              <div>
                <p className="font-display font-semibold text-fg"><Link href={`/authors/${author.slug}`} className="hover:text-accent">{author.name}</Link></p>
                <p className="text-sm text-fg-muted">{author.role}</p>
                <p className="mt-2 text-sm text-fg-2">{author.bio}</p>
              </div>
            </aside>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-height)+1.5rem)] flex flex-col gap-8">
              <nav aria-label="On this page">
                <p className="mono-label mb-3">Contents</p>
                <ol className="flex flex-col border-l border-line">
                  {a.sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-fg-2 hover:border-accent hover:text-fg">{s.heading}</a>
                    </li>
                  ))}
                </ol>
              </nav>
              {services.length ? (
                <div>
                  <p className="mono-label mb-3">Related services</p>
                  <ul className="flex flex-col gap-2">
                    {services.map((s) => (
                      <li key={s.slug}>
                        <Link href={`/services/${s.slug}`} className="flex items-center gap-2 text-sm font-medium text-fg hover:text-accent"><Icon name={s.icon} size={16} className="text-accent" />{s.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Badge tone="neutral" mono={false}>Not legal or audit advice</Badge>
            </div>
          </aside>
        </Container>
      </Section>

      {related.length ? (
        <Section theme="light" spacing="sm" className="hairline-t">
          <Container>
            <p className="mono-label mb-6">Related reading</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ArticleCard key={r.slug} article={r} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
      <RelatedLinks groups={[{ heading: "Related services", links: services.map((s) => ({ label: s.name, href: `/services/${s.slug}`, icon: s.icon })) }]} theme="dark" />
      <CTASection eventPrefix="service" />
    </>
  );
}
