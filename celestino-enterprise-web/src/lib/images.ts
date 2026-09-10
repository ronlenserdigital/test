import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Photography manifest. Files live in public/images and are looked up at build
 * time; a missing file renders nothing, so pages never show a broken image.
 *
 * Uniqueness rule: every slot has its own filename (see
 * docs/content/image-brief-batch-2.md). Until that file exists, `firstImage`
 * falls back to a batch-1 photo; once the unique file lands the fallback is
 * never used again.
 */
export interface SiteImage {
  src: string;
  alt: string;
}

const ALT: Record<string, string> = {
  // batch 1
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
  // batch 2
  "home-hero": "Celestino engineers in an operations office at dusk: one reviewing a wall-mounted network map, one on a headset, a glowing rack room behind them.",
  "home-tile-onsite": "A technician wheeling a laptop cart down a clinic corridor toward a wiring closet.",
  "home-tile-standards": "Hands applying a printed label to a blue patch cable inside a rack.",
  "home-tile-evidence": "A bound assessment report being handed across a desk.",
  "home-pillar-protect": "A security engineer's desk with a monitor showing an alert queue and a hardware security key.",
  "home-pillar-operate": "A help-desk floor with three workstations in a row and a whiteboard of tickets.",
  "home-pillar-recover": "A tape library and disk array in a rack with a technician holding a labeled drive sled.",
  "home-pillar-modernize": "A half-empty rack mid-migration with old equipment on a cart and a new switch being seated.",
  "home-pillar-build": "Two developers pairing at one ultrawide monitor with a phone on a stand running a test build.",
  "home-government-band": "Interior of a county boardroom with a dais, flags and a wall display, empty chairs in morning light.",
  "home-resources-feature": "A printed checklist being ticked with a pen beside a laptop and reading glasses.",
  "home-industry-strip-a": "Hospital administrative corridor with a workstation on wheels and a badge reader.",
  "home-industry-strip-b": "An advisory desk with four monitors of charts, one person in profile.",
  "home-industry-strip-c": "A red-brick municipal building entrance with a ramp and flagpole.",
  "home-industry-strip-d": "A law-firm library aisle with a laptop open on a reading table.",
  "home-industry-strip-e": "A small-business back office with a shelf of binders and a mini rack in a wall cabinet.",
  "services-hub-hero": "A wide operations desk with a printed service catalog, a laptop, a headset and a tablet.",
  "solutions-hub-hero": "A whiteboard covered in an architecture diagram with a person's arm holding a marker.",
  "industries-hub-hero": "A Virginia main-street block at dusk with a clinic, a bank branch and a law office in a row.",
  "resources-hub-hero": "Three printed guides fanned beside a laptop, a highlighter and a coffee.",
  "trust-hero": "A secure records room door with a badge reader and a window showing racks behind.",
  "case-studies-hero": "An empty client conference room at dusk with a closed laptop and a wall display.",
  "solution-cyber-resilience": "A backup appliance rack and a monitor with an incident timeline connected by a single blue cable run.",
  "solution-infrastructure-modernization": "An older server lifted out of a rack beside a new, cleanly cabled rack.",
  "solution-business-continuity": "A tabletop continuity exercise around a conference table with a wall display timeline.",
  "solution-cloud-security": "A laptop in a glass office showing an identity console with a phone showing an authentication prompt.",
  "solution-secure-application-engineering": "A code review station with a diff on screen and a printed threat-model diagram on the wall.",
  "solution-it-operational-resilience": "A documentation binder open beside a monitor showing a monitoring wall of status tiles.",
  "government-hero": "Inside a county IT office: a workstation with a records system, a state flag out of focus, filing cabinets.",
  "author-team": "Three engineers' hands on keyboards at a shared bench with monitors showing terminals.",
  "about-principles": "A hallway of a small office with framed network diagrams and a door open to a lit workspace.",
  "about-facts": "A desk with a Virginia road atlas open beside a laptop and a coffee.",
  "approach-review": "A quarterly review with printed charts on a table and a laptop showing a roadmap.",
  "nationwide-regional": "An unmarked dark service van parked outside a brick office building in a Virginia town.",
  "contact-thanks": "A desk phone and a notepad with a pen in morning light.",
  "not-found": "An empty rack unit with a blank panel and one blue LED.",
};

const DETAIL_ALT: Record<string, string> = {
  "managed-it": "A monthly service report being reviewed at a client's desk with printed charts and a laptop.",
  "co-managed-it": "Two people at a whiteboard with a two-column responsibility list, one internal badge and one visitor badge.",
  cybersecurity: "A hardware security key being inserted into a laptop beside a phone showing an authentication prompt.",
  "cloud-infrastructure": "A printed migration wave plan taped to a server-room wall being checked off by an engineer.",
  "network-management": "A printed network diagram with a hand tracing a path in pencil beside a firewall appliance.",
  "backup-disaster-recovery": "A restore test in progress with a laptop progress bar, a stopwatch and a printed runbook.",
  "security-risk-advisory": "A risk register spread across a conference table as printed heat-map pages.",
  "software-development": "A sprint board of sticky notes beside a monitor with a pipeline view.",
  "web-application-engineering": "A performance dashboard on a monitor beside a tablet showing a storefront.",
  "ai-automation": "A printed process map with handwritten annotations beside a monitor showing a flow builder.",
  "government-public-sector": "A municipal records room with rolling shelves and a workstation.",
  healthcare: "A clinic back office with a locked cabinet and a scheduling workstation.",
  "financial-services": "A compliance officer's desk with a bound policy manual and a city view.",
  "professional-services": "A paralegal workstation with a document scanner and case files.",
  "smb-mid-market": "A warehouse office window looking onto a shop floor with a laptop and label printer on the desk.",
};

