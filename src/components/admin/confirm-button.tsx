"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Two steps for anything that cannot be undone: the first click unfolds the
 * consequence, the second performs it. Nothing fires on the same click that
 * asked "are you sure?".
 */
export function ConfirmButton({
  label,
  confirmLabel = "Confirm",
  description,
  onConfirm,
  variant = "outline",
  size = "sm",
  confirmVariant = "danger",
  disabled,
  pending,
  className,
}: {
  label: string;
  confirmLabel?: string;
  description: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  confirmVariant?: ButtonProps["variant"];
  disabled?: boolean;
  pending?: boolean;
  className?: string;
}) {
  const [asking, setAsking] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const working = busy || Boolean(pending);

  if (!asking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || working}
        onClick={() => setAsking(true)}
      >
        {pending ? "Working…" : label}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Confirm: ${label}`}
      className={cn("max-w-[360px] border border-navy bg-white p-2.5", className)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !working) setAsking(false);
      }}
    >
      <p className="text-[13px] leading-snug text-navy">{description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant={confirmVariant}
          size="sm"
          autoFocus
          disabled={working}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              setAsking(false);
            } catch {
              // The caller surfaces the failure next to the record; keep the confirm open.
            } finally {
              setBusy(false);
            }
          }}
        >
          {working ? "Working…" : confirmLabel}
        </Button>
        <Button variant="quiet" size="sm" disabled={working} onClick={() => setAsking(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
