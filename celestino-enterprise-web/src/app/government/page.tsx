import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { LinkButton } from "@/components/ui/button";
import { CTASection } from "@/components/ui/cta-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { site } from "@/content/site";
import { getService } from "@/content/services";
import { getArticle } from "@/content/articles";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Government & Public Sector Capabilities";
const description =
  "Celestino Enterprise capabilities for state, local and federal-adjacent buyers: managed IT, cybersecurity, disaster recovery and secure application engineering, with procurement identifiers, business classifications and framework alignment.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/government" });

const crumbs = [
  { label: "Home", href: "/" },
  { label: "Government & public sector", href: "/government" },
];

const capabilityServices = ["managed-it", "co-managed-it", "cybersecurity", "security-risk-advisory", "backup-disaster-recovery", "cloud-infrastructure", "network-management", "software-development"];
const frameworks = [
  { name: "NIST Cybersecurity Framework 2.0", detail: "Baseline structure for assessments, roadmaps and reporting to leadership." },
  { name: "NIST SP 800-171 / CMMC 2.0", detail: "Readiness planning for organizations handling Controlled Unclassified Information. Celestino does not issue CMMC certifications." },
  { name: "CJIS Security Policy", detail: "Considerations for systems that touch criminal justice information." },
  { name: "HIPAA Security Rule", detail: "For public health, human services and benefits administration systems." },
  { name: "State records and privacy statutes", detail: "Retention, FOIA and breach-notification obligations that shape system design." },
];

