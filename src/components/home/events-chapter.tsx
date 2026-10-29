"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { dayParts, formatTime, isFuture } from "@/lib/format";
import type { EventRow } from "@/lib/types";

/**
 * Upcoming events as a banded agenda: day tabs down the left, the selected
 * event's details on the right. One tab is always selected, so the section
 * can never render empty.
 */
export function EventsChapter({ events, demo }: { events: EventRow[]; demo: boolean }) {
  const upcoming = useMemo(() => {
    const list = events.filter((event) => isFuture(event.starts_at));
    return (list.length > 0 ? list : events).slice(0, 5);
  }, [events]);
  const [activeId, setActiveId] = useState(upcoming[0]?.id ?? "");
  const active = upcoming.find((event) => event.id === activeId) ?? upcoming[0];

  return (
    <section aria-labelledby="events-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <h2 id="events-heading" className="t-h1 max-w-[12ch] text-navy">
              What is next
            </h2>
            <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-slate">
              Five dates on the KOSA calendar. Each one is published by an event manager, open to
              signed-in members, and recorded in your registration history.
            </p>
          </Reveal>
          <div className="flex items-center gap-3">
            {demo ? <DemoTag label="Demo events" /> : null}
            <Button asChild variant="ink" size="md">
              <Link href="/events/">All events</Link>
            </Button>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState title="No events are published yet" className="mt-10">
            Events appear here as soon as an event manager publishes them.
          </EmptyState>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-[150px_1fr] md:gap-10">
            <div
              role="tablist"
              aria-label="Upcoming event dates"
              aria-orientation="vertical"
              className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0"
            >
              {upcoming.map((event) => {
                const parts = dayParts(event.starts_at);
                const selected = event.id === active?.id;
                return (
                  <button
                    key={event.id}
                    type="button"
                    role="tab"
                    id={`event-tab-${event.id}`}
                    aria-selected={selected}
                    aria-controls={`event-panel-${event.id}`}
                    onClick={() => setActiveId(event.id)}
                    className={`flex h-16 w-[132px] shrink-0 flex-col justify-center px-3 text-left transition-colors md:w-[150px] ${
                      selected ? "bg-navy text-white" : "bg-paper text-navy hover:bg-paper-dim"
                    }`}
                  >
                    <span className="font-[family-name:var(--font-display)] text-[16px] font-bold">
                      {parts.weekday} {parts.day} {parts.month}
                    </span>
                    <span className={`text-[13px] ${selected ? "text-white/75" : "text-slate"}`}>
                      {parts.time} EAT
                    </span>
                  </button>
                );
              })}
            </div>

            {active ? (
              <div
                role="tabpanel"
                id={`event-panel-${active.id}`}
                aria-labelledby={`event-tab-${active.id}`}
                className="flex flex-col justify-between bg-paper px-5 py-6 md:min-h-[300px] md:px-8 md:py-8"
              >
                <div>
                  <p className="text-[14px] text-slate">
                    {active.category} · {active.venue ?? "Venue to be confirmed"}
                  </p>
                  <h3 className="mt-2 t-h2 max-w-[28ch] text-navy">{active.title}</h3>
                  <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-navy/85 md:text-[17px]">
                    {active.summary}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button asChild variant="primary" size="md">
                    <Link href={`/events/${active.slug}/`}>Details and RSVP</Link>
                  </Button>
                  <p className="text-[14px] text-slate">
                    {formatTime(active.starts_at)} EAT
                    {active.capacity ? ` · ${active.capacity} places` : ""}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
