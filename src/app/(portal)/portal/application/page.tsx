"use client";

import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RequireAuth } from "@/components/portal/guards";
import {
  APPLICATION_LABELS,
  MetaRow,
  PageTitle,
  Panel,
  StatusPill,
  applicationTone,
  useLoad,
} from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PageLoading } from "@/components/ui/spinner";
import { getMyApplication, submitApplication } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { applicationSchema, type ApplicationInput } from "@/lib/validation";
import type { ApplicationStatus } from "@/lib/types";

type ApplicationFormValues = Omit<ApplicationInput, "consent"> & { consent: boolean };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 2 - 1950 }, (_, index) => CURRENT_YEAR + 1 - index);

const NEXT_STEP: Record<ApplicationStatus, string> = {
  pending:
    "The membership officer reviews applications in the order they arrive. Nothing more is needed from you; keep your profile current in the meantime.",
  needs_info:
    "The membership officer needs the information in their note. Update your application below and send it again.",
  approved:
    "It is approved. Member areas unlock as soon as your membership record exists — if this page still says otherwise, sign out and back in.",
  rejected:
    "The application was not approved. If you want the reason in more detail, write to the association through the public contact page.",
};

function ApplicationScreen() {
  const { session, profile, loading, refresh } = useAuth();
  const application = useLoad(session ? `application:${session.user.id}` : "application:none", () =>
    session ? getMyApplication() : Promise.resolve(null),
  );
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema) as unknown as Resolver<ApplicationFormValues>,
    defaultValues: {
      fullName: "",
      graduationYear: undefined,
      cohortNote: "",
      motivation: "",
      consent: false,
    },
  });

  const consent = watch("consent");
  const motivation = watch("motivation") ?? "";

  const record = application.data;

  React.useEffect(() => {
    if (record?.status !== "needs_info") return;
    reset({
      fullName: record.full_name,
      graduationYear: record.graduation_year ?? undefined,
      cohortNote: record.cohort_note ?? "",
      motivation: record.motivation,
      consent: false,
    });
  }, [record, reset]);

  React.useEffect(() => {
    if (!profile) return;
    const current = getValues();
    reset({
      ...current,
      fullName: current.fullName || profile.full_name,
      graduationYear: current.graduationYear ?? profile.graduation_year ?? undefined,
    });
  }, [profile, reset, getValues]);

  const needsNewSubmission = !record || record.status === "needs_info";

  async function onSubmit(values: ApplicationFormValues) {
    setServerError(null);
    if (!values.graduationYear) {
      setServerError("Choose your graduation year before sending.");
      return;
    }
    try {
      await submitApplication({
        fullName: values.fullName,
        graduationYear: values.graduationYear,
        cohortNote: values.cohortNote || undefined,
        motivation: values.motivation,
      });
      toast.success("Application submitted");
      application.reload();
      window.dispatchEvent(new Event("kosa:membership-changed"));
      await refresh();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not submit the application. Try again.",
      );
    }
  }

  if (loading) return <PageLoading label="Loading your application" />;

  return (
    <>
      <PageTitle
        title="Membership application"
        lede="Membership is a decision, not a sign-up. The membership officer reads every application and records the outcome here."
      />

      {application.error ? (
        <Notice tone="error" title="Could not load your application" className="mb-6">
          {application.error}{" "}
          <button
            type="button"
            onClick={application.reload}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Try again
          </button>
        </Notice>
      ) : null}

      {application.loading && !record ? (
        <PageLoading label="Checking for an existing application" />
      ) : record ? (
        <div className="flex flex-col gap-6">
          <Panel title="Your application" description={`Submitted ${formatDateTime(record.submitted_at)}`}>
            <dl>
              <MetaRow label="Status">
                <StatusPill tone={applicationTone(record.status)}>
                  {APPLICATION_LABELS[record.status]}
                </StatusPill>
              </MetaRow>
              <MetaRow label="Name on the form">{record.full_name}</MetaRow>
              <MetaRow label="Graduation year">{record.graduation_year ?? "Not given"}</MetaRow>
              <MetaRow label="Cohort note">
                {record.cohort_note || <span className="text-slate">None</span>}
              </MetaRow>
              <MetaRow label="Reviewed">
                {record.reviewed_at ? formatDate(record.reviewed_at) : <span className="text-slate">Not yet</span>}
              </MetaRow>
              <MetaRow label="Reviewer note">
                {record.review_note || <span className="text-slate">No note was left.</span>}
              </MetaRow>
              <MetaRow label="Next step">{NEXT_STEP[record.status]}</MetaRow>
            </dl>

            <div className="mt-5">
              <p className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.08em] text-slate">
                Why you are joining
              </p>
              <p className="mt-2 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-navy">
                {record.motivation}
              </p>
            </div>
          </Panel>

          <Notice tone="info" title="Who decides">
            Only the membership officer can approve an application, and only from the association&apos;s
            records system. This page cannot approve anything, and neither can the account it belongs to.
          </Notice>

          {record.status === "needs_info" ? (
            <Notice tone="warning" title="Send the missing information">
              Add what the note asks for below and submit again. The earlier application stays in the
              record with its note.
            </Notice>
          ) : null}

          {record.status === "rejected" ? (
            <div>
              <Button asChild variant="outline" size="md">
                <Link href="/contact/">Ask the membership officer about this decision</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {needsNewSubmission ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-6">
          <Panel
            title={record ? "Submit an updated application" : "Apply for membership"}
            description="The membership officer uses these answers to confirm your cohort and to welcome you properly."
          >
            <div className="flex flex-col gap-5">
              <Field id="fullName" label="Full name" required error={errors.fullName?.message}>
                {(props) => <Input {...props} {...register("fullName")} autoComplete="name" />}
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="graduationYear"
                  label="Graduation year"
                  required
                  hint="The year you completed your studies at Kakoma."
                  error={errors.graduationYear?.message}
                >
                  {(props) => (
                    <Select {...props} {...register("graduationYear", { valueAsNumber: true })}>
                      <option value="">Choose a year</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field
                  id="cohortNote"
                  label="Class or house"
                  hint="Optional — helps the officer place you with the right cohort."
                  error={errors.cohortNote?.message}
                >
                  {(props) => <Input {...props} {...register("cohortNote")} placeholder="e.g. S6 Sciences, 2004" />}
                </Field>
              </div>

              <Field
                id="motivation"
                label="Why do you want to join?"
                required
                hint={`At least 40 characters. ${motivation.trim().length} written so far.`}
                error={errors.motivation?.message}
              >
                {(props) => (
                  <Textarea
                    {...props}
                    {...register("motivation")}
                    rows={7}
                    placeholder="What you would like to give or receive through the association, and anything the officer should know."
                  />
                )}
              </Field>

              <Checkbox
                id="consent"
                checked={consent}
                onChange={(event) => setValue("consent", event.target.checked, { shouldValidate: true })}
                label="I confirm that I attended Kakoma and that the details above are true. I understand that the membership officer will review them and that the decision is theirs."
              />
              {errors.consent?.message ? (
                <p role="alert" className="text-[14px] font-semibold text-[#8f2018]">
                  {errors.consent.message}
                </p>
              ) : null}

              {serverError ? (
                <Notice tone="error" title="Could not submit the application">
                  {serverError}
                </Notice>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : record ? "Submit updated application" : "Submit application"}
                </Button>
                <span className="text-[13px] text-slate">
                  You can correct your profile at any time; this form is the record the officer decides on.
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="What happens next">
            <ol className="flex flex-col gap-3 text-[15px] leading-relaxed text-navy">
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">1. The officer reads it.</strong>{" "}
                Applications are reviewed in the order they arrive, usually within a month.
              </li>
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">2. A decision is recorded.</strong>{" "}
                Approved, sent back for information, or not approved — with a note here either way.
              </li>
              <li className="border-l-2 border-paper-dim pl-4">
                <strong className="font-[family-name:var(--font-display)]">3. Access follows.</strong> An
                approved application creates a membership record, and the directory, mentorship and welfare
                areas open.
              </li>
            </ol>
          </Panel>
        </form>
      ) : null}
    </>
  );
}

export default function PortalApplicationPage() {
  return (
    <RequireAuth>
      <ApplicationScreen />
    </RequireAuth>
  );
}
