import { renderOg, OG_SIZE } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise resources";

export default function Image() {
  return renderOg({ eyebrow: "Resources", title: "Guides, checklists and decision frameworks written by engineers.", description: "Managed IT operating models, NIST CSF, HIPAA, CMMC, backup and recovery, cloud and secure development." });
}
