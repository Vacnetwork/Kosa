"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crest } from "@/components/brand/crest";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ADMIN_GROUPS, ADMIN_SECTIONS, ROLE_LABELS, canSeeSection, isActiveSection } from "@/components/admin/nav";

/**
 * The administration chrome: a compact navy bar, a left rail of only the
 * sections this sign-in can reach, and the page on the quiet app surface.
 *
 * Signed-out visitors are sent to the sign-in screen with a way back. Signed-in
 * accounts with no administrator role get a plain explanation instead of a
 * half-drawn dashboard.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { loading, backendConfigured, session, profile, roles, isAdmin, can, signOut, refresh } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  const nextPath = pathname && pathname.startsWith("/admin") ? pathname : "/admin/";
  const loginHref = `/login/?next=${encodeURIComponent(nextPath)}`;

  React.useEffect(() => {
    if (!loading && backendConfigured && !session) {
      router.replace(loginHref);
    }
  }, [loading, backendConfigured, session, loginHref, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out");
      router.replace("/login/");
    } catch {
      toast.error("Could not sign out. Reload the page and try again.");
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="app-surface flex min-h-screen items-center justify-center">
        <PageLoading label="Checking your access" />
      </div>
    );
  }

  if (!backendConfigured) {
    return (
      <Standalone
        title="No backend is configured"
        body="This build has no Supabase URL and key, so there is nothing to administer and no account to sign in with. Administration is not simulated: every screen would be showing invented numbers, so it is closed instead."
      >
        <Button asChild variant="ink" size="sm">
          <Link href="/">Back to the site</Link>
        </Button>
      </Standalone>
    );
  }

  if (!session) {
    return (
      <Standalone
        title="Sign in to continue"
        body="Administration is only available to signed-in accounts that hold an administrator role. If the redirect does not happen, use the button below."
      >
        <Button asChild variant="ink" size="sm">
          <Link href={loginHref}>Sign in</Link>
        </Button>
      </Standalone>
    );
  }

  if (!isAdmin) {
    return (
      <Standalone
        title="No administration role"
        body={
          <>
            You are signed in as <span className="font-semibold text-navy">{profile?.full_name ?? session.user.email}</span>
            , but no administrator role is attached to this account — or the role list could not be read just now. Roles
            are granted by a super administrator.
          </>
        }
        footer={
          <ul className="flex flex-wrap gap-1.5">
            {roles.length > 0 ? (
              roles.map((role) => (
                <li key={role} className="border border-paper-dim bg-paper px-2 py-1 text-[13px] font-semibold text-navy">
                  {ROLE_LABELS[role]}
                </li>
              ))
            ) : (
              <li className="text-[13px] text-slate">No roles on this account.</li>
            )}
          </ul>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ink" size="sm">
            <Link href="/portal/">Go to the member portal</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Public site</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={signingOut}>
            Check again
          </Button>
          <Button variant="quiet" size="sm" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </Standalone>
    );
  }

  const sections = ADMIN_SECTIONS.filter((section) => canSeeSection(section, can));
  const visibleRoles = roles.filter((role) => role !== "member");
  const displayName = profile?.full_name ?? session.user.email ?? "Administrator";

  return (
    <div className="app-surface min-h-screen">
      <header className="sticky top-0 z-40 h-14 bg-navy text-white">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 overflow-hidden px-4">
          <Link href="/admin/" className="flex min-w-0 items-center gap-2.5" aria-label="KOSA administration overview">
            <Crest className="h-8 w-auto shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-[family-name:var(--font-display)] text-[15px] font-extrabold leading-tight">
                KOSA administration
              </span>
              <span className="hidden truncate text-[13px] leading-tight text-white/60 sm:block">
                Kakoma Old Students Association
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-[22ch] truncate text-[14px] font-semibold leading-tight">{displayName}</p>
              <p className="hidden max-w-[22ch] truncate text-[13px] leading-tight text-white/60 lg:block">
                {session.user.email}
              </p>
            </div>
            <ul aria-label="Your roles" className="flex max-w-[46vw] flex-wrap justify-end gap-1">
              {visibleRoles.length > 0 ? (
                visibleRoles.map((role) => (
                  <li key={role} className="border border-white/30 px-1.5 py-0.5 text-[13px] font-semibold leading-tight text-white/85">
                    {ROLE_LABELS[role]}
                  </li>
                ))
              ) : (
                <li className="border border-white/30 px-1.5 py-0.5 text-[13px] font-semibold text-white/85">Member</li>
              )}
            </ul>
            <Button variant="onDark" size="sm" className="shrink-0" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col md:flex-row">
        <aside className="border-b border-paper-dim bg-white md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-[236px] md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
          <nav aria-label="Administration sections" className="flex gap-3 overflow-x-auto px-3 py-2 md:block md:px-0 md:py-4">
            {ADMIN_GROUPS.map((group) => {
              const items = sections.filter((section) => section.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="md:mb-3">
                  <p className="hidden px-4 pb-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-slate md:block">
                    {group}
                  </p>
                  <ul className="flex gap-1 md:block">
                    {items.map((section) => {
                      const active = isActiveSection(section.href, pathname);
                      return (
                        <li key={section.href}>
                          <Link
                            href={section.href}
                            aria-current={active ? "page" : undefined}
                            title={section.summary}
                            className={cn(
                              "block whitespace-nowrap px-2.5 py-1.5 text-[14px] leading-tight transition-colors md:border-l-2 md:px-4 md:py-2",
                              active
                                ? "bg-paper font-semibold text-navy md:border-navy"
                                : "text-slate hover:bg-paper hover:text-navy md:border-transparent",
                            )}
                          >
                            {section.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
          <div className="hidden border-t border-paper-dim px-4 py-3 md:block">
            <p className="text-[13px] leading-relaxed text-slate">
              Sections are listed by role. Every write is checked again by the database, which records it in the audit log.
            </p>
            <Link href="/" className="mt-2 inline-block text-[13px] text-navy underline decoration-2 underline-offset-4">
              Public site
            </Link>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 py-5 text-[15px] md:px-8 md:py-7">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Standalone({
  title,
  body,
  footer,
  children,
}: {
  title: string;
  body: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="app-surface min-h-screen">
      <header className="h-14 bg-navy text-white">
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2.5 px-4">
          <Crest className="h-8 w-auto" />
          <span className="font-[family-name:var(--font-display)] text-[15px] font-extrabold">KOSA administration</span>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[560px] px-4 py-10">
        <div className="bg-white p-6 quiet-border">
          <h1 className="font-[family-name:var(--font-display)] text-[24px] font-extrabold leading-tight text-navy">{title}</h1>
          <div className="mt-2 text-[15px] leading-relaxed text-slate">{body}</div>
          {footer ? <div className="mt-4">{footer}</div> : null}
          {children ? <div className="mt-5">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
