import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { dayParts, formatTime, isFuture } from "@/lib/format";
import { displayTitle } from "@/lib/display";
import { getPublishedEvents } from "@/lib/server-content";
import type { EventRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Every published KOSA date: the annual general meeting, the mentorship clinic, the bursary ceremony, the clean-up day and the reunion weekend, with venue, capacity and RSVP.",
  alternates: { canonical: "/events/" },
};

function EventRowItem({ event, muted = false }: { event: EventRow; muted?: boolean }) {
  const parts = dayParts(event.starts_at);

  return (
    <div className={muted ? "bg-white" : "bg-paper"}>
      <div className="grid gap-4 px-5 py-6 md:grid-cols-[120px_1fr_auto] md:items-center md:gap-8 md:px-8 md:py-7">
        <div
          className={`flex w-[96px] flex-col justify-center px-3 py-2 ${
            muted ? "bg-paper" : "bg-navy"
          }`}
        >
          <span className={`text-[13px] ${muted ? "text-slate" : "text-white/75"}`}>{parts.weekday}</span>
          <span
            className={`font-[family-name:var(--font-display)] text-[27px] font-extrabold leading-none ${
              muted ? "text-navy" : "text-white"
            }`}
          >
            {parts.day}
          </span>
          <span className={`text-[13px] ${muted ? "text-slate" : "text-white/75"}`}>{parts.month}</span>
        </div>

        <div>
          <h3 className="t-h3 max-w-[32ch] text-navy">{displayTitle(event.title)}</h3>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-slate">
            {event.category} · {event.venue ?? "Venue to be confirmed"}
          </p>
          <p className="mt-1 text-[15px] text-slate">
            {formatTime(event.starts_at)} EAT ·{" "}
            {event.capacity ? `${event.capacity} places` : "Capacity not set"}
          </p>
        </div>

        <Button
          asChild
          variant={muted ? "quiet" : "outline"}
          size="md"
          className="w-full justify-self-start sm:w-auto md:justify-self-end"
        >
          <Link href={`/events/${event.slug}/`}>{muted ? "See the record" : "Details and RSVP"}</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const { rows, demo } = await getPublishedEvents();
  const upcoming = rows
    .filter((event) => isFuture(event.starts_at))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const past = rows
    .filter((event) => !isFuture(event.starts_at))
    .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));

  return (
    <>
      <PageHero
        id="events-title"
        lines={["Events"]}
        lede="Every published KOSA date in one place: the annual meeting, the clinics, the bursary ceremony and the reunions. Signed-in members reserve a place; the rest of the page is open to anyone."
      >
        {demo ? <DemoTag label="Demo events" /> : null}
      </PageHero>

      <section aria-labelledby="upcoming-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-6 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="upcoming-heading" className="t-h1 text-navy">
                What is on
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-slate">
                Dates below are published by the event managers. A place is held only when a member reserves
                it, so the organisers can plan seating, refreshments and volunteers against a real number.
              </p>
            </Reveal>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState title="No dates are published yet" className="mt-10">
              When an event manager publishes the next meeting or clinic it appears here, with its venue and
              the number of places.
            </EmptyState>
          ) : (
            <ul className="mt-10 flex flex-col gap-2">
              {upcoming.map((event, index) => (
                <Reveal as="li" key={event.id} delay={index * 50}>
                  <EventRowItem event={event} />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="past-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="past-heading" className="t-h1 text-navy">
              Past dates
            </h2>
            <p className="mt-4 max-w-[54ch] text-[17px] leading-relaxed text-slate">
              Dates stay on the page once they have run, so a member can find the event they attended and the
              reports that came out of it.
            </p>
          </Reveal>

          {past.length === 0 ? (
            <EmptyState title="Nothing has run yet" className="mt-8">
              The first date on this list is still ahead. Past dates are filed here after they happen.
            </EmptyState>
          ) : (
            <ul className="mt-8 flex flex-col gap-2">
              {past.map((event, index) => (
                <Reveal as="li" key={event.id} delay={index * 40}>
                  <EventRowItem event={event} muted />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="attend-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="attend-heading" className="t-h1 text-white">
              How to attend
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-12">
            <Reveal delay={60}>
              <h3 className="t-h3 text-gold">Reserve, do not just turn up</h3>
              <p className="mt-3 max-w-[46ch] text-[17px] leading-relaxed text-white/85">
                Registration keeps the numbers honest: chairs, food and, for the clinics, how many volunteers
                to ask. It also means someone can reach you if the venue changes at short notice.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <h3 className="t-h3 text-gold">Members first</h3>
              <p className="mt-3 max-w-[46ch] text-[17px] leading-relaxed text-white/85">
                RSVP opens to members whose application has been approved and whose membership is active. An
                applicant can still see every date while the officer reads the file.
              </p>
            </Reveal>
          </div>

          <Reveal delay={180} className="mt-8">
            <p className="max-w-[62ch] text-[16px] leading-relaxed text-white/70">
              Every registration you make is listed in your portal, so you can check what you signed up for
              without keeping the confirmation email.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="join-heading" className="bg-white px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 md:grid-cols-12 md:items-center md:gap-12">
          <div className="md:col-span-8">
            <Reveal>
              <h2 id="join-heading" className="t-h2 text-navy">
                Not on the register
              </h2>
            </Reveal>
            <Reveal delay={60} className="mt-3">
              <p className="max-w-[54ch] text-[17px] leading-relaxed text-slate">
                RSVP needs a member account. The membership page sets out the four steps, and none of them
                takes more than a few minutes.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-4 md:justify-self-end">
            <Button asChild variant="ink" size="lg" className="w-full sm:w-auto">
              <Link href="/membership/">See the four steps</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
