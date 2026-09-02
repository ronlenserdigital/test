"use client";

import { useEffect } from "react";

/**
 * Reveal-on-scroll engine.
 *
 * Elements marked [data-reveal] start hidden only when `.js` is on <html>
 * (set before paint by the root layout) and motion is allowed. This engine adds
 * `.is-visible` when they enter the viewport.
 *
 * It is a document-level singleton installed once and never torn down, so it is
 * independent of React effect timing, route transitions and streaming:
 *  1. IntersectionObserver reveals elements as they intersect.
 *  2. MutationObserver observes any [data-reveal] node added later (client-side
 *     navigation, suspense boundaries, state changes).
 *  3. A scroll/resize-driven sweep reveals anything in the viewport that the
 *     observer has not yet handled, so a missed callback cannot hide content.
 */

const SELECTOR = "[data-reveal]:not(.is-visible)";

declare global {
  interface Window {
    __celestinoReveal?: true;
  }
}

function installRevealEngine(): void {
  if (window.__celestinoReveal) return;
  window.__celestinoReveal = true;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const showAll = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => el.classList.add("is-visible"));

  if (reduce || !("IntersectionObserver" in window)) {
    showAll();
    new MutationObserver(showAll).observe(document.documentElement, { childList: true, subtree: true });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
  );

  const observeWithin = (root: ParentNode | Element) => {
    if (root instanceof Element && root.matches(SELECTOR)) io.observe(root);
    root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
  };

  // Sweep: reveal anything currently within the viewport. Used as a fallback on
  // scroll, resize and after DOM mutations.
  let rafId = 0;
  const sweep = () => {
    rafId = 0;
    const vh = window.innerHeight;
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh * 1.02) {
        el.classList.add("is-visible");
        io.unobserve(el);
      }
    });
  };
  const scheduleSweep = () => {
    if (!rafId) rafId = window.requestAnimationFrame(sweep);
  };

  observeWithin(document);
  scheduleSweep();

  new MutationObserver((records) => {
    let added = false;
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n instanceof Element) {
          observeWithin(n);
          added = true;
        }
      });
    }
    if (added) {
      scheduleSweep();
      // Second pass after layout settles (fonts, images, streamed content).
      window.setTimeout(scheduleSweep, 250);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("scroll", scheduleSweep, { passive: true });
  window.addEventListener("resize", scheduleSweep, { passive: true });
  window.addEventListener("pageshow", scheduleSweep);
}

export function RevealObserver() {
  useEffect(() => {
    installRevealEngine();
  }, []);
  return null;
}
