import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons/icon";
import type { IconName } from "@/components/icons/icon-names";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-[background-color,color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover rounded-md",
  secondary: "border border-line-strong text-fg hover:border-fg-2 hover:bg-surface-2 rounded-md",
  ghost: "text-fg-2 hover:text-fg hover:bg-surface-2 rounded-md",
  link: "text-accent hover:text-accent-hover underline-offset-4 hover:underline px-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: "left" | "right";
  className?: string;
  children: ReactNode;
  /** Analytics event name, emitted via delegated listener. */
  event?: string;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  className,
  children,
  event,
  external,
  ...rest
}: CommonProps & { href: string; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const cls = cn(base, variants[variant], variant !== "link" && sizes[size], className);
  const content = (
    <>
      {icon && iconPosition === "left" ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
      {icon && iconPosition === "right" ? <Icon name={icon} size={18} /> : null}
    </>
  );
  if (external) {
    return (
      <a href={href} className={cls} data-event={event} target="_blank" rel="noopener noreferrer" {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} data-event={event} {...rest}>
      {content}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  className,
  children,
  event,
  type = "button",
  ...rest
}: CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button type={type} className={cn(base, variants[variant], variant !== "link" && sizes[size], className)} data-event={event} {...rest}>
      {icon && iconPosition === "left" ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
      {icon && iconPosition === "right" ? <Icon name={icon} size={18} /> : null}
    </button>
  );
}
