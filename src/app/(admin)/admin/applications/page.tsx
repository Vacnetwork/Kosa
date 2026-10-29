"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StatusPill, humanStatus, statusTone } from "@/components/admin/status-pill";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { decideApplication, listApplications, listMembers } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import type { ApplicationStatus, Membership, MembershipApplication } from "@/lib/types";
import { cn } from "@/lib/cn";

type Decision = "approved" | "rejected" | "needs_info";

const TABS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "needs_info", label: "Needs information" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const DECISION_TITLES: Record<Decision, string> = {
  approved: "Application approved",
  rejected: "Application rejected",
  needs_info: "More information requested",
};

export default function AdminApplicationsPage() {
  return (
    <AdminGate permission="approve_members" screen="Membership applications">
      <ApplicationsScreen />
    </AdminGate>
  );
}

function ApplicationsScreen() {
  const { can } = useAuth();
  const { data, loading, error, reload } = useAdminData<MembershipApplication[]>(() => listApplications(), [], []);
  const [tab, setTab] = React.useState<ApplicationStatus | "all">("pending");
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [noteErrors, setNoteErrors] = React.useState<Record<string, string>>({});
  const [decisionErrors, setDecisionErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState<{ id: string; decision: Decision } | null>(null);
  const [activation, setActivation] = React.useState<{ name: string; membership: Membership | null } | null>(null);

  const applications = React.useMemo(
    () => [...data].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)),
    [data],
  );

  const counts = React.useMemo(() => {
    const base: Record<ApplicationStatus | "all", number> = {
      pending: 0,
      needs_info: 0,
      approved: 0,
      rejected: 0,
      all: applications.length,
    };
    applications.forEach((application) => {
      base[application.status] += 1;
    });
    return base;
  }, [applications]);

  const visible = tab === "all" ? applications : applications.filter((application) => application.status === tab);
  const oldestPending = React.useMemo(() => {
    const pendingRows = applications.filter((application) => application.status === "pending");
    return pendingRows.length > 0 ? pendingRows[pendingRows.length - 1].submitted_at : null;
  }, [applications]);

  const decide = async (application: MembershipApplication, decision: Decision) => {
    const note = (notes[application.id] ?? "").trim();
    if ((decision === "rejected" || decision === "needs_info") && note.length < 5) {
      setNoteErrors((previous) => ({
        ...previous,
        [application.id]: "A note is required: write what the applicant needs to know before this can go ahead.",
      }));
      return;
    }

    setPending({ id: application.id, decision });
    setDecisionErrors((previous) => ({ ...previous, [application.id]: "" }));

    try {
      await decideApplication(application.id, decision, note || undefined);

      let membership: Membership | null = null;
      if (decision === "approved" && can("manage_members")) {
        try {
          const members = await listMembers();
          membership = members.find((member) => member.user_id === application.user_id) ?? null;
        } catch {
          membership = null;
        }
      }

      if (decision === "approved") setActivation({ name: application.full_name, membership });
      setNotes((previous) => ({ ...previous, [application.id]: "" }));
      setNoteErrors((previous) => ({ ...previous, [application.id]: "" }));
      toast.success(DECISION_TITLES[decision], { description: application.full_name });
      reload();
    } catch (cause) {
      const message = errorMessage(cause, "The server refused this decision.");
      setDecisionErrors((previous) => ({ ...previous, [application.id]: message }));
      toast.error("Decision not saved", { description: message });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Membership applications"
        description="Every decision is recorded against your account in the audit log. Approval activates membership through the database function."
        meta={
          <>
            <span>{counts.pending} pending</span>
            <span>{counts.needs_info} awaiting information</span>
            {oldestPending ? <span>Oldest waiting since {formatDate(oldestPending)}</span> : null}
          </>
        }
      />

      {activation ? (
        <Notice tone="success" title={`${activation.name} approved`} className="mb-4">
          {activation.membership ? (
            <span>
              Membership is {activation.membership.status}
              {activation.membership.member_no ? `, member number ${activation.membership.member_no}` : ", number not yet issued"}
              {activation.membership.cohort_year ? `, cohort ${activation.membership.cohort_year}` : ""}.
            </span>
          ) : (
            <span>
              The decision is recorded. The database function creates or reactivates the membership record — open{" "}
              <Link href="/admin/members/" className="underline decoration-2 underline-offset-2">
                Members
              </Link>{" "}
              to see the member number.
            </span>
          )}
          <span className="mt-2 block">
            <Button variant="quiet" size="sm" onClick={() => setActivation(null)}>
              Dismiss
            </Button>
          </span>
        </Notice>
      ) : null}

      <div role="group" aria-label="Filter applications by status" className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(item.value)}
              className={cn(
                "inline-flex items-center gap-2 border px-2.5 py-1 text-[13px] font-semibold leading-tight transition-colors",
                active
                  ? "border-navy bg-navy text-white"
                  : "border-paper-dim bg-white text-navy hover:border-navy",
              )}
            >
              {item.label}
              <span className="tabular-nums opacity-80">{counts[item.value]}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white px-4 py-10 quiet-border">
          <Spinner label="Loading applications" />
        </div>
      ) : error ? (
        <div className="bg-white p-4 quiet-border">
          <Notice tone="error" title="Could not load applications">
            {error}
          </Notice>
          <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white px-4 py-8 quiet-border">
          <p className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">
            {tab === "all" ? "No applications yet" : `No applications in ${humanStatus(tab)}`}
          </p>
          <p className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-slate">
            {tab === "pending"
              ? "Nothing is waiting for a decision. New applications appear here the moment they are submitted."
              : "Change the filter above to see the rest of the queue."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((application) => {
            const decidable = application.status === "pending" || application.status === "needs_info";
            const noteError = noteErrors[application.id];
            const decisionError = decisionErrors[application.id];
            const working = pending?.id === application.id;

            return (
              <li key={application.id}>
                <article className="bg-white quiet-border">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-dim px-4 py-3">
                    <div className="min-w-0">
                      <h2 className="font-[family-name:var(--font-display)] text-[18px] font-bold leading-tight text-navy">
                        {application.full_name}
                      </h2>
                      <p className="mt-1 text-[13px] text-slate">
                        Graduation year {application.graduation_year ?? "—"} · submitted {formatDateTime(application.submitted_at)}
                      </p>
                      {application.cohort_note ? (
                        <p className="mt-1 text-[13px] text-slate">Cohort note: {application.cohort_note}</p>
                      ) : (
                        <p className="mt-1 text-[13px] text-slate">No cohort note given.</p>
                      )}
                    </div>
                    <StatusPill label={humanStatus(application.status)} tone={statusTone(application.status)} />
                  </div>

                  <div className="px-4 py-3">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">Motivation</p>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-navy">{application.motivation}</p>
                  </div>

                  {application.reviewed_at || application.review_note ? (
                    <div className="border-t border-paper-dim px-4 py-3">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">
                        Previous decision {application.reviewed_at ? `· ${formatDateTime(application.reviewed_at)}` : ""}
                      </p>
                      <p className="mt-1 text-[14px] leading-relaxed text-navy">
                        {application.review_note ?? "No note was left with this decision."}
                      </p>
                    </div>
                  ) : null}

                  {decidable ? (
                    <div className="border-t border-paper-dim bg-paper/70 px-4 py-3">
                      <Field
                        id={`note-${application.id}`}
                        label="Decision note"
                        required={false}
                        hint="Required when rejecting or asking for more information. The applicant sees this note."
                        error={noteError}
                      >
                        {(field) => (
                          <Textarea
                            {...field}
                            rows={2}
                            className="min-h-20 text-[15px]"
                            value={notes[application.id] ?? ""}
                            onChange={(event) => {
                              setNotes((previous) => ({ ...previous, [application.id]: event.target.value }));
                              if (noteError) setNoteErrors((previous) => ({ ...previous, [application.id]: "" }));
                            }}
                          />
                        )}
                      </Field>

                      <div className="mt-3 flex flex-wrap items-start gap-2">
                        <ConfirmButton
                          label="Approve"
                          confirmLabel="Approve and activate"
                          variant="ink"
                          confirmVariant="ink"
                          pending={working}
                          description={`Approve ${application.full_name}? This activates membership for graduation year ${application.graduation_year ?? "—"} and is recorded in the audit log.`}
                          onConfirm={() => decide(application, "approved")}
                        />
                        <ConfirmButton
                          label="Request more information"
                          confirmLabel="Send request"
                          variant="outline"
                          confirmVariant="ink"
                          pending={working}
                          description={
                            <>
                              Ask {application.full_name} for more information. Your note is required and is shown to the
                              applicant.
                            </>
                          }
                          onConfirm={() => decide(application, "needs_info")}
                        />
                        <ConfirmButton
                          label="Reject"
                          confirmLabel="Reject application"
                          variant="danger"
                          confirmVariant="danger"
                          pending={working}
                          description={`Reject ${application.full_name}? Your note is required and is shown to the applicant. This is recorded in the audit log.`}
                          onConfirm={() => decide(application, "rejected")}
                        />
                      </div>

                      {decisionError ? (
                        <Notice tone="error" title="The server refused this decision" className="mt-3">
                          {decisionError}
                        </Notice>
                      ) : null}
                    </div>
                  ) : (
                    <div className="border-t border-paper-dim px-4 py-2.5 text-[13px] text-slate">
                      Decided {application.reviewed_at ? formatDateTime(application.reviewed_at) : "—"}. Approved and
                      rejected applications are final on this screen.
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