/** Delivered filenames that differ from route slugs. */
const ALIASES: Record<string, string> = {
  "service-web-application-engineering": "service-web-ecommerce",
  "industry-government-public-sector": "industry-government",
  "service-web-application-engineering-detail": "service-web-ecommerce-detail",
  "industry-government-public-sector-detail": "industry-government-detail",
  "article-virginia-public-sector-procurement-security-guide": "article-virginia-public-sector-procurement-security-guide",
};

const PUBLIC_DIR = path.join(process.cwd(), "public", "images");
const EXT = ["jpg", "jpeg", "webp", "png"];

function resolve(file: string): string | null {
  for (const ext of EXT) {
    if (existsSync(path.join(PUBLIC_DIR, `${file}.${ext}`))) return `/images/${file}.${ext}`;
  }
  return null;
}

/** Returns the image if the file exists in public/images, otherwise null. */
export function getImage(name: string, alt?: string): SiteImage | null {
  const src = resolve(ALIASES[name] ?? name);
  return src ? { src, alt: alt ?? ALT[name] ?? "" } : null;
}

/** 3:2 card crop when a dedicated `<name>-card` file exists, otherwise the master. */
export function getCardImage(name: string): SiteImage | null {
  const src = resolve(`${ALIASES[name] ?? name}-card`);
  return src ? { src, alt: ALT[name] ?? "" } : getImage(name);
}

/** First existing image in priority order. Unique name first, batch-1 fallback last. */
export function firstImage(...names: string[]): SiteImage | null {
  for (const n of names) {
    const img = getImage(n);
    if (img) return img;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Slot accessors. Unique filename first, fallback second.
// ---------------------------------------------------------------------------

export const serviceImage = (slug: string) => getImage(`service-${slug}`);
export const serviceCardImage = (slug: string) => getCardImage(`service-${slug}`);
export const serviceDetailImage = (slug: string) => getImage(`service-${slug}-detail`, DETAIL_ALT[slug]);
export const industryImage = (slug: string) => getImage(`industry-${slug}`);
export const industryCardImage = (slug: string) => getCardImage(`industry-${slug}`);
export const industryDetailImage = (slug: string) => getImage(`industry-${slug}-detail`, DETAIL_ALT[slug]);

const PILLAR_FALLBACK: Record<string, string> = {
  protect: "service-cybersecurity",
  operate: "service-managed-it",
  resilience: "service-backup-disaster-recovery",
  modernize: "service-cloud-infrastructure",
  build: "service-software-development",
};
const PILLAR_NAME: Record<string, string> = { protect: "protect", operate: "operate", resilience: "recover", modernize: "modernize", build: "build" };
export const pillarImage = (pillar: string) => getImage(`home-pillar-${PILLAR_NAME[pillar]}`) ?? getCardImage(PILLAR_FALLBACK[pillar] ?? "");

const SOLUTION_FALLBACK: Record<string, string> = {
  "cyber-resilience": "service-cybersecurity",
  "infrastructure-modernization": "service-cloud-infrastructure",
  "business-continuity": "service-backup-disaster-recovery",
  "cloud-security": "service-cloud-infrastructure",
  "secure-application-engineering": "service-software-development",
  "it-operational-resilience": "service-managed-it",
};
export const solutionImage = (slug: string) => firstImage(`solution-${slug}`, SOLUTION_FALLBACK[slug] ?? "");
export const solutionCardImage = (slug: string) => getImage(`solution-${slug}`) ?? getCardImage(SOLUTION_FALLBACK[slug] ?? "");

const CATEGORY_FALLBACK: Record<string, string> = {
  cybersecurity: "service-cybersecurity",
  "it-operations": "service-managed-it",
  cloud: "service-cloud-infrastructure",
  compliance: "service-security-risk-advisory",
  resilience: "service-backup-disaster-recovery",
  "government-technology": "industry-government-public-sector",
  "software-engineering": "service-software-development",
  "ai-automation": "service-ai-automation",
};
/** Article: its own photo, else the category fallback. Used on the card and the article header. */
export const articleImage = (slug: string, category: string, title?: string) =>
  getImage(`article-${slug}`, title ? `Illustration for the guide: ${title}` : undefined) ?? firstImage(CATEGORY_FALLBACK[category] ?? "");
export const articleCardImage = (slug: string, category: string, title?: string) =>
  getImage(`article-${slug}`, title ? `Illustration for the guide: ${title}` : undefined) ?? getCardImage(CATEGORY_FALLBACK[category] ?? "");
export const topicImage = (category: string) => getImage(`topic-${category}`);

const HOME_STRIP = ["a", "b", "c", "d", "e"];
/** Home industry gallery tile for the i-th industry; falls back to that industry's card. */
export const homeIndustryImage = (i: number, slug: string) => getImage(`home-industry-strip-${HOME_STRIP[i] ?? "a"}`) ?? industryCardImage(slug);

export const trustSectionImage = (slug: string) => getImage(`trust-${slug}`);

export type CtaTexture = "fiber" | "rack" | "cable";
/** CTA band backdrop rotated by page group so the same texture is not on every page. */
export const ctaTexture = (variant: CtaTexture) =>
  ({ fiber: () => getImage("texture-fiber"), rack: () => getImage("texture-rack-detail"), cable: () => firstImage("texture-cable-macro", "texture-fiber") })[variant]();
