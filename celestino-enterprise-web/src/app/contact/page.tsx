import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/icons/icon";
import { ContactForm } from "@/components/forms/contact-form";
import { CONTACT_INTENTS, type ContactIntent } from "@/lib/validation/contact";
import { site, hasVerifiedEmail, hasVerifiedPhone } from "@/content/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";
import Link from "next/link";

const title = "Contact Celestino Enterprise";
const description =
  "Request an assessment, talk to an engineer, or ask a security question. Celestino Enterprise responds within one business day from Woodford, Virginia.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/contact" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Contact", href: "/contact" },
];

type SearchParams = Promise<{ intent?: string; service?: string; solution?: string; industry?: string }>;

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const intent: ContactIntent = CONTACT_INTENTS.includes(sp.intent as ContactIntent) ? (sp.intent as ContactIntent) : "assessment";
  const need = sp.service;

  const steps = [
    { title: "You describe the environment", detail: "Users, sites, what you run, what is keeping you up at night, and any deadline." },
    { title: "An engineer replies", detail: "Within one business day, with clarifying questions or a proposed scope for the assessment." },
    { title: "Assessment and findings", detail: "A scored baseline and prioritized plan you keep whether or not you engage Celestino for the work." },
  ];

  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/contact", title, description, type: "ContactPage" }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow="Contact" title="Talk to an engineer, not a sales queue." intro="Every inquiry is read by someone who does the work. Tell us what you run and what is at stake, and we will tell you what we would do first." grid={false} />
      <Section theme="light" spacing="default">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-lg border border-line bg-surface-1 p-6 md:p-8">
            <ContactForm initialIntent={intent} initialNeed={need} />
          </div>
          <aside className="flex flex-col gap-8">
            <div>
              <p className="mono-label mb-4">What happens next</p>
              <ol className="flex flex-col divide-y divide-line border-y border-line">
                {steps.map((s, i) => (
                  <li key={s.title} className="grid gap-1 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                    <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-medium text-fg">{s.title}</p>
                      <p className="text-sm text-fg-2">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-lg border border-line bg-surface-1 p-6">
              <p className="mono-label mb-4">Direct contact</p>
              <address className="flex flex-col gap-3 not-italic text-sm text-fg-2">
                <p className="flex items-center gap-2"><Icon name="pin" size={16} className="text-fg-muted" />{site.address.addressLocality}, {site.address.addressRegion} {site.address.postalCode}</p>
                {hasVerifiedPhone() ? <p className="flex items-center gap-2"><Icon name="phone" size={16} className="text-fg-muted" /><a href={`tel:${site.phone.value.replace(/[^\d+]/g, "")}`} data-event="phone_click" className="hover:text-fg">{site.phone.value}</a></p> : null}
                {hasVerifiedEmail() ? <p className="flex items-center gap-2"><Icon name="mail" size={16} className="text-fg-muted" /><a href={`mailto:${site.email.value}`} data-event="email_click" className="hover:text-fg">{site.email.value}</a></p> : null}
                {!hasVerifiedPhone() && !hasVerifiedEmail() ? <p className="text-fg-muted">Phone and email are published on confirmation. The form above reaches the same engineers.</p> : null}
                <p className="flex items-center gap-2"><Icon name="globe" size={16} className="text-fg-muted" />Remote-first, US-wide. <Link href="/nationwide-support" className="text-accent underline">Onsite coverage</Link></p>
              </address>
            </div>
            <div className="rounded-lg border border-line bg-surface-2 p-6 text-sm text-fg-2">
              <p className="flex gap-2"><Icon name="alert" size={18} className="mt-0.5 shrink-0 text-warning" /><span><span className="font-medium text-fg">Active incident?</span> Do not send system names, credentials or exploit details through this form. Select &ldquo;Security question or report&rdquo; and we will arrange a secure channel. See <Link href="/trust/responsible-disclosure" className="text-accent underline">responsible disclosure</Link>.</span></p>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
