"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/portal/guards";
import { ConfirmButton } from "@/components/portal/confirm-button";
import {
  PageTitle,
  Panel,
  REGISTRATION_LABELS,
  StatusPill,
  registrationTone,
  useLoad,
} from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { cancelRegistration, listEvents, listMyRegistrations, registerForEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dayParts, formatDate, formatTime, isFuture } from "@/lib/format";

const GUEST_OPTIONS = [0, 1, 2, 3, 4, 5];

function EventsScreen() {
  const { session, isMember, loading } = useAuth();
  const [openEvent, setOpenEvent] = React.useState<string | null>(null);
  const [guests, setGuests] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const data = useLoad(session ? `events:${session.user.id}` : "events:none", async () => {
    if (!session) return { events: [], registrations: [] };
    const [events, registrations] = await Promise.all([listEvents(), listMyRegistrations()]);
    return { events, registrations };
  });

  const upcoming = (data.data?.events ?? [])
    .filter((event) => event.is_published && isFuture(event.starts_at))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const registrations = data.data?.registrations ?? [];

  function registrationFor(eventId: string) {
    return registrations.find((row) => row.event_id === eventId && row.status !== "cancelled");
  }

  function startRsvp(eventId: string) {
    setOpenEvent(eventId);
    setFormError(null);
    const existing = registrationFor(eventId);
    setGuests(existing?.guests ?? 0);
    setNotes(existing?.notes ?? "");
  }

  async function submitRsvp(eventId: string, eventTitle: string) {
    setPendingId(eventId);
    setFormError(null);
    try {
      await registerForEvent(eventId, guests, notes);
      toast.success(`RSVP recorded for ${eventTitle}`);
      setOpenEvent(null);
      setNotes("");
      setGuests(0);
      data.reload();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not record the RSVP.");
    } finally {
      setPendingId(null);
    }
  }

  async function cancel(id: string) {
    try {
      await cancelRegistration(id);
      toast.success("Registration cancelled");
      data.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel the registration.");
    }
  }

  if (loading) return <PageLoading label="Loading events" />;

  return (
    <>
      <PageTitle
        title="Events"
        lede="Published dates from the events team, and every registration recorded against your account."
      />

      {!isMember ? (
        <Notice tone="warning" title="RSVP needs an active membership" className="mb-6">
          You can read the programme below, but registration opens once the membership officer approves
          your application.{" "}
          <Link href="/portal/application/" className="underline decoration-2 underline-offset-4">
            See your application
          </Link>
          .
        </Notice>
      ) : null}

      {data.error ? (
        <Notice tone="error" title="Could not load events" className="mb-6">
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

      <section aria-labelledby="upcoming-events" className="mb-10">
        <h2
          id="upcoming-events"
          className="mb-4 font-[family-name:var(--font-display)] text-[19px] font-bold text-navy"
        >
          Upcoming
        </h2>

        {data.loading && !data.data ? (
          <div className="bg-white px-5 py-10 quiet-border">
            <Spinner label="Loading the programme" />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState title="No upcoming events are published">
            Confirmed dates appear here as soon as the events team publishes them, with the venue and the
            registration form. Anything you have already registered for stays listed below.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {upcoming.map((event) => {
              const mine = registrationFor(event.id);
              const date = dayParts(event.starts_at);
              const isOpen = openEvent === event.id;
              return (
                <li
                  key={event.id}
                  id={`event-${event.id}`}
                  className="scroll-mt-24 bg-white quiet-border"
                >
                  <div className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-start">
                    <div className="flex w-20 shrink-0 flex-col items-center border border-paper-dim px-3 py-2 text-center">
                      <span className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-wide text-slate">
                        {date.weekday}
                      </span>
                      <span className="font-[family-name:var(--font-display)] text-[28px] font-extrabold leading-none text-navy">
                        {date.day}
                      </span>
                      <span className="text-[13px] text-slate">{date.month}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-[family-name:var(--font-display)] text-[17px] font-bold leading-snug text-navy">
                          {event.title}
                        </h3>
                        {mine ? (
                          <StatusPill tone={registrationTone(mine.status)}>
                            {REGISTRATION_LABELS[mine.status]}
                          </StatusPill>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[14px] text-slate">
                        {formatDate(event.starts_at)} at {formatTime(event.starts_at)} EAT
                        {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""}
                        {event.venue ? ` · ${event.venue}` : ""}
                      </p>
                      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-navy">
                        {event.summary}
                      </p>
                      {event.capacity ? (
                        <p className="mt-1 text-[13px] text-slate">
                          Capacity {event.capacity}. Waitlist applies once it is full.
                        </p>
                      ) : null}

                      <div className="mt-4">
                        {isMember ? (
                          <Button
                            type="button"
                            variant={isOpen ? "quiet" : "ink"}
                            size="sm"
                            onClick={() => (isOpen ? setOpenEvent(null) : startRsvp(event.id))}
                          >
                            {isOpen ? "Hide the form" : mine ? "Update RSVP" : "RSVP"}
                          </Button>
                        ) : (
                          <span className="text-[14px] text-slate">
                            Registration is open to active members only.
                          </span>
                        )}
                      </div>

                      {isOpen ? (
                        <div className="mt-4 border border-paper-dim bg-paper px-4 py-4">
                          <p className="font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                            {mine ? "Update your registration" : "Register for this event"}
                          </p>
                          <div className="mt-3 grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
                            <div className="flex flex-col gap-1.5">
                              <label
                                htmlFor={`guests-${event.id}`}
                                className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
                              >
                                Guests
                              </label>
                              <select
                                id={`guests-${event.id}`}
                                value={guests}
                                onChange={(changeEvent) => setGuests(Number(changeEvent.target.value))}
                                className="h-11 w-full border border-paper-dim bg-white px-3 text-[15px] text-navy focus:border-navy focus:outline-none"
                              >
                                {GUEST_OPTIONS.map((count) => (
                                  <option key={count} value={count}>
                                    {count === 0 ? "Just me" : `${count} guest${count === 1 ? "" : "s"}`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label
                                htmlFor={`notes-${event.id}`}
                                className="font-[family-name:var(--font-display)] text-[13px] font-bold text-navy"
                              >
                                Notes for the organisers
                              </label>
                              <textarea
                                id={`notes-${event.id}`}
                                value={notes}
                                onChange={(changeEvent) => setNotes(changeEvent.target.value)}
                                rows={2}
                                maxLength={300}
                                placeholder="Dietary needs, access requirements, arrival time…"
                                className="w-full resize-y border border-paper-dim bg-white px-3 py-2 text-[15px] text-navy placeholder:text-slate/70 focus:border-navy focus:outline-none"
                              />
                            </div>
                          </div>

                          {formError && openEvent === event.id ? (
                            <Notice tone="error" title="Could not record the RSVP" className="mt-3">
                              {formError}
                            </Notice>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="ink"
                              size="sm"
                              onClick={() => submitRsvp(event.id, event.title)}
                              disabled={pendingId === event.id}
                            >
                              {pendingId === event.id ? "Saving…" : mine ? "Save changes" : "Confirm RSVP"}
                            </Button>
                            <Button
                              type="button"
                              variant="quiet"
                              size="sm"
                              onClick={() => setOpenEvent(null)}
                              disabled={pendingId === event.id}
                            >
                              Cancel
                            </Button>
                            <span className="text-[13px] text-slate">
                              Up to five guests per member. Children must be accompanied.
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Panel
        title="My registration history"
        description="Every registration on this account, newest first. Cancelling frees your place for someone else."
        bodyClassName="px-0 py-0"
      >
        {data.loading && !data.data ? (
          <div className="px-5 py-8">
            <Spinner label="Loading your registrations" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState title="No registrations yet">
              When you RSVP to an event it is recorded here with its status, the number of guests and the
              date you registered.
            </EmptyState>
          </div>
        ) : (
          <TableWrap className="border-0">
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Date</Th>
                <Th>Guests</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <Td>
                    <span className="font-[family-name:var(--font-display)] font-bold text-navy">
                      {registration.events?.title ?? "Event no longer published"}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-slate">
                      registered {formatDate(registration.created_at)}
                    </span>
                  </Td>
                  <Td>{registration.events ? formatDate(registration.events.starts_at) : "—"}</Td>
                  <Td>{registration.guests === 0 ? "None" : registration.guests}</Td>
                  <Td>
                    <StatusPill tone={registrationTone(registration.status)}>
                      {REGISTRATION_LABELS[registration.status]}
                    </StatusPill>
                  </Td>
                  <Td>
                    {registration.status === "cancelled" ? (
                      <span className="text-[13px] text-slate">No action</span>
                    ) : (
                      <ConfirmButton
                        label="Cancel"
                        confirmLabel="Yes, cancel"
                        consequence="This gives up your place and any guest places. You can register again while places remain."
                        onConfirm={() => cancel(registration.id)}
                      />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}

export default function PortalEventsPage() {
  return (
    <RequireAuth>
      <EventsScreen />
    </RequireAuth>
  );
}
