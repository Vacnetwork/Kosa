import Link from "next/link";
import { ClipReveal } from "@/components/motion/clip-reveal";
import { Reveal } from "@/components/motion/reveal";
import { DemoTag } from "@/components/ui/demo-tag";
import { Button } from "@/components/ui/button";
import { photoBySource } from "@/components/site/photo-figure";
import { formatDate } from "@/lib/format";
import { displayTitle } from "@/lib/display";
import type { NewsPost } from "@/lib/types";

/**
 * The lead story, given the whole width of the page: picture on the left, the
 * headline and the opening of the report in the ink block on the right. One
 * highlight only — the newest story the association filed — so the homepage
 * never turns into a second news page.
 */
export function NewsHighlight({ post }: { post: NewsPost }) {
  const cover = photoBySource(post.cover_image_url);

  return (
    <section aria-labelledby="highlight-heading" className="bg-paper">
      <div className="mx-auto grid w-full max-w-[1440px] md:grid-cols-12">
        {cover ? (
          <div className="relative aspect-[4/3] overflow-hidden bg-paper-dim md:col-span-7 md:aspect-auto md:min-h-[62svh]">
            <ClipReveal className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
              src={cover.src}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              loading="eager"
              decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </ClipReveal>
            <p className="absolute bottom-0 left-0 bg-navy/80 px-3 py-2 text-[11px] leading-none text-white/85">
              AI-generated illustration · not a photograph of the school
            </p>
          </div>
        ) : null}

        <div
          className={`flex flex-col justify-between bg-navy px-6 py-10 md:px-10 md:py-14 ${
            cover ? "md:col-span-5" : "md:col-span-12"
          }`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold">Latest from KOSA</p>
              {post.is_fixture ? <DemoTag className="bg-gold text-navy" label="Demo story" /> : null}
            </div>
            <p className="mt-4 text-[15px] text-white/70">
              {formatDate(post.published_at)} · {post.author_name}
            </p>
            <Reveal>
              <h2
                id="highlight-heading"
                className="mt-3 max-w-[24ch] text-[clamp(24px,3vw,38px)] font-[family-name:var(--font-display)] font-extrabold leading-[1.08] tracking-tight text-white"
              >
                {displayTitle(post.title)}
              </h2>
            </Reveal>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/80 md:text-[17px]">
              {post.excerpt}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild variant="primary" size="lg">
              <Link href={`/news/${post.slug}/`}>Read the story</Link>
            </Button>
            <Link
              href="/news/"
              className="text-[15px] text-white/70 underline underline-offset-4 hover:text-white"
            >
              All news &amp; stories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
