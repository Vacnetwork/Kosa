"use client";

import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { RequireAuth } from "@/components/portal/guards";
import { PageTitle, Panel, useLoad } from "@/components/portal/kit";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import { getMyContact, updateMyProfile, updateMyVisibility } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { profileSchema, type ProfileInput } from "@/lib/validation";

/**
 * `graduationYear` is optional while the form is empty so the select can start
 * on "Choose…". The zod schema still requires it: the cast only relaxes the
 * form-state type, never the validation.
 */
type ProfileFormValues = Omit<ProfileInput, "graduationYear"> & { graduationYear?: number };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 2 - 1950 }, (_, index) => CURRENT_YEAR + 1 - index);

function ProfileScreen() {
  const { profile, session, loading, refresh } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  const contact = useLoad(session ? `contact:${session.user.id}` : "contact:none", () =>
    session ? getMyContact() : Promise.resolve(null),
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileFormValues>,
    defaultValues: {
      fullName: "",
      preferredName: "",
      graduationYear: undefined,
      profession: "",
      employer: "",
      city: "",
      country: "",
      interests: "",
      bio: "",
      linkedinUrl: "",
      directoryVisibility: "members",
      allowContactByMembers: false,
    },
  });

  React.useEffect(() => {
    if (!profile) return;
    reset({
      fullName: profile.full_name,
      preferredName: profile.preferred_name ?? "",
      graduationYear: profile.graduation_year ?? undefined,
      profession: profile.profession ?? "",
      employer: profile.employer ?? "",
      city: profile.city ?? "",
      country: profile.country ?? "",
      interests: profile.interests.join(", "),
      bio: profile.bio ?? "",
      linkedinUrl: profile.linkedin_url ?? "",
      directoryVisibility: profile.directory_visibility,
      allowContactByMembers: profile.allow_contact_by_members,
    });
  }, [profile, reset]);

  React.useEffect(() => {
    if (contact.data) setPhone(contact.data.phone ?? "");
  }, [contact.data]);

  const visibility = watch("directoryVisibility");
  const allowContact = watch("allowContactByMembers");

  async function onSubmit(values: ProfileFormValues) {
    setServerError(null);
    setPhoneError(null);
    if (phone.trim().length > 40) {
      setPhoneError("Keep the phone number under 40 characters.");
      return;
    }
    if (!values.graduationYear) {
      setServerError("Choose your graduation year before saving.");
      return;
    }

    try {
      await updateMyProfile({
        fullName: values.fullName,
        preferredName: values.preferredName || undefined,
        graduationYear: values.graduationYear,
        profession: values.profession || undefined,
        employer: values.employer || undefined,
        city: values.city || undefined,
        country: values.country || undefined,
        interests: values.interests || undefined,
        bio: values.bio || undefined,
        linkedinUrl: values.linkedinUrl || undefined,
        phone,
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not save your profile.");
      return;
    }

    try {
      await updateMyVisibility({
        directoryVisibility: values.directoryVisibility,
        allowContactByMembers: values.allowContactByMembers,
      });
    } catch (error) {
      setServerError(
        `Your profile details were saved, but the visibility settings were not: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
      await refresh();
      return;
    }

    await refresh();
    toast.success("Profile saved");
  }

  if (loading) return <PageLoading label="Loading your profile" />;

  return (
    <>
      <PageTitle
        title="Your profile"
        lede="What the association holds about you, and what other members are allowed to see. Changes take effect immediately."
      />

      {!profile ? (
        <Notice tone="info" title="No profile record yet" className="mb-6">
          Fill this in and save once; the record is created with your account. Your membership application
          is separate and lives under{" "}
          <Link href="/portal/application/" className="underline decoration-2 underline-offset-4">
            Application
          </Link>
          .
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <Panel title="Your details" description="Used in the directory and on association records.">
            <div className="flex flex-col gap-5">
              <Field id="fullName" label="Full name" required error={errors.fullName?.message}>
                {(props) => <Input {...props} {...register("fullName")} autoComplete="name" />}
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="preferredName"
                  label="Preferred name"
                  hint="Optional — what you would like to be called."
                  error={errors.preferredName?.message}
                >
                  {(props) => <Input {...props} {...register("preferredName")} autoComplete="nickname" />}
                </Field>

                <Field
                  id="graduationYear"
                  label="Graduation year"
                  required
                  hint="The year you left the school."
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
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="profession" label="Profession" error={errors.profession?.message}>
                  {(props) => (
                    <Input {...props} {...register("profession")} placeholder="e.g. Teacher, nurse, engineer" />
                  )}
                </Field>

                <Field id="employer" label="Employer or organisation" error={errors.employer?.message}>
                  {(props) => <Input {...props} {...register("employer")} />}
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="city" label="City or town" error={errors.city?.message}>
                  {(props) => <Input {...props} {...register("city")} autoComplete="address-level2" />}
                </Field>

                <Field id="country" label="Country" error={errors.country?.message}>
                  {(props) => <Input {...props} {...register("country")} autoComplete="country-name" />}
                </Field>
              </div>

              <Field
                id="interests"
                label="Interests"
                hint="Separate with commas, up to twelve. e.g. Mentorship, Bursary fund, ICT"
                error={errors.interests?.message}
              >
                {(props) => <Input {...props} {...register("interests")} />}
              </Field>

              <Field
                id="bio"
                label="Short biography"
                hint="A few sentences other members can read. Leave it empty if you would rather not."
                error={errors.bio?.message}
              >
                {(props) => <Textarea {...props} {...register("bio")} rows={5} />}
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="linkedinUrl"
                  label="LinkedIn profile"
                  hint="Full URL, including https://"
                  error={errors.linkedinUrl?.message}
                >
                  {(props) => (
                    <Input {...props} {...register("linkedinUrl")} type="url" inputMode="url" />
                  )}
                </Field>

                <Field
                  id="phone"
                  label="Phone number"
                  hint="Only shown to members when you allow contact."
                  error={phoneError ?? undefined}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      type="tel"
                      autoComplete="tel"
                    />
                  )}
                </Field>
              </div>

              <div className="border-t border-paper-dim pt-4">
                <p className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.08em] text-slate">
                  Sign-in email
                </p>
                <p className="mt-1 text-[15px] text-navy">{session?.user.email ?? "—"}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate">
                  This is the address Supabase authenticates you with. It is not editable here; the
                  membership officer can correct it on your record.
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Directory visibility"
            description="Two switches that decide what other members see. The association's officers can always see your record."
          >
            <div className="flex flex-col gap-5">
              <Field
                id="directoryVisibility"
                label="Listing in the alumni directory"
                hint="Active members only — applicants cannot browse the directory."
                error={errors.directoryVisibility?.message}
              >
                {(props) => (
                  <Select {...props} {...register("directoryVisibility")}>
                    <option value="members">Listed for active members</option>
                    <option value="hidden">Hidden from the directory</option>
                  </Select>
                )}
              </Field>

              <Checkbox
                id="allowContactByMembers"
                label="Let active members see my email address and phone number in the directory."
                checked={allowContact}
                onChange={(event) => setValue("allowContactByMembers", event.target.checked, { shouldDirty: true })}
              />

              <div className="border border-paper-dim bg-paper px-4 py-4">
                <p className="font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                  What other members can see
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-[14px] leading-relaxed text-navy">
                  <li>
                    {visibility === "hidden"
                      ? "Nothing: your profile is removed from the directory entirely."
                      : "Your name, graduation year, profession, employer, city, country, bio and interests."}
                  </li>
                  <li>
                    {allowContact && visibility === "members"
                      ? "Your email address and phone number — only to signed-in active members."
                      : "No email address or phone number."}
                  </li>
                  <li>
                    The membership officer and administrators can see your full record, as they must to run
                    the association.
                  </li>
                </ul>
              </div>

              {serverError ? (
                <Notice tone="error" title="Could not save">
                  {serverError}
                </Notice>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save profile"}
                </Button>
                {isDirty ? (
                  <span className="text-[13px] text-slate">Unsaved changes</span>
                ) : (
                  <span className="text-[13px] text-slate">
                    {profile?.updated_at ? `Last saved ${formatDate(profile.updated_at)}` : ""}
                  </span>
                )}
                <span className="text-[13px] text-slate">
                  {contact.loading ? <Spinner label="Loading contact details" /> : null}
                </span>
              </div>
            </div>
          </Panel>
        </form>

        <aside className="flex flex-col gap-6">
          <Panel title="How this is protected">
            <p className="text-[15px] leading-relaxed text-navy">
              There is no server in this deployment. Every read and write goes straight to Supabase, where
              row-level security decides what you may see or change. Hiding a field here would not protect
              it — the database rules are what protect it.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-slate">
              That also means the visibility switches above are enforced on the server, not just drawn on
              this page.
            </p>
          </Panel>

          <Panel title="Contact details">
            <p className="text-[15px] leading-relaxed text-navy">
              Your email and phone are stored separately from the public profile. Other members receive them
              only through the directory, and only when you allow contact.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-slate">
              The welfare desk and the membership officer use the same record to reply to you.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}

export default function PortalProfilePage() {
  return (
    <RequireAuth>
      <ProfileScreen />
    </RequireAuth>
  );
}
