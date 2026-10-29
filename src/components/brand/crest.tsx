import { cn } from "@/lib/cn";

/**
 * Placeholder KOSA crest drawn in the brand colours.
 *
 * The official crest was not supplied with the brief. This mark is a stand-in
 * with the same function (shield, initials, motto band) so the layout is
 * complete and honest. To swap in the real crest, drop the file at
 * `public/brand/kosa-crest.png` and set NEXT_PUBLIC_CREST_SRC, or replace this
 * component's body — see docs/HANDOVER.md.
 */
export function Crest({ className, title = "KOSA crest" }: { className?: string; title?: string }) {
  const custom = process.env.NEXT_PUBLIC_CREST_SRC;
  if (custom) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={custom} alt={title} className={cn("h-12 w-auto", className)} width={48} height={56} />;
  }
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 56 64"
      className={cn("h-12 w-auto", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 2h52v34c0 13.5-11.6 22.4-26 26C13.6 58.4 2 49.5 2 36V2Z" fill="#102B60" stroke="#C99A20" strokeWidth="2.5" />
      <path d="M2 30h52" stroke="#C99A20" strokeWidth="2.5" />
      <path d="M15 12h26M15 18h26M15 24h18" stroke="#FFFFFF" strokeWidth="2.5" />
      <text
        x="28"
        y="47"
        textAnchor="middle"
        fill="#C99A20"
        fontFamily="var(--font-manrope), sans-serif"
        fontSize="13"
        fontWeight="800"
        letterSpacing="0.5"
      >
        KOSA
      </text>
      <path d="M34 50h14M34 55h14" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.85" />
    </svg>
  );
}
