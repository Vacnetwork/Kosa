"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isBackendConfigured } from "@/lib/supabase";
import type { Membership, MembershipStatus, Profile, Role } from "@/lib/types";

interface AuthState {
  loading: boolean;
  backendConfigured: boolean;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  membership: Membership | null;
  isAdmin: boolean;
  isMember: boolean;
  memberStatus: MembershipStatus | "none";
  can: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export type Permission =
  | "approve_members"
  | "manage_members"
  | "manage_roles"
  | "manage_events"
  | "manage_announcements"
  | "manage_gallery"
  | "view_finance"
  | "record_contributions"
  | "view_welfare"
  | "delete_content";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "approve_members",
    "manage_members",
    "manage_roles",
    "manage_events",
    "manage_announcements",
    "manage_gallery",
    "view_finance",
    "record_contributions",
    "view_welfare",
    "delete_content",
  ],
  membership_officer: ["approve_members", "manage_members", "manage_announcements"],
  event_manager: ["manage_events", "manage_gallery", "manage_announcements"],
  treasurer: ["view_finance", "record_contributions", "view_welfare"],
  member: [],
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);

  const loadIdentity = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    const supabase = getSupabase();
    if (!supabase || !nextSession?.user) {
      setProfile(null);
      setRoles([]);
      setMembership(null);
      return;
    }
    const userId = nextSession.user.id;
    const [profileRes, rolesRes, membershipRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("memberships").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setProfile((profileRes.data as Profile | null) ?? null);
    setRoles(((rolesRes.data ?? []) as { role: Role }[]).map((r) => r.role));
    setMembership((membershipRes.data as Membership | null) ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    await loadIdentity(data.session ?? null);
    setLoading(false);
  }, [loadIdentity]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      loadIdentity(data.session ?? null).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      void loadIdentity(nextSession);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase?.auth.signOut();
    setProfile(null);
    setRoles([]);
    setMembership(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(() => {
    const permissions = new Set<Permission>();
    roles.forEach((role) => ROLE_PERMISSIONS[role]?.forEach((p) => permissions.add(p)));
    return {
      loading,
      backendConfigured: isBackendConfigured(),
      session,
      profile,
      roles,
      membership,
      isAdmin: roles.some((r) => r !== "member"),
      isMember: membership?.status === "active",
      memberStatus: membership?.status ?? "none",
      can: (permission: Permission) => permissions.has(permission),
      refresh,
      signOut,
    };
  }, [loading, session, profile, roles, membership, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
