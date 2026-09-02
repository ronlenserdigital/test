import { renderOg, OG_SIZE } from "@/lib/seo/og";
import { getIndustry } from "@/content/industries";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise industry";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = getIndustry(slug);
  return renderOg({ eyebrow: "Industry", title: i?.name ?? "Industries", description: i?.shortDescription });
}
