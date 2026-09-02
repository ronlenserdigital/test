import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";
import { services } from "@/content/services";
import { solutions } from "@/content/solutions";
import { industries } from "@/content/industries";
import { articles, articleCategories, getArticlesByCategory } from "@/content/articles";
import { authors } from "@/content/authors";
import { trustSections } from "@/content/trust";
import { publishedCaseStudies } from "@/content/case-studies";

/**
 * Content last-modified dates. Static pages use the date their content was last
 * edited in this repository (CONTENT_UPDATED), not the build time, so lastmod is
 * not faked on every deployment. Articles use their reviewedAt date.
 */
const CONTENT_UPDATED = "2026-09-02";

type Entry = MetadataRoute.Sitemap[number];
const entry = (path: string, priority: number, changeFrequency: Entry["changeFrequency"], lastModified = CONTENT_UPDATED): Entry => ({
  url: `${SITE_URL}${path}`,
  lastModified,
  changeFrequency,
  priority,
});

export default function sitemap(): MetadataRoute.Sitemap {
  const core: Entry[] = [
    entry("/", 1, "weekly"),
    entry("/services", 0.9, "monthly"),
    entry("/solutions", 0.8, "monthly"),
    entry("/industries", 0.8, "monthly"),
    entry("/government", 0.8, "monthly"),
    entry("/about", 0.6, "monthly"),
    entry("/approach", 0.6, "monthly"),
    entry("/nationwide-support", 0.6, "monthly"),
    entry("/trust", 0.7, "monthly"),
    entry("/resources", 0.8, "weekly"),
    entry("/case-studies", 0.6, "monthly"),
    entry("/contact", 0.7, "yearly"),
    entry("/privacy", 0.2, "yearly"),
    entry("/terms", 0.2, "yearly"),
  ];
  const svc = services.map((s) => entry(`/services/${s.slug}`, 0.9, "monthly"));
  const sol = solutions.map((s) => entry(`/solutions/${s.slug}`, 0.8, "monthly"));
  const ind = industries.map((i) => entry(`/industries/${i.slug}`, 0.8, "monthly"));
  const trust = trustSections.map((t) => entry(`/trust/${t.slug}`, 0.5, "monthly"));
  const topics = articleCategories.filter((c) => getArticlesByCategory(c.slug).length > 0).map((c) => entry(`/resources/topics/${c.slug}`, 0.6, "weekly"));
  const posts = articles.map((a) => entry(`/resources/${a.slug}`, 0.7, "monthly", a.reviewedAt));
  const auth = authors.filter((a) => a.verified).map((a) => entry(`/authors/${a.slug}`, 0.3, "monthly"));
  const cases = publishedCaseStudies.map((c) => entry(`/case-studies/${c.slug}`, 0.7, "monthly", c.publishedAt));
  return [...core, ...svc, ...sol, ...ind, ...trust, ...topics, ...posts, ...auth, ...cases];
}
