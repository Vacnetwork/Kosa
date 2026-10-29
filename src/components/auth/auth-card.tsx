"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/** The white card every auth screen sits in. */
export function AuthCard({
  title,
  lede,
  children,
  footer,
  className,
}: {
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white px-6 py-7 quiet-border md:px-8 md:py-9", className)}>
      <h1 className="font-[family-name:var(--font-display)] text-[25px] font-extrabold leading-[1.12] text-navy md:text-[28px]">
        {title}
      </h1>
      {lede ? <div className="mt-2 max-w-prose text-[15px] leading-relaxed text-slate">{lede}</div> : null}
      <div className="mt-6">{children}</div>
      <noscript>
        <p className="mt-6 bg-[#fdf6e3] px-4 py-3 text-[14px] leading-relaxed text-[#5a4408]">
          This portal needs JavaScript to sign you in securely: the browser talks to the association&rsquo;s
          database directly, and the page never posts your details anywhere else. Enable JavaScript and
          reload.
        </p>
      </noscript>
      {footer ? (
        <div className="mt-6 border-t border-paper-dim pt-4 text-[14px] leading-relaxed text-slate">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
