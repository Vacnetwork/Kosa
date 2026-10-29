"use client";

/**
 * The app's whole data contract.
 *
 * Every function has two paths:
 *   • configured  — talks to Supabase; authorisation is enforced by RLS and by
 *                   SECURITY DEFINER functions in supabase/migrations.
 *   • unconfigured — returns clearly-labelled demo fixtures so the deployed
 *                   static site is demonstrable without a backend.
 *
 * Pages never call `supabase.from(...)` directly, so the security-critical
 * RPC boundary lives in one place and can be audited.
 */
import { getSupabase, isBackendConfigured, siteUrl, getCaptchaToken } from "@/lib/supabase";
import {
  DEMO_ALUMNI,
  DEMO_ANNOUNCEMENTS,
  DEMO_COHORTS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_IMPACT,
  DEMO_NEWS,
  DEMO_WELFARE_REQUESTS,
} from "@/content/demo";
import type {
  AlumniCard,
  Announcement,
  ApplicationStatus,
  AuditLog,
  Contribution,
  EventRegistration,
  EventRow,
  GalleryItem,
  ImpactStats,
  Membership,
  MembershipApplication,
  MembershipStatus,
  MentorshipOffer,
  MentorshipRequest,
  NewsPost,
  Profile,
  Role,
  WelfareRequest,
  WelfareStatus,
} from "@/lib/types";

export class ApiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new ApiError(error.message, error);
  return data as T;
}

function fail(error: unknown, fallback: string): never {
  if (error instanceof ApiError) throw error;
  const message = error instanceof Error ? error.message : fallback;
  throw new ApiError(message, error);
}

/* ------------------------------------------------------------------ auth */

export async function signUp(input: { fullName: string; email: string; password: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured, so accounts cannot be created yet.");
  const captchaToken = await getCaptchaToken();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback/`,
      captchaToken,
    },
  });
  if (error) fail(error, "Could not create the account.");
  return data;
}

export async function signIn(input: { email: string; password: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured, so signing in is unavailable.");
  const captchaToken = await getCaptchaToken();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
    options: { captchaToken },
  });
  if (error) fail(error, "Could not sign in with those details.");
  return data;
}

export async function requestPasswordReset(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const captchaToken = await getCaptchaToken();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/reset-password/`,
    captchaToken,
  });
  if (error) fail(error, "Could not send the reset email.");
}

export async function updatePassword(password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) fail(error, "Could not update the password.");
}

export async function resendVerificationEmail(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) fail(error, "Could not resend the verification email.");
}

/* -------------------------------------------------------------- profiles */

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) fail(error, "Could not load your profile.");
  return (data as Profile | null) ?? null;
}

export async function getMyContact() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profile_contacts")
    .select("email, phone")
    .maybeSingle();
  if (error) return null;
  return data as { email: string | null; phone: string | null } | null;
}

export async function updateMyProfile(input: {
  fullName: string;
  preferredName?: string;
  graduationYear: number;
  profession?: string;
  employer?: string;
  city?: string;
  country?: string;
  interests?: string;
  bio?: string;
  linkedinUrl?: string;
  phone?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new ApiError("Sign in again to save your profile.");

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: input.fullName,
      preferred_name: input.preferredName || null,
      graduation_year: input.graduationYear,
      profession: input.profession || null,
      employer: input.employer || null,
      city: input.city || null,
      country: input.country || null,
      interests: input.interests
        ? input.interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12)
        : [],
      bio: input.bio || null,
      linkedin_url: input.linkedinUrl || null,
    },
    { onConflict: "id" },
  );
  if (error) fail(error, "Could not save your profile.");

  if (input.phone !== undefined) {
    const { error: contactError } = await supabase.from("profile_contacts").upsert(
      { profile_id: user.id, email: user.email ?? null, phone: input.phone || null },
      { onConflict: "profile_id" },
    );
    if (contactError) fail(contactError, "Could not save your contact details.");
  }
}

export async function updateMyVisibility(input: {
  directoryVisibility: "members" | "hidden";
  allowContactByMembers: boolean;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase
    .from("profiles")
    .update({
      directory_visibility: input.directoryVisibility,
      allow_contact_by_members: input.allowContactByMembers,
    })
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
  if (error) fail(error, "Could not save your visibility settings.");
}

/* ------------------------------------------------------------ membership */

export async function submitApplication(input: {
  fullName: string;
  graduationYear: number;
  cohortNote?: string;
  motivation: string;
}): Promise<string> {
  return rpc<string>("submit_membership_application", {
    p_full_name: input.fullName,
    p_graduation_year: input.graduationYear,
    p_cohort_note: input.cohortNote || null,
    p_motivation: input.motivation,
  });
}

export async function getMyApplication(): Promise<MembershipApplication | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("membership_applications")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as MembershipApplication | null) ?? null;
}

