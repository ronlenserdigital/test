import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb";
import { Eyebrow } from "@/components/ui/heading";
import { LinkButton } from "@/components/ui/button";
import type { ReactNode } from "react";

interface PageHeroProps {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  intro?: string;
  actions?: { label: string; href: string; variant?: "primary" | "secondary"; event?: string }[];
  aside?: ReactNode;
  grid?: boolean;
}

export function PageHero({ crumbs, eyebrow, title, intro, actions, aside, grid = true }: PageHeroProps) {
  return (
    <Section theme="dark" spacing="none" grid={grid} className="hairline-b">
      <Container className="pb-14 pt-8 md:pb-20 md:pt-10">
        <Breadcrumb items={crumbs} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-end">
          <div className="flex flex-col gap-5">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <h1 className="text-4xl max-w-[18ch]">{title}</h1>
            {intro ? <p className="measure text-lg text-fg-2">{intro}</p> : null}
            {actions?.length ? (
              <div className="mt-2 flex flex-wrap gap-3">
                {actions.map((a) => (
                  <LinkButton key={a.href + a.label} href={a.href} variant={a.variant ?? "primary"} size="lg" icon={a.variant === "secondary" ? undefined : "arrow-right"} event={a.event}>
                    {a.label}
                  </LinkButton>
                ))}
              </div>
            ) : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      </Container>
    </Section>
  );
}
