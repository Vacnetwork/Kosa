import { cn } from "@/lib/cn";

type Tone = "positive" | "negative" | "pending" | "attention" | "neutral" | "confidential";

const TONES: Record<Tone, string> = {
  positive: "border-[#276b40] bg-[#eaf2ec] text-[#1c4a2c]",
  negative: "border-[#8f2018] bg-[#fbeceb] text-[#7c1d16]",
  pending: "border-navy/30 bg-paper text-navy",
  attention: "border-gold bg-[#fdf6e3] text-[#5a4408]",
  neutral: "border-paper-dim bg-white text-slate",
  confidential: "border-navy bg-navy text-white",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[13px] font-semibold leading-tight",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  pending: "pending",
  submitted: "pending",
  reviewing: "attention",
  needs_info: "attention",
  approved: "positive",
  active: "positive",
  disbursed: "positive",
  going: "positive",
  published: "positive",
  rejected: "negative",
  declined: "negative",
  suspended: "negative",
  lapsed: "attention",
  cancelled: "neutral",
  draft: "neutral",
  waitlist: "attention",
};

export function statusTone(status: string): Tone {
  return STATUS_TONES[status] ?? "neutral";
}

export function humanStatus(status: string): string {
  return status.replace(/_/g, " ");
}
