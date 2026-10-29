import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Photo } from "@/content/demo";

type Tone = "navy" | "paper" | "gold";

const TONE: Record<Tone, { field: string; head: string; lede: string; credit: string }> = {
  navy: { field: "bg-navy", head: "text-white", lede: "text-white/90", credit: "text-white/60" },
  paper: { field: "bg-paper", head: "text-navy", lede: "text-navy/90", credit: "text-slate" },
  gold: { field: "bg-gold", head: "text-navy", lede: "text-navy/90", credit: "text-navy/70" },
};

/**
 * The opening chapter of an inner page.
 *
 * The page's name is set as an authored block of one or two lines at display
 * size — the page's focal point — with the sentence that explains it directly
 * beneath (never off-screen on a phone, so a bare name is never the whole
 * first screen). An image, credited, fills the right third of the
 * chapter; it is the same picture language as the homepage's chapters.
 */
export function PageHero({
  id,
  lines,
  lede,
  tone = "navy",
  photo,
  children,
}: {
  id: string;
  lines: string[];
  lede: ReactNode;
  tone?: Tone;
  photo?: Photo;
  children?: ReactNode;
}) {
  const colours = TONE[tone];

  return (
    <section
      aria-labelledby={id}
      className={cn("px-[var(--margin)] py-10 md:py-16", colours.field)}
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:items-end md:gap-10">
        <div className={photo ? "md:col-span-7" : "md:col-span-8"}>
          <h1
            id={id}
            className={cn(
              "text-[clamp(44px,7.4vw,104px)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]",
              colours.head,
            )}
          >
            {lines.map((line, index) => (
              <span key={line} className="line-mask">
                <span style={{ animationDelay: `${80 + index * 110}ms` }}>{line}</span>
              </span>
            ))}
          </h1>
          <p className={cn("mt-5 max-w-[46ch] text-[18px] leading-relaxed md:mt-7 md:text-[20px]", colours.lede)}>
            {lede}
          </p>
          {children ? <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">{children}</div> : null}
        </div>

        {photo ? (
          <div className="md:col-span-5">
            <div className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="eager"
                decoding="async"
                className="h-[220px] w-full object-cover md:h-[clamp(260px,34svh,420px)]"
              />
            </div>
            <p className={cn("mt-2 text-[13px] leading-relaxed", colours.credit)}>
              AI-generated illustration · not a photograph
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
