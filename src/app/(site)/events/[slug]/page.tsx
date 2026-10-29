import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PhotoFigure, photoBySource } from "@/components/site/photo-figure";
import { RsvpPanel } from "@/components/site/rsvp-panel";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { formatDate, formatTime } from "@/lib/format";
import { displayTitle } from "@/lib/display";
import { getPublishedEvents } from "@/lib/server-content";

export async function generateStaticParams() {
  const { rows } = await getPublishedEvents();
  return rows.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { rows } = await getPublishedEvents();
  const event = rows.find((row) => row.slug === slug);
  if (!event) {
    return { title: "Event not found", description: "This event is not published." };
  }
  return {
    title: displayTitle(event.title),
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}/` },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { rows, demo } = await getPublishedEvents();
  const event = rows.find((row) => row.slug === slug);

  if (!event) {
    return (
      <section aria-labelledby="missing-heading" className="bg-paper px-[var(--margin)] py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1440px]">
          <h1 id="missing-heading" className="t-h1 text-navy">
            Event not found
          </h1>
          <p className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-slate">
            This date is not published, or it has been withdrawn since it was shared. Every published event is
            on the events page, with its venue and capacity.
          </p>
          <Button asChild variant="ink" size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/events/">All events</Link>
          </Button>
        </div>
      </section>
    );
  }

  const cover = photoBySource(event.cover_image_url);
  const paragraphs = (event.description ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    // The fixtures end with a note to whoever replaces them; the DemoTag beside
    // the title does that job on the page itself.
    .filter((paragraph) => !/demo content/i.test(paragraph));

  return (
    <>
      <section aria-labelledby="event-title" className="bg-paper px-[var(--margin)] py-12 md:py-20">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="text-[15px] text-slate">
            {formatDate(event.starts_at)} · {event.category}
          </p>

          <h1
            id="event-title"
            className="mt-4 max-w-[26ch] text-[clamp(26px,3.2vw,44px)] font-[family-name:var(--font-display)] font-extrabold leading-[1.1] tracking-tight text-navy"
          >
            {displayTitle(event.title)}
          </h1>

          {demo ? <DemoTag className="mt-4" label="Demo event" /> : null}

          <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end md:gap-12">
            <p className="max-w-[56ch] text-[18px] leading-relaxed text-navy/85 md:col-span-8 md:text-[19px]">
              {event.summary}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row md:col-span-4 md:justify-end">
              <Button asChild variant="ink" size="lg" className="w-full sm:w-auto">
                <a href="#rsvp">Reserve a place</a>
              </Button>
              <Link
                href="/events/"
                className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[16px] font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
              >
                All events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {cover ? (
        <div className="bg-white px-[var(--margin)] py-10 md:py-14">
          <div className="mx-auto w-full max-w-[1440px]">
            <Reveal>
              <PhotoFigure photo={cover} aspect="wide" priority />
            </Reveal>
          </div>
        </div>
      ) : null}

      <section aria-labelledby="about-heading" className="bg-white px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-4">
            <h2 id="about-heading" className="t-h2 text-navy">
              About this date
            </h2>
          </Reveal>
          <div className="md:col-span-8">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 40)} delay={index * 60}>
                  <p
                    className={`max-w-[64ch] leading-relaxed ${
                      index === 0
                        ? "text-[18px] text-navy md:text-[19px]"
                        : "mt-5 text-[17px] text-slate md:text-[18px]"
                    }`}
                  >
                    {paragraph}
                  </p>
                </Reveal>
              ))
            ) : (
              <p className="max-w-[60ch] text-[17px] leading-relaxed text-slate">
                The event managers have published the date and the venue; a full description follows.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="when-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="when-heading" className="t-h1 text-navy">
              When and where
            </h2>
          </Reveal>

          <dl className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { term: "Date", detail: formatDate(event.starts_at) },
              { term: "Starts", detail: `${formatTime(event.starts_at)} EAT` },
              {
                term: "Ends",
                detail: event.ends_at ? `${formatTime(event.ends_at)} EAT` : "Not published",
              },
              { term: "Venue", detail: event.venue ?? "To be confirmed" },
              { term: "Category", detail: event.category },
              {
                term: "Places",
                detail: event.capacity ? `${event.capacity} in total` : "Not capped",
              },
            ].map((item) => (
              <div key={item.term} className="bg-white px-5 py-4">
                <dt className="text-[13px] text-slate">{item.term}</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-[17px] font-bold leading-snug text-navy">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="rsvp"
        aria-labelledby="rsvp-heading"
        className="scroll-mt-20 bg-navy px-[var(--margin)] py-16 md:py-24"
      >
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <Reveal>
              <h2 id="rsvp-heading" className="t-h1 text-white">
                Your place
              </h2>
              <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-white/70">
                {event.capacity
                  ? `${event.capacity} places have been published for this date.`
                  : "No cap has been published for this date."}
              </p>
            </Reveal>
          </div>
          <div className="md:col-span-8">
            <Reveal delay={80}>
              <RsvpPanel eventId={event.id} />
            </Reveal>
          </div>
        </div>
      </section>

      <div className="bg-white px-[var(--margin)] py-10 md:py-14">
        <div className="mx-auto w-full max-w-[1440px]">
          <Link
            href="/events/"
            className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[17px] font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
          >
            Back to all events
          </Link>
        </div>
      </div>
    </>
  );
}
