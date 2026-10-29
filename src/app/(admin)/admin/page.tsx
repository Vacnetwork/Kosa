"use client";

import * as React from "react";
import Link from "next/link";
import { AdminPageHeader, Panel } from "@/components/admin/admin-page-header";
import { AuditPanel } from "@/components/admin/audit-panel";
import { Stat, StatRow } from "@/components/admin/stat-row";
import { currentYearInKampala, monthKey } from "@/components/admin/datetime";
import { ALL_PERMISSIONS, PERMISSION_LABELS, ROLE_LABELS } from "@/components/admin/nav";
import { errorMessage } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useAuth, type Permission } from "@/lib/auth";
import { listApplications, listContributions, listEvents, listMembers, listWelfareQueue } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney, isFuture } from "@/lib/format";
import { cn } from "@/lib/cn";

type MetricKey = "applications" | "members" | "events" | "welfare" | "contributions";

interface MetricState {
  value: string;
  note: string;
  available: boolean;
}

const CARDS: { key: MetricKey; label: string; href: string; permission?: Permission }[] = [
  { key: "applications", label: "Pending applications", href: "/admin/applications/", permission: "approve_members" },
  { key: "members", label: "Active members", href: "/admin/members/", permission: "manage_members" },
  { key: "events", label: "Upcoming events", href: "/admin/events/" },
  { key: "welfare", label: "Open welfare requests", href: "/admin/welfare/", permission: "view_welfare" },
  { key: "contributions", label: "Contributions this year", href: "/admin/contributions/", permission: "view_finance" },
];

const READING: Record<MetricKey, MetricState> = {
  applications: { value: "…", note: "Reading the queue", available: true },
  members: { value: "…", note: "Reading the register", available: true },
  events: { value: "…", note: "Reading the calendar", available: true },
  welfare: { value: "…", note: "Reading the queue", available: true },
  contributions: { value: "…", note: "Reading the ledger", available: true },
};

export default function AdminOverviewPage() {
  const { can, roles, backendConfigured, profile } = useAuth();
  const [metrics, setMetrics] = React.useState<Record<MetricKey, MetricState>>(READING);
  const [loadedAt, setLoadedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setMetrics(READING);
    setLoadedAt(null);

    const put = (key: MetricKey, patch: Partial<MetricState>) => {
      if (active) setMetrics((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }));
    };

    const count = async (
      key: MetricKey,
      permission: Permission | undefined,
      load: () => Promise<number>,
      note: (value: number) => string,
    ) => {
      if (permission && !can(permission)) {
        put(key, { value: "—", note: `Not in your permissions (${permission})`, available: false });
        return;
      }
      try {
        const value = await load();
        put(key, { value: value.toLocaleString("en-GB"), note: note(value), available: true });
      } catch (cause) {
        put(key, { value: "—", note: errorMessage(cause, "Could not read this count."), available: false });
      }
    };

    const contributions = async () => {
      if (!can("view_finance")) {
        put("contributions", { value: "—", note: "Not in your permissions (view_finance)", available: false });
        return;
      }
      try {
        const rows = await listContributions();
        const year = currentYearInKampala();
        const thisYear = rows.filter((row) => monthKey(row.received_at).startsWith(String(year)));
        const byCurrency = new Map<string, number>();
        thisYear.forEach((row) => {
          byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + Number(row.amount));
        });
        const value =
          byCurrency.size === 0
            ? formatMoney(0, "UGX")
            : Array.from(byCurrency.entries())
                .map(([currency, total]) => formatMoney(total, currency))
                .join(" · ");
        put("contributions", {
          value,
          note: `${thisYear.length} receipt${thisYear.length === 1 ? "" : "s"} recorded since 1 Jan ${year}`,
          available: true,
        });
      } catch (cause) {
        put("contributions", { value: "—", note: errorMessage(cause, "Could not read the ledger."), available: false });
      }
    };

    void Promise.all([
      count(
        "applications",
        "approve_members",
        async () => (await listApplications("pending")).length,
        (value) => (value === 0 ? "Nothing is waiting for a decision" : value === 1 ? "One application waiting" : `${value} applications waiting`),
      ),
      count(
        "members",
        "manage_members",
        async () => (await listMembers({ status: "active" })).length,
        (value) => (value === 0 ? "No active membership on the register" : "Status active on the register"),
      ),
      count(
        "events",
        undefined,
        async () => (await listEvents()).filter((event) => isFuture(event.starts_at)).length,
        (value) => (value === 0 ? "No published date ahead" : "Published, still to come"),
      ),
      count(
        "welfare",
        "view_welfare",
        async () => {
          const rows = await listWelfareQueue();
          return rows.filter((row) => row.status === "submitted" || row.status === "reviewing").length;
        },
        (value) => (value === 0 ? "No request is open" : "Submitted or under review"),
      ),
      contributions(),
    ]).finally(() => {
      if (active) setLoadedAt(new Date().toISOString());
    });

    return () => {
      active = false;
    };
  }, [can]);

  const today = formatDate(new Date().toISOString());

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description={`What needs attention across the register, the programme and the books. Signed in as ${profile?.full_name ?? "an administrator"}.`}
        meta={
          <>
            <span>{today}</span>
            <span>Roles: {roles.length > 0 ? roles.map((role) => ROLE_LABELS[role]).join(", ") : "none"}</span>
            <span>{loadedAt ? `Figures read ${formatDateTime(loadedAt)}` : "Reading the database…"}</span>
          </>
        }
      />

      {!backendConfigured ? (
        <Notice tone="warning" title="No backend is configured" className="mb-4">
          This build has no Supabase URL and key, so there are no records to count. The figures below will stay
          blank rather than show sample numbers.
        </Notice>
      ) : null}

      <StatRow>
        {CARDS.map((card) => {
          const metric = metrics[card.key];
          return (
            <Stat
              key={card.key}
              label={card.label}
              value={metric.value}
              note={metric.note}
              muted={!metric.available}
              href={metric.available ? card.href : undefined}
            />
          );
        })}
      </StatRow>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <AuditPanel
          limit={10}
          title="Audit log — last 10 entries"
          description="Written by the database on every privileged change. Newest first."
        />

        <Panel
          title="Your permissions"
          description="What this sign-in may do. The database enforces the same list on every call."
          actions={
            <Button asChild variant="quiet" size="sm">
              <Link href="/admin/reports/">Reports</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-paper-dim">
            {ALL_PERMISSIONS.map((permission) => {
              const held = can(permission);
              return (
                <li key={permission} className="flex items-start justify-between gap-3 py-1.5">
                  <div className="min-w-0">
                    <p className={cn("text-[14px] leading-snug", held ? "font-semibold text-navy" : "text-slate")}>
                      {PERMISSION_LABELS[permission]}
                    </p>
                    <p className="font-mono text-[13px] leading-snug text-slate">{permission}</p>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 text-[13px] font-semibold",
                      held ? "text-[#1c4a2c]" : "text-slate/70",
                    )}
                  >
                    {held ? "Held" : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-paper-dim pt-2 text-[13px] leading-relaxed text-slate">
            A permission you do not hold hides a screen; it does not weaken the check. Calls the database refuses are
            shown as errors, never as an empty list.
          </p>
        </Panel>
      </div>
    </>
  );
}
