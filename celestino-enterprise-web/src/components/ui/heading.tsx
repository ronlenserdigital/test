import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Eyebrow({ children, className, as: Tag = "p" }: { children: ReactNode; className?: string; as?: "p" | "span" | "div" }) {
  return <Tag className={cn("eyebrow", className)}>{children}</Tag>;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  size?: "lg" | "md";
  className?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, title, lede, align = "left", as: Tag = "h2", size = "lg", className, id }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={cn(size === "lg" ? "text-3xl" : "text-2xl", "max-w-[22ch]")}>
        {title}
      </Tag>
      {lede ? <p className="measure text-md text-fg-2">{lede}</p> : null}
    </div>
  );
}
