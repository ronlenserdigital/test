import { SITE_URL, site, hasVerifiedEmail, hasVerifiedPhone, socialLinks } from "@/content/site";
import type { Article, Author, FAQ, Service } from "@/content/types";

type JsonLd = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Organization node. Address is city-level only (street address unverified as a public office). */
export function organizationJsonLd(): JsonLd {
  const org: JsonLd = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: site.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.address.addressLocality,
      addressRegion: site.address.addressRegion,
      postalCode: site.address.postalCode,
      addressCountry: site.address.addressCountry,
    },
    areaServed: { "@type": "Country", name: "United States" },
  };
  if (site.legalName.verified) org.legalName = site.legalName.value;
  if (socialLinks.length) org.sameAs = socialLinks.map((s) => s.url);
  const contactPoints: JsonLd[] = [];
  if (hasVerifiedPhone()) {
    contactPoints.push({ "@type": "ContactPoint", contactType: "sales", telephone: site.phone.value, areaServed: "US", availableLanguage: "English" });
  }
  if (hasVerifiedEmail()) {
    contactPoints.push({ "@type": "ContactPoint", contactType: "customer support", email: site.email.value, areaServed: "US" });
  }
  if (contactPoints.length) org.contactPoint = contactPoints;
  return org;
}

export function websiteJsonLd(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_URL,
    name: site.name,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

export function webPageJsonLd(params: { path: string; title: string; description: string; type?: string; datePublished?: string; dateModified?: string }): JsonLd {
  const url = `${SITE_URL}${params.path}`;
  return {
    "@type": params.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: params.title,
    description: params.description,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en-US",
    ...(params.datePublished ? { datePublished: params.datePublished } : {}),
    ...(params.dateModified ? { dateModified: params.dateModified } : {}),
  };
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

export function serviceJsonLd(service: Service): JsonLd {
  return {
    "@type": "Service",
    "@id": `${SITE_URL}/services/${service.slug}#service`,
    name: service.name,
    description: service.shortDescription,
    serviceType: service.name,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "United States" },
    url: `${SITE_URL}/services/${service.slug}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${service.name} capabilities`,
      itemListElement: service.capabilities.map((c) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: c.title, description: c.description },
      })),
    },
  };
}

/** FAQPage only where the FAQ is visible on-page and answers are self-contained. */
export function faqJsonLd(faqs: FAQ[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function articleJsonLd(article: Article, author: Author): JsonLd {
  const url = `${SITE_URL}/resources/${article.slug}`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    datePublished: article.publishedAt,
    dateModified: article.reviewedAt,
    author: author.isOrganization
      ? { "@type": "Organization", name: author.name, url: `${SITE_URL}/authors/${author.slug}` }
      : { "@type": "Person", name: author.name, jobTitle: author.role, url: `${SITE_URL}/authors/${author.slug}` },
    publisher: { "@id": ORG_ID },
    image: [`${url}/opengraph-image`],
    articleSection: article.category,
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };
}

export function personJsonLd(author: Author): JsonLd {
  return {
    "@type": author.isOrganization ? "Organization" : "Person",
    "@id": `${SITE_URL}/authors/${author.slug}#author`,
    name: author.name,
    description: author.bio,
    url: `${SITE_URL}/authors/${author.slug}`,
    ...(author.isOrganization ? { parentOrganization: { "@id": ORG_ID } } : { jobTitle: author.role, worksFor: { "@id": ORG_ID } }),
  };
}

/** Wraps nodes into a single @graph document. */
export function graph(...nodes: JsonLd[]): JsonLd {
  return { "@context": "https://schema.org", "@graph": nodes };
}
