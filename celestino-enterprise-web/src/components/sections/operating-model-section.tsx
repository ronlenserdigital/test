import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { OperatingModel } from "./operating-model";
import { LinkButton } from "@/components/ui/button";

export function OperatingModelSection({ showLink = true }: { showLink?: boolean }) {
  return (
    <Section theme="dark" spacing="default" grid>
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="How the work is done"
            title="Assess, design, secure, operate, monitor, improve."
            lede="Every engagement, whether a full managed environment or a single application project, moves through the same six stages. Each stage produces evidence you can hand to an auditor, an insurer or your board."
          />
          {showLink ? (
            <LinkButton href="/approach" variant="secondary" icon="arrow-right" className="shrink-0">
              Read the full approach
            </LinkButton>
          ) : null}
        </div>
        <div className="mt-12">
          <OperatingModel />
        </div>
      </Container>
    </Section>
  );
}
