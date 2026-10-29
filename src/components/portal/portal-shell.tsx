"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Crest } from "@/components/brand/crest";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useLoad, StatusPill, membershipTone, MEMBERSHIP_LABELS } from "@/components/portal/kit";
import { getMyApplication } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { KOSA } from "@/lib/brand";
import type { MembershipApplication } from "@/lib/types";

const NAV = [
  { href: "/portal/", label: "Dashboard" },
  { href: "/portal/profile/", label: "Profile" },
  { href: "/portal/directory/", label: "Directory" },
  { href: "/portal/events/", label: "Events" },
  { href: "/portal/announcements/", label: "Announcements" },
  { href: "/portal/welfare/", label: "Welfare" },
  { href: "/portal/mentorship/", label: "Mentorship" },
];

type BannerState =
  | { kind: "active"; memberNo: string | null; joined: string | null }
  | { kind: "pending" }
  | { kind: "needs_info"; note: string | null }
  | { kind: "lapsed" }
  | { kind: "suspended" }
  | { kind: "rejected"; note: string | null }
  | { kind: "none" };

function resolveBanner(
  membershipStatus: ReturnType<typeof useAuth>["memberStatus"],
  memberNo: string | null,
  joined: string | null,
  application: MembershipApplication | null,
): BannerState {
  if (membershipStatus === "active") return { kind: "active", memberNo, joined };
  if (membershipStatus === "lapsed") return { kind: "lapsed" };
  if (membershipStatus === "suspended") return { kind: "suspended" };
  if (membershipStatus === "pending") return { kind: "pending" };
  if (application?.status === "pending") return { kind: "pending" };
  if (application?.status === "needs_info") return { kind: "needs_info", note: application.review_note };
  if (application?.status === "rejected") return { kind: "rejected", note: application.review_note };
  return { kind: "none" };
}

/**
 * D5 membership-status banner: one plain sentence per state, never a colour
 * without words. It says who decides, because nobody on this screen can.
 */
