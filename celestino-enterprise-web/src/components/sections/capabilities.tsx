import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/icons/icon";
import { pillars, getServicesByPillar } from "@/content/services";
import { cn } from "@/lib/cn";

/**
 * Five capability groups in an asymmetric layout: Protect and Operate are the
 * lead groups (wider), Recover/Modernize/Build complete the model.
 */
export function Capabilities() {
  return (
    <Section theme="light" spacing="default">
      <Container>
        <SectionHeading
          eyebrow="What Celestino does"
          title="Five capability groups. One operating model."
          lede="Security, operations, recovery, modernization and engineering are usually bought from different vendors and never reconcile. Celestino runs them as one connected system, so a change in one layer is understood in all of them."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {pillars.map((p, i) => {
            const services = getServicesByPillar(p);
            const lead = i < 2;
            return (
              <article
                key={p.id}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}
                className={cn(
                  "flex flex-col rounded-lg border border-line bg-surface-1 p-6 md:p-7",
                  lead ? "md:col-span-3" : "md:col-span-2",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{p.label}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-2 text-fg-2">
                    <Icon name={p.icon} size={18} />
                  </span>
                </div>
                <h3 className="mt-5 text-xl">{p.title}</h3>
                <p className="mt-2 font-medium text-fg">{p.outcome}</p>
                <p className="mt-3 text-sm text-fg-2">{p.description}</p>
                <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/services/${s.slug}`} className="group flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-fg hover:text-accent">
                        {s.navLabel}
                        <Icon name="arrow-right" size={16} className="shrink-0 text-fg-muted transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:text-accent" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
