import { renderOg, OG_SIZE } from "@/lib/seo/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise: secure infrastructure, resilient operations";

export default function Image() {
  return renderOg({
    eyebrow: "Managed IT · Cybersecurity · Engineering",
    title: "Secure infrastructure. Resilient operations. One accountable team.",
    description: "Managed IT, cybersecurity, recovery and secure application engineering for mid-sized and regulated organizations.",
  });
}
