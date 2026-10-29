import type { Permission } from "@/lib/auth";
import type { Role } from "@/lib/types";

/**
 * The administration surface, and the permission each screen needs.
 *
 * This list is only navigation: it decides what is worth showing, never what is
 * allowed. The same checks run on the server (RLS + SECURITY DEFINER functions),
 * so hiding a link is a courtesy, not a control.
 */
export type AdminGroup = "Register" | "Programme" | "Money & welfare" | "Governance";

export const ADMIN_GROUPS: AdminGroup[] = ["Register", "Programme", "Money & welfare", "Governance"];

export interface AdminSection {
  href: string;
  label: string;
  group: AdminGroup;
  /** Any one of these grants the screen. Empty means "any administrator". */
  permissions: Permission[];
  summary: string;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    href: "/admin/",
    label: "Overview",
    group: "Register",
    permissions: [],
    summary: "What needs attention, and what your roles allow",
  },
  {
    href: "/admin/applications/",
    label: "Applications",
    group: "Register",
    permissions: ["approve_members"],
    summary: "Approve, reject or ask for more information",
  },
  {
    href: "/admin/members/",
    label: "Members",
    group: "Register",
    permissions: ["manage_members"],
    summary: "The register, status changes and CSV export",
  },
  {
    href: "/admin/events/",
    label: "Events",
    group: "Programme",
    permissions: ["manage_events"],
    summary: "Publish events and read registrations",
  },
  {
    href: "/admin/announcements/",
    label: "Announcements",
    group: "Programme",
    permissions: ["manage_announcements"],
    summary: "Notices for members or administrators",
  },
  {
    href: "/admin/gallery/",
    label: "Gallery",
    group: "Programme",
    permissions: ["manage_gallery"],
    summary: "Pictures, credits and albums",
  },
  {
    href: "/admin/contributions/",
    label: "Contributions",
    group: "Money & welfare",
    permissions: ["view_finance", "record_contributions"],
    summary: "Record money received and read the totals",
  },
  {
    href: "/admin/welfare/",
    label: "Welfare",
    group: "Money & welfare",
    permissions: ["view_welfare"],
    summary: "The confidential welfare queue",
  },
  {
    href: "/admin/reports/",
    label: "Reports",
    group: "Governance",
    permissions: [],
    summary: "Plain tables for the committee",
  },
  {
    href: "/admin/audit/",
    label: "Audit log",
    group: "Governance",
    permissions: [],
    summary: "Every privileged write, newest first",
  },
  {
    href: "/admin/roles/",
    label: "Roles",
    group: "Governance",
    permissions: ["manage_roles"],
    summary: "Grant and revoke administrator roles",
  },
];

export function canSeeSection(section: AdminSection, can: (permission: Permission) => boolean): boolean {
  return section.permissions.length === 0 || section.permissions.some((permission) => can(permission));
}

export function isActiveSection(href: string, pathname: string): boolean {
  const path = pathname || "/admin/";
  if (href === "/admin/") return path === "/admin/" || path === "/admin";
  const bare = href.replace(/\/$/, "");
  return path === href || path === bare || path.startsWith(href);
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  membership_officer: "Membership officer",
  event_manager: "Event manager",
  treasurer: "Treasurer",
  member: "Member",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  approve_members: "Decide membership applications",
  manage_members: "Manage the member register",
  manage_roles: "Grant and revoke roles",
  manage_events: "Publish and edit events",
  manage_announcements: "Post and delete announcements",
  manage_gallery: "Manage the gallery",
  view_finance: "View contributions and totals",
  record_contributions: "Record contributions",
  view_welfare: "Open the welfare queue",
  delete_content: "Delete published content",
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];
