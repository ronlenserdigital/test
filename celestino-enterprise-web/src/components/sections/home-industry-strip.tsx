import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Photo } from "@/components/ui/photo";
import { Icon } from "@/components/icons/icon";
import { industries } from "@/content/industries";
import { homeIndustryImage } from "@/lib/images";

/** Five-up photo gallery of sectors served. Each tile links to the industry page. */
export function HomeIndustryStrip() {
  return (
    <Section theme="light" spacing="default" className="hairline-t">
      <Container width="wide">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Industries"
            title="Built for organizations that answer to regulators."
            lede="The controls, evidence and recovery objectives differ by sector. Each industry page maps the regulatory environment to the services that satisfy it."
          />
          <Link href="/industries" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover">
            All industries
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {industries.map((ind, i) => {
            const image = homeIndustryImage(i, ind.slug);
            return (
              <li key={ind.slug} data-reveal style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}>
                <Link href={`/industries/${ind.slug}`} className="group relative block overflow-hidden rounded-lg border border-line bg-surface-1">
                  {image ? (
                    <Photo image={image} ratio="4/5" sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw" className="rounded-none border-0 transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center text-accent">
                      <Icon name={ind.icon} size={32} />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0e13] via-[#0a0e13]/75 to-transparent p-4 pt-14 text-left">
                    <p className="font-display text-base font-semibold text-white">{ind.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/75">{ind.regulatory.slice(0, 2).map((r) => r.name).join(" · ")}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
