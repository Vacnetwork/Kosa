"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/supabase";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      getResponse: (id?: string) => string | undefined;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile — free, unlimited bot protection.
 *
 * The widget writes its token into the DOM; src/lib/supabase.ts#getCaptchaToken
 * reads it with turnstile.getResponse() and passes it as `captchaToken` on each
 * auth call. The matching secret lives only in the Supabase project's auth
 * settings (never in this repo).
 *
 * Renders nothing at all when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so local
 * development and demo builds are unaffected.
 */
export function Turnstile({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        theme: "light",
      });
    };

    if (window.turnstile) mount();
    else {
      const timer = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(timer);
          mount();
        }
      }, 250);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <div className={className}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={ref} />
      <p className="text-[13px] leading-relaxed text-slate">
        Protected by Cloudflare Turnstile, which checks that you are a person without asking you to
        solve a puzzle.
      </p>
    </div>
  );
}
