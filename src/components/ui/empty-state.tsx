import * as React from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white px-6 py-10 quiet-border", className)}>
      <p className="font-[family-name:var(--font-display)] text-[17px] font-bold text-navy">{title}</p>
      {children ? <div className="mt-2 max-w-prose t-small text-slate">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
