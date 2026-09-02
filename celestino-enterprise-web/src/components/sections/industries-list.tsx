import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { industries } from "@/content/industries";

/** Industries as an editorial list with the regulatory context, not a card grid. */
export function IndustriesList() {
  return (
    <Section theme="light" spacing="default" className="hairline-t">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <SectionHeading
          eyebrow="Industries"
          title="Built for organizations that answer to regulators."
          lede="The controls, evidence and recovery objectives differ by sector. Each industry page maps the regulatory environment to the services that satisfy it."
        />
        <ul className="divide-y divide-line border-y border-line">
          {industries.map((ind, i) => (
            <li key={ind.slug} data-reveal style={{ ["--reveal-delay" as string]: `${i * 50}ms` }}>
              <Link href={`/industries/${ind.slug}`} className="group grid gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-1 text-accent">
                  <Icon name={ind.icon} size={20} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-lg font-semibold text-fg group-hover:text-accent">{ind.name}</span>
                  <span className="text-sm text-fg-2">{ind.shortDescription}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {ind.regulatory.slice(0, 3).map((r) => (
                      <span key={r.name} className="rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-fg-muted">
                        {r.name}
                      </span>
                    ))}
                  </span>
                </span>
                <Icon name="arrow-right" size={18} className="hidden text-fg-muted transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:text-accent sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
