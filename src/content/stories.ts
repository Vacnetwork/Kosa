/**
 * Official stories — content supplied by the association itself.
 *
 * Unlike `src/content/demo.ts`, nothing here is a fixture: these are reports
 * KOSA has published to its own site, so they render without a Demo label.
 * They are also seeded into `public.news_posts` (see `supabase/seed.sql`): when
 * a backend is configured the database is the source of truth and this file is
 * only the fallback for a build with no backend.
 *
 * Edit or add stories in the admin screens once the database is live; keep this
 * file in step so a build without a backend still shows the real record.
 */
import { PHOTOS } from "@/content/demo";
import type { NewsPost } from "@/lib/types";

export const OFFICIAL_NEWS: NewsPost[] = [
  {
    id: "official-news-jubilee-dinner",
    slug: "diamond-jubilee-hall-fundraising-dinner",
    title: "Diamond Jubilee Hall project unveiled at a Bugolobi fundraising dinner",
    excerpt:
      "Old students, board members and friends of Kakoma Secondary School came together at Royal Suites, Bugolobi on 15 August 2026 in support of the Diamond Jubilee Hall Project — a new hall for the school, timed to mark its 60th anniversary on 14 November 2026.",
    body: [
      "On 15 August 2026, old students, board members and friends of Kakoma Secondary School came together at Royal Suites, Bugolobi for an evening fundraising dinner in support of the Diamond Jubilee Hall Project — a new hall for the school, timed to mark our 60th anniversary on 14 November 2026.",
      "Board Chairman Dr. Isaac Nsereko welcomed guests and thanked old students for continuing to \u201clabour for success\u201d long after leaving Kakoma's gates. Head Teacher Bbale David spoke about the Board's vision for the Jubilee Hall and thanked old students for their generosity.",
      "The evening's highlight was the unveiling of the Diamond Jubilee Hall Project board: a visual journey \u201cfrom where we are\u201d — the school's current, aging facilities — \u201cto where we want to be\u201d — a modern hall pictured in architectural renders.",
      "Old students, including a guest from the Class of 1968, shared memories from their own years at Kakoma before pledging their support.",
    ].join("\n\n"),
    cover_image_url: PHOTOS.alumni.src,
    author_name: "KOSA Secretariat",
    published_at: "2026-08-15T21:00:00+03:00",
    is_published: true,
  },
];