export async function listApplications(status?: ApplicationStatus): Promise<MembershipApplication[]> {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  let query = supabase.from("membership_applications").select("*").order("submitted_at", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) fail(error, "Could not load applications.");
  return (data ?? []) as MembershipApplication[];
}

export async function decideApplication(
  applicationId: string,
  decision: "approved" | "rejected" | "needs_info",
  note?: string,
) {
  await rpc<void>("decide_membership_application", {
    p_application_id: applicationId,
    p_decision: decision,
    p_note: note || null,
  });
}

export async function listMembers(filter?: { status?: MembershipStatus; query?: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  let query = supabase
    .from("memberships")
    .select("*, profiles:user_id(id, full_name, graduation_year, profession, city, country, directory_visibility)")
    .order("updated_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) fail(error, "Could not load members.");
  const rows = (data ?? []) as (Membership & { profiles: Partial<Profile> | null })[];
  if (!filter?.query) return rows;
  const needle = filter.query.toLowerCase();
  return rows.filter((row) => (row.profiles?.full_name ?? "").toLowerCase().includes(needle));
}

export async function setMemberStatus(userId: string, status: MembershipStatus, notes?: string) {
  await rpc<void>("set_member_status", { p_user_id: userId, p_status: status, p_notes: notes || null });
}

export async function setUserRole(userId: string, role: Role, grant: boolean) {
  await rpc<void>("set_user_role", { p_user_id: userId, p_role: role, p_grant: grant });
}

export async function listRoles() {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { data, error } = await supabase
    .from("user_roles")
    .select("*, profiles:user_id(full_name)")
    .order("granted_at", { ascending: false });
  if (error) fail(error, "Could not load roles.");
  return data ?? [];
}

/* ------------------------------------------------------------- directory */

export async function searchAlumni(params: {
  query?: string;
  year?: number | null;
  profession?: string;
  location?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: AlumniCard[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) {
    const needle = (params.query ?? "").toLowerCase();
    const filtered = DEMO_ALUMNI.filter((member) => {
      const haystack = `${member.full_name} ${member.profession ?? ""} ${member.city ?? ""} ${member.interests.join(" ")}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesYear = !params.year || member.graduation_year === params.year;
      const matchesProfession = !params.profession || (member.profession ?? "").toLowerCase().includes(params.profession.toLowerCase());
      const matchesLocation = !params.location || (member.city ?? "").toLowerCase().includes(params.location.toLowerCase());
      return matchesQuery && matchesYear && matchesProfession && matchesLocation;
    });
    return { rows: filtered, total: filtered.length };
  }
  const data = await rpc<Array<AlumniCard & { total_count: number }>>("search_alumni", {
    p_query: params.query || null,
    p_year: params.year ?? null,
    p_profession: params.profession || null,
    p_location: params.location || null,
    p_limit: params.limit ?? 24,
    p_offset: params.offset ?? 0,
  });
  const total = data.length > 0 ? Number(data[0].total_count) : 0;
  return { rows: data.map(({ total_count: _ignored, ...rest }) => rest as AlumniCard), total };
}

export async function getAlumniProfile(id: string) {
  const supabase = getSupabase();
  if (!supabase) {
    const member = DEMO_ALUMNI.find((m) => m.id === id) ?? null;
    return member ? { ...member, bio: null, email: null, phone: null, canContact: false } : null;
  }
  const data = await rpc<Array<AlumniCard & { bio: string | null; email: string | null; phone: string | null; can_contact: boolean }>>(
    "get_alumni_profile",
    { p_id: id },
  );
  const row = data?.[0];
  if (!row) return null;
  const { can_contact, ...rest } = row;
  return { ...rest, canContact: Boolean(can_contact) };
}

export async function listCohorts(): Promise<{ year: number; members: number }[]> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_COHORTS;
  try {
    const data = await rpc<{ year: number; members: number }[]>("cohort_stats");
    return data ?? [];
  } catch {
    return DEMO_COHORTS;
  }
}

export async function getImpactStats(): Promise<ImpactStats> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_IMPACT;
  try {
    const data = await rpc<Array<ImpactStats>>("get_impact_stats");
    const row = data?.[0];
    if (!row) return DEMO_IMPACT;
    return { ...row, demo: false };
  } catch {
    return DEMO_IMPACT;
  }
}

/* ----------------------------------------------------------------- events */

export async function listEvents(options?: { includeUnpublished?: boolean }): Promise<EventRow[]> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_EVENTS;
  let query = supabase.from("events").select("*").order("starts_at", { ascending: true });
  if (!options?.includeUnpublished) query = query.eq("is_published", true);
  const { data, error } = await query;
  if (error) fail(error, "Could not load events.");
  return (data ?? []) as EventRow[];
}

export async function getEvent(slug: string): Promise<EventRow | null> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_EVENTS.find((event) => event.slug === slug) ?? null;
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) return null;
  return (data as EventRow | null) ?? null;
}

export async function registerForEvent(eventId: string, guests = 0, notes?: string) {
  await rpc<string>("register_for_event", {
    p_event_id: eventId,
    p_guests: guests,
    p_notes: notes || null,
  });
}

export async function cancelRegistration(registrationId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("id", registrationId);
  if (error) fail(error, "Could not cancel the registration.");
}

export async function listMyRegistrations(): Promise<(EventRegistration & { events: EventRow | null })[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, events(*)")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Could not load your registrations.");
  return (data ?? []) as (EventRegistration & { events: EventRow | null })[];
}

export async function listEventRegistrations(eventId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*, profiles:user_id(full_name, graduation_year)")
    .eq("event_id", eventId);
  if (error) fail(error, "Could not load registrations.");
  return data ?? [];
}

export async function saveEvent(input: {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  venue?: string;
  category?: string;
  capacity?: number | null;
  isPublished: boolean;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const payload = {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    description: input.description || null,
    starts_at: input.startsAt,
    ends_at: input.endsAt || null,
    venue: input.venue || null,
    category: input.category || "General",
    capacity: input.capacity ?? null,
    is_published: input.isPublished,
  };
  const query = input.id
    ? supabase.from("events").update(payload).eq("id", input.id)
    : supabase.from("events").insert(payload);
  const { error } = await query;
  if (error) fail(error, "Could not save the event.");
}

/* --------------------------------------------------- announcements / news */

export async function listAnnouncements(): Promise<Announcement[]> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_ANNOUNCEMENTS.filter((a) => a.audience === "members");
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) fail(error, "Could not load announcements.");
  return (data ?? []) as Announcement[];
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  audience: "members" | "admins";
  isPinned: boolean;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.from("announcements").insert({
    title: input.title,
    body: input.body,
    audience: input.audience,
    is_pinned: input.isPinned,
  });
  if (error) fail(error, "Could not publish the announcement.");
}

export async function deleteAnnouncement(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) fail(error, "Could not delete the announcement.");
}

export async function listNews(): Promise<NewsPost[]> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_NEWS;
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (error) fail(error, "Could not load stories.");
  return (data ?? []) as NewsPost[];
}

export async function getNews(slug: string): Promise<NewsPost | null> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_NEWS.find((post) => post.slug === slug) ?? null;
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) return null;
  return (data as NewsPost | null) ?? null;
}

/* ---------------------------------------------------------------- gallery */

export async function listGallery(album?: string): Promise<GalleryItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return album ? DEMO_GALLERY.filter((item) => item.album === album) : DEMO_GALLERY;
  }
  let query = supabase
    .from("gallery_items")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (album) query = query.eq("album", album);
  const { data, error } = await query;
  if (error) fail(error, "Could not load the gallery.");
  return (data ?? []) as GalleryItem[];
}

export async function addGalleryItem(input: {
  title: string;
  caption?: string;
  imageUrl: string;
  credit?: string;
  album?: string;
  cohortYear?: number | null;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.from("gallery_items").insert({
    title: input.title,
    caption: input.caption || null,
    image_url: input.imageUrl,
    credit: input.credit || null,
    album: input.album || "General",
    cohort_year: input.cohortYear ?? null,
  });
  if (error) fail(error, "Could not add the picture.");
}

export async function deleteGalleryItem(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) fail(error, "Could not remove the picture.");
}

/** Uploads to the `gallery` bucket. Storage policies allow admin roles only. */
export async function uploadGalleryImage(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  if (file.size > 5 * 1024 * 1024) throw new ApiError("Pictures must be 5 MB or smaller.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new ApiError("Use a JPEG, PNG or WebP picture.");
  }
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file, { upsert: false });
  if (error) fail(error, "Could not upload the picture.");
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------------------------------------------------------- welfare */

export async function submitWelfareRequest(input: {
  category: string;
  summary: string;
  details: string;
  amountRequested?: number;
  isConfidential: boolean;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { error } = await supabase.from("welfare_requests").insert({
    category: input.category,
    summary: input.summary,
    details: input.details,
    amount_requested: input.amountRequested ?? null,
    is_confidential: input.isConfidential,
  });
  if (error) fail(error, "Could not submit the request.");
}

export async function listMyWelfareRequests(): Promise<WelfareRequest[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("welfare_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Could not load your requests.");
  return (data ?? []) as WelfareRequest[];
}

export async function listWelfareQueue(status?: WelfareStatus): Promise<WelfareRequest[]> {
  const supabase = getSupabase();
  if (!supabase) return DEMO_WELFARE_REQUESTS;
  let query = supabase.from("welfare_requests").select("*").order("created_at", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) fail(error, "Could not load the welfare queue.");
  return (data ?? []) as WelfareRequest[];
}

export async function decideWelfareRequest(requestId: string, status: WelfareStatus, note?: string) {
  await rpc<void>("decide_welfare_request", {
    p_request_id: requestId,
    p_status: status,
    p_note: note || null,
  });
}

/* ------------------------------------------------------------ mentorship */

export async function listMentors(): Promise<(MentorshipOffer & { profiles: { full_name: string; graduation_year: number | null; profession: string | null } | null })[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("mentorship_offers")
    .select("*, profiles:user_id(full_name, graduation_year, profession)")
    .eq("is_accepting", true)
    .order("created_at", { ascending: false });
  if (error) fail(error, "Could not load mentors.");
  return data ?? [];
}

export async function upsertMentorOffer(input: { expertise: string; availability?: string; isAccepting: boolean }) {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new ApiError("Sign in again to update your mentorship offer.");
  const { error } = await supabase.from("mentorship_offers").upsert(
    {
      user_id: userId,
      expertise: input.expertise,
      availability: input.availability || null,
      is_accepting: input.isAccepting,
    },
    { onConflict: "user_id" },
  );
  if (error) fail(error, "Could not save your mentorship offer.");
}

export async function requestMentorship(mentorId: string, message: string) {
  await rpc<string>("request_mentorship", { p_mentor_id: mentorId, p_message: message });
}

export async function listMyMentorships(): Promise<MentorshipRequest[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("mentorship_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Could not load mentorship requests.");
  return (data ?? []) as MentorshipRequest[];
}

export async function respondMentorship(requestId: string, status: "accepted" | "declined" | "closed") {
  await rpc<void>("respond_mentorship", { p_request_id: requestId, p_status: status });
}

/* ---------------------------------------------------------- contributions */

export async function listContributions(): Promise<Contribution[]> {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .order("received_at", { ascending: false });
  if (error) fail(error, "Could not load contributions.");
  return (data ?? []) as Contribution[];
}

export async function recordContribution(input: {
  memberId?: string;
  campaign: string;
  amount: number;
  currency: string;
  method?: string;
  reference?: string;
  receivedAt: string;
  note?: string;
}) {
  await rpc<string>("record_contribution", {
    p_member_id: input.memberId || null,
    p_campaign: input.campaign,
    p_amount: input.amount,
    p_currency: input.currency,
    p_method: input.method || null,
    p_reference: input.reference || null,
    p_received_at: input.receivedAt,
    p_note: input.note || null,
  });
}

/* ------------------------------------------------------------------ audit */

export async function listAuditLogs(filters?: { action?: string; entity?: string }): Promise<AuditLog[]> {
  const supabase = getSupabase();
  if (!supabase) throw new ApiError("The backend is not configured.");
  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
  if (filters?.action) query = query.eq("action", filters.action);
  if (filters?.entity) query = query.eq("entity", filters.entity);
  const { data, error } = await query;
  if (error) fail(error, "Could not load the audit log.");
  return (data ?? []) as AuditLog[];
}

/* ---------------------------------------------------------------- contact */

export async function sendContactMessage(input: { name: string; email: string; subject: string; message: string }) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new ApiError(
      "The contact form has no backend yet. The app falls back to opening your email client instead.",
    );
  }
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: input.name,
    p_email: input.email,
    p_subject: input.subject,
    p_message: input.message,
  });
  if (error) fail(error, "Could not send the message.");
}

export const isConfigured = isBackendConfigured;
