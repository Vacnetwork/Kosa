"use client";

import * as React from "react";
import { AdminGate, InlineGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuditPanel } from "@/components/admin/audit-panel";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { StatusPill } from "@/components/admin/status-pill";
import { TableSection } from "@/components/admin/table-section";
import { monthKey, monthLabel } from "@/components/admin/datetime";
import { useAdminData } from "@/components/admin/use-admin-data";
import { Td } from "@/components/ui/table";
import { listApplications, listContributions, listEventRegistrations, listEvents, listMembers } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { ApplicationStatus, EventRegistration, EventRow, Membership, Profile } from "@/lib/types";

type MemberRow = Membership & { profiles: Partial<Profile> | null };

interface CohortRow {
  cohort: string;
  active: number;
  lapsed: number;
  suspended: number;
  pending: number;
  total: number;
}

interface MonthRow {
  key: string;
  label: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needs_info: number;
}

interface CampaignRow {
  key: string;
  campaign: string;
  currency: string;
  count: number;
  total: number;
}

interface AttendanceRow {
  event: EventRow;
  going: number | null;
  waitlist: number | null;
  cancelled: number | null;
  guests: number | null;
}

export default function AdminReportsPage() {
  return (
    <AdminGate screen="Reports">
      <AdminPageHeader
        title="Reports"
        description="Plain tables for the committee. Every figure is a count or a sum of rows the database returned — there are no charts and no modelled projections."
        meta={
          <>
            <span>Each table exports exactly its own rows.</span>
            <span>Where your roles cannot read a source table, that section says so and stays empty.</span>
          </>
        }
      />

      <div className="space-y-4">
        <InlineGate permission="manage_members">
          <CohortReport />
        </InlineGate>

        <InlineGate permission="approve_members">
          <ApplicationsReport />
        </InlineGate>

        <InlineGate permission="view_finance">
          <ContributionsReport />
        </InlineGate>

        <InlineGate permission="manage_events">
          <AttendanceReport />
        </InlineGate>

        <AuditPanel
          title="Audit log"
          description="Filter by action or entity, then export the filtered rows. Newest first, at most 300 entries."
          filterable
          exportable
          stickyHeader
        />
      </div>
    </AdminGate>
  );
}

function CohortReport() {
  const { data, loading, error, reload } = useAdminData<MemberRow[]>(() => listMembers(), [], []);

  const rows = React.useMemo<CohortRow[]>(() => {
    const map = new Map<string, CohortRow>();
    data.forEach((member) => {
      const year = member.cohort_year ?? member.profiles?.graduation_year ?? null;
      const cohort = year ? String(year) : "Not set";
      const row = map.get(cohort) ?? { cohort, active: 0, lapsed: 0, suspended: 0, pending: 0, total: 0 };
      row.total += 1;
      if (member.status === "active") row.active += 1;
      else if (member.status === "lapsed") row.lapsed += 1;
      else if (member.status === "suspended") row.suspended += 1;
      else row.pending += 1;
      map.set(cohort, row);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.cohort === "Not set") return 1;
      if (b.cohort === "Not set") return -1;
      return b.cohort.localeCompare(a.cohort);
    });
  }, [data]);

  return (
    <TableSection
      caption="Membership by cohort"
      description="Cohort year first, then the member's graduation year, then a single 'Not set' row for records with neither."
      head={["Cohort", "Active", "Lapsed", "Suspended", "Pending", "Total"]}
      rowCount={rows.length}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="The register is empty"
      emptyBody="Once applications are approved, cohort totals appear here."
      actions={<CsvExportButton rows={rows.map((row) => ({ ...row }))} filename="kosa-report-membership-by-cohort.csv" />}
    >
      {rows.map((row) => (
        <tr key={row.cohort}>
          <Td className="font-semibold tabular-nums">{row.cohort}</Td>
          <Td className="tabular-nums">{row.active}</Td>
          <Td className="tabular-nums">{row.lapsed}</Td>
          <Td className="tabular-nums">{row.suspended}</Td>
          <Td className="tabular-nums">{row.pending}</Td>
          <Td className="font-semibold tabular-nums">{row.total}</Td>
        </tr>
      ))}
    </TableSection>
  );
}

