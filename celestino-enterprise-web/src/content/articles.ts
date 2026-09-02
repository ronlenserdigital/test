import type { Article, ArticleCategory } from "./types";
import { article as managedItVsCoManagedIt } from "./articles/managed-it-vs-co-managed-it";
import { article as inHouseItVsManagedIt } from "./articles/in-house-it-vs-managed-it";
import { article as nistCsfImplementationGuideSmb } from "./articles/nist-csf-implementation-guide-smb";
import { article as cyberResilienceReadinessChecklist } from "./articles/cyber-resilience-readiness-checklist";
import { article as hipaaCybersecurityConsiderations } from "./articles/hipaa-cybersecurity-considerations";
import { article as cloudVsHybridInfrastructure } from "./articles/cloud-vs-hybrid-infrastructure";
import { article as backupVsDisasterRecovery } from "./articles/backup-vs-disaster-recovery";
import { article as businessContinuityVsDisasterRecovery } from "./articles/business-continuity-vs-disaster-recovery";
import { article as cmmcReadinessConcepts } from "./articles/cmmc-readiness-concepts";
import { article as secureApplicationDevelopmentChecklist } from "./articles/secure-application-development-checklist";
import { article as virginiaPublicSectorProcurementSecurityGuide } from "./articles/virginia-public-sector-procurement-security-guide";

const allArticles: Article[] = [
  managedItVsCoManagedIt,
  inHouseItVsManagedIt,
  nistCsfImplementationGuideSmb,
  cyberResilienceReadinessChecklist,
  hipaaCybersecurityConsiderations,
  cloudVsHybridInfrastructure,
  backupVsDisasterRecovery,
  businessContinuityVsDisasterRecovery,
  cmmcReadinessConcepts,
  secureApplicationDevelopmentChecklist,
  virginiaPublicSectorProcurementSecurityGuide,
];

/** All articles, newest first by publishedAt. */
export const articles: Article[] = [...allArticles].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export const articleMap = new Map(articles.map((a) => [a.slug, a]));

export function getArticle(slug: string): Article | undefined {
  return articleMap.get(slug);
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return articles.filter((a) => a.category === category);
}

export interface ArticleCategoryDef {
  slug: ArticleCategory;
  label: string;
  description: string;
}

export const articleCategories: ArticleCategoryDef[] = [
  {
    slug: "cybersecurity",
    label: "Cybersecurity",
    description:
      "Controls, detection, response and the evidence that proves a security program works, written for buyers and the engineers who run it.",
  },
  {
    slug: "it-operations",
    label: "IT Operations",
    description:
      "Operating models, staffing, cost and risk decisions for organizations deciding how their technology function should be run.",
  },
  {
    slug: "cloud",
    label: "Cloud and Infrastructure",
    description:
      "Workload placement, hybrid design, identity and connectivity decisions for cloud, on-premises and mixed environments.",
  },
  {
    slug: "compliance",
    label: "Compliance and Frameworks",
    description:
      "NIST, HIPAA, FINRA, SOX and related obligations translated into controls, documentation and audit evidence.",
  },
  {
    slug: "resilience",
    label: "Resilience and Recovery",
    description:
      "Backup, disaster recovery, business continuity and the testing that turns plans into proven capability.",
  },
  {
    slug: "government-technology",
    label: "Government Technology",
    description:
      "Procurement, security standards and readiness concepts for public bodies and the suppliers that serve them, including CMMC.",
  },
  {
    slug: "software-engineering",
    label: "Software Engineering",
    description:
      "Secure design, development and operation of custom web, mobile and ecommerce applications.",
  },
  {
    slug: "ai-automation",
    label: "AI and Automation",
    description:
      "Practical applications of AI and workflow automation, and the governance and security controls they require.",
  },
];
