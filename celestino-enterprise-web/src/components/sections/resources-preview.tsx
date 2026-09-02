import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { LinkButton } from "@/components/ui/button";
import { ArticleCard } from "@/components/ui/article-card";
import type { Article } from "@/content/types";

export function ResourcesPreview({ articles }: { articles: Article[] }) {
  if (!articles.length) return null;
  const [lead, ...rest] = articles;
  return (
    <Section theme="light" spacing="default" className="hairline-t">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Resources"
            title="Decision guides written by engineers, not marketers."
            lede="Operating-model comparisons, readiness checklists and framework implementation sequences you can act on before you talk to anyone."
          />
          <LinkButton href="/resources" variant="secondary" icon="arrow-right" className="shrink-0">
            All resources
          </LinkButton>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <ArticleCard article={lead} featured />
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {rest.slice(0, 4).map((a) => (
              <li key={a.slug}>
                <Link href={`/resources/${a.slug}`} className="group flex flex-col gap-1 py-4">
                  <span className="mono-label">{a.type.replace("-", " ")} · {a.readingMinutes} min</span>
                  <span className="font-display text-base font-semibold text-fg group-hover:text-accent">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
