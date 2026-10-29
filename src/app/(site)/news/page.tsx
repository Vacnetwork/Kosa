import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PHOTOS } from "@/content/demo";
import { photoBySource } from "@/components/site/photo-figure";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { displayTitle } from "@/lib/display";
import { getPublishedNews } from "@/lib/server-content";

export const metadata: Metadata = {
  title: "News & stories",
  description:
    "Reports from the KOSA welfare desk, the bursary committee, the projects group and the mentorship clinic, with the date each story was published.",
  alternates: { canonical: "/news/" },
};

export default async function NewsPage() {
  const { rows, demo } = await getPublishedNews();

  return (
    <>
      <PageHero
        id="news-title"
        lines={["News", "& stories"]}
        lede="Reports written by the desk that did the work: what the bursary fund paid for, what came out of a clinic, and what was handed over when a project finished."
        photo={PHOTOS.market}
      >
        {demo ? <DemoTag label="Includes demo stories" /> : null}
      </PageHero>

      <section aria-labelledby="stories-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="stories-heading" className="t-h1 text-navy">
              Latest stories
            </h2>
            <p className="mt-4 max-w-[54ch] text-[17px] leading-relaxed text-slate md:text-[18px]">
              Every entry carries the date it was published and the desk that filed it. Nothing here is
              anonymous, and nothing is written in the third person about people who have not agreed to it.
            </p>
          </Reveal>

          {rows.length === 0 ? (
            <EmptyState title="No stories are published yet" className="mt-10">
              Reports appear here as the welfare desk, the bursary committee and the projects group file them.
            </EmptyState>
          ) : (
            <div className="mt-10 flex flex-col gap-2">
              {rows.map((post, index) => {
                const cover = photoBySource(post.cover_image_url);
                return (
                  <Reveal key={post.id} delay={index * 60}>
                    <article className="grid gap-0 bg-paper md:grid-cols-12">
                      {cover ? (
                        <div className="md:col-span-4">
                          <div className="aspect-[4/3] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cover.srcSmall}
                              alt={cover.alt}
                              width={cover.width}
                              height={cover.height}
                              loading={index === 0 ? "eager" : "lazy"}
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="px-4 py-2 text-[13px] leading-relaxed text-slate">{cover.credit}</p>
                        </div>
                      ) : null}

                      <div
                        className={`px-5 py-6 md:px-8 md:py-8 ${
                          cover ? "md:col-span-8" : "md:col-span-12"
                        }`}
                      >
                        <p className="text-[15px] text-slate">
                          {formatDate(post.published_at)} · {post.author_name}
                        </p>
                        <h2 className="mt-2 max-w-[38ch] font-[family-name:var(--font-display)] text-[17px] font-bold leading-[1.2] tracking-tight text-navy md:text-[22px] lg:text-[24px]">
                          {displayTitle(post.title)}
                        </h2>
                        <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                          {post.excerpt}
                        </p>
                        <Link
                          href={`/news/${post.slug}/`}
                          className="mt-4 inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[16px] font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
                        >
                          Read the story
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="who-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-5">
            <h2 id="who-heading" className="t-h1 text-white">
              Who writes
            </h2>
          </Reveal>
          <div className="md:col-span-7">
            <Reveal delay={80}>
              <p className="max-w-[56ch] text-[18px] leading-relaxed text-white/85">
                Stories come from the desks themselves: the welfare desk reports what the fund met and what
                it could not, the bursary committee reports on the term, the projects group reports at
                handover, and the mentorship group reports after a clinic.
              </p>
            </Reveal>
            <Reveal delay={140} className="mt-5">
              <p className="max-w-[56ch] text-[16px] leading-relaxed text-white/70">
                Reports do not name a member who received help unless that member has agreed to be named. The
                figures are the story.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="send-heading" className="bg-paper px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 md:grid-cols-12 md:items-center md:gap-12">
          <div className="md:col-span-8">
            <Reveal>
              <h2 id="send-heading" className="t-h2 text-navy">
                Have something to tell?
              </h2>
            </Reveal>
            <Reveal delay={60} className="mt-3">
              <p className="max-w-[54ch] text-[17px] leading-relaxed text-slate">
                A reunion, a member&rsquo;s work, a project that needs hands: send it to the secretariat and it
                can be published here with your name on it.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-4 md:justify-self-end">
            <Button asChild variant="ink" size="lg" className="w-full sm:w-auto">
              <Link href="/contact/">Write to the secretariat</Link>
            </Button>
          </Reveal>
        </div>
      </section>
      <PhotoBand
        keys={["alumni", "students", "compound"]}
        caption="AI-generated illustrations, not photographs: no photograph of the school or its members was supplied, so these stand in and must be replaced with the association's own pictures."
      />
    </>
  );
}