function ApplicationsReport() {
  const { data, loading, error, reload } = useAdminData(
    () => listApplications(),
    [],
    [] as Awaited<ReturnType<typeof listApplications>>,
  );

  const rows = React.useMemo<MonthRow[]>(() => {
    const map = new Map<string, MonthRow>();
    data.forEach((application) => {
      const key = monthKey(application.submitted_at);
      const row = map.get(key) ?? {
        key,
        label: monthLabel(application.submitted_at),
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        needs_info: 0,
      };
      row.total += 1;
      const status: ApplicationStatus = application.status;
      row[status] += 1;
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [data]);

  return (
    <TableSection
      caption="Applications by month"
      description="Grouped by the month an application was submitted, in Kampala time. Statuses are as they stand now."
      head={["Month", "Received", "Pending", "Approved", "Rejected", "Needs info"]}
      rowCount={rows.length}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="No applications yet"
      emptyBody="Months appear here once the first application is submitted."
      actions={
        <CsvExportButton
          rows={rows.map((row) => ({
            month: row.label,
            received: row.total,
            pending: row.pending,
            approved: row.approved,
            rejected: row.rejected,
            needs_info: row.needs_info,
          }))}
          filename="kosa-report-applications-by-month.csv"
        />
      }
    >
      {rows.map((row) => (
        <tr key={row.key}>
          <Td className="whitespace-nowrap font-semibold">{row.label}</Td>
          <Td className="tabular-nums">{row.total}</Td>
          <Td className="tabular-nums">{row.pending}</Td>
          <Td className="tabular-nums">{row.approved}</Td>
          <Td className="tabular-nums">{row.rejected}</Td>
          <Td className="tabular-nums">{row.needs_info}</Td>
        </tr>
      ))}
    </TableSection>
  );
}

function ContributionsReport() {
  const { data, loading, error, reload } = useAdminData(
    () => listContributions(),
    [],
    [] as Awaited<ReturnType<typeof listContributions>>,
  );

  const rows = React.useMemo<CampaignRow[]>(() => {
    const map = new Map<string, CampaignRow>();
    data.forEach((contribution) => {
      const key = `${contribution.campaign}|${contribution.currency}`;
      const row = map.get(key) ?? {
        key,
        campaign: contribution.campaign,
        currency: contribution.currency,
        count: 0,
        total: 0,
      };
      row.count += 1;
      row.total += Number(contribution.amount);
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  const grandTotalCurrencies = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((contribution) => {
      map.set(contribution.currency, (map.get(contribution.currency) ?? 0) + Number(contribution.amount));
    });
    return Array.from(map.entries());
  }, [data]);

  return (
    <TableSection
      caption="Contributions by campaign"
      description={
        grandTotalCurrencies.length > 0
          ? `All receipts, all years. Totals kept separate by currency: ${grandTotalCurrencies
              .map(([currency, total]) => formatMoney(total, currency))
              .join(" · ")}.`
          : "All receipts, all years, kept separate by currency."
      }
      head={["Campaign", "Currency", "Receipts", "Total"]}
      rowCount={rows.length}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="No contributions recorded"
      emptyBody="Record receipts on the Contributions screen; they roll up here by campaign."
      actions={
        <CsvExportButton
          rows={rows.map((row) => ({ campaign: row.campaign, currency: row.currency, receipts: row.count, total: row.total }))}
          filename="kosa-report-contributions-by-campaign.csv"
        />
      }
    >
      {rows.map((row) => (
        <tr key={row.key}>
          <Td className="font-semibold">{row.campaign}</Td>
          <Td className="font-mono text-[13px]">{row.currency}</Td>
          <Td className="tabular-nums">{row.count}</Td>
          <Td className="whitespace-nowrap font-semibold tabular-nums">{formatMoney(row.total, row.currency)}</Td>
        </tr>
      ))}
    </TableSection>
  );
}

function AttendanceReport() {
  const { data, loading, error, reload } = useAdminData<AttendanceRow[]>(
    async () => {
      const events = await listEvents({ includeUnpublished: true });
      return Promise.all(
        events.map(async (event) => {
          try {
            const registrations = (await listEventRegistrations(event.id)) as (EventRegistration & {
              profiles?: { full_name: string } | null;
            })[];
            const live = registrations.filter((row) => row.status !== "cancelled");
            return {
              event,
              going: live.filter((row) => row.status === "going").length,
              waitlist: live.filter((row) => row.status === "waitlist").length,
              cancelled: registrations.length - live.length,
              guests: live.reduce((sum, row) => sum + (row.guests ?? 0), 0),
            };
          } catch {
            return { event, going: null, waitlist: null, cancelled: null, guests: null };
          }
        }),
      );
    },
    [],
    [],
  );

  const rows = React.useMemo(
    () => [...data].sort((a, b) => b.event.starts_at.localeCompare(a.event.starts_at)),
    [data],
  );

  const unreadable = rows.some((row) => row.going === null);

  return (
    <TableSection
      caption="Event attendance"
      description={
        unreadable
          ? "Drafts and published events both count. A dash means the registration list could not be read for that event."
          : "Drafts and published events both count. Guests are additional people brought by a registered member."
      }
      head={["Event", "Starts", "State", "Going", "Waitlist", "Cancelled", "Guests", "Capacity"]}
      rowCount={rows.length}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="No events yet"
      emptyBody="Attendance appears once events exist and members register."
      actions={
        <CsvExportButton
          rows={rows.map((row) => ({
            event: row.event.title,
            slug: row.event.slug,
            starts_at: row.event.starts_at,
            state: row.event.is_published ? "published" : "draft",
            going: row.going ?? "",
            waitlist: row.waitlist ?? "",
            cancelled: row.cancelled ?? "",
            guests: row.guests ?? "",
            capacity: row.event.capacity ?? "",
          }))}
          filename="kosa-report-event-attendance.csv"
        />
      }
    >
      {rows.map((row) => (
        <tr key={row.event.id}>
          <Td className="font-semibold">{row.event.title}</Td>
          <Td className="whitespace-nowrap text-[13px] tabular-nums">{formatDate(row.event.starts_at)}</Td>
          <Td>
            <StatusPill
              label={row.event.is_published ? "Published" : "Draft"}
              tone={row.event.is_published ? "positive" : "neutral"}
            />
          </Td>
          <Td className="tabular-nums">{row.going ?? "—"}</Td>
          <Td className="tabular-nums">{row.waitlist ?? "—"}</Td>
          <Td className="tabular-nums">{row.cancelled ?? "—"}</Td>
          <Td className="tabular-nums">{row.guests ?? "—"}</Td>
          <Td className="tabular-nums">{row.event.capacity ?? "no limit"}</Td>
        </tr>
      ))}
    </TableSection>
  );
}
