const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Kampala",
});

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Kampala",
});

const DAY_FMT = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Africa/Kampala" });
const DAY_NUM_FMT = new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: "Africa/Kampala" });
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Africa/Kampala" });

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return DATE_FMT.format(new Date(iso));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return TIME_FMT.format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return `${formatDate(iso)}, ${formatTime(iso)} EAT`;
}

export function dayParts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: DAY_FMT.format(d),
    day: DAY_NUM_FMT.format(d),
    month: MONTH_FMT.format(d),
    time: TIME_FMT.format(d),
  };
}

export function formatMoney(amount: number | null | undefined, currency = "UGX"): string {
  if (amount === null || amount === undefined) return "—";
  const formatted = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(amount);
  return `${currency} ${formatted}`;
}

export function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

export function relativeDays(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "";
  const keys = columns ?? Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return [keys.join(","), ...rows.map((row) => keys.map((k) => escape(row[k])).join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
