import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/icons/icon";
import { Badge } from "@/components/ui/badge";
import { CTASection } from "@/components/ui/cta-section";
import { trustSections } from "@/content/trust";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Trust Center";
const description =
  "Celestino Enterprise Trust Center: security practices, privacy, data handling, responsible disclosure, compliance support, certifications, accessibility and security advisories, published with verified information only.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/trust" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Trust Center", href: "/trust" },
];

export default function TrustPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/trust", title, description, type: "CollectionPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Trust Center"
        title="How Celestino secures its own operations, and yours."
        intro="A firm that holds privileged access to client systems should publish how it protects that access. This page collects Celestino's practices and policies. Sections marked 'awaiting documentation' describe what will be published, never what we wish were true."
      />
      <Section theme="light" spacing="default">
        <Container>
          <ul className="grid gap-4 md:grid-cols-2">
            {trustSections.map((s) => (
              <li key={s.slug}>
                <Link href={`/trust/${s.slug}`} className="group flex h-full flex-col rounded-lg border border-line bg-surface-1 p-6 transition-colors duration-[var(--duration-base)] hover:border-accent">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg group-hover:text-accent">{s.title}</h2>
                    {s.status === "awaiting-client" ? <Badge tone="warning">Awaiting documentation</Badge> : <Badge tone="success">Published</Badge>}
                  </div>
                  <p className="mt-2 flex-1 text-sm text-fg-2">{s.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    Read
                    <Icon name="arrow-right" size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <CTASection title="Have a security question before you engage?" lede="Send it through the contact form with 'Security question' as the subject. Questions about our practices are answered by an engineer, not a sales representative." primary={{ label: "Ask a security question", href: "/contact?intent=security" }} secondary={{ label: "Security practices", href: "/trust/security-practices" }} />
    </>
  );
}
