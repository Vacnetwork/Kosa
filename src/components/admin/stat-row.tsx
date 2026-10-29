import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Five real figures in a row. A figure the viewer may not read is shown as a
 * dash with the reason — never as a zero, which would be a lie about the books.
 */
export function StatRow({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{children}</ul>;
}

export function Stat({
  label,
  value,
  note,
  href,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  href?: string;
  muted?: boolean;
}) {
  const body = (
    <>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">{label}</p>
      <p
        className={cn(
          "mt-2 font-[family-name:var(--font-display)] text-[30px] font-extrabold leading-none tabular-nums",
          muted ? "text-slate" : "text-navy",
        )}
      >
        {value}
      </p>
      {note ? <p className="mt-1.5 text-[13px] leading-snug text-slate">{note}</p> : null}
      {href ? (
        <span className="mt-2 inline-block text-[13px] font-semibold text-navy underline decoration-2 underline-offset-4">
          Open
        </span>
      ) : null}
    </>
  );

  const shell = "block h-full bg-white p-4 quiet-border";

  if (href) {
    return (
      <li>
        <Link href={href} className={cn(shell, "transition-colors hover:bg-paper")}>
          {body}
        </Link>
      </li>
    );
  }
  return <li className={shell}>{body}</li>;
}
