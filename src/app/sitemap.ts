import type { MetadataRoute } from "next";
import { getPublishedEvents, getPublishedNews } from "@/lib/server-content";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosa.example.org").replace(/\/+$/, "");

// Static export: the sitemap is baked at build time, never rendered per request.
export const dynamic = "force-static";

const PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about/", changeFrequency: "monthly", priority: 0.7 },
  { path: "/membership/", changeFrequency: "monthly", priority: 0.9 },
  { path: "/events/", changeFrequency: "weekly", priority: 0.8 },
  { path: "/news/", changeFrequency: "weekly", priority: 0.7 },
  { path: "/welfare/", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gallery/", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contact/", changeFrequency: "yearly", priority: 0.6 },
];

/**
 * The sitemap is generated at build time from the same published content the
 * pages render, so a story or a date cannot be missing from it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, news] = await Promise.all([getPublishedEvents(), getPublishedNews()]);
  const lastModified = new Date();

  return [
    ...PAGES.map((page) => ({
      url: `${SITE}${page.path}`,
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...events.rows.map((event) => ({
      url: `${SITE}/events/${event.slug}/`,
      lastModified: new Date(event.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...news.rows.map((post) => ({
      url: `${SITE}/news/${post.slug}/`,
      lastModified: new Date(post.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
