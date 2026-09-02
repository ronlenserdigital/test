import { renderOg, OG_SIZE } from "@/lib/seo/og";
import { getArticle, articleCategories } from "@/content/articles";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Celestino Enterprise article";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  const cat = articleCategories.find((c) => c.slug === a?.category);
  return renderOg({ eyebrow: cat?.label ?? "Resources", title: a?.title ?? "Resources", description: a ? `${a.type.replace("-", " ")} · ${a.readingMinutes} min read` : undefined });
}
