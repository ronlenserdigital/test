import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { intentLabels, CONTACT_INTENTS, type ContactIntent } from "@/lib/validation/contact";

export const metadata: Metadata = {
  title: "Message received",
  robots: { index: false, follow: false },
};

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  const label = CONTACT_INTENTS.includes(intent as ContactIntent) ? intentLabels[intent as ContactIntent] : "Your message";
  return (
    <Section theme="light" className="flex min-h-[60vh] items-center">
      <Container width="narrow" className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface-1 text-accent-2"><Icon name="check" size={24} /></span>
        <p className="eyebrow">{label}</p>
        <h1 className="text-3xl">Received. An engineer will reply within one business day.</h1>
        <p className="measure text-fg-2">If your request is time-sensitive, mention it in a follow-up and it will be prioritized. In the meantime, the resources below cover the questions most people ask before the first call.</p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/resources/cyber-resilience-readiness-checklist" icon="arrow-right">Readiness checklist</LinkButton>
          <LinkButton href="/resources/managed-it-vs-co-managed-it" variant="secondary">Managed vs co-managed IT</LinkButton>
        </div>
      </Container>
    </Section>
  );
}
