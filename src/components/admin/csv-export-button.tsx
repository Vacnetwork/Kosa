"use client";

import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/format";

/**
 * Exports exactly the rows currently on screen. Disabled with a reason when
 * there is nothing to write, so no one downloads an empty file and wonders.
 */
export function CsvExportButton({
  rows,
  filename,
  columns,
  label = "Export CSV",
  size = "sm",
  variant = "outline",
  disabled,
  className,
}: {
  rows: Record<string, unknown>[];
  filename: string;
  columns?: string[];
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  className?: string;
}) {
  const count = rows.length;
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || count === 0}
      title={count === 0 ? "There is nothing in this view to export" : `Download ${count} rows as CSV`}
      onClick={() => {
        downloadCsv(filename, toCsv(rows, columns));
        toast.success("CSV downloaded", { description: `${filename} — ${count} rows.` });
      }}
    >
      {label}
    </Button>
  );
}
