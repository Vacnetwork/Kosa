import { Reveal } from "@/components/motion/reveal";
import { DemoTag } from "@/components/ui/demo-tag";
import type { Achievement } from "@/content/demo";

/**
 * Alumni achievements as a plain list of years — no cards, no icons, no
 * rules: rows are separated by a step in tone.
 */
export function AchievementsChapter({ achievements }: { achievements: Achievement[] }) {
  return (
    <section aria-labelledby="achievements-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-4">
            <h2 id="achievements-heading" className="t-h2 max-w-[16ch] text-navy">
              Where they went
            </h2>
            <p className="mt-4 max-w-[36ch] text-[16px] leading-relaxed text-slate">
              Four years, four different roads out of the same classroom. These entries are
              placeholders until members publish their own records.
            </p>
            <DemoTag className="mt-5" label="Demo content" />
          </Reveal>
          <ul className="flex flex-col md:col-span-8">
            {achievements.map((item, index) => (
              <Reveal
                as="li"
                key={item.name}
                delay={index * 60}
                className={`px-1 py-6 ${index % 2 === 0 ? "bg-paper px-5" : "bg-white px-5"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-[family-name:var(--font-display)] text-[22px] font-bold text-navy">
                    {item.name}
                  </p>
                  <p className="text-[14px] text-slate">{item.field}</p>
                </div>
                <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-navy/85">{item.note}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
