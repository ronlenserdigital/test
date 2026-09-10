import Image from "next/image";
import { cn } from "@/lib/cn";
import type { SiteImage } from "@/lib/images";

interface PhotoProps {
  image: SiteImage | null;
  ratio?: "16/9" | "3/2" | "4/5" | "21/9";
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Decorative images (textures) get empty alt and aria-hidden. */
  decorative?: boolean;
}

const ratios = { "16/9": "aspect-[16/9]", "3/2": "aspect-[3/2]", "4/5": "aspect-[4/5]", "21/9": "aspect-[21/9]" };

/**
 * Responsive photo in a fixed-ratio frame. Renders nothing when the image is not
 * yet available, so layouts stay stable while the photography set is produced.
 */
export function Photo({ image, ratio = "16/9", priority = false, sizes = "(min-width: 1024px) 40vw, 100vw", className, decorative = false }: PhotoProps) {
  if (!image) return null;
  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg border border-line bg-surface-2", ratios[ratio], className)} aria-hidden={decorative || undefined}>
      <Image src={image.src} alt={decorative ? "" : image.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

/** Full-bleed background texture at low opacity. Purely decorative. */
export function TextureBackdrop({ image, className }: { image: SiteImage | null; className?: string }) {
  if (!image) return null;
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <Image src={image.src} alt="" fill sizes="100vw" className="object-cover opacity-[0.22]" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/40" />
    </div>
  );
}
