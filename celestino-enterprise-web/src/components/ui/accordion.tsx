import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  name?: string;
  open?: boolean;
  className?: string;
  headingLevel?: "h3" | "h4";
}

/** Native <details> accordion: keyboard and screen-reader behavior come from the platform. */
export function AccordionItem({ title, children, name, open, className, headingLevel: H = "h3" }: AccordionItemProps) {
  return (
    <details name={name} open={open} className={cn("group border-b border-line", className)}>
      <summary className="flex cursor-pointer items-start justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
        <H className="text-base font-semibold text-fg md:text-md">{title}</H>
        <Icon
          name="chevron-down"
          size={18}
          className="mt-1 shrink-0 text-fg-muted transition-transform duration-[var(--duration-base)] group-open:rotate-180"
        />
      </summary>
      <div className="pb-6 text-fg-2 measure">{children}</div>
    </details>
  );
}
