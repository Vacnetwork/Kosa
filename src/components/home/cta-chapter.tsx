import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

/**
 * The close flips the page: ink becomes the ground. The headline echoes the
 * hero without repeating it, in two authored lines at every width, and there
 * is exactly one action.
 */
export function CtaChapter() {
  return (
    <section aria-labelledby="cta-heading" className="bg-navy px-[var(--margin)] py-14 md:py-20 lg:min-h-[80svh]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col justify-between">
        <Reveal>
          <h2 id="cta-heading" className="text-[clamp(36px,10.5vw,120px)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-white">
            <span className="block">Committed</span>
            <span className="block text-gold">to our future</span>
          </h2>
        </Reveal>

        <div className="mt-12 flex flex-col items-start justify-between gap-8 md:mt-20 md:flex-row md:items-end">
          <Reveal delay={80} className="md:max-w-[44ch]">
            <p className="text-[19px] leading-relaxed text-white/85 md:text-[20px]">
              Membership is open to anyone who attended Kakoma. Register once, and your cohort, your
              events and the welfare desk are in one place.
            </p>
          </Reveal>
          <Reveal delay={140} className="w-full md:w-auto">
            <Button asChild variant="primary" size="block" className="md:h-14 md:w-auto md:px-10">
              <Link href="/membership/">Start a membership application</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
