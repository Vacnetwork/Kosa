import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * App screens may use quiet rules (the public chapters may not), so tables are
 * plain with a single tone step between header and rows.
 */
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto bg-white quiet-border", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap bg-paper px-4 py-3 font-[family-name:var(--font-display)] text-[13px] font-bold text-navy",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-t border-paper-dim px-4 py-3 align-top text-navy", className)}>{children}</td>;
}
