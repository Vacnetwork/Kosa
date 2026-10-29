import type { Metadata } from "next";
import Link from "next/link";
import { GalleryWall } from "@/components/gallery/gallery-wall";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PHOTOS } from "@/content/demo";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedGallery } from "@/lib/server-content";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A picture wall for the association, album by album. Every tile is an AI-generated illustration, labelled as such, and members add their own photographs to their year once signed in.",
  alternates: { canonical: "/gallery/" },
};

export default async function GalleryPage() {
  const { rows, demo } = await getPublishedGallery();

  return (
    <>
      <PageHero
        id="gallery-title"
        lines={["Gallery"]}
        lede="Illustrations of the school, the town around it and the gatherings that bring members back — sorted into albums, and labelled so nobody mistakes them for photographs."
        photo={PHOTOS.classroom}
      >
        {demo ? <DemoTag label="Demo pictures" /> : null}
      </PageHero>

      <section aria-labelledby="wall-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="wall-heading" className="t-h1 text-navy">
              The wall
            </h2>
            <p className="mt-4 max-w-[54ch] text-[17px] leading-relaxed text-slate md:text-[18px]">
              Choose an album to narrow the wall, or read all of it. Every tile is an AI-generated
              illustration made for this demonstration build — none is a photograph of the school or its
              members, and each says so beneath it.
            </p>
          </Reveal>

          <div className="mt-8">
            {rows.length === 0 ? (
              <EmptyState title="No pictures are published yet">
                Albums appear here as event managers and members add photographs.
              </EmptyState>
            ) : (
              <GalleryWall items={rows} />
            )}
          </div>

          <p className="mt-8 max-w-[58ch] text-[15px] leading-relaxed text-slate">
            Signed-in members can add pictures to their own year.{" "}
            <Link
              href="/login/"
              className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
            >
              Sign in to add yours
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-labelledby="add-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <Reveal>
              <h2 id="add-heading" className="t-h1 text-navy">
                Add your pictures
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-5">
              <p className="max-w-[40ch] text-[17px] leading-relaxed text-slate">
                Members can add photographs to their own year once signed in. The wall is only as good as
                what the years send in.
              </p>
            </Reveal>
            <Reveal delay={140} className="mt-8">
              <Button asChild variant="ink" size="lg" className="w-full sm:w-auto">
                <Link href="/login/">Sign in to add pictures</Link>
              </Button>
            </Reveal>
          </div>

          <ul className="flex flex-col gap-2 md:col-span-7">
            {[
              {
                name: "A picture the association can use",
                body: "JPEG, PNG or WebP, 5 MB or smaller. Phone photographs are fine; nothing needs a scanner.",
              },
              {
                name: "A caption and a credit",
                body: "One line saying where and when it was taken, and the name of whoever took it. If you took it, say so.",
              },
              {
                name: "The year it belongs to",
                body: "Tag the year so the picture appears on your year's wall and in the album you choose.",
              },
            ].map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 60} className="bg-white px-6 py-6">
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <div className="bg-white px-[var(--margin)] py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="max-w-[92ch] text-[14px] leading-relaxed text-slate">
            The pictures on this wall are openly licensed photographs of Gulu and Acholi life, credited to
            Alemeneghini, Micheal Kaluba, Chapelle musa, Bettycath and Erinamukuta under CC BY-SA 4.0, via
            Wikimedia Commons. They show the world around KOSA, not KOSA itself, and they are replaced as the
            association sends its own.
          </p>
        </div>
      </div>
      <PhotoBand
        keys={["students", "market", "alumni"]}
        caption="AI-generated illustrations, not photographs: no photograph of the school or its members was supplied, so these stand in and must be replaced with the association's own pictures."
      />
    </>
  );
}
