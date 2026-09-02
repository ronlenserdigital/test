import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  theme?: "dark" | "light";
  spacing?: "default" | "sm" | "none";
  grid?: boolean;
  bleedTop?: boolean;
}

/**
 * Section owns the surface theme. Children consume semantic tokens, so the same
 * component renders correctly on either surface.
 */
export function Section({ theme = "dark", spacing = "default", grid = false, className, ...rest }: SectionProps) {
  return (
    <section
      className={cn(
        theme === "light" ? "theme-light" : "theme-dark",
        "relative bg-bg text-fg",
        spacing === "default" && "section-y",
        spacing === "sm" && "section-y-sm",
        grid && "grid-backdrop",
        className,
      )}
      {...rest}
    />
  );
}
