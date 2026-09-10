import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { HeroVisual } from "./hero-visual";

const LAYERS = [
  ["Users", "Training and phishing simulation so people detect what tools miss."],
  ["Identity", "MFA, conditional access and least-privilege roles."],
  ["Endpoints", "Detection, encryption and patch compliance on every device."],
  ["Network", "Segmentation, firewall policy and secure remote access."],
  ["Cloud", "Tenant baselines, sharing controls and cost governance."],
  ["Applications", "Patched, monitored and engineered with secure defaults."],
  ["Data", "Immutable, isolated backups with tested restores."],
  ["Monitoring", "Alerts routed to a staffed queue with owners and runbooks."],
] as const;

/** The layered operations model as its own section, used when the hero carries a photograph. */
export function LayersSection() {
  return (
    <Section theme="dark" spacing="default" grid className="hairline-t">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="What we protect"
            title="Eight layers. One control path."
            lede="Every environment Celestino runs is managed as a stack. Each layer has a control, an owner and evidence, and the monitoring layer watches all of them."
          />
          <ol className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {LAYERS.map(([name, detail], i) => (
              <li key={name} className="flex gap-3">
                <span className="mt-0.5 font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-sm font-semibold text-fg">{name}</span>
                  <span className="block text-xs text-fg-2">{detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="hidden justify-end lg:flex">
          <HeroVisual className="w-full" />
        </div>
      </Container>
    </Section>
  );
}
