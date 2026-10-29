import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { DemoTag } from "@/components/ui/demo-tag";
import type { ImpactStats } from "@/lib/types";

/**
 * One figure owns the screen: a claim at the top, a long gap, then the number
 * with its caption. The right half stays empty on purpose, and the source line
 * closes the bottom-right corner.
 */
export function StatsChapter({ stats }: { stats: ImpactStats }) {
  return (
    <section aria-labelledby="impact-heading" className="bg-gold px-[var(--margin)] py-14 md:py-20 lg:min-h-[88svh]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col">
        <Reveal>
          <h2 id="impact-heading" className="t-h2 max-w-[16ch] text-navy">
            The register, by year
          </h2>
        </Reveal>

        <div className="mt-14 flex-1 lg:mt-24" />

        <Reveal delay={80}>
          <p className="t-figure text-navy">
            <CountUp value={stats.active_members} />
            <span className="ml-2 align-super font-[family-name:var(--font-display)] text-[clamp(26px,3.6vw,56px)] font-extrabold">
              members
            </span>
          </p>
          <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-navy/85 md:text-[17px]">
            on the verified register across {stats.years} graduation years, from the earliest leavers
            to those who left last year. Every entry is approved by the membership officer before the
            directory shows it.
          </p>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <p className="text-[15px] text-navy/75">
            {stats.projects} funded projects · {stats.bursaries_awarded} bursaries awarded
          </p>
          <p className="flex items-center gap-2 text-[13px] text-navy/70">
            {stats.demo ? <DemoTag label="Demo figures" /> : null}
            {stats.demo ? "Sample figures for this demonstration build." : "Source: KOSA register."}
          </p>
        </div>
      </div>
    </section>
  );
}
