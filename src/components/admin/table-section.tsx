import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Notice } from "@/components/ui/notice";
import { TableWrap, Th } from "@/components/ui/table";
import { cn } from "@/lib/cn";

/**
 * A table with its four states spelled out: loading, refused/failed, empty and
 * loaded. Every administration table uses this so no screen can quietly render
 * an empty grid when the truth is "the server said no".
 */
export function TableSection({
  caption,
  description,
  head,
  rowCount,
  loading,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyBody,
  actions,
  children,
  footer,
  className,
  stickyHeader,
}: {
  caption?: string;
  description?: React.ReactNode;
  head: string[];
  rowCount: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyBody?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
}) {
  return (
    <section className={cn("bg-white quiet-border", className)}>
      {caption || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-dim px-4 py-3">
          <div className="min-w-0">
            {caption ? (
              <h2 className="font-[family-name:var(--font-display)] text-[16px] font-bold leading-snug text-navy">{caption}</h2>
            ) : null}
            {description ? <p className="mt-0.5 max-w-[72ch] text-[13px] leading-relaxed text-slate">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      {loading ? (
        <div className="px-4 py-8">
          <Spinner label="Loading…" />
        </div>
      ) : error ? (
        <div className="p-4">
          <Notice tone="error" title="Could not load this table">
            {error}
          </Notice>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : rowCount === 0 ? (
        <div className="px-4 py-8">
          <p className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">{emptyTitle}</p>
          {emptyBody ? <div className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-slate">{emptyBody}</div> : null}
        </div>
      ) : (
        <TableWrap className={stickyHeader ? "max-h-[68vh] overflow-y-auto" : undefined}>
          <thead>
            <tr>
              {head.map((label) => (
                <Th key={label} className={stickyHeader ? "sticky top-0 z-10" : undefined}>
                  {label}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </TableWrap>
      )}

      {footer ? <div className="border-t border-paper-dim px-4 py-2 text-[13px] text-slate">{footer}</div> : null}
    </section>
  );
}

/** Small filter row used above tables; kept separate so it can wrap. */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-3", className)}>{children}</div>;
}

export function FilterField({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-semibold text-navy">
        {label}
      </label>
      {children}
    </div>
  );
}
