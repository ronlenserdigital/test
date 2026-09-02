"use client";

import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/content/navigation";

interface MegaPanelProps {
  id: string;
  item: NavItem;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: () => void;
}

export function MegaPanel({ id, item, open, onMouseEnter, onMouseLeave, onNavigate }: MegaPanelProps) {
  const groups = item.groups ?? [];
  const cols = groups.length + (item.feature ? 1 : 0);
  return (
    <div
      id={id}
      hidden={!open}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "absolute inset-x-0 top-full hidden border-b border-line bg-bg-2 shadow-lg lg:block",
        open ? "animate-[panel-in_var(--duration-base)_var(--ease-out)]" : "",
      )}
    >
      <div
        className="container-wide grid gap-8 py-8"
        style={{ gridTemplateColumns: `repeat(${Math.max(cols, 2)}, minmax(0, 1fr))` }}
      >
        {groups.map((group) => (
          <div key={group.heading} className={cn(group.links.length > 4 && cols <= 2 && "col-span-2")}>
            <p className="mono-label mb-3">{group.heading}</p>
            <ul className={cn("flex flex-col", group.links.length > 4 && cols <= 2 && "grid grid-cols-2 gap-x-6")}>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className="group flex gap-3 rounded-md px-2 py-2.5 -mx-2 hover:bg-surface-2 focus-visible:bg-surface-2"
                  >
                    {link.icon ? (
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line bg-surface-1 text-accent">
                        <Icon name={link.icon} size={16} />
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-fg">{link.label}</span>
                      {link.description ? <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">{link.description}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {item.feature ? (
          <Link
            href={item.feature.href}
            onClick={onNavigate}
            className="group flex flex-col justify-between rounded-lg border border-line bg-surface-1 p-5 hover:border-accent"
          >
            <div>
              <p className="eyebrow mb-3">{item.feature.eyebrow}</p>
              <p className="font-display text-lg font-semibold leading-snug text-fg">{item.feature.title}</p>
              <p className="mt-2 text-sm text-fg-2">{item.feature.description}</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              {item.feature.cta}
              <Icon name="arrow-right" size={16} className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
