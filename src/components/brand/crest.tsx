import { cn } from "@/lib/cn";

/**
 * The official KOSA crest, supplied by the association.
 *
 * The file in `public/brand/` is the supplied artwork, cut to a circle so it
 * sits cleanly on navy, gold and paper fields without a white square behind it
 * (`kosa-crest-round.png`), plus a full square version for print or social use.
 * `NEXT_PUBLIC_CREST_SRC` overrides the path if the artwork is ever replaced.
 */
export const CREST_SRC = process.env.NEXT_PUBLIC_CREST_SRC || "/brand/kosa-crest-round.png";

export function Crest({
  className,
  title = "Kakoma Old Students Association crest",
}: {
  className?: string;
  title?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={CREST_SRC}
      alt={title}
      width={512}
      height={512}
      decoding="async"
      className={cn("h-12 w-auto select-none", className)}
    />
  );
}
