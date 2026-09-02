import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/icons/icon";
import type { IconName } from "@/components/icons/icon-names";

export interface RelatedGroup {
  heading: string;
  links: { label: string; href: string; description?: string; icon?: IconName }[];
}

/** Cross-cluster links: services ↔ solutions ↔ industries ↔ articles. Real anchors, crawlable. */
export function RelatedLinks({ groups, theme = "light" }: { groups: RelatedGroup[]; theme?: "light" | "dark" }) {
  const filled = groups.filter((g) => g.links.length);
  if (!filled.length) return null;
  return (
    <Section theme={theme} spacing="sm" className="hairline-t">
      <Container className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {filled.map((g) => (
          <nav key={g.heading} aria-label={g.heading}>
            <p className="mono-label mb-4">{g.heading}</p>
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-start gap-3 py-3.5 text-fg hover:text-accent">
                    {l.icon ? <Icon name={l.icon} size={18} className="mt-0.5 shrink-0 text-accent" /> : null}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{l.label}</span>
                      {l.description ? <span className="mt-0.5 text-xs text-fg-muted">{l.description}</span> : null}
                    </span>
                    <Icon name="arrow-up-right" size={16} className="mt-0.5 shrink-0 text-fg-muted transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
    </Section>
  );
}
