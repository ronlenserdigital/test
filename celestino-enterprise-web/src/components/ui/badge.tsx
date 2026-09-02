import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line text-fg-2 bg-surface-2",
  accent: "border-transparent text-accent bg-accent-soft",
  success: "border-transparent text-success bg-accent-2-soft",
  warning: "border-transparent text-warning bg-surface-2",
  danger: "border-transparent text-danger bg-surface-2",
};

export function Badge({ tone = "neutral", children, className, mono = true }: { tone?: Tone; children: ReactNode; className?: string; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs",
        mono && "font-mono uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
