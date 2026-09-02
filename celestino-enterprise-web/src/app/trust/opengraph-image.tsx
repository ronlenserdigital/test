import { renderOg, OG_SIZE } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise Trust Center";

export default function Image() {
  return renderOg({ eyebrow: "Trust Center", title: "Security practices, privacy, disclosure and accessibility.", description: "How Celestino secures its own operations and the access it holds to client environments." });
}
