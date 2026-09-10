import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Photo } from "@/components/ui/photo";
import { firstImage, getImage, getCardImage } from "@/lib/images";

/**
 * Three-up photo band: what the work looks like. Renders only when at least
 * one photo exists. Captions carry the claim; the photo carries the proof.
 */
export function PhotoMosaic() {
  const tiles = [
    { image: firstImage("home-tile-onsite", "nationwide-support-hero"), label: "Onsite anywhere in the US", detail: "Remote-first operations with field response for the work that needs hands on a rack." },
    { image: getImage("home-tile-standards") ?? getCardImage("service-network-management"), label: "Documented to a standard", detail: "Labeled cabling, current diagrams and configuration under version control." },
    { image: firstImage("home-tile-evidence", "approach-hero"), label: "Evidence at every stage", detail: "Assessment reports, runbooks and review minutes an auditor can read." },
  ].filter((t) => t.image);
  if (!tiles.length) return null;
  return (
    <Section theme="dark" spacing="none" className="hairline-b">
      <Container width="wide" className="grid gap-4 py-4 md:grid-cols-3">
        {tiles.map((t, i) => (
          <figure key={t.label} className="group relative overflow-hidden rounded-lg" data-reveal style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}>
            <Photo image={t.image} ratio="4/5" sizes="(min-width: 768px) 33vw, 100vw" className="rounded-lg border-0 md:aspect-[5/4] lg:aspect-[4/3]" />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent p-5 pt-16">
              <p className="font-display text-base font-semibold text-fg">{t.label}</p>
              <p className="mt-1 text-sm text-fg-2">{t.detail}</p>
            </figcaption>
          </figure>
        ))}
      </Container>
    </Section>
  );
}
