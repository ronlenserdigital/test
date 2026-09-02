import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { OperatingModel } from "@/components/sections/operating-model";
import { STAGES } from "@/components/sections/operating-model-data";
import { CTASection } from "@/components/ui/cta-section";
import { RelatedLinks } from "@/components/sections/related-links";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/json-ld";

const title = "Our Approach: The Celestino Operating Model";
const description =
  "How Celestino delivers every engagement: Assess, Design, Secure, Operate, Monitor, Improve. Each stage has defined inputs, outputs and the evidence it produces for auditors, insurers and leadership.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/approach" });
const crumbs = [
  { label: "Home", href: "/" },
  { label: "Our approach", href: "/approach" },
];

export default function ApproachPage() {
  return (
    <>
      <JsonLd data={graph(webPageJsonLd({ path: "/approach", title, description }), breadcrumbJsonLd(crumbs))} />
      <PageHero
        crumbs={crumbs}
        eyebrow="Our approach"
        title="Six stages. Defined outputs. Evidence at every step."
        intro="Managed environments, security programs and application projects all move through the same cycle. The stages are not a sales diagram; they are how work is scheduled, reported and reviewed."
      />
      <Section theme="dark" spacing="default" grid>
        <Container>
          <OperatingModel />
        </Container>
      </Section>
      <Section theme="light" spacing="default" className="hairline-t">
        <Container>
          <SectionHeading eyebrow="Stage reference" title="Every stage, in full" lede="The interactive model above is summarized here in plain text so nothing depends on interaction." />
          <div className="mt-10 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2 text-left">
                  <th className="mono-label px-4 py-3 font-medium">Stage</th>
                  <th className="mono-label px-4 py-3 font-medium">Inputs</th>
                  <th className="mono-label px-4 py-3 font-medium">Outputs</th>
                  <th className="mono-label px-4 py-3 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {STAGES.map((s, i) => (
                  <tr key={s.id} className="border-t border-line align-top">
                    <th scope="row" className="px-4 py-4 text-left">
                      <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ml-2 font-display font-semibold text-fg">{s.label}</span>
                      <p className="mt-1 text-xs font-normal text-fg-2">{s.summary}</p>
                    </th>
                    <td className="px-4 py-4 text-fg-2">
                      <ul className="list-disc pl-4">{s.inputs.map((x) => <li key={x}>{x}</li>)}</ul>
                    </td>
                    <td className="px-4 py-4 text-fg-2">
                      <ul className="list-disc pl-4">{s.outputs.map((x) => <li key={x}>{x}</li>)}</ul>
                    </td>
                    <td className="px-4 py-4 text-fg">{s.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>
      <RelatedLinks groups={[{ heading: "Apply the model", links: [{ label: "Managed IT Services", href: "/services/managed-it", icon: "server" }, { label: "Cybersecurity Services", href: "/services/cybersecurity", icon: "shield-check" }, { label: "Backup & Disaster Recovery", href: "/services/backup-disaster-recovery", icon: "backup" }] }, { heading: "Read", links: [{ label: "NIST CSF 2.0 implementation sequence", href: "/resources/nist-csf-implementation-guide-smb" }, { label: "Cyber resilience readiness checklist", href: "/resources/cyber-resilience-readiness-checklist" }] }]} />
      <CTASection />
    </>
  );
}
