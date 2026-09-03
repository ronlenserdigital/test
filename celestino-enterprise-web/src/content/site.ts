/**
 * Site-wide verified configuration.
 *
 * RULE: Nothing in this file is published unless it is either
 *   (a) taken from Celestino's own existing website/materials, or
 *   (b) supplied and confirmed by the client.
 *
 * Every claim carries a `source` so reviewers can trace it. Fields marked
 * `verified: false` are rendered as structural placeholders (or hidden) and
 * MUST be confirmed before launch. See docs/client-information-required.md.
 */

export type ClaimSource =
  | "existing-site" // present on celestinoenterprise.com before the rebuild
  | "public-record" // state registration, procurement registry, etc.
  | "third-party-directory" // Yelp/ZoomInfo/Nextdoor — low confidence
  | "client-supplied" // confirmed in writing by Celestino
  | "unverified";

export interface Claim<T = string> {
  value: T;
  verified: boolean;
  source: ClaimSource;
  note?: string;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://celestinoenterprise.com";

export const site = {
  name: "Celestino Enterprise",
  legalName: {
    value: "Celestino Enterprise LLC",
    verified: false,
    source: "public-record",
    note: "Virginia SCC entity S8616122 (per opengovus). Registry lists status INACTIVE as of 2024-01-31 — client must confirm current legal status and exact legal name before launch.",
  } satisfies Claim,
  tagline: "Secure infrastructure. Resilient operations.",
  description:
    "Celestino Enterprise delivers managed IT, cybersecurity and compliance support, cloud and infrastructure operations, disaster recovery, and secure application engineering for organizations across the United States, from Woodford, Virginia.",
  url: SITE_URL,
  locale: "en_US",

  /** Experience claim. Client-supplied 2026-09-02: 31 years. (The legacy site title said "25+".) */
  experienceYears: {
    value: "31",
    verified: true,
    source: "client-supplied",
    note: "Confirmed by the client as 31 years of IT experience. Keep phrasing as 'years of IT engineering experience' (team experience), not 'years in business'; the LLC was registered in 2019.",
  } satisfies Claim,

  address: {
    streetAddress: "13329 Fredericksburg Tpke",
    addressLocality: "Woodford",
    addressRegion: "VA",
    postalCode: "22580",
    addressCountry: "US",
    verified: false,
    source: "third-party-directory" as ClaimSource,
    note: "Consistent across Virginia SCC record, Yelp, ZoomInfo and Nextdoor. Confirm with client whether this is a public office or a registered address that should not be published.",
  },

  /**
   * Two different phone numbers appear in third-party directories.
   * Neither is published until the client confirms the primary line.
   */
  phone: {
    value: "",
    verified: false,
    source: "unverified",
    note: "Directories list (804) 632-6521 and (202) 650-8607. Client must confirm the primary sales/support line.",
  } satisfies Claim,

  email: {
    value: "",
    verified: false,
    source: "unverified",
    note: "No public email confirmed. Client to supply sales, support and security-disclosure addresses.",
  } satisfies Claim,

  securityContactEmail: {
    value: "",
    verified: false,
    source: "unverified",
    note: "Required before /.well-known/security.txt is served.",
  } satisfies Claim,

  /** Support model claims — all from existing site copy. */
  support: {
    proactiveSupport: {
      value: "up to 24/7/365 proactive support",
      verified: true,
      source: "existing-site",
      note: "Existing copy says 'up to 24/7/365'. Do not drop the 'up to' qualifier without client confirmation of contracted hours.",
    } satisfies Claim,
    emergencyOnsite: {
      value: "Emergency onsite support",
      verified: true,
      source: "existing-site",
    } satisfies Claim,
    nationwideOnsite: {
      value: "Nationwide onsite support",
      verified: true,
      source: "existing-site",
      note: "Existing copy: 'the ability to receive Nationwide Onsite Support'. Delivery model (own staff vs. partner network) unconfirmed.",
    } satisfies Claim,
    hours: {
      value: "",
      verified: false,
      source: "unverified",
      note: "Business hours not published anywhere authoritative.",
    } satisfies Claim,
  },

  /** Compliance frameworks the existing site says it supports. These are *support* claims, not certifications. */
  complianceSupport: {
    value: ["HIPAA", "FINRA", "SOX"],
    verified: true,
    source: "existing-site",
    note: "Existing copy: 'compliance support (HIPAA, FINRA, SOX, etc.)'. Presented as compliance *support*, never as Celestino being certified.",
  } satisfies Claim<string[]>,

  /** Certifications held by Celestino or its staff. NONE verified. */
  certifications: [] as Array<{
    name: string;
    issuer: string;
    holder: "company" | "staff";
    verified: boolean;
    source: ClaimSource;
    url?: string;
  }>,

  /** Technology / channel partnerships. NONE verified. Platforms below are *experience* claims from the existing site, not partnerships. */
  partners: [] as Array<{
    name: string;
    tier?: string;
    verified: boolean;
    source: ClaimSource;
    url?: string;
  }>,

  /** Platforms the existing site says the team has worked with. Experience claims only. */
  platformExperience: {
    value: ["Magento", "Shopify", "BigCommerce"],
    verified: true,
    source: "existing-site",
    note: "From ecommerce service copy. These are experience claims, not partnerships or certifications.",
  } satisfies Claim<string[]>,

  /** Public-sector procurement identifiers. NONE verified — never render empty values. */
  government: {
    servesPublicSector: {
      value: false,
      verified: false,
      source: "unverified",
      note: "Existing site does not name public-sector customers. The Government page is built as a capabilities framework and must not claim past performance until confirmed.",
    } satisfies Claim<boolean>,
    uei: { value: "", verified: false, source: "unverified" } satisfies Claim,
    cage: { value: "", verified: false, source: "unverified" } satisfies Claim,
    duns: { value: "", verified: false, source: "unverified" } satisfies Claim,
    naics: {
      value: [] as string[],
      verified: false,
      source: "unverified",
      note: "Likely candidates for client to confirm in SAM.gov: 541512, 541513, 541519, 541511, 541690, 518210. Do not publish unconfirmed.",
    } satisfies Claim<string[]>,
    samRegistered: { value: false, verified: false, source: "unverified" } satisfies Claim<boolean>,
    evaRegistered: {
      value: false,
      verified: false,
      source: "unverified",
      note: "Virginia eVA vendor registration status unknown.",
    } satisfies Claim<boolean>,
    swamCertified: {
      value: false,
      verified: false,
      source: "unverified",
      note: "Virginia SWaM (Small, Women-owned, Minority-owned) certification status unknown.",
    } satisfies Claim<boolean>,
    businessClassifications: {
      value: [] as string[],
      verified: false,
      source: "unverified",
    } satisfies Claim<string[]>,
    contractVehicles: {
      value: [] as string[],
      verified: false,
      source: "unverified",
    } satisfies Claim<string[]>,
    capabilityStatementUrl: {
      value: "",
      verified: false,
      source: "unverified",
      note: "PDF to be supplied by client. Rendered as a download when present.",
    } satisfies Claim,
  },

  social: {
    linkedin: {
      value: "",
      verified: false,
      source: "third-party-directory",
      note: "A LinkedIn profile exists (personal-style URL). Client must supply the company page URL.",
    } satisfies Claim,
    facebook: {
      value: "",
      verified: false,
      source: "third-party-directory",
      note: "Directories reference a Facebook page. URL unconfirmed.",
    } satisfies Claim,
    x: { value: "", verified: false, source: "unverified" } satisfies Claim,
    github: { value: "", verified: false, source: "unverified" } satisfies Claim,
  },

  /** Leadership. Registered agent per public record; role/bio unconfirmed. */
  people: [] as Array<{
    name: string;
    role: string;
    verified: boolean;
    source: ClaimSource;
  }>,

  /** Awards. The existing site says 'award winning' with no named award. Do not publish. */
  awards: [] as Array<{
    name: string;
    issuer: string;
    year: number;
    verified: boolean;
    source: ClaimSource;
  }>,

  /** Service territory. */
  serviceArea: {
    headquartersRegion: "Woodford, Virginia (between Fredericksburg and Richmond)",
    onsiteCoverage: "United States",
    remoteCoverage: "United States",
    verified: false,
    source: "existing-site" as ClaimSource,
    note: "'Nationwide onsite support' from existing site. Regional focus inferred from address.",
  },

  /** Client portal / incident line — shown in the utility rail only when verified. */
  utility: {
    clientPortalUrl: { value: "", verified: false, source: "unverified" } satisfies Claim,
    incidentLine: { value: "", verified: false, source: "unverified" } satisfies Claim,
  },
} as const;

/** Helper: returns the value only when verified, otherwise undefined. */
export function verified<T>(claim: Claim<T>): T | undefined {
  return claim.verified ? claim.value : undefined;
}

export function hasVerifiedPhone(): boolean {
  return site.phone.verified && site.phone.value.length > 0;
}

export function hasVerifiedEmail(): boolean {
  return site.email.verified && site.email.value.length > 0;
}

export const socialLinks = Object.entries(site.social)
  .filter(([, c]) => c.verified && c.value)
  .map(([key, c]) => ({ key, url: c.value }));
