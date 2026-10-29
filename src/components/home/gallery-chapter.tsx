"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/lib/types";

/**
 * THE LIVE THING.
 *
 * Pick a graduation year and the wall changes to that cohort: how many members
 * it holds on the register, and the pictures tagged to it. It is the page's
 * one interactive device, and it is built from the subject itself — an alumni
 * association is organised by year. Without JavaScript the full wall still
 * renders (the filter is additive, never required to read anything).
 */
export function GalleryChapter({
  items,
  cohorts,
}: {
  items: GalleryItem[];
  cohorts: { year: number; members: number }[];
}) {
  const [year, setYear] = useState<number | "all">("all");
  const years = useMemo(() => cohorts.map((cohort) => cohort.year).sort((a, b) => b - a), [cohorts]);
  const visible = useMemo(
    () => (year === "all" ? items : items.filter((item) => item.cohort_year === year)),
    [items, year],
  );
  const cohortMembers = year === "all" ? null : cohorts.find((c) => c.year === year)?.members ?? 0;

  return (
    <section aria-labelledby="gallery-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <h2 id="gallery-heading" className="t-h1 text-navy">
              Pick a year
            </h2>
            <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-slate">
              The wall changes with the cohort you choose. Every picture is a real photograph of Gulu and
              Acholi life, credited under the strip.
            </p>
          </Reveal>
          <div className="flex items-center gap-3">
            <label htmlFor="cohort-picker" className="text-[15px] font-semibold text-navy">
              Cohort
            </label>
            <select
              id="cohort-picker"
              value={String(year)}
              onChange={(event) => setYear(event.target.value === "all" ? "all" : Number(event.target.value))}
              className="h-12 border-2 border-paper-dim bg-white px-3 text-[16px] text-navy focus:border-navy focus:outline-none"
            >
              <option value="all">All cohorts</option>
              {years.map((option) => (
                <option key={option} value={option}>
                  Class of {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p aria-live="polite" className="mt-8 text-[15px] text-slate">
          {year === "all"
            ? `${items.length} pictures across ${years.length} recorded cohorts.`
            : `Class of ${year}: ${cohortMembers} members on the register, ${visible.length} ${visible.length === 1 ? "picture" : "pictures"}.`}
        </p>

        {visible.length === 0 ? (
          <div className="mt-6 bg-paper px-6 py-10">
            <p className="font-[family-name:var(--font-display)] text-[18px] font-bold text-navy">
              No pictures are tagged to the Class of {year} yet
            </p>
            <p className="mt-2 max-w-[52ch] text-[15px] text-slate">
              Members of that cohort can add photographs once signed in. Every other cohort is still on the wall.
            </p>
            <Button variant="outline" size="sm" className="mt-5" onClick={() => setYear("all")}>
              Show all cohorts
            </Button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
            {visible.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 40} className="flex flex-col">
                <div className="aspect-square overflow-hidden bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.caption ?? item.title}
                    width={800}
                    height={800}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-2 bg-paper px-3 py-2">
                  <p className="truncate font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                    {item.title}
                  </p>
                  <p className="shrink-0 text-[13px] text-slate">
                    {item.cohort_year ? `’${String(item.cohort_year).slice(2)}` : item.album}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild variant="ink" size="md">
            <Link href="/gallery/">Open the full gallery</Link>
          </Button>
          <p className="text-[14px] text-slate">Signed-in members can add pictures to their own cohort.</p>
        </div>
      </div>
    </section>
  );
}
