import { HomeChapters } from "@/components/home/home-chapters";
import { getImpactStats, getPublicCohorts, getPublishedEvents, getPublishedGallery } from "@/lib/server-content";

/**
 * The homepage is pre-rendered at build time: published content is read from
 * Supabase during `next build` (RLS applies to the anon key) and falls back to
 * labelled demo content when no backend is configured.
 */
export default async function HomePage() {
  const [events, gallery, impact, yearTotals] = await Promise.all([
    getPublishedEvents(),
    getPublishedGallery(),
    getImpactStats(),
    getPublicCohorts(),
  ]);

  return (
    <HomeChapters
      events={events.rows}
      eventsDemo={events.demo}
      gallery={gallery.rows}
      impact={impact}
      yearTotals={yearTotals.length > 0 ? yearTotals : [{ year: 1999, members: 34 }]}
    />
  );
}
