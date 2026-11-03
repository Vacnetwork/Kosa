"use client";

/**
 * Print control for the paper application form. The page itself is a normal
 * server-rendered document: if this button never loads, the visitor can still
 * use the browser's own print command, so nothing depends on the script.
 */
export function PrintFormButton({ label = "Print this form" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-12 items-center justify-center gap-2 bg-navy px-6 font-[family-name:var(--font-display)] text-[15px] font-bold text-white transition-colors hover:bg-navy-deep focus-visible:outline-3 focus-visible:outline-offset-3"
    >
      {label}
    </button>
  );
}
