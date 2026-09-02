import { renderOg, OG_SIZE } from "@/lib/seo/og";
import { getService } from "@/content/services";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise service";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getService(slug);
  return renderOg({ eyebrow: "Service", title: s?.name ?? "Services", description: s?.shortDescription });
}
