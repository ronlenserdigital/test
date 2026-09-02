import { Section } from "./section";
import { Container } from "./container";
import { LinkButton } from "./button";
import { primaryCta, secondaryCta } from "@/content/navigation";

interface CTASectionProps {
  title?: string;
  lede?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  eventPrefix?: string;
}

export function CTASection({
  title = "Start with an assessment, not a sales pitch.",
  lede = "One conversation with an engineer maps your environment against the operating model and tells you what to fix first, whether or not you hire Celestino to fix it.",
  primary = primaryCta,
  secondary = secondaryCta,
  eventPrefix = "service",
}: CTASectionProps) {
  return (
    <Section theme="dark" spacing="default" className="hairline-t">
      <Container className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-[52ch] flex-col gap-4">
          <h2 className="text-3xl">{title}</h2>
          <p className="text-md text-fg-2">{lede}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={primary.href} size="lg" icon="arrow-right" event={`${eventPrefix}_cta_click`}>
            {primary.label}
          </LinkButton>
          <LinkButton href={secondary.href} size="lg" variant="secondary" event={`${eventPrefix}_cta_click`}>
            {secondary.label}
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}
