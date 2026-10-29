"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, DetailItem, Panel } from "@/components/admin/admin-page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { StatusPill, humanStatus, statusTone } from "@/components/admin/status-pill";
import { FilterBar, FilterField, TableSection } from "@/components/admin/table-section";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Td } from "@/components/ui/table";
import { setMemberStatus, listMembers } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Membership, MembershipStatus, Profile } from "@/lib/types";
import { cn } from "@/lib/cn";

type MemberRow = Membership & { profiles: Partial<Profile> | null };
type StatusFilter = MembershipStatus | "all";

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "lapsed", label: "Lapsed" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

const CHANGEABLE: MembershipStatus[] = ["active", "lapsed", "suspended"];

export default function AdminMembersPage() {
  return (
    <AdminGate permission="manage_members" screen="Member register">
      <MembersScreen />
    </AdminGate>
  );
}

function MembersScreen() {
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error, reload } = useAdminData<MemberRow[]>(
    () => listMembers({ status: status === "all" ? undefined : status, query: query || undefined }),
    [status, query],
    [],
  );

  const selected = data.find((member) => member.user_id === selectedUser) ?? null;
  const filtered = status !== "all" || query.length > 0;

  const exportRows = data.map((member) => ({
    name: member.profiles?.full_name ?? "",
    member_no: member.member_no ?? "",
    status: member.status,
    cohort_year: member.cohort_year ?? "",
    graduation_year: member.profiles?.graduation_year ?? "",
    profession: member.profiles?.profession ?? "",
    employer: member.profiles?.employer ?? "",
    city: member.profiles?.city ?? "",
    country: member.profiles?.country ?? "",
    joined_at: member.joined_at ?? "",
    updated_at: member.updated_at,
  }));

  return (
    <>
      <AdminPageHeader
        title="Members"
        description="The register as the database holds it. Status changes are recorded in the audit log against your account."
        meta={
          <>
            <span>{data.length} rows in this view</span>
            <span>Status is changed here; profile details are edited by the member.</span>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 bg-white p-3 quiet-border">
        <FilterBar>
          <FilterField id="member-search" label="Search by name">
            <Input
              id="member-search"
              className="h-10 w-56 text-[15px]"
              placeholder="e.g. Aciro"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FilterField>
          <FilterField id="member-status" label="Membership status">
            <Select
              id="member-status"
              className="h-10 w-44 text-[15px]"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              {STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </FilterField>
          {filtered ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >
              Clear
            </Button>
          ) : null}
        </FilterBar>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate">{loading ? "Loading…" : `${data.length} shown`}</span>
          <CsvExportButton rows={exportRows} filename="kosa-members.csv" disabled={loading || Boolean(error)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <TableSection
          caption="Register"
          description={filtered ? "Filtered view. The CSV export matches these rows." : "Every membership record, most recently updated first."}
          head={["Member", "Number", "Status", "Year", "Updated"]}
          rowCount={data.length}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle={filtered ? "No member matches this view" : "The register is empty"}
          emptyBody={
            filtered
              ? "Clear the search or choose another status. Nothing has been hidden by the search itself beyond these filters."
              : "Members appear here once an application is approved."
          }
        >
          {data.map((member) => {
            const active = member.user_id === selectedUser;
            const name = member.profiles?.full_name ?? "Unnamed profile";
            return (
              <tr key={member.id} className={cn(active ? "bg-paper" : undefined)}>
                <Td>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedUser(active ? null : member.user_id)}
                    className="text-left font-semibold text-navy underline decoration-transparent underline-offset-4 hover:decoration-navy"
                  >
                    {name}
                  </button>
                  <span className="mt-0.5 block text-[13px] text-slate">
                    {member.profiles?.graduation_year ? `Class of ${member.profiles.graduation_year}` : "Graduation year not set"}
                  </span>
                </Td>
                <Td className="font-mono text-[13px] tabular-nums">{member.member_no ?? "—"}</Td>
                <Td>
                  <StatusPill label={humanStatus(member.status)} tone={statusTone(member.status)} />
                </Td>
                <Td className="tabular-nums">{member.cohort_year ?? "—"}</Td>
                <Td className="whitespace-nowrap text-[13px] text-slate">{formatDate(member.updated_at)}</Td>
              </tr>
            );
          })}
        </TableSection>

        {selected ? (
          <MemberDetail key={selected.user_id} member={selected} onChanged={reload} onClose={() => setSelectedUser(null)} />
        ) : (
          <Panel title="Member detail" description="Choose a name in the register to open the full record.">
            <p className="text-[14px] leading-relaxed text-slate">
              The detail panel holds the profile summary, the membership number and year, and the status change
              control.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate">
              Need the money a member has given? Open{" "}
              <Link href="/admin/contributions/" className="underline decoration-2 underline-offset-4">
                Contributions
              </Link>{" "}
              if your role can read the ledger.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}

function MemberDetail({
  member,
  onChanged,
  onClose,
}: {
  member: MemberRow;
  onChanged: () => void;
  onClose: () => void;
}) {
  const profile = member.profiles ?? null;
  const [nextStatus, setNextStatus] = React.useState<MembershipStatus>(
    CHANGEABLE.includes(member.status) ? member.status : "active",
  );
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const unchanged = nextStatus === member.status;

  const apply = async () => {
    if (unchanged) return;
    setPending(true);
    setError(null);
    try {
      await setMemberStatus(member.user_id, nextStatus, note.trim() || undefined);
      toast.success("Membership status changed", {
        description: `${profile?.full_name ?? "Member"}: ${member.status} → ${nextStatus}.`,
      });
      setNote("");
      onChanged();
    } catch (cause) {
      const message = errorMessage(cause, "The server refused this change.");
      setError(message);
      toast.error("Status not changed", { description: message });
    } finally {
      setPending(false);
    }
  };

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <Panel
        title={profile?.full_name ?? "Unnamed profile"}
        description="Profile summary and membership record"
        actions={
          <Button variant="quiet" size="sm" onClick={onClose}>
            Close
          </Button>
        }
      >
        <dl className="divide-y divide-paper-dim">
          <DetailItem label="Member number">
            <span className="font-mono text-[14px]">{member.member_no ?? "Not yet issued"}</span>
          </DetailItem>
          <DetailItem label="Membership status">
            <StatusPill label={humanStatus(member.status)} tone={statusTone(member.status)} />
          </DetailItem>
          <DetailItem label="Year of completion">{member.cohort_year ?? "—"}</DetailItem>
          <DetailItem label="Graduation year">{profile?.graduation_year ?? "—"}</DetailItem>
          <DetailItem label="Joined">{member.joined_at ? formatDate(member.joined_at) : "—"}</DetailItem>
          <DetailItem label="Last updated">{formatDateTime(member.updated_at)}</DetailItem>
          <DetailItem label="Profession">{profile?.profession ?? "Not given"}</DetailItem>
          <DetailItem label="Employer">{profile?.employer ?? "Not given"}</DetailItem>
          <DetailItem label="Location">
            {[profile?.city, profile?.country].filter(Boolean).join(", ") || "Not given"}
          </DetailItem>
          <DetailItem label="Directory visibility">{profile?.directory_visibility ?? "—"}</DetailItem>
          <DetailItem label="Interests">
            {profile?.interests && profile.interests.length > 0 ? profile.interests.join(", ") : "Not given"}
          </DetailItem>
          <DetailItem label="Bio">
            <span className="block max-h-40 overflow-y-auto whitespace-pre-line">{profile?.bio ?? "Not given"}</span>
          </DetailItem>
          <DetailItem label="Account reference">
            <span className="font-mono text-[13px]">{member.user_id}</span>
          </DetailItem>
          <DetailItem label="Register note">{member.notes ?? "—"}</DetailItem>
        </dl>

        <div className="mt-4 border-t border-paper-dim pt-3">
          <h3 className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">Change status</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">
            Only active, lapsed and suspended are set by hand here. A pending membership is activated by approving its
            application.
          </p>

          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor={`status-${member.user_id}`} className="text-[13px] font-semibold text-navy">
              New status
            </label>
            <Select
              id={`status-${member.user_id}`}
              className="h-10 text-[15px]"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as MembershipStatus)}
            >
              {CHANGEABLE.map((value) => (
                <option key={value} value={value}>
                  {humanStatus(value)}
                </option>
              ))}
            </Select>
            <label htmlFor={`status-note-${member.user_id}`} className="text-[13px] font-semibold text-navy">
              Note (optional)
            </label>
            <Textarea
              id={`status-note-${member.user_id}`}
              className="min-h-16 text-[15px]"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why the status is changing"
            />
          </div>

          <div className="mt-3">
            <ConfirmButton
              key={`${member.user_id}-${nextStatus}`}
              label="Apply status change"
              confirmLabel={`Set ${nextStatus}`}
              variant="ink"
              confirmVariant={nextStatus === "suspended" ? "danger" : "ink"}
              disabled={unchanged}
              pending={pending}
              description={
                <>
                  Change {profile?.full_name ?? "this member"} from {member.status} to {nextStatus}? The change is
                  written immediately and recorded in the audit log.
                </>
              }
              onConfirm={apply}
            />
          </div>
          {unchanged ? <p className="mt-2 text-[13px] text-slate">That is already the current status.</p> : null}

          {error ? (
            <Notice tone="error" title="The server refused this change" className="mt-3">
              {error}
            </Notice>
          ) : null}
        </div>
      </Panel>
    </aside>
  );
}
