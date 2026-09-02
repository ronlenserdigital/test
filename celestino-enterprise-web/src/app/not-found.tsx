import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const links = [
    { label: "Services", href: "/services", detail: "Managed IT, cybersecurity, recovery, engineering" },
    { label: "Resources", href: "/resources", detail: "Decision guides and checklists" },
    { label: "Trust Center", href: "/trust", detail: "Security practices and policies" },
    { label: "Contact", href: "/contact", detail: "Talk to an engineer" },
  ];
  return (
    <Section theme="dark" grid className="flex min-h-[60vh] items-center">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-5">
          <p className="eyebrow">404 · Not found</p>
          <h1 className="text-4xl">That page does not exist at this address.</h1>
          <p className="measure text-md text-fg-2">
            The URL may have changed during the site rebuild. If you followed a link from another site, the destinations below cover everything published here.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/" icon="arrow-right">
              Go to the homepage
            </LinkButton>
            <LinkButton href="/contact" variant="secondary">
              Report a broken link
            </LinkButton>
          </div>
        </div>
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group flex items-center justify-between gap-4 p-5 hover:text-accent">
                <span className="flex flex-col">
                  <span className="font-medium text-fg">{l.label}</span>
                  <span className="text-sm text-fg-muted">{l.detail}</span>
                </span>
                <Icon name="arrow-right" size={18} className="text-fg-muted group-hover:text-accent" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
