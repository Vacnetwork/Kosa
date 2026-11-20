import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "error" | "success";

/**
 * Inline status, not a promotional band.
 *
 * A filled block with a thick coloured stripe down the left is the shape of an
 * advertisement, and readers skim past it — which is exactly wrong for a
 * decision, a refusal or a status. So:
 *
 *   • info reads as page text: a hairline rule above it, no fill, no stripe;
 *   • warning is a bordered block, the border on all sides so it reads as a
 *     quotation from the association rather than a banner;
 *   • error is the only loud one, because it is the only one that should stop
 *     the reader, and it carries role="alert";
 *   • success is a quiet bordered line that does not celebrate.
 */
const TONES: Record<Tone, string> = {
  info: "border-t border-paper-dim pt-3 text-navy",
  warning: "border border-paper-dim bg-paper-warm px-4 py-3 text-notice-ink",
  error: "border-2 border-danger bg-danger-wash px-4 py-3 text-danger-ink",
  success: "border border-paper-dim px-4 py-3 text-success-ink",
};

const TITLE_TONE: Record<Tone, string> = {
  info: "text-slate",
  warning: "text-notice-ink",
  error: "text-danger-ink",
  success: "text-success-ink",
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
  role,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  return (
    <div
      role={role ?? (tone === "error" ? "alert" : "status")}
      className={cn("text-[15px] leading-relaxed", TONES[tone], className)}
    >
      {title ? (
        <p className={cn("mb-1 font-[family-name:var(--font-display)] font-bold", TITLE_TONE[tone])}>
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}
