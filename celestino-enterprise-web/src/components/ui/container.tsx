import { cn } from "@/lib/cn";
import type { ElementType, HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  width?: "default" | "wide" | "narrow";
}

export function Container({ as: Tag = "div", width = "default", className, ...rest }: ContainerProps) {
  const w = width === "wide" ? "container-wide" : width === "narrow" ? "container-narrow" : "container-x";
  return <Tag className={cn(w, className)} {...rest} />;
}
