"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, Panel } from "@/components/admin/admin-page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { StatusPill } from "@/components/admin/status-pill";
import { TableSection } from "@/components/admin/table-section";
import { ROLE_LABELS } from "@/components/admin/nav";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Td } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { listMembers, listRoles, setUserRole } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Membership, Profile, Role } from "@/lib/types";

interface RoleRow {
  id: string;
  user_id: string;
  role: Role;
  granted_at: string;
  granted_by: string | null;
  profiles: { full_name: string } | null;
}

type MemberRow = Membership & { profiles: Partial<Profile> | null };

const ROLES: Role[] = ["membership_officer", "event_manager", "treasurer", "super_admin"];

const ROLE_NOTES: Record<Role, string> = {
  super_admin: "Everything, including granting roles and reading the audit log",
  membership_officer: "Applications, the member register and announcements",
  event_manager: "Events, the gallery and announcements",
  treasurer: "Contributions and the welfare queue",
  member: "No administrator access",
};

export default function AdminRolesPage() {
  return (
    <AdminGate permission="manage_roles" screen="Roles">
      <RolesScreen />
    </AdminGate>
  );
}

function RolesScreen() {
  const { session, profile, refresh } = useAuth();
  const roles = useAdminData<RoleRow[]>(async () => (await listRoles()) as RoleRow[], [], []);
  const members = useAdminData<MemberRow[]>(() => listMembers(), [], []);

  const [memberId, setMemberId] = React.useState("");
  const [role, setRole] = React.useState<Role>("membership_officer");
  const [granting, setGranting] = React.useState(false);
  const [revoking, setRevoking] = React.useState<string | null>(null);
  const [grantError, setGrantError] = React.useState<string | null>(null);

  const nameFor = (userId: string) => {
    const member = members.data.find((row) => row.user_id === userId);
    const fromRoles = roles.data.find((row) => row.user_id === userId)?.profiles?.full_name;
    return member?.profiles?.full_name ?? fromRoles ?? "Unknown account";
  };

  const grant = async () => {
    if (!memberId) return;
    setGranting(true);
    setGrantError(null);
    try {
      await setUserRole(memberId, role, true);
      toast.success("Role granted", { description: `${nameFor(memberId)} — ${ROLE_LABELS[role]}.` });
      roles.reload();
      void refresh();
      setMemberId("");
    } catch (cause) {
      const message = errorMessage(cause, "The server refused to grant that role.");
      setGrantError(message);
      toast.error("Role not granted", { description: message });
    } finally {
      setGranting(false);
    }
  };

  const revoke = async (row: RoleRow) => {
    setRevoking(row.id);
    try {
      await setUserRole(row.user_id, row.role, false);
      toast.success("Role revoked", { description: `${nameFor(row.user_id)} — ${ROLE_LABELS[row.role]}.` });
      roles.reload();
      void refresh();
    } catch (cause) {
      toast.error("Role not revoked", { description: errorMessage(cause, "The server refused that change.") });
    } finally {
      setRevoking(null);
    }
  };

  const exportRows = roles.data.map((row) => ({
    member: nameFor(row.user_id),
    role: row.role,
    granted_at: row.granted_at,
    granted_by: row.granted_by ?? "",
    user_id: row.user_id,
  }));

  const selectedMember = members.data.find((row) => row.user_id === memberId);

  return (
    <>
      <AdminPageHeader
        title="Roles"
        description="Administrator roles decide which screens and which database functions an account can use. Only a super administrator can change them."
        meta={
          <>
            <span>{roles.data.length} role grants</span>
            <span>{roles.data.filter((row) => row.role === "super_admin").length} super administrators</span>
            <span>Signed in as {profile?.full_name ?? session?.user.email ?? "—"}</span>
          </>
        }
      />

      <Notice tone="warning" title="Role changes are audited" className="mb-4">
        <p>
          Granting or revoking a role is written to the audit log with your account as the actor. Roles are checked by
          the database on every call, so this screen cannot grant more than the server allows.
        </p>
        <p className="mt-2">
          Take care with your own account: removing your last super administrator role removes your own access to this
          screen.
        </p>
      </Notice>

      <Panel
        title="Grant a role"
        description="Choose an account from the member register, then the role. The grant is confirmed before it is sent."
        className="mb-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="grant-member" className="text-[13px] font-semibold text-navy">
              Member
            </label>
            <Select
              id="grant-member"
              className="h-10 text-[15px]"
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              disabled={members.loading || Boolean(members.error)}
            >
              <option value="">{members.loading ? "Loading members…" : "Choose an account"}</option>
              {members.data.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profiles?.full_name ?? "Unnamed profile"}
                  {member.member_no ? ` · ${member.member_no}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="grant-role" className="text-[13px] font-semibold text-navy">
              Role
            </label>
            <Select
              id="grant-role"
              className="h-10 text-[15px]"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <ConfirmButton
              label="Grant role"
              confirmLabel={`Grant ${ROLE_LABELS[role]}`}
              variant="primary"
              confirmVariant="ink"
              disabled={!memberId || members.loading}
              pending={granting}
              description={
                <>
                  Grant {ROLE_LABELS[role]} to {selectedMember?.profiles?.full_name ?? "this account"}? {ROLE_NOTES[role]}.
                  The change is recorded in the audit log.
                </>
              }
              onConfirm={grant}
            />
          </div>
        </div>

        <p className="mt-2 text-[13px] text-slate">{ROLE_NOTES[role]}.</p>

        {members.error ? (
          <Notice tone="error" title="The member register could not be read" className="mt-3">
            {members.error} Roles can still be revoked below; granting needs a member to choose.
          </Notice>
        ) : null}
        {grantError ? (
          <Notice tone="error" title="The server refused this grant" className="mt-3">
            {grantError}
          </Notice>
        ) : null}
      </Panel>

      <TableSection
        caption="Current grants"
        description="One row per role held, newest grant first."
        head={["Member", "Role", "Granted", "Action"]}
        rowCount={roles.data.length}
        loading={roles.loading}
        error={roles.error}
        onRetry={roles.reload}
        emptyTitle="No administrator roles are granted"
        emptyBody="Every account is a plain member. Grant the first role above."
        actions={<CsvExportButton rows={exportRows} filename="kosa-roles.csv" disabled={roles.data.length === 0} />}
      >
        {roles.data.map((row) => {
          const self = row.user_id === session?.user.id;
          return (
            <tr key={row.id}>
              <Td>
                <span className="font-semibold text-navy">{nameFor(row.user_id)}</span>
                <span className="mt-0.5 block font-mono text-[13px] text-slate">{row.user_id.slice(0, 8)}</span>
                {self ? <StatusPill label="You" tone="pending" className="mt-1" /> : null}
              </Td>
              <Td>
                <span className="text-[14px] font-semibold text-navy">{ROLE_LABELS[row.role]}</span>
                <span className="mt-0.5 block font-mono text-[13px] text-slate">{row.role}</span>
              </Td>
              <Td className="whitespace-nowrap text-[13px] text-slate">{formatDateTime(row.granted_at)}</Td>
              <Td>
                <ConfirmButton
                  label="Revoke"
                  confirmLabel="Revoke role"
                  variant="outline"
                  confirmVariant="danger"
                  pending={revoking === row.id}
                  description={
                    self
                      ? `Revoke your own ${ROLE_LABELS[row.role]} role? You may lose access to this screen immediately.`
                      : `Revoke ${ROLE_LABELS[row.role]} from ${nameFor(row.user_id)}? The account keeps every other role it holds.`
                  }
                  onConfirm={() => revoke(row)}
                />
              </Td>
            </tr>
          );
        })}
      </TableSection>

      <div className="mt-3 flex justify-end">
        <Button asChild variant="quiet" size="sm">
          <Link href="/admin/audit/">See who changed what in the audit log</Link>
        </Button>
      </div>
    </>
  );
}
