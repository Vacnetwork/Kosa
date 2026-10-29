"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Crest } from "@/components/brand/crest";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { KOSA, NAV_LINKS } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * A plain bar: mark, name, five links, one action. No glass, no pill, no
 * chrome. It sits on whatever chapter colour is behind it, so its colours
 * come from props rather than being fixed here.
 */
export function SiteHeader({ tone = "paper" }: { tone?: "paper" | "navy" }) {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const onDark = tone === "navy";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "z-40 w-full",
        onDark ? "bg-navy text-white" : "bg-paper text-navy",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-[var(--margin)] py-4">
        <Link href="/" className="flex items-center gap-3" aria-label={`${KOSA.name} home`}>
          <Crest className="h-10 w-auto md:h-11" />
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-tight md:text-[19px]">
              KOSA
            </span>
            <span className={cn("mt-1 hidden text-[13px] sm:block", onDark ? "text-white/75" : "text-slate")}>
              Kakoma Old Students Association
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-[family-name:var(--font-display)] text-[15px] font-bold transition-colors",
                  onDark ? "text-white/85 hover:text-white" : "text-navy/80 hover:text-navy",
                  active && (onDark ? "text-white underline decoration-gold decoration-2 underline-offset-4" : "text-navy underline decoration-gold decoration-2 underline-offset-4"),
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login/"
            className={cn(
              "hidden text-[14px] underline decoration-2 underline-offset-4 md:inline",
              onDark ? "text-white/80 decoration-transparent hover:decoration-gold" : "text-navy/80 decoration-transparent hover:decoration-gold",
            )}
          >
            {session ? "Account" : "Sign in"}
          </Link>
          <Button asChild variant="primary" size="sm">
            <Link href={session ? "/portal/" : "/membership/"}>{session ? "Member portal" : "Join KOSA"}</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="kosa-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "flex h-11 w-11 items-center justify-center lg:hidden",
              onDark ? "text-white" : "text-navy",
            )}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
              {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div id="kosa-mobile-nav" className="lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1 bg-navy px-[var(--margin)] py-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 font-[family-name:var(--font-display)] text-[20px] font-bold text-white"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild variant="primary" size="block" className="mt-4">
              <Link href={session ? "/portal/" : "/login/"}>{session ? "Member portal" : "Member login"}</Link>
            </Button>
            {!loading && !session ? (
              <Button asChild variant="onDark" size="block" className="mt-2">
                <Link href="/register/">Create an account</Link>
              </Button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
