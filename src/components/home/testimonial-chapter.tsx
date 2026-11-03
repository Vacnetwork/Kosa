import { Reveal } from "@/components/motion/reveal";

/**
 * Two flat blocks butted together: who is being quoted in the ink block, the
 * quotation in the gold block. The association closes its own prospectus with
 * this line, so it is used here as it was printed, attributed and dated — not
 * an invented member testimonial. The quotation does the work of a heading, so
 * it is set as a statement at 34px and never larger.
 */
export function TestimonialChapter() {
  return (
    <section aria-label="What the association stands on" className="grid w-full md:grid-cols-12">
      <div className="flex min-h-[180px] flex-col justify-end bg-navy px-6 py-8 md:col-span-5 md:min-h-[62svh] md:px-8">
        <p className="font-[family-name:var(--font-display)] text-[20px] font-bold text-white">
          Helen Keller
        </p>
        <p className="mt-1 max-w-[34ch] text-[15px] text-white/70">
          American author and disability rights advocate, 1880&ndash;1968
        </p>
        <p className="mt-6 max-w-[34ch] text-[14px] leading-relaxed text-white/60">
          The quotation the association closes its own prospectus with.
        </p>
      </div>
      <div className="bg-gold px-6 py-10 md:col-span-7 md:px-12 md:py-14">
        <Reveal>
          <blockquote className="max-w-[26ch] text-[clamp(22px,2.4vw,34px)] font-bold leading-[1.2] tracking-tight text-navy">
            &ldquo;Alone we can do so little; together we can do so much.&rdquo;
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
