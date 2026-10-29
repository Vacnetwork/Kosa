"use client";

/**
 * Small, shared building blocks for the member portal.
 *
 * The portal is an "Operate" surface: flat paper, white panels, 1px rules,
 * square corners, navy for structure. Gold is reserved for the single primary
 * action on a screen, so nothing in this file paints gold.
 */
import * as React from "react";
import { cn } from "@/lib/cn";
import type {
  ApplicationStatus,
  MembershipStatus,
  RegistrationStatus,
  WelfareCategory,
  WelfareStatus,
} from "@/lib/types";

/* ---------------------------------------------------------------- layout */

export function PageTitle({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-paper-dim pb-5">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-display)] text-[26px] font-extrabold leading-[1.1] text-navy md:text-[32px]">
          {title}
        </h1>
        {lede ? <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-slate">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("bg-white quiet-border", className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-dim px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-display)] text-[17px] font-bold leading-snug text-navy">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-prose text-[14px] leading-relaxed text-slate">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-5 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** A label/value pair for record-style panels. Renders as <dt>/<dd> inside a <dl>. */
export function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-paper-dim py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-44 shrink-0 font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.08em] text-slate">
        {label}
      </dt>
      <dd className="min-w-0 text-[15px] leading-relaxed text-navy">{children}</dd>
    </div>
  );
}

/* ---------------------------------------------------------------- status */

type PillTone = "neutral" | "positive" | "warning" | "negative";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "border-navy/30 bg-paper text-navy",
  positive: "border-[#276b40]/35 bg-[#eaf2ec] text-[#1c4a2c]",
  warning: "border-[#8a6a12]/35 bg-[#fdf6e3] text-[#5a4408]",
  negative: "border-[#8f2018]/35 bg-[#fbeceb] text-[#7c1d16]",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-[family-name:var(--font-display)] text-[13px] font-bold leading-normal",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  pending: "Pending",
  active: "Active",
  lapsed: "Lapsed",
  suspended: "Suspended",
};

export const APPLICATION_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending review",
  needs_info: "Needs information",
  approved: "Approved",
  rejected: "Not approved",
};

export const WELFARE_LABELS: Record<WelfareStatus, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  approved: "Approved",
  disbursed: "Disbursed",
  declined: "Declined",
};

export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  going: "Going",
  waitlist: "On the waitlist",
  cancelled: "Cancelled",
};

export const WELFARE_CATEGORY_LABELS: Record<WelfareCategory, string> = {
  bereavement: "Bereavement",
  medical: "Medical",
  education: "Education",
  hardship: "Hardship",
  other: "Other",
};

export function membershipTone(status: MembershipStatus): PillTone {
  if (status === "active") return "positive";
  if (status === "pending") return "warning";
  return "negative";
}

export function applicationTone(status: ApplicationStatus): PillTone {
  if (status === "approved") return "positive";
  if (status === "pending") return "warning";
  if (status === "needs_info") return "warning";
  return "negative";
}

export function welfareTone(status: WelfareStatus): PillTone {
  if (status === "disbursed" || status === "approved") return "positive";
  if (status === "declined") return "negative";
  return "warning";
}

export function registrationTone(status: RegistrationStatus): PillTone {
  if (status === "going") return "positive";
  if (status === "waitlist") return "warning";
  return "neutral";
}

/* ------------------------------------------------------------ data hook */

interface Loaded<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads a client-side collection with explicit loading / error states and a
 * `reload()` for after a mutation. `key` is the cache identity: change it and
 * the data is fetched again (used for filters and pagination).
 */
export function useLoad<T>(key: string, load: () => Promise<T>) {
  const loadRef = React.useRef(load);
  loadRef.current = load;

  const [state, setState] = React.useState<Loaded<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    loadRef
      .current()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!alive) return;
        const message =
          error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";
        setState({ data: null, loading: false, error: message });
      });
    return () => {
      alive = false;
    };
  }, [key, nonce]);

  const reload = React.useCallback(() => setNonce((value) => value + 1), []);

  return { ...state, reload };
}

/** Re-renders a component when the browser's query string is available. */
export function useQueryString(): URLSearchParams | null {
  const [params, setParams] = React.useState<URLSearchParams | null>(null);
  React.useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);
  return params;
}

/** Debounces a rapidly-changing value (search boxes). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
