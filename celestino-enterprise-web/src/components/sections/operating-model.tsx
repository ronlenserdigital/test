"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";
import { STAGES } from "./operating-model-data";

/**
 * Interactive operating model. All stage summaries render statically; selecting a
 * stage reveals its inputs, outputs and evidence. Works with pointer, keyboard and touch.
 */
export function OperatingModel() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const stage = STAGES[active];

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = STAGES.length;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      document.getElementById(`${baseId}-tab-${next}`)?.focus();
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
      {/* Stage rail */}
      <div role="tablist" aria-label="Operating model stages" aria-orientation="vertical" className="relative flex flex-col">
        <span aria-hidden="true" className="absolute left-[1.35rem] top-6 bottom-6 w-px bg-line" />
        {STAGES.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
              id={`${baseId}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "group relative flex items-start gap-4 rounded-md px-2 py-3 text-left transition-colors duration-[var(--duration-fast)]",
                selected ? "text-fg" : "text-fg-2 hover:text-fg",
              )}
            >
              <span
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-bg transition-colors duration-[var(--duration-fast)]",
                  selected ? "border-accent text-accent" : "border-line-strong text-fg-muted group-hover:border-fg-muted",
                )}
              >
                <Icon name={s.icon} size={18} />
              </span>
              <span className="flex min-w-0 flex-col gap-1 pt-1">
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-xs tracking-[0.12em] text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-lg font-semibold">{s.label}</span>
                </span>
                <span className="text-sm text-fg-2">{s.summary}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="flex flex-col gap-6 rounded-lg border border-line bg-surface-1 p-6 md:p-8 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Stage {String(active + 1).padStart(2, "0")} · {stage.label}</p>
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden="true" />
            Evidence-producing
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mono-label mb-3">Inputs</p>
            <ul className="flex flex-col gap-2 text-sm text-fg-2">
              {stage.inputs.map((x) => (
                <li key={x} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-muted" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mono-label mb-3">Outputs</p>
            <ul className="flex flex-col gap-2 text-sm text-fg-2">
              {stage.outputs.map((x) => (
                <li key={x} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-line bg-bg-2 p-4">
          <p className="mono-label mb-1">What you can show an auditor</p>
          <p className="text-sm text-fg">{stage.evidence}</p>
        </div>
      </div>
    </div>
  );
}
