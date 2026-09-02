import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

const isProduction = process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_SITE_ENV === "production";

/**
 * Production allows crawling of everything public and references the sitemap.
 * Preview/staging deployments disallow all crawling so they are never indexed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/contact/thanks", "/_next/static/chunks/*.map"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
