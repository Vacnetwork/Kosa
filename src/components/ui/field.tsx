"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Label + control + error, wired for screen readers:
 * the hint and the error are tied to the control with aria-describedby,
 * and the error carries role="alert" so it is announced when it appears.
 */
interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; "aria-describedby": string | undefined; "aria-invalid": boolean }) => React.ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, required, children, className }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}
      {hint ? (
        <p id={hintId} className="t-small text-slate">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="t-small font-semibold text-[#8f2018]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full border-2 border-paper-dim bg-white px-3 py-3 text-[16px] text-navy placeholder:text-slate/70 focus:border-navy focus:outline-none disabled:bg-paper";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(controlBase, "h-12", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlBase, "min-h-32 resize-y", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(controlBase, "h-12 appearance-none bg-white pr-8", className)} {...props} />
  ),
);
Select.displayName = "Select";

export function Checkbox({
  id,
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-navy)]"
        {...props}
      />
      <label htmlFor={id} className="t-small text-navy">
        {label}
      </label>
    </div>
  );
}
