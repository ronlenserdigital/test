import Link from "next/link";
import { site, hasVerifiedPhone } from "@/content/site";
import { Icon } from "@/components/icons/icon";

/**
 * Top utility rail. Renders only verified items; returns null when nothing is verified
 * so the layout never shows an empty bar.
 */
export function UtilityRail() {
  const items: { label: string; href: string; icon: "phone" | "alert" | "lock" | "building"; event?: string; external?: boolean }[] = [];

  if (hasVerifiedPhone()) {
    items.push({ label: site.phone.value, href: `tel:${site.phone.value.replace(/[^\d+]/g, "")}`, icon: "phone", event: "phone_click" });
  }
  if (site.utility.incidentLine.verified && site.utility.incidentLine.value) {
    items.push({ label: "Need urgent support?", href: site.utility.incidentLine.value, icon: "alert" });
  }
  if (site.utility.clientPortalUrl.verified && site.utility.clientPortalUrl.value) {
    items.push({ label: "Client portal", href: site.utility.clientPortalUrl.value, icon: "lock", external: true });
  }
  if (site.government.servesPublicSector.verified && site.government.servesPublicSector.value) {
    items.push({ label: "Government & public sector", href: "/government", icon: "building" });
  }

  if (items.length === 0) return null;

  return (
    <div className="theme-dark hidden border-b border-line bg-bg-2 text-xs text-fg-2 md:block">
      <div className="container-wide flex h-[var(--utility-height)] items-center justify-end gap-6">
        {items.map((item) =>
          item.href.startsWith("/") ? (
            <Link key={item.label} href={item.href} className="inline-flex items-center gap-1.5 hover:text-fg" data-event={item.event}>
              <Icon name={item.icon} size={14} />
              {item.label}
            </Link>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-1.5 hover:text-fg"
              data-event={item.event}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </a>
          ),
        )}
      </div>
    </div>
  );
}
