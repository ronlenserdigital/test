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

const PUBLIC_DIR = path.join(process.cwd(), "public", "images");
const EXT = ["jpg", "jpeg", "webp", "png"];

/** Returns the image descriptor if the file exists in public/images, otherwise null. */
export function getImage(name: string): SiteImage | null {
  for (const ext of EXT) {
    if (existsSync(path.join(PUBLIC_DIR, `${name}.${ext}`))) {
      return { src: `/images/${name}.${ext}`, alt: ALT[name] ?? "" };
    }
  }
  return null;
}

export const serviceImage = (slug: string) => getImage(`service-${slug}`);
export const industryImage = (slug: string) => getImage(`industry-${slug}`);
