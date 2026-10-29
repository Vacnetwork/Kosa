/**
 * Cloudflare Pages reads `_headers` and `_redirects` from the root of the
 * deployed directory. Next.js's static export does not always carry them over
 * from public/, so this runs after `next build` (npm `postbuild`) and copies
 * them into ./out, failing loudly if they are missing.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const files = ["_headers", "_redirects"];
const root = process.cwd();
const out = join(root, "out");

if (!existsSync(out)) {
  console.error("out/ is missing — run `next build` first");
  process.exit(1);
}

for (const file of files) {
  const from = join(root, "public", file);
  if (!existsSync(from)) continue;
  copyFileSync(from, join(out, file));
  console.log(`copied ${file} → out/${file}`);
}