function MembershipBanner({ state }: { state: BannerState }) {
  if (state.kind === "active") {
    return (
      <Notice tone="success" title="Your membership is active">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            {state.memberNo ? `Member number ${state.memberNo}` : "Member number not issued yet"}
            {state.joined ? ` · joined ${formatDate(state.joined)}` : ""}
          </span>
          <Link href="/portal/profile/" className="underline decoration-2 underline-offset-4">
            Review your directory listing
          </Link>
        </span>
      </Notice>
    );
  }

  if (state.kind === "pending") {
    return (
      <Notice tone="warning" title="Your application is with the membership officer">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Only the membership officer can approve it. You will get member access — the directory,
            mentorship and welfare — once it is approved; your profile and this dashboard already work.
          </span>
          <Link href="/portal/application/" className="underline decoration-2 underline-offset-4">
            See your application
          </Link>
        </span>
      </Notice>
    );
  }

  if (state.kind === "needs_info") {
    return (
      <Notice tone="warning" title="The membership officer needs more information">
        <span className="block">
          {state.note ?? "Open your application to see what is missing, then submit it again."}
        </span>
        <Link
          href="/portal/application/"
          className="mt-1 inline-block underline decoration-2 underline-offset-4"
        >
          Read the note and resubmit
        </Link>
      </Notice>
    );
  }

  if (state.kind === "rejected") {
    return (
      <Notice tone="error" title="Your application was not approved">
        <span className="block">
          {state.note ?? "The membership officer recorded a decision without a note."}
        </span>
        <Link
          href="/portal/application/"
          className="mt-1 inline-block underline decoration-2 underline-offset-4"
        >
          See the application
        </Link>
      </Notice>
    );
  }

  if (state.kind === "lapsed") {
    return (
      <Notice tone="warning" title="Your membership has lapsed">
        <span className="block">
          Members-only areas are closed until the membership officer restores your record. Your profile and
          announcements stay available. Write to the association through the public contact page to arrange
          renewal.
        </span>
        <Link href="/contact/" className="mt-1 inline-block underline decoration-2 underline-offset-4">
          Contact the association
        </Link>
      </Notice>
    );
  }

  if (state.kind === "suspended") {
    return (
      <Notice tone="error" title="Your membership is suspended">
        <span className="block">
          Members-only areas are closed. The membership officer holds the reason on your record; the
          association&apos;s contact page is the way to ask about it.
        </span>
        <Link href="/contact/" className="mt-1 inline-block underline decoration-2 underline-offset-4">
          Contact the association
        </Link>
      </Notice>
    );
  }

  return (
    <Notice tone="info" title="You have not applied for membership yet">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          An account is not a membership. Submit the application and the membership officer will review it.
        </span>
        <Link href="/portal/application/" className="underline decoration-2 underline-offset-4">
          Start the application
        </Link>
      </span>
    </Notice>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profile, membership, memberStatus, signOut } = useAuth();
  const [signingOut, setSigningOut] = React.useState(false);

  const application = useLoad(session ? `portal-application:${session.user.id}` : "portal-application:none", () =>
    session ? getMyApplication() : Promise.resolve(null),
  );
  const reloadApplication = application.reload;

  // Pages below can change membership facts (submitting an application), so the
  // banner re-reads the record when they say so.
  React.useEffect(() => {
    const onChange = () => reloadApplication();
    window.addEventListener("kosa:membership-changed", onChange);
    return () => window.removeEventListener("kosa:membership-changed", onChange);
  }, [reloadApplication]);

  const banner = resolveBanner(
    memberStatus,
    membership?.member_no ?? null,
    membership?.joined_at ?? null,
    application.data,
  );

  const displayName =
    profile?.preferred_name || profile?.full_name || session?.user.email || "Member";

  React.useEffect(() => {
    const titled = [...NAV, { href: "/portal/application/", label: "Membership application" }];
    const current = titled.find((item) =>
      item.href === "/portal/" ? pathname === "/portal/" : pathname.startsWith(item.href),
    );
    document.title = current ? `${current.label} — KOSA member portal` : "Member portal — KOSA";
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out");
      router.replace("/login/");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="app-surface flex min-h-screen flex-col">
      <header className="bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 px-5 py-3 md:px-8">
          <Link href="/portal/" className="flex items-center gap-3" aria-label="Member portal home">
            <Crest className="h-9 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-display)] text-[16px] font-extrabold text-navy">
                KOSA
              </span>
              <span className="mt-1 text-[13px] text-slate">Member portal</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="hidden text-right sm:block">
                <p className="text-[13px] leading-tight text-slate">Signed in as</p>
                <p className="font-[family-name:var(--font-display)] text-[14px] font-bold leading-tight text-navy">
                  {displayName}
                </p>
              </div>
            ) : null}
            {membership ? (
              <StatusPill tone={membershipTone(membership.status)}>
                {MEMBERSHIP_LABELS[membership.status]}
              </StatusPill>
            ) : null}
            {session ? (
              <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login/">Sign in</Link>
              </Button>
            )}
          </div>
        </div>

        <nav aria-label="Member portal" className="border-t border-paper-dim">
          <div className="mx-auto w-full max-w-[1120px] overflow-x-auto px-5 md:px-8">
            <ul className="flex items-stretch gap-6">
              {NAV.map((item) => {
                const active =
                  item.href === "/portal/" ? pathname === "/portal/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-12 items-center border-b-2 font-[family-name:var(--font-display)] text-[14px] font-bold transition-colors",
                        active
                          ? "border-navy text-navy"
                          : "border-transparent text-slate hover:text-navy",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {session ? (
        <div className="bg-white py-4">
          <div className="mx-auto w-full max-w-[1120px] px-5 md:px-8">
            {application.error ? (
              <Notice tone="error" title="Could not read your application status">
                {application.error}
              </Notice>
            ) : application.loading && !application.data && !membership ? (
              <Notice tone="info" title="Checking your membership record">
                Reading your application status from the association&apos;s records.
              </Notice>
            ) : (
              <MembershipBanner state={banner} />
            )}
          </div>
        </div>
      ) : null}

      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-8 md:py-10">{children}</div>
      </main>

      <footer className="border-t border-paper-dim bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-2 px-5 py-4 text-[13px] text-slate md:px-8">
          <span>
            {KOSA.name} · {KOSA.motto}
          </span>
          <Link href="/" className="underline decoration-1 underline-offset-4 hover:text-navy">
            Back to the public site
          </Link>
        </div>
      </footer>
    </div>
  );
}
