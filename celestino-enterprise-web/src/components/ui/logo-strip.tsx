import { site } from "@/content/site";

/**
 * Partner / customer logo strip. Renders nothing until verified partners exist;
 * the calling section decides whether to show a placeholder explanation.
 */
export function LogoStrip() {
  const partners = site.partners.filter((p) => p.verified);
  if (partners.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-10 gap-y-6" aria-label="Technology partners">
      {partners.map((p) => (
        <li key={p.name} className="text-sm font-medium text-fg-2">
          {p.name}
          {p.tier ? <span className="ml-1 text-fg-muted">· {p.tier}</span> : null}
        </li>
      ))}
    </ul>
  );
}
