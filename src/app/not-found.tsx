import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/brand/crest";
import { Button } from "@/components/ui/button";
import { KOSA, NAV_LINKS } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page is not part of the KOSA site. Every page is listed in the menu.",
};

export default function NotFound() {
  return (
    <main id="main" className="min-h-svh bg-navy px-[var(--margin)] py-14 text-white md:py-20">
      <div className="mx-auto flex min-h-[70svh] w-full max-w-[1440px] flex-col justify-between gap-12">
        <div className="flex items-center gap-3">
          <Crest className="h-10 w-auto md:h-11" />
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-tight md:text-[19px]">
              {KOSA.shortName}
            </span>
            <span className="mt-1 text-[13px] text-white/70">{KOSA.name}</span>
          </span>
        </div>

        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <h1 className="t-h1 uppercase text-white">
              <span className="block">Off the</span>
              <span className="block">register</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-white/85">
              This address is not part of the site. It may have been a page that has since moved, or a link
              with a letter out of place.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link href="/">Back to the home page</Link>
              </Button>
              <Link
                href="/contact/"
                className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[17px] font-bold text-white underline decoration-gold decoration-2 underline-offset-4"
              >
                Write to the secretariat
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <h2 className="font-[family-name:var(--font-display)] text-[17px] font-bold text-white">
              Every page on the site
            </h2>
            <ul className="mt-4 flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-11 items-center py-2 font-[family-name:var(--font-display)] text-[17px] font-bold text-white underline decoration-transparent underline-offset-4 hover:decoration-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="max-w-[92ch] text-[13px] leading-relaxed text-white/60">{KOSA.motto}</p>
      </div>
    </main>
  );
}
