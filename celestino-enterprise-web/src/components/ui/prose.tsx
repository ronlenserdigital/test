import { inlineMarkdown } from "@/lib/inline-markdown";
import { cn } from "@/lib/cn";

/** Renders plain-text paragraphs (with inline markdown links/bold) inside the prose style. */
export function Prose({ paragraphs, className }: { paragraphs: string[]; className?: string }) {
  return (
    <div className={cn("prose-c", className)}>
      {paragraphs.map((p, i) => (
        <p key={i}>{inlineMarkdown(p)}</p>
      ))}
    </div>
  );
}
