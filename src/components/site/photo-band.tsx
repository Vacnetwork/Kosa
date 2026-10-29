import { PHOTOS, type Photo } from "@/content/demo";
import { cn } from "@/lib/cn";

/**
 * A band of real photographs of the world around KOSA, with their credits.
 * Used once per inner page so every public chapter carries more than one
 * picture, and so the pictures are never presented as photographs of the
 * association itself.
 */
export function PhotoBand({
  keys,
  caption,
  className,
}: {
  keys: (keyof typeof PHOTOS)[];
  caption?: string;
  className?: string;
}) {
  const photos = keys.map((key) => PHOTOS[key]) as Photo[];
  return (
    <section aria-label="Photographs" className={cn("bg-white px-[var(--margin)] pb-4 pt-2", className)}>
      <div className="mx-auto w-full max-w-[1440px]">
        <ul className="grid gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.src}>
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.srcSmall}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="h-[220px] w-full object-cover md:h-[260px]"
                />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate">
                {photo.credit} · {photo.licence}
              </p>
            </li>
          ))}
        </ul>
        {caption ? <p className="mt-4 max-w-[80ch] text-[14px] leading-relaxed text-slate">{caption}</p> : null}
      </div>
    </section>
  );
}
