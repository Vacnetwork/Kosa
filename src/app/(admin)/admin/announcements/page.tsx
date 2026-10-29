"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, Panel } from "@/components/admin/admin-page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StatusPill } from "@/components/admin/status-pill";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { createAnnouncement, deleteAnnouncement, listAnnouncements } from "@/lib/api";
import { announcementSchema, type AnnouncementInput } from "@/lib/validation";
import { formatDateTime } from "@/lib/format";
import type { Announcement } from "@/lib/types";

const BLANK: AnnouncementInput = { title: "", body: "", audience: "members", isPinned: false };

export default function AdminAnnouncementsPage() {
  return (
    <AdminGate permission="manage_announcements" screen="Announcements">
      <AnnouncementsScreen />
    </AdminGate>
  );
}

function AnnouncementsScreen() {
  const { can } = useAuth();
  const { data, loading, error, reload } = useAdminData<Announcement[]>(() => listAnnouncements(), [], []);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const form = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema) as unknown as Resolver<AnnouncementInput>,
    defaultValues: BLANK,
  });
  const pinned = form.watch("isPinned");

  const submit = form.handleSubmit(async (values) => {
    setSaving(true);
    setFormError(null);
    try {
      await createAnnouncement(values);
      toast.success("Announcement published", {
        description: `${values.title} — ${values.audience === "admins" ? "administrators" : "members"}.`,
      });
      form.reset(BLANK);
      reload();
    } catch (cause) {
      const message = errorMessage(cause, "The announcement could not be published.");
      setFormError(message);
      toast.error("Announcement not published", { description: message });
    } finally {
      setSaving(false);
    }
  });

  const remove = async (announcement: Announcement) => {
    setDeleting(announcement.id);
    try {
      await deleteAnnouncement(announcement.id);
      toast.success("Announcement deleted", { description: announcement.title });
      reload();
    } catch (cause) {
      toast.error("Announcement not deleted", { description: errorMessage(cause, "The server refused that delete.") });
    } finally {
      setDeleting(null);
    }
  };

  const canDelete = can("delete_content");

  return (
    <>
      <AdminPageHeader
        title="Announcements"
        description="Notices appear in the member portal for the audience chosen. Administrators can also post to other administrators only."
        meta={
          <>
            <span>{data.length} announcements</span>
            <span>{data.filter((row) => row.is_pinned).length} pinned</span>
            <span>{canDelete ? "Your role can delete content" : "Deleting needs the delete_content permission"}</span>
          </>
        }
      />

      <Panel title="New announcement" description="Title and body are required. Pinned notices stay at the top of the list." className="mb-4">
        <form method="post" onSubmit={submit} noValidate>
          <div className="grid gap-3 md:grid-cols-2">
            <Field id="announcement-title" label="Title" required error={form.formState.errors.title?.message} className="md:col-span-2">
              {(field) => <Input {...field} {...form.register("title")} className="text-[15px]" placeholder="Renewal window opens on 1 November" />}
            </Field>
            <Field id="announcement-body" label="Body" required error={form.formState.errors.body?.message} className="md:col-span-2">
              {(field) => <Textarea {...field} {...form.register("body")} className="min-h-28 text-[15px]" rows={4} />}
            </Field>
            <Field id="announcement-audience" label="Audience" required error={form.formState.errors.audience?.message}>
              {(field) => (
                <Select {...field} {...form.register("audience")} className="text-[15px]">
                  <option value="members">Members</option>
                  <option value="admins">Administrators only</option>
                </Select>
              )}
            </Field>
            <div className="flex items-end pb-1">
              <Checkbox
                id="announcement-pinned"
                label="Pin to the top of the list"
                checked={pinned}
                onChange={(event) => form.setValue("isPinned", event.target.checked, { shouldValidate: true })}
              />
            </div>
          </div>

          {formError ? (
            <Notice tone="error" title="The announcement was not published" className="mt-3">
              {formError}
            </Notice>
          ) : null}

          <div className="mt-4 border-t border-paper-dim pt-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Publishing…" : "Publish announcement"}
            </Button>
          </div>
        </form>
      </Panel>

      <section className="bg-white quiet-border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-dim px-4 py-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">Published announcements</h2>
            <p className="mt-0.5 text-[13px] text-slate">Pinned first, then newest. Everyone who can read the audience sees these.</p>
          </div>
          <Button variant="quiet" size="sm" onClick={reload} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="px-4 py-8">
            <Spinner label="Loading announcements" />
          </div>
        ) : error ? (
          <div className="p-4">
            <Notice tone="error" title="Could not load announcements">
              {error}
            </Notice>
            <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className="px-4 py-8">
            <p className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">No announcements yet</p>
            <p className="mt-1 text-[14px] text-slate">The first notice you publish will appear here and in the portal.</p>
          </div>
        ) : (
          <ul className="divide-y divide-paper-dim">
            {data.map((announcement) => {
              const open = expanded === announcement.id;
              const long = announcement.body.length > 240;
              return (
                <li key={announcement.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-[family-name:var(--font-display)] text-[16px] font-bold leading-snug text-navy">
                          {announcement.title}
                        </h3>
                        {announcement.is_pinned ? <StatusPill label="Pinned" tone="attention" /> : null}
                        <StatusPill
                          label={announcement.audience === "admins" ? "Administrators" : "Members"}
                          tone={announcement.audience === "admins" ? "pending" : "neutral"}
                        />
                      </div>
                      <p className="mt-1 text-[13px] text-slate">Published {formatDateTime(announcement.published_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {long ? (
                        <Button variant="quiet" size="sm" aria-expanded={open} onClick={() => setExpanded(open ? null : announcement.id)}>
                          {open ? "Show less" : "Read all"}
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <ConfirmButton
                          label="Delete"
                          confirmLabel="Delete announcement"
                          variant="outline"
                          confirmVariant="danger"
                          pending={deleting === announcement.id}
                          description={`Delete "${announcement.title}"? It disappears from the portal immediately and cannot be restored from here.`}
                          onConfirm={() => remove(announcement)}
                        />
                      ) : (
                        <Button variant="outline" size="sm" disabled title="Deleting content needs the delete_content permission">
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  <p
                    className={
                      open || !long
                        ? "mt-2 whitespace-pre-line text-[15px] leading-relaxed text-navy"
                        : "mt-2 whitespace-pre-line text-[15px] leading-relaxed text-navy [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
                    }
                  >
                    {announcement.body}
                  </p>
                  {!canDelete ? (
                    <p className="mt-1 text-[13px] text-slate">
                      Your roles can post but not delete; the delete button is disabled and the database would refuse the call.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
