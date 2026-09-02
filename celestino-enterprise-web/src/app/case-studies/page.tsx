import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { CTASection } from "@/components/ui/cta-section";
import { publishedCaseStudies } from "@/content/case-studies";
import { getIndustry } from "@/content/industries";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Case Studies";
const description =
  "Verified Celestino Enterprise engagements: challenge, environment, risk, solution, implementation and outcome, published only with client approval of every detail.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/case-studies", image: "/resources/opengraph-image" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Case studies", href: "/case-studies" },
];

const standard = [
  { title: "Challenge and environment", detail: "What the client ran, what was at risk, and why the status quo was untenable." },
  { title: "Solution and implementation", detail: "What Celestino changed, in what order, and what was deliberately left alone." },
  { title: "Outcome", detail: "Measured results the client has reviewed. No invented percentages." },
  { title: "Attribution", detail: "Named or anonymized at the client's choice, with written approval on file." },
];

export default function CaseStudiesPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/case-studies", title, description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow="Case studies" title="Engagements, documented to a standard." intro="A case study on this site is a record the client has read and approved. If that sounds slower than the usual marketing page, it is. It is also the only kind worth citing in a procurement response." />
      <Section theme="light" spacing="default">
        <Container>
          {publishedCaseStudies.length ? (
            <ul className="grid gap-5 md:grid-cols-2">
              {publishedCaseStudies.map((c) => {
                const ind = getIndustry(c.industrySlug);
                return (
                  <li key={c.slug}>
                    <Link href={`/case-studies/${c.slug}`} className="group flex h-full flex-col rounded-lg border border-line bg-surface-1 p-7 hover:border-accent" data-event="case_study_view">
                      <p className="mono-label">{ind?.name ?? "Case study"}</p>
                      <h2 className="mt-3 text-xl group-hover:text-accent">{c.title}</h2>
                      <p className="mt-2 text-sm text-fg-2">{c.summary}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <SectionHeading eyebrow="The standard" title="What every published case study contains." lede="Case studies are in the client-approval process and will appear here as they are released. In the meantime, the industry pages describe the environments and obligations Celestino works in." />
              <ol className="grid gap-4 sm:grid-cols-2">
                {standard.map((s, i) => (
                  <li key={s.title} className="flex flex-col gap-2 rounded-lg border border-line bg-surface-1 p-6">
                    <span className="font-mono text-xs tracking-[0.12em] text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-lg">{s.title}</h3>
                    <p className="text-sm text-fg-2">{s.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="mt-10 flex items-center gap-2 text-sm text-fg-2">
            <Icon name="arrow-right" size={16} className="text-accent" />
            <Link href="/industries" className="font-medium text-fg hover:text-accent">Browse industry pages</Link>
            <span aria-hidden="true">·</span>
            <Link href="/resources" className="font-medium text-fg hover:text-accent">Read the guides</Link>
          </p>
        </Container>
      </Section>
      <CTASection title="Want a reference call instead of a case study?" lede="References are arranged directly, with the client's consent, once an engagement is scoped." primary={{ label: "Request an assessment", href: "/contact?intent=assessment" }} secondary={{ label: "Talk to an engineer", href: "/contact?intent=expert" }} />
    </>
  );
}