export default function GovernmentPage() {
  const gov = site.government;
  const identifiers: { label: string; claim: { value: string | string[] | boolean; verified: boolean } ; render?: (v: string | string[] | boolean) => string }[] = [
    { label: "Unique Entity ID (UEI)", claim: gov.uei },
    { label: "CAGE code", claim: gov.cage },
    { label: "NAICS codes", claim: gov.naics, render: (v) => (Array.isArray(v) ? v.join(", ") : String(v)) },
    { label: "SAM.gov registration", claim: gov.samRegistered, render: (v) => (v ? "Active" : "Not registered") },
    { label: "Virginia eVA vendor registration", claim: gov.evaRegistered, render: (v) => (v ? "Registered" : "Not registered") },
    { label: "Virginia SWaM certification", claim: gov.swamCertified, render: (v) => (v ? "Certified" : "Not certified") },
    { label: "Business classifications", claim: gov.businessClassifications, render: (v) => (Array.isArray(v) ? v.join(", ") : String(v)) },
    { label: "Contract vehicles", claim: gov.contractVehicles, render: (v) => (Array.isArray(v) ? v.join(", ") : String(v)) },
  ];
  const services = capabilityServices.map(getService).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const articles = ["virginia-public-sector-procurement-security-guide", "cmmc-readiness-concepts", "nist-csf-implementation-guide-smb"].map(getArticle).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const capabilityPdf = gov.capabilityStatementUrl.verified ? gov.capabilityStatementUrl.value : null;

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/government", title, description }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Government & public sector"
        title="Capabilities, identifiers and frameworks on one page."
        intro="Public-sector buyers need to qualify a vendor before they can talk to one. This page carries the information a procurement officer, IT director or prime contractor needs, and states plainly where a value is pending confirmation."
        actions={[
          ...(capabilityPdf
            ? [{ label: "Download capability statement (PDF)", href: capabilityPdf, event: "government_capability_download" }]
            : [{ label: "Request a capability statement", href: "/contact?intent=government", event: "service_cta_click" }]),
          { label: "Public-sector industry page", href: "/industries/government-public-sector", variant: "secondary" as const },
        ]}
      />

      <Section theme="light" spacing="default">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <SectionHeading eyebrow="Procurement information" title="Vendor identifiers and classifications" lede="Values appear here as they are confirmed. A field marked &lsquo;on request&rsquo; has not been verified for publication; contact us and it will be supplied directly." />
            {!capabilityPdf ? (
              <p className="mt-6 rounded-md border border-line bg-surface-2 p-4 text-sm text-fg-2">
                A downloadable capability statement will be published here once supplied. Until then, request one through the contact form and it will be sent by email.
              </p>
            ) : null}
          </div>
          <dl className="divide-y divide-line rounded-lg border border-line bg-surface-1">
            {identifiers.map((row) => {
              const v = row.claim.verified ? (row.render ? row.render(row.claim.value) : String(row.claim.value)) : null;
              return (
                <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-sm font-medium text-fg">{row.label}</dt>
                  <dd className="text-sm">
                    {v ? (
                      <span className="font-mono text-fg">{v}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-fg-muted">
                        <Icon name="clock" size={14} />
                        On request · pending verification
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Container>
      </Section>

      <Section theme="dark" spacing="default" grid className="hairline-t">
        <Container>
          <SectionHeading eyebrow="Capabilities" title="Services structured for public bodies" lede="Each service is delivered with documentation, separation of duties and evidence that public accountability requires. Celestino can contract directly or as a subcontractor to a prime." />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface-1 p-5 hover:border-accent">
                  <Icon name={s.icon} size={20} className="text-accent" />
                  <span className="font-display text-base font-semibold text-fg group-hover:text-accent">{s.name}</span>
                  <span className="text-sm text-fg-2">{s.shortDescription}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section theme="light" spacing="default" className="hairline-t">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Frameworks" title="Security frameworks we work within" />
            <ul className="mt-8 flex flex-col divide-y divide-line border-y border-line">
              {frameworks.map((f) => (
                <li key={f.name} className="py-4">
                  <p className="font-medium text-fg">{f.name}</p>
                  <p className="mt-1 text-sm text-fg-2">{f.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Coverage" title="Service coverage" />
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface-1 p-5">
                <dt className="mono-label">Headquarters</dt>
                <dd className="mt-1 text-sm font-medium text-fg">{site.address.addressLocality}, Virginia</dd>
                <dd className="mt-1 text-xs text-fg-muted">Between Fredericksburg and Richmond, near I-95</dd>
              </div>
              <div className="rounded-lg border border-line bg-surface-1 p-5">
                <dt className="mono-label">Onsite response</dt>
                <dd className="mt-1 text-sm font-medium text-fg">United States</dd>
                <dd className="mt-1 text-xs text-fg-muted">Remote-first delivery with nationwide onsite dispatch</dd>
              </div>
              <div className="rounded-lg border border-line bg-surface-1 p-5">
                <dt className="mono-label">Contracting</dt>
                <dd className="mt-1 text-sm font-medium text-fg">Direct or as subcontractor</dd>
                <dd className="mt-1 text-xs text-fg-muted">Defined scopes under a prime&rsquo;s agreement</dd>
              </div>
              <div className="rounded-lg border border-line bg-surface-1 p-5">
                <dt className="mono-label">Point of contact</dt>
                <dd className="mt-1 text-sm font-medium text-fg">Capability requests</dd>
                <dd className="mt-1">
                  <LinkButton href="/contact?intent=government" variant="link" icon="arrow-right" event="service_cta_click">
                    Contact form
                  </LinkButton>
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </Section>

      <RelatedLinks groups={[{ heading: "Public-sector guidance", links: articles.map((a) => ({ label: a.title, href: `/resources/${a.slug}`, description: `${a.readingMinutes} min read` })) }, { heading: "Trust", links: [{ label: "Trust Center", href: "/trust", icon: "shield-check" }, { label: "Security practices", href: "/trust/security-practices", icon: "lock" }, { label: "Data handling", href: "/trust/data-handling", icon: "database" }] }]} />
      <CTASection title="Qualify Celestino for your next requirement." lede="Send the requirement, the framework it must satisfy and the timeline. An engineer responds with a capability summary and any identifiers you need." primary={{ label: "Contact for public-sector work", href: "/contact?intent=government" }} secondary={{ label: "Public-sector industry page", href: "/industries/government-public-sector" }} />
    </>
  );
}
