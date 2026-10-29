"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Two-step confirmation for destructive or irreversible actions (cancelling a
 * registration, declining a mentorship, closing one). The first click arms the
 * action and explains the consequence; the second runs it.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  consequence,
  onConfirm,
  variant = "danger",
  size = "sm",
  className,
}: {
  label: string;
  confirmLabel: string;
  consequence: string;
  onConfirm: () => Promise<void>;
  variant?: "danger" | "quiet" | "outline";
  size?: "sm" | "md";
  className?: string;
}) {
  const [armed, setArmed] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function run() {
    setPending(true);
    try {
      await onConfirm();
      setArmed(false);
    } finally {
      setPending(false);
    }
  }

  if (!armed) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={pending}
        onClick={() => setArmed(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3 border border-paper-dim bg-paper px-3 py-2", className)}>
      <p className="max-w-[42ch] text-[13px] leading-snug text-navy">{consequence}</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="danger" size="sm" onClick={run} disabled={pending}>
          {pending ? "Working…" : confirmLabel}
        </Button>
        <Button type="button" variant="quiet" size="sm" onClick={() => setArmed(false)} disabled={pending}>
          Keep
        </Button>
      </div>
    </div>
  );
}
