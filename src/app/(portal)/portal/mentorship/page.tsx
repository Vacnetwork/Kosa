"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RequireAuth, RequireMember } from "@/components/portal/guards";
import { ConfirmButton } from "@/components/portal/confirm-button";
import { PageTitle, Panel, StatusPill, useLoad } from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import {
  listMentors,
  listMyMentorships,
  requestMentorship,
  respondMentorship,
  upsertMentorOffer,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { MentorshipRequest } from "@/lib/types";
import { mentorshipOfferSchema } from "@/lib/validation";
import { z } from "zod";

type OfferValues = z.infer<typeof mentorshipOfferSchema>;

const REQUEST_LABELS: Record<MentorshipRequest["status"], string> = {
  pending: "Awaiting reply",
  accepted: "Active",
  declined: "Declined",
  closed: "Closed",
};

function requestTone(status: MentorshipRequest["status"]) {
  if (status === "accepted") return "positive" as const;
  if (status === "pending") return "warning" as const;
  if (status === "declined") return "negative" as const;
  return "neutral" as const;
}

function MentorshipScreen() {
  const { session, loading } = useAuth();
  const myId = session?.user.id ?? "";

  const data = useLoad(session ? `mentorship:${session.user.id}` : "mentorship:none", async () => {
    if (!session) return { mentors: [], requests: [] };
    const [mentors, requests] = await Promise.all([listMentors(), listMyMentorships()]);
    return { mentors, requests };
  });

  const [offerError, setOfferError] = React.useState<string | null>(null);
  const [savedOffer, setSavedOffer] = React.useState(false);
  const [requestingId, setRequestingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [requestError, setRequestError] = React.useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = React.useState<string | null>(null);
  const [pendingResponseId, setPendingResponseId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OfferValues>({
    resolver: zodResolver(mentorshipOfferSchema),
    defaultValues: { expertise: "", availability: "", isAccepting: true },
  });

  const mentors = data.data?.mentors ?? [];
  const requests = data.data?.requests ?? [];
  const myOffer = mentors.find((offer) => offer.user_id === myId);
  const accepting = watch("isAccepting");

  React.useEffect(() => {
    if (!myOffer) return;
    reset({
      expertise: myOffer.expertise,
      availability: myOffer.availability ?? "",
      isAccepting: myOffer.is_accepting,
    });
  }, [myOffer, reset]);

  function nameFor(userId: string): string {
    if (userId === myId) return "You";
    return mentors.find((offer) => offer.user_id === userId)?.profiles?.full_name ?? "A KOSA member";
  }

  const incoming = requests.filter((request) => request.mentor_id === myId);
  const outgoing = requests.filter((request) => request.mentee_id === myId);

  async function saveOffer(values: OfferValues) {
    setOfferError(null);
    try {
      await upsertMentorOffer({
        expertise: values.expertise,
        availability: values.availability || undefined,
        isAccepting: values.isAccepting,
      });
      toast.success(values.isAccepting ? "You are listed as a mentor" : "Your mentorship offer is paused");
      setSavedOffer(true);
      data.reload();
    } catch (error) {
      setOfferError(error instanceof Error ? error.message : "Could not save the offer.");
    }
  }

  async function sendRequest(mentorId: string, mentorName: string) {
    setRequestError(null);
    if (message.trim().length < 20) {
      setRequestError("Write at least 20 characters so the mentor knows what you need.");
      return;
    }
    setPendingRequestId(mentorId);
    try {
      await requestMentorship(mentorId, message.trim());
      toast.success(`Request sent to ${mentorName}`);
      setRequestingId(null);
      setMessage("");
      data.reload();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not send the request.");
    } finally {
      setPendingRequestId(null);
    }
  }

  async function respond(requestId: string, status: "accepted" | "declined" | "closed") {
    setPendingResponseId(requestId);
    try {
      await respondMentorship(requestId, status);
      toast.success(
        status === "accepted"
          ? "Mentorship accepted"
          : status === "declined"
            ? "Request declined"
            : "Mentorship closed",
      );
      data.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the request.");
    } finally {
      setPendingResponseId(null);
    }
  }

  if (loading) return <PageLoading label="Loading mentorship" />;

  return (
    <>
      <PageTitle
        title="Mentorship"
        lede="Offer what you know, or ask someone who has already done it. Requests are private between the two people involved."
      />

      {data.error ? (
        <Notice tone="error" title="Could not load mentorship" className="mb-6">
          {data.error}{" "}
          <button
            type="button"
            onClick={data.reload}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Try again
          </button>
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="flex flex-col gap-6">
          <Panel
            title={myOffer ? "Your mentorship offer" : "Offer to mentor"}
            description="Being listed is voluntary and can be withdrawn at any time."
          >
            <form method="post" onSubmit={handleSubmit(saveOffer)} noValidate className="flex flex-col gap-5">
              <Field
                id="expertise"
                label="What can you help with?"
                required
                hint="Be specific: “CVs for health-sector jobs”, “undergraduate applications”, “small-business accounts”."
                error={errors.expertise?.message}
              >
                {(props) => <Input {...props} {...register("expertise")} maxLength={120} />}
              </Field>

              <Field
                id="availability"
                label="Availability"
                hint="Optional, e.g. “Two calls a month, weekday evenings”."
                error={errors.availability?.message}
              >
                {(props) => <Input {...props} {...register("availability")} maxLength={120} />}
              </Field>

              <Checkbox
                id="isAccepting"
                checked={accepting}
                onChange={(event) => setValue("isAccepting", event.target.checked, { shouldDirty: true })}
                label="Show me in the mentor list and accept new requests. Turning this off removes you from the list; mentorships already accepted carry on."
              />

              {offerError ? (
                <Notice tone="error" title="Could not save the offer">
                  {offerError}
                </Notice>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : myOffer || savedOffer ? "Save offer" : "Publish my offer"}
                </Button>
                {!myOffer && !savedOffer ? (
                  <span className="text-[13px] text-slate">
                    Nothing is published until you save.
                  </span>
                ) : null}
              </div>

              {!myOffer ? (
                <p className="text-[13px] leading-relaxed text-slate">
                  If you already have an offer that is paused, it is not shown in the list — re-enter your
                  expertise here and tick the box to bring it back.
                </p>
              ) : null}
            </form>
          </Panel>

          <Panel
            title="Requests you have received"
            description="Accept, decline, or close a mentorship that has run its course."
            bodyClassName="px-0 py-0"
          >
            {data.loading && !data.data ? (
              <div className="px-5 py-8">
                <Spinner label="Loading requests" />
              </div>
            ) : incoming.length === 0 ? (
              <div className="px-5 py-5">
                <EmptyState title="No requests yet">
                  When a member asks you for mentorship it appears here with their message and a way to
                  accept or decline. Requests are visible only to the two of you.
                </EmptyState>
              </div>
            ) : (
              <ul>
                {incoming.map((request) => (
                  <li key={request.id} className="border-b border-paper-dim px-5 py-5 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                        {nameFor(request.mentee_id)}
                      </span>
                      <StatusPill tone={requestTone(request.status)}>
                        {REQUEST_LABELS[request.status]}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-[13px] text-slate">{formatDate(request.created_at)}</p>
                    <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-navy">
                      {request.message}
                    </p>

                    {request.status === "pending" ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ink"
                          size="sm"
                          onClick={() => respond(request.id, "accepted")}
                          disabled={pendingResponseId === request.id}
                        >
                          {pendingResponseId === request.id ? "Saving…" : "Accept"}
                        </Button>
                        <ConfirmButton
                          label="Decline"
                          confirmLabel="Yes, decline"
                          consequence="The member is told you declined. No reason is required, and it does not affect your standing."
                          onConfirm={() => respond(request.id, "declined")}
                          variant="outline"
                        />
                      </div>
                    ) : request.status === "accepted" ? (
                      <div className="mt-3">
                        <ConfirmButton
                          label="End mentorship"
                          confirmLabel="Yes, close it"
                          consequence="Closes this mentorship for both of you. It stays in your history as closed."
                          onConfirm={() => respond(request.id, "closed")}
                          variant="outline"
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel
            title="Members offering mentorship"
            description="Each offer states what the person can help with and how much time they have."
            bodyClassName="px-0 py-0"
          >
            {data.loading && !data.data ? (
              <div className="px-5 py-8">
                <Spinner label="Loading mentors" />
              </div>
            ) : mentors.length === 0 ? (
              <div className="px-5 py-5">
                <EmptyState title="No mentors are listed yet">
                  Members who offer mentorship appear here with their field and availability. If you can
                  help, the form on this page is how the list fills up.
                </EmptyState>
              </div>
            ) : (
              <ul>
                {mentors.map((mentor) => {
                  const isMine = mentor.user_id === myId;
                  const isOpen = requestingId === mentor.user_id;
                  return (
                    <li key={mentor.id} className="border-b border-paper-dim px-5 py-5 last:border-b-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                          {mentor.profiles?.full_name ?? "A KOSA member"}
                          {isMine ? " (you)" : ""}
                        </p>
                        <p className="text-[13px] text-slate">
                          {mentor.profiles?.graduation_year ? `Class of ${mentor.profiles.graduation_year}` : ""}
                          {mentor.profiles?.graduation_year && mentor.profiles?.profession ? " · " : ""}
                          {mentor.profiles?.profession ?? ""}
                        </p>
                      </div>

                      <p className="mt-2 text-[15px] leading-relaxed text-navy">{mentor.expertise}</p>
                      {mentor.availability ? (
                        <p className="mt-1 text-[13px] text-slate">{mentor.availability}</p>
                      ) : null}

                      {!isMine ? (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="ink"
                            size="sm"
                            onClick={() => {
                              setRequestingId(isOpen ? null : mentor.user_id);
                              setMessage("");
                              setRequestError(null);
                            }}
                          >
                            {isOpen ? "Close" : "Request mentorship"}
                          </Button>

                          {isOpen ? (
                            <div className="mt-3 border border-paper-dim bg-paper px-4 py-4">
                              <label
                                htmlFor={`message-${mentor.id}`}
                                className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
                              >
                                What would you like help with?
                              </label>
                              <Textarea
                                id={`message-${mentor.id}`}
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                rows={3}
                                maxLength={800}
                                className="mt-1.5 min-h-24 bg-white"
                                placeholder="A sentence or two about where you are and what you need."
                              />
                              {requestError ? (
                                <Notice tone="error" className="mt-2">
                                  {requestError}
                                </Notice>
                              ) : null}
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <Button
                                  type="button"
                                  variant="ink"
                                  size="sm"
                                  onClick={() =>
                                    sendRequest(
                                      mentor.user_id,
                                      mentor.profiles?.full_name ?? "this mentor",
                                    )
                                  }
                                  disabled={pendingRequestId === mentor.user_id}
                                >
                                  {pendingRequestId === mentor.user_id ? "Sending…" : "Send request"}
                                </Button>
                                <span className="text-[13px] text-slate">
                                  They can accept or decline; you will see the answer below.
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Requests you have sent"
            description="Once a mentor accepts, arrange the first conversation between yourselves. Names appear for mentors who are currently listed."
            bodyClassName="px-0 py-0"
          >
            {data.loading && !data.data ? (
              <div className="px-5 py-8">
                <Spinner label="Loading your requests" />
              </div>
            ) : outgoing.length === 0 ? (
              <div className="px-5 py-5">
                <EmptyState title="You have not asked anyone yet">
                  Use “Request mentorship” on a member&apos;s offer. Your message and its status stay here.
                </EmptyState>
              </div>
            ) : (
              <ul>
                {outgoing.map((request) => (
                  <li key={request.id} className="border-b border-paper-dim px-5 py-4 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                        {nameFor(request.mentor_id)}
                      </span>
                      <StatusPill tone={requestTone(request.status)}>
                        {REQUEST_LABELS[request.status]}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-[13px] text-slate">Sent {formatDate(request.created_at)}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-navy">{request.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <p className="mt-6 max-w-prose text-[13px] leading-relaxed text-slate">
        Mentorship requests are visible only to the two members involved and to administrators. What is
        listed here is what the database returned for your account.
      </p>
    </>
  );
}

export default function PortalMentorshipPage() {
  return (
    <RequireAuth>
      <RequireMember title="Mentorship is for approved members">
        <MentorshipScreen />
      </RequireMember>
    </RequireAuth>
  );
}
