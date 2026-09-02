import { cn } from "@/lib/cn";

interface StatProps {
  value: string;
  label: string;
  detail?: string;
  className?: string;
}

/** Only render with verified values. See src/content/site.ts. */
export function Stat({ value, label, detail, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-display text-3xl font-semibold tracking-tight text-fg">{value}</span>
      <span className="text-sm font-medium text-fg-2">{label}</span>
      {detail ? <span className="text-xs text-fg-muted">{detail}</span> : null}
    </div>
  );
}
