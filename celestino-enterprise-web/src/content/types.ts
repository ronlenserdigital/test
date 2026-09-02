import type { IconName } from "@/components/icons/icon-names";

export type Pillar = "protect" | "operate" | "resilience" | "modernize" | "build";

export interface PillarDef {
  id: Pillar;
  label: string;
  title: string;
  outcome: string;
  description: string;
  icon: IconName;
  serviceSlugs: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServiceCapability {
  title: string;
  description: string;
}

export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  shortDescription: string;
  pillar: Pillar;
  icon: IconName;
  /** True when the existing site explicitly lists this service. */
  verifiedOnExistingSite: boolean;
  seo: {
    title: string;
    description: string;
    primaryKeyword: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    intro: string;
  };
  /** Who this is for and the operational problem it solves. */
  fit: string[];
  capabilities: ServiceCapability[];
  /** How engagement works, in sequence. */
  engagement: { step: string; detail: string }[];
  outcomes: string[];
  faqs: FAQ[];
  relatedServiceSlugs: string[];
  relatedSolutionSlugs: string[];
  relatedIndustrySlugs: string[];
  relatedArticleSlugs: string[];
}

export interface Solution {
  slug: string;
  name: string;
  shortDescription: string;
  icon: IconName;
  seo: { title: string; description: string; primaryKeyword: string };
  hero: { eyebrow: string; headline: string; intro: string };
  problem: string;
  approach: { title: string; detail: string }[];
  serviceSlugs: string[];
  industrySlugs: string[];
  articleSlugs: string[];
  faqs: FAQ[];
}

export interface Industry {
  slug: string;
  name: string;
  shortDescription: string;
  icon: IconName;
  /** True when Celestino's existing materials document experience in this sector. */
  experienceVerified: boolean;
  seo: { title: string; description: string; primaryKeyword: string };
  hero: { eyebrow: string; headline: string; intro: string };
  challenges: { title: string; detail: string }[];
  regulatory: { name: string; summary: string }[];
  solutionSlugs: string[];
  serviceSlugs: string[];
  articleSlugs: string[];
  faqs: FAQ[];
}

export type ArticleCategory =
  | "cybersecurity"
  | "it-operations"
  | "cloud"
  | "compliance"
  | "resilience"
  | "government-technology"
  | "software-engineering"
  | "ai-automation";

export interface ArticleSection {
  heading: string;
  id: string;
  body: string[]; // paragraphs (plain text; inline links written as [text](/path))
  list?: string[];
  table?: { headers: string[]; rows: string[][] };
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: ArticleCategory;
  type: "guide" | "decision-guide" | "checklist" | "framework" | "commentary";
  authorId: string;
  publishedAt: string; // ISO date
  reviewedAt: string; // ISO date
  readingMinutes: number;
  summary: string; // direct answer, 2-3 sentences
  sections: ArticleSection[];
  keyTakeaways: string[];
  references?: { label: string; url: string }[];
  relatedServiceSlugs: string[];
  relatedArticleSlugs: string[];
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  credentials: string[];
  isOrganization: boolean;
  verified: boolean;
  url?: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  industrySlug: string;
  serviceSlugs: string[];
  summary: string;
  challenge: string;
  environment: string;
  risk: string;
  solution: string;
  implementation: string[];
  outcome: string[];
  technology: string[];
  testimonial?: { quote: string; name: string; role: string };
  publishedAt: string;
  /** Only published when true. */
  verified: boolean;
}

export interface TrustSection {
  slug: string;
  title: string;
  summary: string;
  body: string[];
  status: "published" | "awaiting-client";
  bullets?: string[];
}
