import type { NextConfig } from "next";

// Static export: every route is pre-rendered at build time and served as a
// plain file. This is what makes Cloudflare Pages' free plan (unlimited
// requests and bandwidth on static assets) a legitimate target for this app.
// See docs/DEPLOYMENT.md for the full hosting decision record.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  typedRoutes: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
