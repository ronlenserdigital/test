/** Canonical list of indexable routes, derived from content so tests stay in sync. */
import { services } from "../src/content/services";
import { solutions } from "../src/content/solutions";
import { industries } from "../src/content/industries";
import { articles, articleCategories, getArticlesByCategory } from "../src/content/articles";
import { trustSections } from "../src/content/trust";

export const staticRoutes = ["/", "/services", "/solutions", "/industries", "/government", "/about", "/approach", "/nationwide-support", "/trust", "/resources", "/case-studies", "/contact", "/privacy", "/terms", "/authors/celestino-engineering"];

export const allRoutes = [
  ...staticRoutes,
  ...services.map((s) => `/services/${s.slug}`),
  ...solutions.map((s) => `/solutions/${s.slug}`),
  ...industries.map((i) => `/industries/${i.slug}`),
  ...trustSections.map((t) => `/trust/${t.slug}`),
  ...articleCategories.filter((c) => getArticlesByCategory(c.slug).length).map((c) => `/resources/topics/${c.slug}`),
  ...articles.map((a) => `/resources/${a.slug}`),
];

export const sampleRoutes = ["/", "/services", "/services/cybersecurity", "/solutions/cyber-resilience", "/industries/healthcare", "/government", "/trust", "/resources", "/resources/backup-vs-disaster-recovery", "/contact", "/about"];
