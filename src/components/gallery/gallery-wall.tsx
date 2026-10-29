"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import type { GalleryItem } from "@/lib/types";

/**
 * The wall filters by album. The filter is additive: every picture is in the
 * document on first paint, so the wall is complete without JavaScript.
 */
export function GalleryWall({ items }: { items: GalleryItem[] }) {
  const albums = useMemo(
    () => Array.from(new Set(items.map((item) => item.album))).sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const [album, setAlbum] = useState<string>("all");
  const visible = album === "all" ? items : items.filter((item) => item.album === album);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAlbum("all")}
          aria-pressed={album === "all"}
          className={`h-11 px-4 font-[family-name:var(--font-display)] text-[15px] font-bold transition-colors ${
            album === "all" ? "bg-navy text-white" : "bg-paper text-navy hover:bg-paper-dim"
          }`}
        >
          All pictures
        </button>
        {albums.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setAlbum(name)}
            aria-pressed={album === name}
            className={`h-11 px-4 font-[family-name:var(--font-display)] text-[15px] font-bold transition-colors ${
              album === name ? "bg-navy text-white" : "bg-paper text-navy hover:bg-paper-dim"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-[15px] text-slate">
        {album === "all"
          ? `${items.length} pictures in ${albums.length} albums.`
          : `${visible.length} ${visible.length === 1 ? "picture" : "pictures"} in ${album}.`}
      </p>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <Reveal as="li" key={item.id} delay={(index % 3) * 50} className="flex flex-col bg-paper">
            <div className="aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.caption ?? item.title}
                width={800}
                height={600}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between px-4 py-4">
              <div>
                <p className="font-[family-name:var(--font-display)] text-[17px] font-bold text-navy">
                  {item.title}
                </p>
                {item.caption ? (
                  <p className="mt-1 max-w-[34ch] text-[15px] leading-relaxed text-slate">{item.caption}</p>
                ) : null}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-slate">
                {item.credit ?? "AI-generated illustration"}
                {item.cohort_year ? ` · Class of ${item.cohort_year}` : ` · ${item.album}`}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
