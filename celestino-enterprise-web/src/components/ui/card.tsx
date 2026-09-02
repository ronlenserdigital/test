import Link from "next/link";
import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const pad = { sm: "p-5", md: "p-6 md:p-7", lg: "p-7 md:p-9" };

export function Card({ padding = "md", interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface-1",
        pad[padding],
        interactive && "transition-colors duration-[var(--duration-base)] hover:border-line-strong",
        className,
      )}
      {...rest}
    />
  );
}

/** Whole-card link with a single accessible name (the title). */
export function LinkCard({
  href,
  title,
  children,
  className,
  padding = "md",
  event,
}: {
  href: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  event?: string;
}) {
  return (
    <Link
      href={href}
      data-event={event}
      className={cn(
        "group relative flex flex-col rounded-lg border border-line bg-surface-1 no-underline transition-colors duration-[var(--duration-base)] hover:border-accent focus-visible:border-accent",
        pad[padding],
        className,
      )}
    >
      {title}
      {children}
    </Link>
  );
}
