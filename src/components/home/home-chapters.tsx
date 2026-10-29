import { AboutChapter } from "@/components/home/about-chapter";
import { AchievementsChapter } from "@/components/home/achievements-chapter";
import { CtaChapter } from "@/components/home/cta-chapter";
import { EventsChapter } from "@/components/home/events-chapter";
import { GalleryChapter } from "@/components/home/gallery-chapter";
import { Hero } from "@/components/home/hero";
import { NewsHighlight } from "@/components/home/news-highlight";
import { ProjectsChapter } from "@/components/home/projects-chapter";
import { StatsChapter } from "@/components/home/stats-chapter";
import { TestimonialChapter } from "@/components/home/testimonial-chapter";
import { DEMO_ACHIEVEMENTS, DEMO_PROJECTS } from "@/content/demo";
import type { EventRow, GalleryItem, ImpactStats, NewsPost } from "@/lib/types";

export function HomeChapters({
  leadStory,
  events,
  eventsDemo,
  gallery,
  impact,
  yearTotals,
}: {
  leadStory: NewsPost | null;
  events: EventRow[];
  eventsDemo: boolean;
  gallery: GalleryItem[];
  impact: ImpactStats;
  yearTotals: { year: number; members: number }[];
}) {
  return (
    <>
      <Hero />
      {leadStory ? <NewsHighlight post={leadStory} /> : null}
      <AboutChapter />
      <StatsChapter stats={impact} />
      <EventsChapter events={events} demo={eventsDemo} />
      <ProjectsChapter projects={DEMO_PROJECTS} />
      <AchievementsChapter achievements={DEMO_ACHIEVEMENTS} />
      <TestimonialChapter />
      <GalleryChapter items={gallery} yearTotals={yearTotals} />
      <CtaChapter />
    </>
  );
}
