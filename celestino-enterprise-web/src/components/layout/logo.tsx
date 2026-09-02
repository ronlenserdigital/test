/**
 * Celestino wordmark with a layered-shield mark. The mark is original geometry:
 * three offset strata (infrastructure layers) inside a shield outline.
 * Verified brand assets from the client replace this file without touching callers.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact ? (
        <span className="font-display text-[1.05rem] font-bold leading-none tracking-tight">
          Celestino<span className="font-medium text-fg-2"> Enterprise</span>
        </span>
      ) : null}
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <path d="M16 2.5 4.5 6.8v8.4c0 6.7 4.7 12.5 11.5 14.3 6.8-1.8 11.5-7.6 11.5-14.3V6.8L16 2.5Z" fill="var(--surface-02)" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 12.2 16 9.6l6.5 2.6L16 14.8l-6.5-2.6Z" fill="var(--accent-primary)" />
      <path d="m9.5 16.4 6.5 2.6 6.5-2.6" fill="none" stroke="var(--accent-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.5 20.6 6.5 2.6 6.5-2.6" fill="none" stroke="var(--accent-primary)" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
