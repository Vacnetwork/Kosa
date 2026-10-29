import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PhotoFigure, photoBySource } from "@/components/site/photo-figure";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { formatDate } from "@/lib/format";
import { displayTitle } from "@/lib/display";
import { getPublishedNews } from "@/lib/server-content";

export async function generateStaticParams() {
  const { rows } = await getPublishedNews();
  return rows.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { rows } = await getPublishedNews();
  const post = rows.find((row) => row.slug === slug);
  if (!post) {
    return { title: "Story not found", description: "This story is not published." };
  }
  return {
    title: displayTitle(post.title),
    description: post.excerpt,
    alternates: { canonical: `/news/${post.slug}/` },
  };
}

export default async function NewsStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { rows, demo } = await getPublishedNews();
  const post = rows.find((row) => row.slug === slug);

  if (!post) {
    return (
      <section aria-labelledby="missing-heading" className="bg-paper px-[var(--margin)] py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1440px]">
          <h1 id="missing-heading" className="t-h1 text-navy">
            Story not found
          </h1>
          <p className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-slate">
            This story is not published, or it has been withdrawn since it was shared. Every published story
            is on the news page, with its date and the desk that filed it.
          </p>
          <Button asChild variant="ink" size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/news/">All stories</Link>
          </Button>
        </div>
      </section>
    );
  }

  const cover = photoBySource(post.cover_image_url);
  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    // The fixtures open with a line telling the reader it is demo content; the
    // DemoTag beside the headline says the same thing without reading as copy.
    .filter((paragraph) => !/^this is demo content\.?$/i.test(paragraph));

  return (
    <>
      <article>
        <header className="bg-paper px-[var(--margin)] py-12 md:py-20">
          <div className="mx-auto w-full max-w-[1440px]">
            <p className="text-[15px] text-slate">
              {formatDate(post.published_at)} · {post.author_name}
            </p>
            <h1 className="mt-4 max-w-[40ch] text-[clamp(20px,3.4vw,34px)] font-[family-name:var(--font-display)] font-extrabold leading-[1.1] tracking-tight text-navy">
              {displayTitle(post.title)}
            </h1>
            {demo ? <DemoTag className="mt-5" label="Demo story" /> : null}
            <p className="mt-6 max-w-[56ch] text-[18px] leading-relaxed text-slate md:text-[19px]">
              {post.excerpt}
            </p>
          </div>
        </header>

        {cover ? (
          <div className="bg-white px-[var(--margin)] py-10 md:py-14">
            <div className="mx-auto w-full max-w-[1440px]">
              <Reveal>
                <PhotoFigure photo={cover} aspect="wide" caption="Cover picture." priority />
              </Reveal>
            </div>
          </div>
        ) : null}

        <div className="bg-white px-[var(--margin)] pb-16 pt-4 md:pb-24 md:pt-6">
          <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:gap-12">
            <div className="max-w-[66ch] md:col-span-8">
              {paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 40)} delay={index * 50}>
                  <p
                    className={`leading-relaxed ${
                      index === 0 ? "text-[18px] text-navy md:text-[19px]" : "mt-6 text-[17px] text-slate md:text-[18px]"
                    }`}
                  >
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>

            <aside className="md:col-span-4">
              <Reveal delay={120} className="bg-paper px-6 py-6">
                <h2 className="t-h3 text-navy">Filed by</h2>
                <p className="mt-3 text-[17px] text-navy">{post.author_name}</p>
                <p className="mt-1 text-[16px] text-slate">{formatDate(post.published_at)}</p>
                <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-slate">
                  The figures in this story come from the desk that filed it. Reports do not name a member who
                  received help unless that member agreed to be named.
                </p>
                <Link
                  href="/news/"
                  className="mt-5 inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[16px] font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
                >
                  Back to all stories
                </Link>
              </Reveal>
            </aside>
          </div>
        </div>
      </article>

      <section aria-labelledby="follow-heading" className="bg-navy px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 md:grid-cols-12 md:items-center md:gap-12">
          <div className="md:col-span-8">
            <h2 id="follow-heading" className="t-h2 text-white">
              Follow the work
            </h2>
            <p className="mt-3 max-w-[54ch] text-[17px] leading-relaxed text-white/80">
              Members see each report as it is published, along with the dates, the welfare desk and the
              register of their own year.
            </p>
          </div>
          <div className="md:col-span-4 md:justify-self-end">
            <Button asChild variant="onDark" size="lg" className="w-full sm:w-auto">
              <Link href="/membership/">Join KOSA</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
