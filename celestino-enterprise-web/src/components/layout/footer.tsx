import Link from "next/link";
import { footerColumns } from "@/content/navigation";
import { site, hasVerifiedEmail, hasVerifiedPhone, socialLinks } from "@/content/site";
import { Logo } from "./logo";
import { Icon } from "@/components/icons/icon";

const socialLabels: Record<string, string> = { linkedin: "LinkedIn", facebook: "Facebook", x: "X", github: "GitHub" };

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="theme-dark border-t border-line bg-bg-2 text-fg-2">
      <div className="container-wide grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] lg:gap-8">
        <div className="flex max-w-xs flex-col gap-5">
          <Link href="/" className="text-fg" aria-label="Celestino Enterprise home">
            <Logo />
          </Link>
          <p className="text-sm leading-relaxed">
            Managed IT, cybersecurity, recovery and secure application engineering. Based in {site.address.addressLocality}, Virginia. Onsite support across the United States.
          </p>
          <address className="not-italic text-sm">
            <p className="flex items-center gap-2">
              <Icon name="pin" size={16} className="text-fg-muted" />
              {site.address.addressLocality}, {site.address.addressRegion} {site.address.postalCode}
            </p>
            {hasVerifiedPhone() ? (
              <p className="mt-1.5 flex items-center gap-2">
                <Icon name="phone" size={16} className="text-fg-muted" />
                <a href={`tel:${site.phone.value.replace(/[^\d+]/g, "")}`} data-event="phone_click" className="hover:text-fg">
                  {site.phone.value}
                </a>
              </p>
            ) : null}
            {hasVerifiedEmail() ? (
              <p className="mt-1.5 flex items-center gap-2">
                <Icon name="mail" size={16} className="text-fg-muted" />
                <a href={`mailto:${site.email.value}`} data-event="email_click" className="hover:text-fg">
                  {site.email.value}
                </a>
              </p>
            ) : null}
          </address>
          {socialLinks.length > 0 ? (
            <ul className="flex gap-3" aria-label="Social profiles">
              {socialLinks.map((s) => (
                <li key={s.key}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-fg">
                    {socialLabels[s.key] ?? s.key}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {footerColumns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="mono-label mb-4">{col.heading}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-wide flex flex-col gap-3 py-6 text-xs text-fg-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/privacy" className="hover:text-fg">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-fg">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/trust/accessibility" className="hover:text-fg">
                Accessibility
              </Link>
            </li>
            <li>
              <Link href="/trust/responsible-disclosure" className="hover:text-fg">
                Responsible disclosure
              </Link>
            </li>
            <li>
              <Link href="/sitemap.xml" className="hover:text-fg">
                Sitemap
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
