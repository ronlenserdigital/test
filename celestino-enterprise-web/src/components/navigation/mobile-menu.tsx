"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons/icon";
import { LinkButton } from "@/components/ui/button";
import type { NavItem } from "@/content/navigation";

interface MobileMenuProps {
  id: string;
  open: boolean;
  items: NavItem[];
  primaryCta: { label: string; href: string };
  onClose: () => void;
}

/**
 * Mobile navigation: a full-height panel below the header with grouped
 * accordions (native <details>), the CTA pinned at the bottom, scroll lock,
 * and focus moved into the panel while open.
 */
export function MobileMenu({ id, open, items, primaryCta, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button, summary");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      id={id}
      ref={panelRef}
      hidden={!open}
      className="theme-dark fixed inset-x-0 bottom-0 top-[var(--header-height)] z-40 flex flex-col overflow-y-auto bg-bg lg:hidden"
    >
      <nav aria-label="Mobile" className="container-x flex-1 py-4">
        <ul className="divide-y divide-line">
          {items.map((item) =>
            item.groups ? (
              <li key={item.label}>
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between py-3 text-lg font-medium text-fg">
                    {item.label}
                    <Icon name="chevron-down" size={20} className="text-fg-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="pb-4">
                    <Link href={item.href} onClick={onClose} className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                      All {item.label.toLowerCase()}
                      <Icon name="arrow-right" size={14} />
                    </Link>
                    {item.groups.map((group) => (
                      <div key={group.heading} className="mt-3">
                        <p className="mono-label mb-1">{group.heading}</p>
                        <ul>
                          {group.links.map((link) => (
                            <li key={link.href}>
                              <Link href={link.href} onClick={onClose} className="flex min-h-11 items-center gap-3 py-2 text-base text-fg-2 hover:text-fg">
                                {link.icon ? <Icon name={link.icon} size={18} className="text-accent" /> : null}
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              </li>
            ) : (
              <li key={item.label}>
                <Link href={item.href} onClick={onClose} className="flex min-h-14 items-center py-3 text-lg font-medium text-fg">
                  {item.label}
                </Link>
              </li>
            ),
          )}
          <li>
            <Link href="/contact" onClick={onClose} className="flex min-h-14 items-center py-3 text-lg font-medium text-fg">
              Contact
            </Link>
          </li>
        </ul>
      </nav>
      <div className="container-x sticky bottom-0 border-t border-line bg-bg py-4">
        <LinkButton href={primaryCta.href} size="lg" className="w-full" icon="arrow-right" event="nav_cta_click" onClick={onClose}>
          {primaryCta.label}
        </LinkButton>
      </div>
    </div>
  );
}
