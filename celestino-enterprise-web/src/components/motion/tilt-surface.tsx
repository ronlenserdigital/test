"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Subtle 3D tilt that follows the pointer. Only active for fine pointers with
 * motion allowed; otherwise it is a plain wrapper. Uses transform only.
 */
export function TiltSurface({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const parent = el.parentElement ?? el;
    let raf = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      raf = 0;
      el.style.transform = `perspective(1400px) rotateX(${ty}deg) rotateY(${tx}deg)`;
    };
    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 6;
      ty = -py * 5;
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    parent.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerleave", onLeave);
    return () => {
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={cn("will-change-transform transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)]", className)}>
      {children}
    </div>
  );
}
