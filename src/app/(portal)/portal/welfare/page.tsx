"use client";

import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RequireAuth } from "@/components/portal/guards";
import {
  PageTitle,
  Panel,
  StatusPill,
  WELFARE_CATEGORY_LABELS,
  WELFARE_LABELS,
  useLoad,
  welfareTone,
} from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import { listMyWelfareRequests, submitWelfareRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import type { WelfareCategory, WelfareStatus } from "@/lib/types";
import { welfareRequestSchema, type WelfareRequestInput } from "@/lib/validation";

type WelfareFormValues = {
  category: WelfareCategory;
  summary: string;
  details: string;
  amountRequested?: number | string;
  isConfidential: boolean;
};

const CATEGORY_HINTS: Record<WelfareCategory, string> = {
  bereavement: "A death in the family: funeral and mourning costs.",
  medical: "Treatment, hospital bills, medicines or transport to care.",
  education: "School or course costs for you or a dependant.",
  hardship: "A sudden loss of income, fire, flood or another emergency.",
  other: "Anything the four categories above do not describe.",
};

const DEFAULT_VALUES: WelfareFormValues = {
  category: "medical",
  summary: "",
  details: "",
  amountRequested: "",
  isConfidential: false,
};

function Timeline({ status }: { status: WelfareStatus }) {
  const steps: WelfareStatus[] =
    status === "declined"
      ? ["submitted", "reviewing", "declined"]
      : ["submitted", "reviewing", "approved", "disbursed"];
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step} className="flex gap-3 pb-3 last:pb-0">
            <span className="relative flex w-3 shrink-0 justify-center">
              <span
                aria-hidden="true"
                className={
                  current
                    ? "mt-1.5 h-2.5 w-2.5 bg-navy"
                    : done
                      ? "mt-1.5 h-2.5 w-2.5 border border-navy bg-navy/30"
                      : "mt-1.5 h-2.5 w-2.5 border border-paper-dim bg-white"
                }
              />
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={
                    done || current
                      ? "absolute top-4 h-full w-px bg-navy/30"
                      : "absolute top-4 h-full w-px bg-paper-dim"
                  }
                />
              ) : null}
            </span>
            <span className="flex flex-wrap items-baseline gap-2">
              <span
                className={
                  current
                    ? "font-[family-name:var(--font-display)] text-[14px] font-bold text-navy"
                    : done
                      ? "font-[family-name:var(--font-display)] text-[14px] text-navy"
                      : "text-[14px] text-slate"
                }
              >
                {WELFARE_LABELS[step]}
              </span>
              {current ? (
                <span className="text-[13px] text-slate">
                  {step === "declined" ? "The desk declined this request." : "Current stage"}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function WelfareScreen() {
  const { session, isMember, loading } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const requests = useLoad(session ? `welfare:${session.user.id}` : "welfare:none", () =>
    session ? listMyWelfareRequests() : Promise.resolve([]),
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WelfareFormValues, unknown, WelfareRequestInput>({
    resolver: zodResolver(welfareRequestSchema) as unknown as Resolver<
      WelfareFormValues,
      unknown,
      WelfareRequestInput
    >,
    defaultValues: DEFAULT_VALUES,
  });

  const confidential = watch("isConfidential");
  const category = watch("category");

  async function onSubmit(values: WelfareRequestInput) {
    setServerError(null);
    try {
      await submitWelfareRequest({
        category: values.category,
        summary: values.summary,
        details: values.details,
        amountRequested: values.amountRequested || undefined,
        isConfidential: values.isConfidential,
      });
      toast.success("Welfare request submitted");
      reset(DEFAULT_VALUES);
      requests.reload();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not submit the request. Try again.",
      );
    }
  }

  if (loading) return <PageLoading label="Loading the welfare desk" />;

  return (
    <>
      <PageTitle
        title="Welfare desk"
        lede="Help with bereavement, medical costs, education or sudden hardship. Requests go to the welfare desk, not to the membership at large."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {!isMember ? (
            <Notice tone="warning" title="Welfare requests are open to active members">
              Your membership application has not been approved yet, so the request form is closed.{" "}
              <Link href="/portal/application/" className="underline decoration-2 underline-offset-4">
                See your application
              </Link>
              .
            </Notice>
          ) : (
            <Panel
              title="Submit a request"
              description="Write plainly. The desk would rather have context than polished wording."
            >
              <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                <Field
                  id="category"
                  label="What is this about?"
                  required
                  hint={CATEGORY_HINTS[category]}
                  error={errors.category?.message}
                >
                  {(props) => (
                    <Select {...props} {...register("category")}>
                      {(Object.keys(WELFARE_CATEGORY_LABELS) as WelfareCategory[]).map((value) => (
                        <option key={value} value={value}>
                          {WELFARE_CATEGORY_LABELS[value]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field
                  id="summary"
                  label="One-line summary"
                  required
                  hint="What the desk sees first, e.g. “Help with a hospital bill after an accident”."
                  error={errors.summary?.message}
                >
                  {(props) => <Input {...props} {...register("summary")} maxLength={160} />}
                </Field>

                <Field
                  id="details"
                  label="The details"
                  required
                  hint="At least 40 characters: what happened, what it costs, and what you have already tried."
                  error={errors.details?.message}
                >
                  {(props) => <Textarea {...props} {...register("details")} rows={7} maxLength={2000} />}
                </Field>

                <Field
                  id="amountRequested"
                  label="Amount requested (UGX)"
                  hint="Optional. Leave it empty if you do not know the figure yet."
                  error={errors.amountRequested?.message}
                >
                  {(props) => (
                    <Input
                      {...props}
                      {...register("amountRequested")}
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      placeholder="e.g. 1200000"
                    />
                  )}
                </Field>

                <Checkbox
                  id="isConfidential"
                  checked={confidential}
                  onChange={(event) =>
                    setValue("isConfidential", event.target.checked, { shouldDirty: true })
                  }
                  label="Mark this request confidential: keep the details to the welfare desk only, and share the category and status with anyone else who has to process the payment."
                />

                <div className="border border-paper-dim bg-paper px-4 py-4">
                  <p className="font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                    Who will see this
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[14px] leading-relaxed text-navy">
                    <li>You, whenever you open this page.</li>
                    <li>The treasurer and the association&apos;s administrators, who decide on welfare.</li>
                    <li>Other members cannot read welfare requests — not even their summary.</li>
                    <li>
                      Nothing is published, and approving a request does not publish anything either.
                    </li>
                  </ul>
                </div>

                {serverError ? (
                  <Notice tone="error" title="Could not submit the request">
                    {serverError}
                  </Notice>
                ) : null}

                <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Send to the welfare desk"}
                </Button>

                <p className="text-[13px] leading-relaxed text-slate">
                  Sending this creates a request in the association&apos;s records. It does not commit the
                  desk to pay, and it cannot be withdrawn from this page once it is under review.
                </p>
              </form>
            </Panel>
          )}

          <Panel title="What happens next">
            <ol className="flex flex-col gap-3 text-[15px] leading-relaxed text-navy">
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">Submitted.</strong> The request
                reaches the welfare desk and your own list on this page.
              </li>
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">Under review.</strong> The desk
                may come back to you for receipts, a hospital letter or a guardian&apos;s confirmation.
              </li>
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">Approved, then disbursed.</strong>{" "}
                Approval is recorded first; the payment is marked separately when it is actually made.
              </li>
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">Or declined.</strong> The desk
                records a reason on the request so you are not left guessing.
              </li>
            </ol>
          </Panel>
        </div>

        <Panel
          title="Your requests"
          description="Everything you have sent, newest first, with the stage it has reached."
          bodyClassName="px-0 py-0"
        >
          {requests.loading && !requests.data ? (
            <div className="px-5 py-8">
              <Spinner label="Loading your requests" />
            </div>
          ) : requests.error ? (
            <div className="px-5 py-5">
              <Notice tone="error" title="Could not load your requests">
                {requests.error}{" "}
                <button
                  type="button"
                  onClick={requests.reload}
                  className="font-bold underline decoration-2 underline-offset-4"
                >
                  Try again
                </button>
              </Notice>
            </div>
          ) : (requests.data ?? []).length === 0 ? (
            <div className="px-5 py-5">
              <EmptyState title="No requests yet">
                Requests you send appear here with their status and the desk&apos;s decision note. Nothing is
                created until you submit the form.
              </EmptyState>
            </div>
          ) : (
            <ul>
              {(requests.data ?? []).map((request) => (
                <li key={request.id} className="border-b border-paper-dim px-5 py-5 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={welfareTone(request.status)}>
                      {WELFARE_LABELS[request.status]}
                    </StatusPill>
                    <StatusPill tone="neutral">{WELFARE_CATEGORY_LABELS[request.category]}</StatusPill>
                    {request.is_confidential ? <StatusPill tone="neutral">Confidential</StatusPill> : null}
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-[15px] font-bold leading-snug text-navy">
                    {request.summary}
                  </p>
                  <p className="mt-1 text-[13px] text-slate">
                    Submitted {formatDate(request.created_at)}
                    {request.amount_requested
                      ? ` · ${formatMoney(request.amount_requested, request.currency)} requested`
                      : ""}
                  </p>

                  <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-navy">
                    {request.details}
                  </p>

                  <div className="mt-4 border-t border-paper-dim pt-4">
                    <Timeline status={request.status} />
                  </div>

                  {request.decision_note ? (
                    <p className="mt-3 border-l-2 border-navy/30 pl-3 text-[14px] leading-relaxed text-navy">
                      <span className="font-[family-name:var(--font-display)] font-bold">Note from the desk: </span>
                      {request.decision_note}
                    </p>
                  ) : null}

                  <p className="mt-2 text-[13px] text-slate">
                    Last updated {formatDate(request.updated_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

export default function PortalWelfarePage() {
  return (
    <RequireAuth>
      <WelfareScreen />
    </RequireAuth>
  );
}
