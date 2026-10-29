import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PHOTOS } from "@/content/demo";

/**
 * Inset navy panel: a two-line statement with one shaped photograph on the
 * left, two short text blocks and one action on the right. The photograph is
 * cropped by its own frame, never spilling out of the panel.
 */
export function AboutChapter() {
  const photo = PHOTOS.dancers;
  return (
    <section aria-labelledby="about-heading" className="px-[8px] py-[8px] md:px-[16px] md:py-[16px]">
      <div className="bg-navy px-6 py-12 md:px-12 md:py-16 lg:py-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <Reveal>
              <h2 id="about-heading" className="t-h1 max-w-[14ch] text-white">
                Every cohort, on one register
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-6">
              <p className="max-w-[44ch] text-[18px] leading-relaxed text-white/85 md:text-[20px]">
                KOSA exists so that a leaver never loses the school. Members find their own year again,
                open doors for the one behind them, and pool what they can for families in difficulty.
              </p>
            </Reveal>
            <Reveal delay={130} className="mt-8">
              <div
                className="w-full max-w-[420px] overflow-hidden"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="drift h-[300px] w-full object-cover md:h-[380px]"
                />
              </div>
              <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-white/60">
                {photo.credit} · {photo.licence} · a photograph of the world around KOSA, not of KOSA itself.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-6 md:pl-8 lg:pl-16">
            <Reveal delay={110}>
              <h3 className="t-h3 text-gold">What the association does</h3>
              <p className="mt-3 max-w-[42ch] text-[16px] leading-relaxed text-white/80 md:text-[17px]">
                Keeps a verified register of old students by graduation year, so a class can find itself
                and the executive can reach a cohort without a chain of phone calls.
              </p>
            </Reveal>
            <Reveal delay={170} className="mt-9">
              <h3 className="t-h3 text-gold">How it is run</h3>
              <p className="mt-3 max-w-[42ch] text-[16px] leading-relaxed text-white/80 md:text-[17px]">
                An elected executive, a membership officer, event managers and a treasurer. Applications,
                welfare decisions, contributions and role changes are recorded in an audit log the
                executive can read.
              </p>
            </Reveal>
            <Reveal delay={230} className="mt-9">
              <Button asChild variant="primary" size="md">
                <Link href="/about/">Read about KOSA</Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
