import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, jetbrainsMono, manrope } from "@/lib/fonts";
import { SITE_URL, site } from "@/content/site";
import { primaryCta, primaryNav } from "@/content/navigation";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { UtilityRail } from "@/components/layout/utility-rail";
import { RevealObserver } from "@/components/motion/reveal";
import { Analytics } from "@/components/analytics/analytics";
import { JsonLd } from "@/components/seo/json-ld";
import { graph, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";

const isProduction = process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} | Managed IT, Cybersecurity & Secure Engineering`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  // Preview and staging deployments must never be indexed. Production sets NEXT_PUBLIC_SITE_ENV=production.
  robots: isProduction ? { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } : { index: false, follow: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon" }],
    apple: [{ url: "/apple-icon" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0e13",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} theme-dark h-full`}>
      <head>
        {/* Marks JS availability before first paint so reveal transitions never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <UtilityRail />
        <Header items={primaryNav} primaryCta={primaryCta} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <RevealObserver />
        <Analytics />
        <JsonLd data={graph(organizationJsonLd(), websiteJsonLd())} />
      </body>
    </html>
  );
}
