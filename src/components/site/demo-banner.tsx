"use client";

import { useAuth } from "@/lib/auth";

/**
 * Shown only when no Supabase project is configured at build time. It states
 * plainly what this build is, instead of letting a visitor believe the sample
 * events and figures are association records.
 */
export function DemoBanner() {
  const { backendConfigured } = useAuth();
  if (backendConfigured) return null;
  return (
    <div className="bg-paper-dim px-[var(--margin)] py-2">
      <p className="mx-auto max-w-[1440px] text-[13px] leading-relaxed text-navy">
        <span className="font-semibold">Demonstration build.</span> Association records are not connected
        yet, so every event, figure and story below is clearly-labelled sample content and the member
        portal is closed. The setup steps are in the repository&rsquo;s <code>docs/UNCONFIGURED.md</code>.
      </p>
    </div>
  );
}
