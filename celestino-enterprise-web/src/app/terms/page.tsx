import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/content/site";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Terms of Use";
const description = "Terms governing use of the celestinoenterprise.com website. Service engagements are governed by separate written agreements.";
export const metadata: Metadata = buildMetadata({ title, description, path: "/terms", image: "/trust/opengraph-image" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Terms", href: "/terms" },
];
const updated = "2026-09-02";

export default function TermsPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/terms", title, description, dateModified: updated }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow="Legal" title="Terms of use" intro={`Effective ${updated}. These terms apply to the website at ${site.url}.`} grid={false} />
      <Section theme="light" spacing="default">
        <Container width="narrow">
          <div className="prose-c">
            <h2 id="use">Use of this site</h2>
            <p>This website describes the services of {site.name} and provides educational material. You may use it for lawful purposes. You may not attempt to interfere with its operation, probe or test its security without written authorization (see our responsible disclosure page for the permitted route), scrape it at volume, or submit forms with false or automated information.</p>
            <h2 id="no-advice">Informational content</h2>
            <p>Guides, checklists and articles on this site are general information based on the experience of Celestino&rsquo;s engineers. They are not legal, regulatory or audit advice, and they do not create a client relationship. Compliance obligations depend on your specific circumstances; consult qualified counsel or auditors where required.</p>
            <h2 id="services">Services</h2>
            <p>Any engagement for services is governed by a separate written agreement, which controls over anything on this site. Service descriptions on this site are summaries, not offers or guarantees of particular results.</p>
            <h2 id="ip">Intellectual property</h2>
            <p>The content, design, diagrams and code of this site are owned by {site.name} or its licensors. You may quote short excerpts with attribution and a link. Third-party names and marks belong to their owners and are used for identification only; their appearance does not imply endorsement or partnership unless expressly stated on the Trust Center.</p>
            <h2 id="warranty">No warranty</h2>
            <p>The site is provided as is. {site.name} does not warrant that it will be uninterrupted or error-free, and is not liable for losses arising from reliance on its content, to the fullest extent permitted by law.</p>
            <h2 id="law">Governing law</h2>
            <p>These terms are governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law rules.</p>
            <h2 id="changes">Changes</h2>
            <p>Updated terms are published on this page with a new effective date.</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
