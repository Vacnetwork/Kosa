/**
 * Build-time content for the public pages.
 *
 * Public pages are pre-rendered at build time (static export), so they read
 * published content straight from Supabase's REST API using the anon key —
 * which is itself subject to RLS. If no backend is configured at build time,
 * the clearly-labelled demo fixtures are used instead, and the site still
 * builds and deploys.
 */
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_IMPACT,
  DEMO_NEWS,
  DEMO_PROJECTS,
} from "@/content/demo";
import { OFFICIAL_NEWS } from "@/content/stories";
import type { Announcement, EventRow, GalleryItem, ImpactStats, NewsPost } from "@/lib/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function hasBackend(): boolean {
  return Boolean(url && anonKey);
}

async function rest<T>(path: string): Promise<T | null> {
  if (!url || !anonKey) return null;
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
      },
      // Content is baked into the build; a rebuild publishes new content.
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublishedEvents(): Promise<{ rows: EventRow[]; demo: boolean }> {
  const rows = await rest<EventRow[]>("events?is_published=eq.true&order=starts_at.asc");
  if (!rows) return { rows: DEMO_EVENTS, demo: true };
  return { rows, demo: false };
}

export async function getPublishedNews(): Promise<{ rows: NewsPost[]; demo: boolean }> {
  const rows = await rest<NewsPost[]>("news_posts?is_published=eq.true&order=published_at.desc");
  if (!rows) {
    // No backend: real stories first, then the labelled fixtures.
    const byNewest = (a: NewsPost, b: NewsPost) => Date.parse(b.published_at) - Date.parse(a.published_at);
    const merged = [
      ...[...OFFICIAL_NEWS].sort(byNewest),
      ...DEMO_NEWS.map((post) => ({ ...post, is_fixture: true })).sort(byNewest),
    ];
    return { rows: merged, demo: merged.some((post) => post.is_fixture) };
  }
  // Seeded fixtures are recognisable by their slug prefix, so a real story is
  // never mistaken for one (and never picked as the homepage highlight).
  const marked = rows.map((post) => ({ ...post, is_fixture: post.slug.startsWith("demo-") }));
  return { rows: marked, demo: marked.some((post) => post.is_fixture) };
}

/** The story the homepage highlights: the newest one the association filed. */
export async function getLeadStory(): Promise<NewsPost | null> {
  const { rows } = await getPublishedNews();
  return rows.find((post) => !post.is_fixture) ?? rows[0] ?? null;
}

export async function getPublishedGallery(): Promise<{ rows: GalleryItem[]; demo: boolean }> {
  const rows = await rest<GalleryItem[]>("gallery_items?is_published=eq.true&order=created_at.desc");
  if (!rows) return { rows: DEMO_GALLERY, demo: true };
  return { rows, demo: false };
}

export async function getImpactStats(): Promise<ImpactStats> {
  const rows = await rest<
    { active_members: number; cohorts: number; projects: number; bursaries_awarded: number }[]
  >("rpc/get_impact_stats");
  const row = rows?.[0];
  if (!row) return DEMO_IMPACT;
  return {
    active_members: Number(row.active_members),
    years: Number(row.cohorts),
    projects: Number(row.projects),
    bursaries_awarded: Number(row.bursaries_awarded),
    demo: false,
  };
}

export async function getPublicCohorts(): Promise<{ year: number; members: number }[]> {
  const rows = await rest<{ year: number; members: number }[]>("rpc/cohort_stats");
  if (!rows || rows.length === 0) return [];
  return rows;
}

export async function getPublicAnnouncements(): Promise<Announcement[]> {
  return DEMO_ANNOUNCEMENTS.filter((a) => a.audience === "members");
}

export const PROJECTS = DEMO_PROJECTS;
