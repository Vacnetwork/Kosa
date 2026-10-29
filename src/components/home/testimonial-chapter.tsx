import { Reveal } from "@/components/motion/reveal";
import { DemoTag } from "@/components/ui/demo-tag";

/**
 * Two flat blocks butted together: the speaker in the ink block, the quotation
 * in the gold block. The quotation does the work of a heading, so it is set as
 * a statement at 36px and never larger.
 */
export function TestimonialChapter() {
  return (
    <section aria-label="What members say" className="grid w-full md:grid-cols-12">
      <div className="flex min-h-[180px] flex-col justify-end bg-navy px-6 py-8 md:col-span-5 md:min-h-[62svh] md:px-8">
        <DemoTag className="mb-6 self-start bg-gold text-navy" label="Sample quote" />
        <p className="font-[family-name:var(--font-display)] text-[20px] font-bold text-white">
          A member of the Class of 2004
        </p>
        <p className="mt-1 max-w-[34ch] text-[15px] text-white/70">
          Placeholder speaker, to be replaced by a recorded interview
        </p>
      </div>
      <div className="bg-gold px-6 py-10 md:col-span-7 md:px-12 md:py-14">
        <Reveal>
          <blockquote className="max-w-[32ch] text-[clamp(22px,2.4vw,34px)] font-bold leading-[1.2] tracking-tight text-navy">
            &ldquo;I left in 2004 and lost touch with everyone. The register found my whole class in a
            week.&rdquo;
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
