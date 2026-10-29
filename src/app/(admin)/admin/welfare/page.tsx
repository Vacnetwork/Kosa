"use client";

import * as React from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StatusPill, humanStatus, statusTone } from "@/components/admin/status-pill";
import { shortId } from "@/components/admin/datetime";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { decideWelfareRequest, listWelfareQueue } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { WelfareRequest, WelfareStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const TABS: { value: WelfareStatus | "all"; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewing", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "disbursed", label: "Disbursed" },
  { value: "declined", label: "Declined" },
  { value: "all", label: "All" },
];

const CATEGORY_LABELS: Record<string, string> = {
  bereavement: "Bereavement",
  medical: "Medical",
  education: "Education",
  hardship: "Hardship",
  other: "Other",
};

export default function AdminWelfarePage() {
  return (
    <AdminGate permission="view_welfare" screen="Welfare queue">
      <WelfareScreen />
    </AdminGate>
  );
}

function WelfareScreen() {
  const { data, loading, error, reload } = useAdminData<WelfareRequest[]>(() => listWelfareQueue(), [], []);
  const [tab, setTab] = React.useState<WelfareStatus | "all">("submitted");
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [noteErrors, setNoteErrors] = React.useState<Record<string, string>>({});
  const [decisionErrors, setDecisionErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState<{ id: string; status: WelfareStatus } | null>(null);

  const queue = React.useMemo(
    () => [...data].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [data],
  );

  const counts = React.useMemo(() => {
    const base: Record<WelfareStatus | "all", number> = {
      submitted: 0,
      reviewing: 0,
      approved: 0,
      disbursed: 0,
      declined: 0,
      all: queue.length,
    };
    queue.forEach((request) => {
      base[request.status] += 1;
    });
    return base;
  }, [queue]);

  const visible = tab === "all" ? queue : queue.filter((request) => request.status === tab);
  const confidentialCount = queue.filter((request) => request.is_confidential).length;

  const decide = async (request: WelfareRequest, status: WelfareStatus) => {
    const note = (notes[request.id] ?? "").trim();
    if ((status === "approved" || status === "declined") && note.length < 5) {
      setNoteErrors((previous) => ({
        ...previous,
        [request.id]: "A decision note is required before approving or declining.",
      }));
      return;
    }

    setPending({ id: request.id, status });
    setDecisionErrors((previous) => ({ ...previous, [request.id]: "" }));

    try {
      await decideWelfareRequest(request.id, status, note || undefined);
      toast.success(`Request marked ${humanStatus(status)}`, { description: `Reference ${shortId(request.id)}.` });
      setNotes((previous) => ({ ...previous, [request.id]: "" }));
      setNoteErrors((previous) => ({ ...previous, [request.id]: "" }));
      reload();
    } catch (cause) {
      const message = errorMessage(cause, "The server refused this decision.");
      setDecisionErrors((previous) => ({ ...previous, [request.id]: message }));
      toast.error("Decision not saved", { description: message });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Welfare queue"
        description="Requests for bereavement, medical, education and hardship support. Read them here, decide once, and leave a note the committee can follow."
        meta={
          <>
            <span>{counts.submitted} waiting</span>
            <span>{counts.reviewing} under review</span>
            <span>{confidentialCount} marked confidential</span>
          </>
        }
      />

      <Notice tone="warning" title="These requests are confidential" className="mb-3">
        <p>
          Only holders of the welfare permission can open this queue; the database restricts the rows to those roles and
          records every decision. Do not copy, screenshot or forward a request outside the committee, and do not discuss
          an applicant&apos;s circumstances with anyone who is not deciding it.
        </p>
        <p className="mt-2">
          There is deliberately no CSV export on this screen. Confidential requests carry a marker so they are not
          mistaken for routine business.
        </p>
      </Notice>

      <div role="group" aria-label="Filter the welfare queue" className="mb-4 flex flex-wrap gap-1.5">
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
                active ? "border-navy bg-navy text-white" : "border-paper-dim bg-white text-navy hover:border-navy",
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
          <Spinner label="Loading the welfare queue" />
        </div>
      ) : error ? (
        <div className="bg-white p-4 quiet-border">
          <Notice tone="error" title="Could not load the welfare queue">
            {error}
          </Notice>
          <p className="mt-2 text-[13px] text-slate">
            If the refusal says the function or policy is not permitted, your account does not hold the welfare role the
            database requires — this screen hides it in the navigation for that reason.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white px-4 py-8 quiet-border">
          <p className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">
            {tab === "all" ? "No welfare requests" : `Nothing ${humanStatus(tab)}`}
          </p>
          <p className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-slate">
            Requests arrive from the member portal. Change the filter to see the rest of the queue.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((request) => {
            const noteError = noteErrors[request.id];
            const decisionError = decisionErrors[request.id];
            const working = pending?.id === request.id;
            const terminal = request.status === "declined" || request.status === "disbursed";

            return (
              <li key={request.id}>
                <article className={cn("relative bg-white quiet-border", request.is_confidential ? "pl-1" : undefined)}>
                  {request.is_confidential ? <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-navy" /> : null}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-paper-dim px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="font-[family-name:var(--font-display)] text-[17px] font-bold leading-tight text-navy">
                          {CATEGORY_LABELS[request.category] ?? request.category}
                        </h2>
                        {request.is_confidential ? <StatusPill label="Confidential" tone="confidential" /> : null}
                        <StatusPill label={humanStatus(request.status)} tone={statusTone(request.status)} />
                      </div>
                      <p className="mt-1 text-[13px] text-slate">
                        Submitted {formatDateTime(request.created_at)} · reference{" "}
                        <span className="font-mono">{shortId(request.id)}</span>
                      </p>
                    </div>
                    <p className="text-[15px] font-semibold tabular-nums text-navy">
                      {request.amount_requested !== null
                        ? formatMoney(request.amount_requested, request.currency)
                        : "No amount requested"}
                    </p>
                  </div>

                  <div className="px-4 py-3">
                    <p className="text-[15px] font-semibold leading-snug text-navy">{request.summary}</p>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-navy">{request.details}</p>
                    <p className="mt-2 text-[13px] text-slate">
                      Requester account <span className="font-mono">{shortId(request.user_id)}</span>. The queue does not
                      return names; use the reference if the committee needs to identify the account.
                    </p>
                  </div>

                  {request.decision_note || request.handled_by ? (
                    <div className="border-t border-paper-dim px-4 py-3">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">Last decision</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-navy">
                        {request.decision_note ?? "No note was left with this decision."}
                      </p>
                      {request.handled_by ? (
                        <p className="mt-1 text-[13px] text-slate">
                          Handled by <span className="font-mono">{shortId(request.handled_by)}</span> · updated{" "}
                          {formatDateTime(request.updated_at)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {terminal ? (
                    <div className="border-t border-paper-dim px-4 py-2.5 text-[13px] text-slate">
                      This request is closed as {humanStatus(request.status)}. Closed requests stay in the log for the
                      record; they cannot be reopened from here.
                    </div>
                  ) : (
                    <div className="border-t border-paper-dim bg-paper/70 px-4 py-3">
                      <Field
                        id={`welfare-note-${request.id}`}
                        label="Decision note"
                        required={request.status === "reviewing"}
                        hint="Required to approve or decline. Stored with the request, not shown to the applicant."
                        error={noteError}
                      >
                        {(field) => (
                          <Textarea
                            {...field}
                            rows={2}
                            className="min-h-20 text-[15px]"
                            value={notes[request.id] ?? ""}
                            onChange={(event) => {
                              setNotes((previous) => ({ ...previous, [request.id]: event.target.value }));
                              if (noteError) setNoteErrors((previous) => ({ ...previous, [request.id]: "" }));
                            }}
                          />
                        )}
                      </Field>

                      <div className="mt-3 flex flex-wrap items-start gap-2">
                        {request.status === "submitted" ? (
                          <ConfirmButton
                            label="Begin review"
                            confirmLabel="Mark under review"
                            variant="ink"
                            confirmVariant="ink"
                            pending={working}
                            description="Move this request to review? The applicant sees that it is being considered."
                            onConfirm={() => decide(request, "reviewing")}
                          />
                        ) : null}

                        {request.status === "reviewing" ? (
                          <>
                            <ConfirmButton
                              label="Approve"
                              confirmLabel="Approve request"
                              variant="ink"
                              confirmVariant="ink"
                              pending={working}
                              description="Approve this request? Your note is required and is stored with the decision. Nothing is paid by this action."
                              onConfirm={() => decide(request, "approved")}
                            />
                            <ConfirmButton
                              label="Decline"
                              confirmLabel="Decline request"
                              variant="danger"
                              confirmVariant="danger"
                              pending={working}
                              description="Decline this request? Your note is required and is stored with the decision."
                              onConfirm={() => decide(request, "declined")}
                            />
                          </>
                        ) : null}

                        {request.status === "approved" ? (
                          <ConfirmButton
                            label="Mark disbursed"
                            confirmLabel="Confirm disbursement"
                            variant="ink"
                            confirmVariant="ink"
                            pending={working}
                            description="Confirm the money has reached the member? This closes the request."
                            onConfirm={() => decide(request, "disbursed")}
                          />
                        ) : null}
                      </div>

                      {decisionError ? (
                        <Notice tone="error" title="The server refused this decision" className="mt-3">
                          {decisionError}
                        </Notice>
                      ) : null}
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
