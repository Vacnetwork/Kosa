import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosa.example.org").replace(/\/+$/, "");

// Static export: robots.txt is written once, at build time.
export const dynamic = "force-static";

/**
 * The public chapters are open to crawlers; the member and admin areas are not,
 * and they are behind authentication in any case.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/portal/",
          "/admin/",
          "/auth/",
          "/login/",
          "/register/",
          "/forgot-password/",
          "/verify-email/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
