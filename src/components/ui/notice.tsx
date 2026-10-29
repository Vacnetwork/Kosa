import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "error" | "success";

const TONES: Record<Tone, string> = {
  info: "bg-paper text-navy border-l-4 border-navy",
  warning: "bg-[#fdf6e3] text-[#5a4408] border-l-4 border-gold",
  error: "bg-[#fbeceb] text-[#7c1d16] border-l-4 border-[#8f2018]",
  success: "bg-[#eaf2ec] text-[#1c4a2c] border-l-4 border-[#276b40]",
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
      className={cn("px-4 py-3 text-[15px] leading-relaxed", TONES[tone], className)}
    >
      {title ? <p className="mb-1 font-[family-name:var(--font-display)] font-bold">{title}</p> : null}
      {children}
    </div>
  );
}
