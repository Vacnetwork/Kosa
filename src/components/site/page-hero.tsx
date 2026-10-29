import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "navy" | "paper" | "gold";

const TONE: Record<Tone, { field: string; head: string; lede: string }> = {
  navy: { field: "bg-navy", head: "text-white", lede: "text-white/85" },
  paper: { field: "bg-paper", head: "text-navy", lede: "text-slate" },
  gold: { field: "bg-gold", head: "text-navy", lede: "text-navy/85" },
};

/**
 * The opening chapter of an inner page. The page's name is set as an authored
 * block of one or two lines on the left and the sentence that explains it on
 * the right, so the heading can never wrap past two lines at any width and the
 * chapter is never half empty.
 */
export function PageHero({
  id,
  lines,
  lede,
  tone = "navy",
  children,
}: {
  id: string;
  lines: string[];
  lede: ReactNode;
  tone?: Tone;
  children?: ReactNode;
}) {
  const colours = TONE[tone];

  return (
    <section aria-labelledby={id} className={cn("px-[var(--margin)] py-12 md:py-20", colours.field)}>
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:items-center md:gap-12">
        <div className="md:col-span-7">
          <h1 id={id} className={cn("t-h1 uppercase", colours.head)}>
            {lines.map((line, index) => (
              <span key={line} className="line-mask">
                <span style={{ animationDelay: `${80 + index * 110}ms` }}>{line}</span>
              </span>
            ))}
          </h1>
        </div>
        <div className="md:col-span-5">
          <p className={cn("max-w-[42ch] text-[17px] leading-relaxed md:text-[18px]", colours.lede)}>{lede}</p>
          {children ? <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
