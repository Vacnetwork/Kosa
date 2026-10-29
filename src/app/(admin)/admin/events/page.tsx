"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, Panel } from "@/components/admin/admin-page-header";
import { CsvExportButton } from "@/components/admin/csv-export-button";
import { StatusPill } from "@/components/admin/status-pill";
import { TableSection } from "@/components/admin/table-section";
import { fromDateTimeInput, toDateTimeInput } from "@/components/admin/datetime";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Td } from "@/components/ui/table";
import { listEventRegistrations, listEvents, saveEvent } from "@/lib/api";
import { eventSchema, type EventInput } from "@/lib/validation";
import { formatDateTime, isFuture } from "@/lib/format";
import type { EventRegistration, EventRow } from "@/lib/types";

type RegistrationRow = EventRegistration & { profiles: { full_name: string; graduation_year: number | null } | null };

const BLANK: EventInput = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  startsAt: "",
  endsAt: "",
  venue: "",
  category: "General",
  capacity: undefined,
};

export default function AdminEventsPage() {
  return (
    <AdminGate permission="manage_events" screen="Events">
      <EventsScreen />
    </AdminGate>
  );
}

function EventsScreen() {
  const { data: events, loading, error, reload } = useAdminData<EventRow[]>(
    () => listEvents({ includeUnpublished: true }),
    [],
    [],
  );
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isPublished, setIsPublished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as unknown as Resolver<EventInput>,
    defaultValues: BLANK,
  });

  const [counts, setCounts] = React.useState<Record<string, number | null>>({});
  const [attendeeEventId, setAttendeeEventId] = React.useState<string | null>(null);
  const [attendees, setAttendees] = React.useState<Record<string, RegistrationRow[]>>({});
  const [attendeeLoading, setAttendeeLoading] = React.useState(false);
  const [attendeeError, setAttendeeError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    if (events.length === 0) {
      setCounts({});
      return;
    }
    void (async () => {
      const entries = await Promise.all(
        events.map(async (event): Promise<[string, number | null]> => {
          try {
            const rows = await listEventRegistrations(event.id);
            return [event.id, rows.filter((row) => row.status !== "cancelled").length];
          } catch {
            return [event.id, null];
          }
        }),
      );
      if (active) setCounts(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
    };
  }, [events]);

  const loadAttendees = React.useCallback(async (eventId: string) => {
    setAttendeeLoading(true);
    setAttendeeError(null);
    try {
      const rows = await listEventRegistrations(eventId);
      setAttendees((previous) => ({ ...previous, [eventId]: rows as RegistrationRow[] }));
    } catch (cause) {
      setAttendeeError(errorMessage(cause, "Could not load registrations."));
    } finally {
      setAttendeeLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!attendeeEventId || attendees[attendeeEventId]) return;
    void loadAttendees(attendeeEventId);
  }, [attendeeEventId, attendees, loadAttendees]);

  const sorted = React.useMemo(
    () => [...events].sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
    [events],
  );

  const startEdit = (event: EventRow) => {
    setEditingId(event.id);
    setFormError(null);
    setIsPublished(event.is_published);
    form.reset({
      title: event.title,
      slug: event.slug,
      summary: event.summary,
      description: event.description ?? "",
      startsAt: toDateTimeInput(event.starts_at),
      endsAt: toDateTimeInput(event.ends_at),
      venue: event.venue ?? "",
      category: event.category,
      capacity: event.capacity ?? undefined,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormError(null);
    setIsPublished(false);
    form.reset(BLANK);
  };

  const submit = form.handleSubmit(async (values) => {
    const startsAt = fromDateTimeInput(values.startsAt);
    const endsAt = values.endsAt ? fromDateTimeInput(values.endsAt) : undefined;
    if (endsAt && endsAt <= startsAt) {
      form.setError("endsAt", { message: "The end must be after the start." });
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await saveEvent({
        id: editingId ?? undefined,
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        description: values.description || undefined,
        startsAt,
        endsAt,
        venue: values.venue || undefined,
        category: values.category || undefined,
        capacity: typeof values.capacity === "number" ? values.capacity : null,
        isPublished,
      });
      toast.success(editingId ? "Event updated" : "Event saved", {
        description: `${values.title} — ${isPublished ? "published" : "kept as a draft"}.`,
      });
      cancelEdit();
      reload();
    } catch (cause) {
      const message = errorMessage(cause, "The event could not be saved.");
      setFormError(message);
      toast.error("Event not saved", { description: message });
    } finally {
      setSaving(false);
    }
  });

  const attendeeEvent = events.find((event) => event.id === attendeeEventId) ?? null;
  const attendeeRows = attendeeEventId ? attendees[attendeeEventId] ?? [] : [];
  const guestTotal = attendeeRows.reduce((sum, row) => sum + (row.guests ?? 0), 0);

  return (
    <>
      <AdminPageHeader
        title="Events"
        description="Drafts stay off the public events page until they are published. Times are entered as Kampala time and stored with the offset."
        meta={
          <>
            <span>{events.length} events</span>
            <span>{events.filter((event) => !event.is_published).length} drafts</span>
            <span>{events.filter((event) => isFuture(event.starts_at)).length} still ahead</span>
          </>
        }
      />

      <Panel
        title={editingId ? "Edit event" : "New event"}
        description="Title, slug, summary and start are required. Everything else can be filled in later."
        className="mb-4"
        actions={
          editingId ? (
            <Button variant="quiet" size="sm" onClick={cancelEdit}>
              Cancel edit
            </Button>
          ) : null
        }
      >
        <form onSubmit={submit} noValidate>
          <div className="grid gap-3 md:grid-cols-2">
            <Field id="event-title" label="Title" required error={form.formState.errors.title?.message}>
              {(field) => <Input {...field} {...form.register("title")} className="text-[15px]" placeholder="Annual general meeting" />}
            </Field>
            <Field
              id="event-slug"
              label="Slug"
              required
              hint="Lowercase letters, numbers and hyphens. Used in the public URL."
              error={form.formState.errors.slug?.message}
            >
              {(field) => <Input {...field} {...form.register("slug")} className="text-[15px]" placeholder="annual-general-meeting" />}
            </Field>

            <Field
              id="event-summary"
              label="Summary"
              required
              error={form.formState.errors.summary?.message}
              className="md:col-span-2"
            >
              {(field) => (
                <Input {...field} {...form.register("summary")} className="text-[15px]" placeholder="One line that explains the event" />
              )}
            </Field>

            <Field id="event-description" label="Description" error={form.formState.errors.description?.message} className="md:col-span-2">
              {(field) => <Textarea {...field} {...form.register("description")} className="min-h-28 text-[15px]" rows={4} />}
            </Field>

            <Field id="event-starts" label="Starts" required error={form.formState.errors.startsAt?.message}>
              {(field) => <Input {...field} {...form.register("startsAt")} type="datetime-local" className="text-[15px]" />}
            </Field>
            <Field id="event-ends" label="Ends" error={form.formState.errors.endsAt?.message}>
              {(field) => <Input {...field} {...form.register("endsAt")} type="datetime-local" className="text-[15px]" />}
            </Field>

            <Field id="event-venue" label="Venue" error={form.formState.errors.venue?.message}>
              {(field) => <Input {...field} {...form.register("venue")} className="text-[15px]" placeholder="Kakoma campus, Gulu" />}
            </Field>
            <Field id="event-category" label="Category" error={form.formState.errors.category?.message}>
              {(field) => (
                <Select {...field} {...form.register("category")} className="text-[15px]">
                  <option value="General">General</option>
                  <option value="Reunion">Reunion</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Fundraiser">Fundraiser</option>
                  <option value="Community">Community</option>
                </Select>
              )}
            </Field>

            <Field
              id="event-capacity"
              label="Capacity"
              hint="Leave blank for no limit. Zero also means no limit in the database."
              error={form.formState.errors.capacity?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  {...form.register("capacity", {
                    setValueAs: (value: unknown) => (value === "" || value === null ? undefined : Number(value)),
                  })}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="text-[15px] tabular-nums"
                />
              )}
            </Field>

            <div className="flex items-end pb-1">
              <Checkbox
                id="event-published"
                label="Published — show this event on the public events page"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
              />
            </div>
          </div>

          {formError ? (
            <Notice tone="error" title="The event was not saved" className="mt-3">
              {formError}
            </Notice>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-paper-dim pt-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Save event"}
            </Button>
            {editingId ? (
              <Button variant="quiet" onClick={cancelEdit} disabled={saving}>
                Discard
              </Button>
            ) : null}
            <p className="text-[13px] text-slate">
              {isPublished ? "Saving will publish it immediately." : "Saving keeps it as a draft."}
            </p>
          </div>
        </form>
      </Panel>

      <TableSection
        caption="All events"
        description="Newest start first. The registration count excludes cancelled places and reads live from event_registrations."
        head={["Event", "Starts", "Venue", "State", "Registrations", "Actions"]}
        rowCount={sorted.length}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="No events yet"
        emptyBody="Create the first event with the form above. A draft is only visible here until it is published."
      >
        {sorted.map((event) => {
          const count = counts[event.id];
          const past = !isFuture(event.starts_at);
          return (
            <tr key={event.id}>
              <Td>
                <span className="font-semibold text-navy">{event.title}</span>
                <span className="mt-0.5 block font-mono text-[13px] text-slate">/{event.slug}</span>
              </Td>
              <Td className="whitespace-nowrap text-[13px] tabular-nums">
                {formatDateTime(event.starts_at)}
                {past ? <span className="mt-0.5 block text-slate">past</span> : null}
              </Td>
              <Td className="text-[14px]">{event.venue ?? "—"}</Td>
              <Td>
                <StatusPill
                  label={event.is_published ? "Published" : "Draft"}
                  tone={event.is_published ? "positive" : "neutral"}
                />
              </Td>
              <Td className="tabular-nums">
                {count === undefined ? "…" : count === null ? "—" : count}
                {event.capacity ? <span className="ml-1 text-[13px] text-slate">/ {event.capacity}</span> : null}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => startEdit(event)}>
                    Edit
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-expanded={attendeeEventId === event.id}
                    onClick={() => setAttendeeEventId(attendeeEventId === event.id ? null : event.id)}
                  >
                    {attendeeEventId === event.id ? "Hide attendees" : "Attendees"}
                  </Button>
                </div>
              </Td>
            </tr>
          );
        })}
      </TableSection>

      {attendeeEvent ? (
        <TableSection
          className="mt-4"
          caption={`Registrations — ${attendeeEvent.title}`}
          description="Cancelled registrations are listed too, marked as such."
          head={["Attendee", "Class", "Status", "Guests", "Note", "Registered"]}
          rowCount={attendeeRows.length}
          loading={attendeeLoading}
          error={attendeeError}
          onRetry={() => void loadAttendees(attendeeEvent.id)}
          emptyTitle="No one has registered yet"
          emptyBody="Registrations appear here as members sign up in the portal."
          footer={`${attendeeRows.length} registrations, ${guestTotal} guests.`}
          actions={
            <CsvExportButton
              rows={attendeeRows.map((row) => ({
                name: row.profiles?.full_name ?? "",
                graduation_year: row.profiles?.graduation_year ?? "",
                status: row.status,
                guests: row.guests,
                note: row.notes ?? "",
                registered_at: row.created_at,
              }))}
              filename={`kosa-attendees-${attendeeEvent.slug}.csv`}
            />
          }
        >
          {attendeeRows.map((row) => (
            <tr key={row.id}>
              <Td className="font-semibold">{row.profiles?.full_name ?? "Unknown account"}</Td>
              <Td className="tabular-nums">{row.profiles?.graduation_year ?? "—"}</Td>
              <Td>
                <StatusPill
                  label={row.status}
                  tone={row.status === "cancelled" ? "neutral" : row.status === "waitlist" ? "attention" : "positive"}
                />
              </Td>
              <Td className="tabular-nums">{row.guests}</Td>
              <Td className="max-w-[28ch] text-[14px]">{row.notes ?? "—"}</Td>
              <Td className="whitespace-nowrap text-[13px] text-slate">{formatDateTime(row.created_at)}</Td>
            </tr>
          ))}
        </TableSection>
      ) : null}
    </>
  );
}
