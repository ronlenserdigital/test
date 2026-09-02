import type { Metadata } from "next";
import { SITE_URL, site } from "@/content/site";

export const DEFAULT_OG_IMAGE = "/opengraph-image";

interface PageMeta {
  title: string;
  description: string;
  path: string;
  /** Override the auto-generated OG image route. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noindex?: boolean;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Builds a complete Metadata object for a page. Canonical is always absolute.
 * Title templates are applied by the root layout (`%s | Celestino Enterprise`).
 */
export function buildMetadata({ title, description, path, image, type = "website", publishedTime, modifiedTime, authors, noindex }: PageMeta): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = image ?? `${path === "/" ? "" : path}/opengraph-image`.replace(/\/{2,}/g, "/");
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: site.name,
      locale: site.locale,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${title} · ${site.name}` }],
      ...(type === "article" ? { publishedTime, modifiedTime, authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

/** Truncates a description to a search-friendly length without cutting words. */
export function clampDescription(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + ".";
}
