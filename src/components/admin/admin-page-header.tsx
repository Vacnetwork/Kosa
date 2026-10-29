import * as React from "react";
import { cn } from "@/lib/cn";

/** Every administration screen starts with the same three lines. */
export function AdminPageHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-5 border-b border-paper-dim pb-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-extrabold leading-tight tracking-tight text-navy md:text-[30px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-[76ch] text-[15px] leading-relaxed text-slate">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate">{meta}</div> : null}
    </header>
  );
}

/** A white panel: title row, optional actions, then the body. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("bg-white quiet-border", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-dim px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-[family-name:var(--font-display)] text-[16px] font-bold leading-snug text-navy">{title}</h2>
            ) : null}
            {description ? <p className="mt-0.5 max-w-[72ch] text-[13px] leading-relaxed text-slate">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** A small label + value pair used inside detail panels. */
export function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">{label}</dt>
      <dd className="mt-0.5 text-[14px] leading-relaxed text-navy">{children}</dd>
    </div>
  );
}
