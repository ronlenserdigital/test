import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { site } from "@/content/site";

export function GovernmentBand() {
  const gov = site.government;
  const rows: { label: string; value: string | undefined }[] = [
    { label: "UEI", value: gov.uei.verified ? gov.uei.value : undefined },
    { label: "CAGE", value: gov.cage.verified ? gov.cage.value : undefined },
    { label: "NAICS", value: gov.naics.verified ? gov.naics.value.join(", ") : undefined },
    { label: "SAM.gov", value: gov.samRegistered.verified ? (gov.samRegistered.value ? "Registered" : "Not registered") : undefined },
    { label: "Virginia eVA", value: gov.evaRegistered.verified ? (gov.evaRegistered.value ? "Registered" : "Not registered") : undefined },
    { label: "SWaM", value: gov.swamCertified.verified ? (gov.swamCertified.value ? "Certified" : "Not certified") : undefined },
  ];
  return (
    <Section theme="dark" spacing="default" className="hairline-t">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-5">
          <Eyebrow>Government & public sector</Eyebrow>
          <h2 className="text-3xl">Structured for public-sector procurement.</h2>
          <p className="measure text-md text-fg-2">
            Public bodies need vendor identifiers, framework alignment and a capability statement before a conversation can start. Celestino publishes those on one page, with NIST CSF, NIST SP 800-171 and CJIS considerations mapped to services.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/government" icon="arrow-right">
              View government capabilities
            </LinkButton>
            <LinkButton href="/industries/government-public-sector" variant="secondary">
              Public-sector industry page
            </LinkButton>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-1 bg-surface-1 p-4">
              <dt className="mono-label">{r.label}</dt>
              <dd className="text-sm font-medium text-fg">
                {r.value ?? (
                  <span className="inline-flex items-center gap-1.5 text-fg-muted">
                    <Icon name="clock" size={14} />
                    On request
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
