import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { HeroVisual, HeroVisualCompact } from "./hero-visual";
import { primaryCta, secondaryCta } from "@/content/navigation";
import { site } from "@/content/site";
import { Icon } from "@/components/icons/icon";

export function HomeHero() {
  return (
    <Section theme="dark" spacing="none" grid className="overflow-hidden hairline-b">
      <Container width="wide" className="grid items-center gap-12 pb-16 pt-14 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:pb-24 lg:pt-24">
        <div className="flex max-w-[40rem] flex-col gap-7">
          <p className="eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden="true" />
            Managed IT · Cybersecurity · Recovery · Engineering
          </p>
          <h1 className="text-5xl">
            Secure infrastructure.
            <br />
            Resilient operations.
            <br />
            <span className="text-fg-2">One accountable team.</span>
          </h1>
          <p className="measure text-lg text-fg-2">
            Celestino protects, runs and recovers the technology mid-sized and regulated organizations depend on, and engineers the applications that run on it. Remote-first, with onsite response across the United States.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={primaryCta.href} size="lg" icon="arrow-right" event="nav_cta_click">
              {primaryCta.label}
            </LinkButton>
            <LinkButton href={secondaryCta.href} size="lg" variant="secondary" event="nav_cta_click">
              {secondaryCta.label}
            </LinkButton>
          </div>
          <ul className="mt-2 grid gap-x-8 gap-y-2 text-sm text-fg-2 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-accent" />
              {site.experienceYears.value} years of IT engineering experience
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-accent" />
              HIPAA, FINRA and SOX compliance support
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-accent" />
              Up to 24/7/365 proactive support
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-accent" />
              Nationwide emergency onsite support
            </li>
          </ul>
        </div>

        <div className="relative hidden justify-end lg:flex">
          <HeroVisual className="w-full" />
        </div>
        <div className="lg:hidden">
          <HeroVisualCompact className="mx-auto w-full max-w-md" />
        </div>
      </Container>
    </Section>
  );
}
