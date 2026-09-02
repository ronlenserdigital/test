import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { LogoStrip } from "@/components/ui/logo-strip";
import { site } from "@/content/site";
import { Icon } from "@/components/icons/icon";
import type { IconName } from "@/components/icons/icon-names";

/**
 * Trust layer directly after the hero. Every item is a verified claim from the
 * existing site or a factual statement about how Celestino works. Partner logos
 * and certifications appear automatically once verified in site.ts.
 */
export function TrustLayer() {
  const items: { icon: IconName; title: string; detail: string; href?: string }[] = [
    { icon: "clock", title: `${site.experienceYears.value} years`, detail: "of IT engineering experience across infrastructure, security and software." },
    { icon: "globe", title: "Nationwide onsite", detail: "Remote-first operations with emergency onsite response anywhere in the US.", href: "/nationwide-support" },
    { icon: "document", title: "HIPAA · FINRA · SOX", detail: "Compliance support built into managed operations, not sold separately.", href: "/services/security-risk-advisory" },
    { icon: "shield-check", title: "Trust Center", detail: "Security practices, data handling and disclosure published, not implied.", href: "/trust" },
  ];
  const hasPartners = site.partners.some((p) => p.verified);
  return (
    <Section theme="dark" spacing="none" className="hairline-b bg-bg-2">
      <Container width="wide" className="py-8 md:py-10">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {items.map((it) => {
            const body = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-1 text-accent">
                  <Icon name={it.icon} size={18} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-display text-base font-semibold text-fg">{it.title}</span>
                  <span className="text-sm text-fg-2">{it.detail}</span>
                </span>
              </>
            );
            return (
              <li key={it.title}>
                {it.href ? (
                  <Link href={it.href} className="flex gap-3 rounded-md hover:text-accent">
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        {hasPartners ? (
          <div className="mt-8 border-t border-line pt-8">
            <LogoStrip />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
