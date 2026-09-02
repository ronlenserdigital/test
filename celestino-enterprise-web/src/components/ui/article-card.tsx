import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";
import type { Article } from "@/content/types";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article, featured = false, headingLevel: H = "h3" }: { article: Article; featured?: boolean; headingLevel?: "h2" | "h3" }) {
  return (
    <Link
      href={`/resources/${article.slug}`}
      className={cn(
        "group flex flex-col justify-between rounded-lg border border-line bg-surface-1 p-6 transition-colors duration-[var(--duration-base)] hover:border-accent md:p-7",
        featured && "lg:p-9",
      )}
    >
      <div>
        <p className="mono-label flex flex-wrap items-center gap-x-2">
          <span className="text-accent">{article.type.replace("-", " ")}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readingMinutes} min read</span>
        </p>
        <H className={cn("mt-4 group-hover:text-accent", featured ? "text-2xl" : "text-lg")}>{article.title}</H>
        <p className={cn("mt-3 text-fg-2", featured ? "text-base" : "text-sm")}>{article.description}</p>
      </div>
      <p className="mt-6 flex items-center justify-between text-xs text-fg-muted">
        <span>Reviewed {formatDate(article.reviewedAt)}</span>
        <Icon name="arrow-right" size={16} className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
