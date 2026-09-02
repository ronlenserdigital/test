import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/content/site";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Privacy Policy";
const description = "How celestinoenterprise.com collects, uses and retains information submitted through this website, and how to exercise your rights.";
export const metadata: Metadata = buildMetadata({ title, description, path: "/privacy", image: "/trust/opengraph-image" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Privacy", href: "/privacy" },
];

const updated = "2026-09-02";

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/privacy", title, description, dateModified: updated }), breadcrumbJsonLd(crumbs))} />
      <PageHero crumbs={crumbs} eyebrow="Legal" title="Privacy policy" intro={`Effective ${updated}. This policy covers the website at ${site.url}. Data handling during service delivery is governed by each client agreement.`} grid={false} />
      <Section theme="light" spacing="default">
        <Container width="narrow">
          <div className="prose-c">
            <h2 id="what-we-collect">What we collect</h2>
            <p>When you submit a form on this site we collect the information you enter: your name, work email address, company, phone number if you provide it, the nature of your request, and your message. We also record the time of submission, the page you submitted from and a hashed representation of your network address used only for rate limiting and abuse prevention.</p>
            <p>The site collects aggregate usage measurements to understand which pages are visited and how the site performs. Where Google Analytics 4 is enabled, it is configured with IP anonymization and with advertising features disabled. Vercel Web Analytics and Speed Insights are cookieless and collect aggregate performance and visit data only.</p>
            <h2 id="how-we-use-it">How we use it</h2>
            <p>Form submissions are used to respond to your inquiry and, where you request services, to prepare a proposal. Usage measurements are used to improve the site. We do not sell personal information and we do not share it with third parties for their own marketing.</p>
            <h2 id="retention">Retention</h2>
            <p>Form submissions are retained in an access-controlled database for as long as needed to respond and, if an engagement follows, for the duration of the client relationship. Submissions that do not lead to an engagement are deleted after 24 months. Aggregate analytics are retained according to the provider&rsquo;s default settings.</p>
            <h2 id="security">Security</h2>
            <p>Submissions are transmitted over HTTPS, validated on the server, and stored with database policies that prevent public read access. Access to submissions is limited to Celestino staff who need it to respond. Do not submit passwords, credentials or details of an active security incident through the general contact form; request a secure channel instead.</p>
            <h2 id="your-rights">Your rights</h2>
            <p>You may request a copy of the information you have submitted, ask for it to be corrected, or ask for it to be deleted, by contacting us through the contact page. Requests are answered within 30 days. Residents of jurisdictions with specific privacy laws, including Virginia under the Consumer Data Protection Act, may exercise the rights those laws provide through the same channel.</p>
            <h2 id="cookies">Cookies</h2>
            <p>This site sets no cookies for its own functionality. If Google Analytics is enabled, it sets its standard measurement cookies; you can decline them through your browser settings or a content-blocking extension without affecting the site&rsquo;s functionality.</p>
            <h2 id="changes">Changes</h2>
            <p>Changes to this policy are published on this page with a new effective date.</p>
            <h2 id="contact">Contact</h2>
            <p>Privacy questions and requests: use the contact page and select &ldquo;General inquiry&rdquo; with &ldquo;Privacy&rdquo; in the subject. A dedicated privacy contact address will be published here once confirmed.</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
