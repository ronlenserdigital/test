"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/content/navigation";
import { Logo } from "@/components/layout/logo";
import { MobileMenu } from "./mobile-menu";
import { MegaPanel } from "./mega-panel";

interface HeaderProps {
  items: NavItem[];
  primaryCta: { label: string; href: string };
}

const OPEN_DELAY = 110;
const CLOSE_DELAY = 160;

export function Header({ items, primaryCta }: HeaderProps) {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const baseId = useId();

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const open = useCallback((i: number) => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpenIndex(i), OPEN_DELAY);
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpenIndex(null), CLOSE_DELAY);
  }, []);

  const closeNow = useCallback(() => {
    clearTimers();
    setOpenIndex(null);
  }, []);

  // Close on route change (derived during render, no effect needed).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpenIndex(null);
    setMobileOpen(false);
  }

  // Scroll state for elevation.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape + outside click.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeNow();
        const trigger = navRef.current?.querySelectorAll<HTMLButtonElement>("[data-nav-trigger]")[openIndex];
        trigger?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) closeNow();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [openIndex, closeNow]);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const triggers = Array.from(navRef.current?.querySelectorAll<HTMLButtonElement>("[data-nav-trigger]") ?? []);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      triggers[(i + 1) % triggers.length]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      triggers[(i - 1 + triggers.length) % triggers.length]?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      clearTimers();
      setOpenIndex(i);
      window.requestAnimationFrame(() => {
        document.getElementById(`${baseId}-panel-${i}`)?.querySelector<HTMLElement>("a")?.focus();
      });
    }
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "theme-dark sticky top-0 z-50 border-b transition-[background-color,border-color] duration-[var(--duration-base)]",
        scrolled || openIndex !== null ? "border-line bg-bg/95 backdrop-blur-md" : "border-transparent bg-bg",
      )}
    >
      <nav ref={navRef} aria-label="Primary" className="container-wide flex h-[var(--header-height)] items-center gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-fg" aria-label="Celestino Enterprise home">
          <Logo />
        </Link>

        <ul className="ml-2 hidden h-full items-stretch gap-0.5 lg:flex" onMouseLeave={scheduleClose}>
          {items.map((item, i) => {
            const hasPanel = Boolean(item.groups?.length);
            const expanded = openIndex === i;
            return (
              <li key={item.label} className="relative flex items-stretch" onMouseEnter={() => (hasPanel ? open(i) : closeNow())}>
                {hasPanel ? (
                  <button
                    type="button"
                    data-nav-trigger
                    aria-expanded={expanded}
                    aria-controls={`${baseId}-panel-${i}`}
                    onClick={() => (expanded ? closeNow() : (clearTimers(), setOpenIndex(i)))}
                    onKeyDown={(e) => onTriggerKey(e, i)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-3 text-sm font-medium text-fg-2 transition-colors hover:text-fg",
                      (expanded || isActive(item.href)) && "text-fg",
                    )}
                  >
                    {item.label}
                    <Icon name="chevron-down" size={14} className={cn("transition-transform duration-[var(--duration-fast)]", expanded && "rotate-180")} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn("flex items-center rounded-md px-3 text-sm font-medium text-fg-2 hover:text-fg", isActive(item.href) && "text-fg")}
                  >
                    {item.label}
                  </Link>
                )}
                {/* Active indicator */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-x-3 bottom-0 h-0.5 bg-accent transition-opacity duration-[var(--duration-fast)]",
                    expanded || isActive(item.href) ? "opacity-100" : "opacity-0",
                  )}
                />
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/contact" className="hidden rounded-md px-3 py-2 text-sm font-medium text-fg-2 hover:text-fg md:inline-flex">
            Contact
          </Link>
          {/* Wrapped so display utilities never compete with the button's own display class. */}
          <span className="hidden sm:block">
            <LinkButton href={primaryCta.href} size="sm" event="nav_cta_click">
              {primaryCta.label}
            </LinkButton>
          </span>
          <span className="sm:hidden">
            <LinkButton href={primaryCta.href} size="sm" event="nav_cta_click" aria-label={primaryCta.label}>
              Assessment
            </LinkButton>
          </span>
          <button
            type="button"
            className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-md text-fg hover:bg-surface-2 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={22} />
          </button>
        </div>
      </nav>

      {/* Desktop mega panels */}
      {items.map((item, i) =>
        item.groups ? (
          <MegaPanel
            key={item.label}
            id={`${baseId}-panel-${i}`}
            item={item}
            open={openIndex === i}
            onMouseEnter={clearTimers}
            onMouseLeave={scheduleClose}
            onNavigate={closeNow}
          />
        ) : null,
      )}

      <MobileMenu id="mobile-menu" open={mobileOpen} items={items} primaryCta={primaryCta} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
