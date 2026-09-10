import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Photography manifest. Files live in public/images and are looked up at build
 * time; a missing file simply renders nothing, so pages never show a broken
 * image while the set is being produced. Names match docs/content/image-brief.md.
 * Card crops are not separate files: the 16:9 master is object-fit cropped.
 */
export interface SiteImage {
  src: string;
  alt: string;
}

const ALT: Record<string, string> = {
  "about-hero": "Two Celestino engineers in a Virginia operations office reviewing network dashboards, with a server rack visible through a glass door.",
  "approach-hero": "An engineer drawing a six-stage process flow on a whiteboard while a colleague follows along on a laptop.",
  "nationwide-support-hero": "A field technician kneeling at an open network rack, dressing blue patch cables with a laptop on a cart beside him.",
  "contact-hero": "Evening street in a historic Virginia river town with brick storefronts and a modern office building at the end of the block.",
  "service-managed-it": "A tidy help-desk workstation with a headset, two monitors showing a ticket board, and morning light from a window.",
  "service-co-managed-it": "An internal IT staff member and a visiting engineer reviewing a responsibility matrix together on one laptop.",
  "service-cybersecurity": "A security analyst at a three-monitor desk in a dim room reviewing event timelines.",
  "service-cloud-infrastructure": "A laptop showing a cloud console in front of a small glass-walled server room with two racks.",
  "service-network-management": "Close-up of a patch panel with neatly bundled blue and grey cables and lit port LEDs.",
  "service-backup-disaster-recovery": "A technician inserting a drive sled into a storage array with green and blue status lights.",
  "service-security-risk-advisory": "A compliance review at a conference table with printed control matrices, a policy binder and a laptop.",
  "service-software-development": "A developer at an ultrawide monitor showing code and an architecture diagram, with a mobile simulator on a second screen.",
  "service-web-application-engineering": "A designer and developer reviewing a responsive storefront on a phone, tablet and monitor.",
  "service-ai-automation": "An engineer reviewing an automation workflow of connected nodes on a monitor, with a printed process map on the desk.",
  "industry-government-public-sector": "Exterior of a red-brick Virginia county government building with white columns and mature trees.",
  "industry-healthcare": "A clinic nurse station with a workstation on wheels and a badge reader on the wall.",
  "industry-financial-services": "An advisory office with dual monitors showing charts, a compliance binder and a glass partition.",
  "industry-professional-services": "A law-firm conference room with a long walnut table, tall windows and bookshelves.",
  "industry-smb-mid-market": "The back office of a regional business with a small network rack in an open closet and a manager's desk.",
  "texture-fiber": "",
  "texture-rack-detail": "",
  "texture-data-center-corridor": "",
  "case-study-placeholder": "",
};

/** Delivered filenames that differ from route slugs. */
const ALIASES: Record<string, string> = {
  "service-web-application-engineering": "service-web-ecommerce",
  "industry-government-public-sector": "industry-government",
};

const PUBLIC_DIR = path.join(process.cwd(), "public", "images");
const EXT = ["jpg", "jpeg", "webp", "png"];

/** Returns the image descriptor if the file exists in public/images, otherwise null. */
export function getImage(name: string): SiteImage | null {
  const file = ALIASES[name] ?? name;
  for (const ext of EXT) {
    if (existsSync(path.join(PUBLIC_DIR, `${file}.${ext}`))) {
      return { src: `/images/${file}.${ext}`, alt: ALT[name] ?? "" };
    }
  }
  return null;
}

/** 3:2 card crop when a dedicated `<name>-card` file exists, otherwise the master. */
export function getCardImage(name: string): SiteImage | null {
  const file = ALIASES[name] ?? name;
  for (const ext of EXT) {
    if (existsSync(path.join(PUBLIC_DIR, `${file}-card.${ext}`))) {
      return { src: `/images/${file}-card.${ext}`, alt: ALT[name] ?? "" };
    }
  }
  return getImage(name);
}

export const serviceImage = (slug: string) => getImage(`service-${slug}`);
export const serviceCardImage = (slug: string) => getCardImage(`service-${slug}`);
export const industryImage = (slug: string) => getImage(`industry-${slug}`);
export const industryCardImage = (slug: string) => getCardImage(`industry-${slug}`);

/** Pillar → representative service card. */
const PILLAR_IMAGE: Record<string, string> = {
  protect: "service-cybersecurity",
  operate: "service-managed-it",
  resilience: "service-backup-disaster-recovery",
  modernize: "service-cloud-infrastructure",
  build: "service-software-development",
};
export const pillarImage = (pillar: string) => getCardImage(PILLAR_IMAGE[pillar] ?? "");

/** Solution → closest service photo. */
const SOLUTION_IMAGE: Record<string, string> = {
  "cyber-resilience": "service-cybersecurity",
  "infrastructure-modernization": "service-cloud-infrastructure",
  "business-continuity": "service-backup-disaster-recovery",
  "cloud-security": "service-cloud-infrastructure",
  "secure-application-engineering": "service-software-development",
  "it-operational-resilience": "service-managed-it",
};
export const solutionImage = (slug: string) => getImage(SOLUTION_IMAGE[slug] ?? "");
export const solutionCardImage = (slug: string) => getCardImage(SOLUTION_IMAGE[slug] ?? "");

/** Article category → photo, used on article cards and article headers. */
const CATEGORY_IMAGE: Record<string, string> = {
  cybersecurity: "service-cybersecurity",
  "it-operations": "service-managed-it",
  cloud: "service-cloud-infrastructure",
  compliance: "service-security-risk-advisory",
  resilience: "service-backup-disaster-recovery",
  "government-technology": "industry-government-public-sector",
  "software-engineering": "service-software-development",
  "ai-automation": "service-ai-automation",
};
export const categoryImage = (category: string) => getImage(CATEGORY_IMAGE[category] ?? "");
export const categoryCardImage = (category: string) => getCardImage(CATEGORY_IMAGE[category] ?? "");
