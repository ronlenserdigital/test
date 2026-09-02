import { renderOg, OG_SIZE } from "@/lib/seo/og";
import { getSolution } from "@/content/solutions";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise solution";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSolution(slug);
  return renderOg({ eyebrow: "Solution", title: s?.name ?? "Solutions", description: s?.shortDescription });
}
