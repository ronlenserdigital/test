/**
 * Analytics event taxonomy. Names match docs/seo/measurement-plan.md.
 * Events are emitted by `data-event` attributes via the delegated listener in
 * components/analytics/analytics.tsx, or programmatically with `track()`.
 */
export const EVENTS = [
  "nav_cta_click",
  "service_cta_click",
  "assessment_start",
  "assessment_submit",
  "contact_start",
  "contact_submit",
  "phone_click",
  "email_click",
  "case_study_view",
  "resource_download",
  "outbound_partner_click",
  "government_capability_download",
] as const;

export type EventName = (typeof EVENTS)[number];

export type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const allowed = new Set<string>(EVENTS);

/** Sends an event to GA4 (if configured) and Vercel Analytics (if loaded). Never sends form contents. */
export function track(name: EventName | string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  if (!allowed.has(name)) return;
  const safe: EventParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (typeof v === "string" && v.length > 100) continue;
    safe[k] = v;
  }
  window.gtag?.("event", name, safe);
  window.dispatchEvent(new CustomEvent("celestino:track", { detail: { name, params: safe } }));
}
