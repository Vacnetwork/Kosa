"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader, Panel } from "@/components/admin/admin-page-header";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { errorMessage, useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { addGalleryItem, deleteGalleryItem, listGallery, uploadGalleryImage } from "@/lib/api";
import { galleryItemSchema, type GalleryItemInput } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import type { GalleryItem } from "@/lib/types";

const BLANK: GalleryItemInput = {
  title: "",
  caption: "",
  imageUrl: "",
  credit: "",
  album: "General",
  cohortYear: undefined,
};

export default function AdminGalleryPage() {
  return (
    <AdminGate permission="manage_gallery" screen="Gallery">
      <GalleryScreen />
    </AdminGate>
  );
}

function GalleryScreen() {
  const { can } = useAuth();
  const { data, loading, error, reload } = useAdminData<GalleryItem[]>(() => listGallery(), [], []);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const form = useForm<GalleryItemInput>({
    resolver: zodResolver(galleryItemSchema) as unknown as Resolver<GalleryItemInput>,
    defaultValues: BLANK,
  });
  const imageUrl = form.watch("imageUrl");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadGalleryImage(file);
      form.setValue("imageUrl", url, { shouldValidate: true });
      toast.success("Picture uploaded", { description: "Add a title and credit, then save the item." });
    } catch (cause) {
      const message = errorMessage(cause, "The upload failed.");
      setUploadError(message);
      toast.error("Upload failed", { description: message });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setSaving(true);
    setFormError(null);
    try {
      await addGalleryItem({
        title: values.title,
        caption: values.caption || undefined,
        imageUrl: values.imageUrl,
        credit: values.credit || undefined,
        album: values.album || undefined,
        cohortYear: typeof values.cohortYear === "number" ? values.cohortYear : null,
      });
      toast.success("Picture added to the gallery", { description: values.title });
      form.reset(BLANK);
      if (fileInput.current) fileInput.current.value = "";
      reload();
    } catch (cause) {
      const message = errorMessage(cause, "The picture could not be added.");
      setFormError(message);
      toast.error("Not saved", { description: message });
    } finally {
      setSaving(false);
    }
  });

  const remove = async (item: GalleryItem) => {
    setDeleting(item.id);
    try {
      await deleteGalleryItem(item.id);
      toast.success("Picture removed", { description: item.title });
      reload();
    } catch (cause) {
      toast.error("Picture not removed", { description: errorMessage(cause, "The server refused that delete.") });
    } finally {
      setDeleting(null);
    }
  };

  const canDelete = can("delete_content");

  return (
    <>
      <AdminPageHeader
        title="Gallery"
        description="Pictures are uploaded to the public gallery bucket, then described here. Uploads are limited to 5 MB and JPEG, PNG or WebP; the storage policy allows administrator roles only."
        meta={
          <>
            <span>{data.length} published pictures</span>
            <span>{canDelete ? "Your role can delete pictures" : "Deleting needs delete_content"}</span>
          </>
        }
      />

      <Panel title="Add a picture" description="Upload first, then describe it. The item is not published until you save." className="mb-4">
        <form method="post" onSubmit={submit} noValidate>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="gallery-file" className="mb-1 block text-[15px] font-bold text-navy">
                Picture file
              </label>
              <input
                ref={fileInput}
                id="gallery-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(event) => void handleFile(event.target.files?.[0])}
                className="block w-full border-2 border-paper-dim bg-white px-3 py-2 text-[15px] text-navy file:mr-3 file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-white disabled:bg-paper"
              />
              <p className="mt-1 text-[13px] text-slate">
                {uploading ? "Uploading…" : "JPEG, PNG or WebP, up to 5 MB."}
              </p>
              {uploadError ? (
                <Notice tone="error" title="Upload failed" className="mt-2">
                  {uploadError}
                </Notice>
              ) : null}
            </div>

            {imageUrl ? (
              <div className="md:col-span-2">
                <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate">Uploaded</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-44 w-full max-w-[420px] object-cover quiet-border" />
              </div>
            ) : null}

            <Field id="gallery-title" label="Title" required error={form.formState.errors.title?.message}>
              {(field) => <Input {...field} {...form.register("title")} className="text-[15px]" placeholder="Prize-giving, 1998 year" />}
            </Field>
            <Field
              id="gallery-image-url"
              label="Image URL"
              required
              hint="Filled in by the upload. You can paste a public URL instead."
              error={form.formState.errors.imageUrl?.message}
            >
              {(field) => <Input {...field} {...form.register("imageUrl")} className="font-mono text-[13px]" placeholder="https://…" />}
            </Field>

            <Field id="gallery-caption" label="Caption" error={form.formState.errors.caption?.message} className="md:col-span-2">
              {(field) => <Textarea {...field} {...form.register("caption")} className="min-h-20 text-[15px]" rows={2} />}
            </Field>

            <Field
              id="gallery-credit"
              label="Credit"
              hint="Photographer, archive or source. Leave blank only if it is genuinely unknown."
              error={form.formState.errors.credit?.message}
            >
              {(field) => <Input {...field} {...form.register("credit")} className="text-[15px]" placeholder="Photograph by …" />}
            </Field>
            <Field id="gallery-album" label="Album" error={form.formState.errors.album?.message}>
              {(field) => <Input {...field} {...form.register("album")} className="text-[15px]" placeholder="General" />}
            </Field>

            <Field
              id="gallery-year"
              label="Year of completion"
              hint="Only if the picture belongs to one graduating class."
              error={form.formState.errors.cohortYear?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  {...form.register("cohortYear", {
                    setValueAs: (value: unknown) => (value === "" || value === null ? undefined : Number(value)),
                  })}
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  className="text-[15px] tabular-nums"
                />
              )}
            </Field>
          </div>

          {formError ? (
            <Notice tone="error" title="The picture was not saved" className="mt-3">
              {formError}
            </Notice>
          ) : null}

          <div className="mt-4 border-t border-paper-dim pt-3">
            <Button type="submit" variant="primary" disabled={saving || uploading}>
              {saving ? "Saving…" : "Add to gallery"}
            </Button>
          </div>
        </form>
      </Panel>

      <section className="bg-white quiet-border">
        <div className="border-b border-paper-dim px-4 py-3">
          <h2 className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">Published pictures</h2>
          <p className="mt-0.5 text-[13px] text-slate">Every item here is visible on the public gallery.</p>
        </div>

        {loading ? (
          <div className="px-4 py-8">
            <Spinner label="Loading the gallery" />
          </div>
        ) : error ? (
          <div className="p-4">
            <Notice tone="error" title="Could not load the gallery">
              {error}
            </Notice>
            <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className="px-4 py-8">
            <p className="font-[family-name:var(--font-display)] text-[16px] font-bold text-navy">The gallery is empty</p>
            <p className="mt-1 text-[14px] text-slate">Upload the first picture above.</p>
          </div>
        ) : (
          <ul className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => (
              <li key={item.id} className="flex flex-col bg-white quiet-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.caption ?? item.title} className="h-36 w-full object-cover" />
                <div className="flex flex-1 flex-col p-3">
                  <p className="font-[family-name:var(--font-display)] text-[15px] font-bold leading-snug text-navy">{item.title}</p>
                  <p className="mt-1 text-[13px] text-slate">
                    {item.album}
                    {item.cohort_year ? ` · ${item.cohort_year}` : ""} · {formatDate(item.created_at)}
                  </p>
                  {item.caption ? <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate">{item.caption}</p> : null}
                  <p className="mt-2 text-[13px] leading-snug text-navy">
                    <span className="font-semibold">Credit:</span> {item.credit ?? "not recorded"}
                  </p>
                  <div className="mt-3 flex justify-end">
                    {canDelete ? (
                      <ConfirmButton
                        label="Delete"
                        confirmLabel="Remove picture"
                        variant="outline"
                        confirmVariant="danger"
                        pending={deleting === item.id}
                        description={`Remove "${item.title}" from the gallery? The record is deleted; the uploaded file itself is left in the bucket.`}
                        onConfirm={() => remove(item)}
                      />
                    ) : (
                      <Button variant="outline" size="sm" disabled title="Deleting content needs the delete_content permission">
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
