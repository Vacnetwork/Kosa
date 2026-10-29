import { cn } from "@/lib/cn";

/**
 * Marks sample content wherever it appears, so no visitor mistakes demo
 * figures, quotes or events for official association records.
 */
export function DemoTag({ className, label = "Demo content" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-navy px-2 py-1 font-[family-name:var(--font-display)] text-[13px] font-bold text-white",
        className,
      )}
    >
      {label}
    </span>
  );
}
