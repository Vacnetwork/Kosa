/**
 * Row types mirror supabase/migrations/*.sql exactly (snake_case columns).
 * Keep this file in step with the migrations: it is the app-side contract that
 * the Row Level Security policies enforce on the server.
 */

export type Role = "super_admin" | "membership_officer" | "event_manager" | "treasurer" | "member";

export type DirectoryVisibility = "members" | "hidden";

export type ApplicationStatus = "pending" | "needs_info" | "approved" | "rejected";

export type MembershipStatus = "pending" | "active" | "lapsed" | "suspended";

export type RegistrationStatus = "going" | "waitlist" | "cancelled";

export type WelfareStatus = "submitted" | "reviewing" | "approved" | "disbursed" | "declined";

export type WelfareCategory = "bereavement" | "medical" | "education" | "hardship" | "other";

export interface Profile {
  id: string;
  full_name: string;
  preferred_name: string | null;
  graduation_year: number | null;
  profession: string | null;
  employer: string | null;
  city: string | null;
  country: string | null;
  interests: string[];
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  directory_visibility: DirectoryVisibility;
  allow_contact_by_members: boolean;
  created_at: string;
  updated_at: string;
}

/** Private contact details, readable only by their owner and by administrators. */
export interface ProfileContact {
  profile_id: string;
  email: string | null;
  phone: string | null;
}

export interface MembershipApplication {
  id: string;
  user_id: string;
  full_name: string;
  graduation_year: number | null;
  cohort_note: string | null;
  motivation: string;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
}

export interface Membership {
  id: string;
  user_id: string;
  member_no: string | null;
  status: MembershipStatus;
  cohort_year: number | null;
  joined_at: string | null;
  updated_at: string;
  notes: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: Role;
  granted_at: string;
  granted_by: string | null;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  category: string;
  capacity: number | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  guests: number;
  notes: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "members" | "admins";
  is_pinned: boolean;
  published_at: string;
  created_by: string | null;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
  is_published: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  credit: string | null;
  album: string;
  cohort_year: number | null;
  is_published: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export interface WelfareRequest {
  id: string;
  user_id: string;
  category: WelfareCategory;
  summary: string;
  details: string;
  amount_requested: number | null;
  currency: string;
  status: WelfareStatus;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  handled_by: string | null;
  decision_note: string | null;
}

export interface Contribution {
  id: string;
  member_id: string | null;
  campaign: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  received_at: string;
  recorded_by: string | null;
  note: string | null;
}

export interface MentorshipOffer {
  id: string;
  user_id: string;
  expertise: string;
  availability: string | null;
  is_accepting: boolean;
  created_at: string;
}

export interface MentorshipRequest {
  id: string;
  mentor_id: string;
  mentee_id: string;
  message: string;
  status: "pending" | "accepted" | "declined" | "closed";
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

/** A directory card: the only shape other members can ever see. */
export interface AlumniCard {
  id: string;
  full_name: string;
  graduation_year: number | null;
  profession: string | null;
  employer: string | null;
  city: string | null;
  country: string | null;
  interests: string[];
  avatar_url: string | null;
}

export interface ImpactStats {
  active_members: number;
  cohorts: number;
  projects: number;
  bursaries_awarded: number;
  demo: boolean;
}
