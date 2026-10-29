import { PHOTOS, type Photo } from "@/content/demo";
import { cn } from "@/lib/cn";

const ASPECT = {
  wide: "aspect-[16/9]",
  photo: "aspect-[3/2]",
  square: "aspect-square",
} as const;

/**
 * Photographs are never illustrative stand-ins: each one is the real file in
 * public/photos, described in its alt text and credited with the photographer
 * and licence directly beneath it.
 */
export function photoBySource(src: string | null | undefined): Photo | undefined {
  if (!src) return undefined;
  return Object.values(PHOTOS).find((photo) => photo.src === src || photo.srcSmall === src);
}

export function PhotoFigure({
  photo,
  className,
  caption,
  tone = "light",
  aspect = "photo",
  priority = false,
}: {
  photo: Photo;
  className?: string;
  caption?: string;
  tone?: "light" | "dark";
  aspect?: keyof typeof ASPECT;
  priority?: boolean;
}) {
  return (
    <figure className={cn("flex flex-col", className)}>
      <div className={cn("overflow-hidden bg-paper", ASPECT[aspect])}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption
        className={cn(
          "mt-3 max-w-[54ch] text-[13px] leading-relaxed",
          tone === "dark" ? "text-white/60" : "text-slate",
        )}
      >
        {caption ? <span className={tone === "dark" ? "text-white" : "text-navy"}>{caption} </span> : null}
        {photo.credit} · {photo.licence} · a photograph of the world around KOSA, not of KOSA itself.
      </figcaption>
    </figure>
  );
}
