import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/ui/prose";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons/icon";
import { trustSections, getTrustSection } from "@/content/trust";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return trustSections.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getTrustSection(slug);
  if (!s) return {};
  return buildMetadata({ title: `${s.title} | Trust Center`, description: s.summary, path: `/trust/${slug}`, image: "/trust/opengraph-image" });
}

export default async function TrustSectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const s = getTrustSection(slug);
  if (!s) notFound();
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Trust Center", href: "/trust" },
    { label: s.title, href: `/trust/${s.slug}` },
  ];
  const verifiedCerts = site.certifications.filter((c) => c.verified);
  const verifiedPartners = site.partners.filter((p) => p.verified);

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: `/trust/${s.slug}`, title: `${s.title} | Trust Center`, description: s.summary }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow="Trust Center" title={s.title} intro={s.summary} grid={false} />
      <Section theme="light" spacing="default">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article className="max-w-[68ch]">
            <div className="mb-6">
              {s.status === "awaiting-client" ? <Badge tone="warning">Awaiting client documentation</Badge> : <Badge tone="success">Published</Badge>}
            </div>
            <Prose paragraphs={s.body} />
            {s.bullets?.length ? (
              <ul className="mt-8 flex flex-col divide-y divide-line border-y border-line">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-3 py-3.5 text-fg-2">
                    <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
            {s.slug === "certifications" ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-surface-1 p-5">
                  <p className="mono-label mb-3">Staff certifications</p>
                  {verifiedCerts.length ? (
                    <ul className="text-sm text-fg">{verifiedCerts.map((c) => <li key={c.name}>{c.name} · {c.issuer}</li>)}</ul>
                  ) : (
                    <p className="text-sm text-fg-muted">None published. Added on documentation.</p>
                  )}
                </div>
                <div className="rounded-lg border border-line bg-surface-1 p-5">
                  <p className="mono-label mb-3">Technology partners</p>
                  {verifiedPartners.length ? (
                    <ul className="text-sm text-fg">{verifiedPartners.map((p) => <li key={p.name}>{p.name}{p.tier ? ` · ${p.tier}` : ""}</li>)}</ul>
                  ) : (
                    <p className="text-sm text-fg-muted">None published. Platform experience (Magento, Shopify, BigCommerce) is an experience claim, not a partnership.</p>
                  )}
                </div>
              </div>
            ) : null}
            {s.slug === "privacy" ? (
              <p className="mt-8 text-sm text-fg-2">
                The full privacy policy is at <Link href="/privacy" className="text-accent underline">/privacy</Link>.
              </p>
            ) : null}
          </article>
          <nav aria-label="Trust Center sections" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
            <p className="mono-label mb-3">Trust Center</p>
            <ul className="flex flex-col border-l border-line">
              {trustSections.map((x) => (
                <li key={x.slug}>
                  <Link href={`/trust/${x.slug}`} aria-current={x.slug === s.slug ? "page" : undefined} className={`block border-l-2 py-2 pl-4 text-sm ${x.slug === s.slug ? "-ml-px border-accent text-fg" : "-ml-px border-transparent text-fg-2 hover:text-fg"}`}>
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>
    </>
  );
}
