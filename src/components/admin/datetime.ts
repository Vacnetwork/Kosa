/**
 * Kampala wall-clock helpers for <input type="datetime-local">.
 *
 * Uganda runs on EAT (UTC+3) all year with no daylight saving, so a fixed
 * offset is exact here and keeps the input showing the time an event manager
 * would write on a noticeboard rather than their laptop's local zone.
 */
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

export function toDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 16);
}

export function fromDateTimeInput(value: string): string {
  if (!value) return "";
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}+03:00`).toISOString();
}

export function todayInKampala(): string {
  return new Date(Date.now() + EAT_OFFSET_MS).toISOString().slice(0, 10);
}

export function currentYearInKampala(): number {
  return Number(todayInKampala().slice(0, 4));
}

/** YYYY-MM in Kampala, for grouping. */
export function monthKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 7);
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "Africa/Kampala",
});

export function monthLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return MONTH_LABEL.format(date);
}

export function shortId(value: string | null | undefined): string {
  if (!value) return "—";
  return value.length > 8 ? value.slice(0, 8) : value;
}
