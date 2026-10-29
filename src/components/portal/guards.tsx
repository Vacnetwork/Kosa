"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageLoading } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";

/**
 * Cosmetic route guards for the static export.
 *
 * They decide what this browser renders; they are NOT the security boundary.
 * Every row is protected by Supabase Row Level Security, so a visitor who
 * edits the bundle still gets nothing back from the database.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, session, backendConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (loading || session || !backendConfigured) return;
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login/${next}`);
  }, [loading, session, backendConfigured, pathname, router]);

  if (!backendConfigured) {
    return (
      <div className="mx-auto max-w-xl">
        <Notice tone="warning" title="The member portal is not connected yet">
          This build has no Supabase backend configured, so there are no accounts to sign in with. Once
          <code className="mx-1 bg-white/60 px-1 text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code> and
          <code className="mx-1 bg-white/60 px-1 text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          are set at build time, the portal becomes available.
        </Notice>
      </div>
    );
  }

  if (loading) return <PageLoading label="Checking your session" />;

  if (!session) {
    return (
      <div className="mx-auto max-w-xl">
        <Notice tone="info" title="Sign in to continue">
          Taking you to the sign-in page. If nothing happens,{" "}
          <Link href="/login/" className="underline decoration-2 underline-offset-4">
            open it here
          </Link>
          .
        </Notice>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Member-only surfaces (directory, mentorship). A signed-in applicant sees a
 * plain explanation instead of a wall of empty results.
 */
export function RequireMember({
  children,
  title = "Approved members only",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { isMember, membership } = useAuth();

  if (isMember) return <>{children}</>;

  const status = membership?.status;

  return (
    <div className="bg-white px-6 py-10 quiet-border">
      <h1 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-navy">{title}</h1>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-navy">
        {status === "pending"
          ? "Your membership application is still with the membership officer. This part of the portal opens as soon as your membership is approved."
          : status === "lapsed"
            ? "Your membership has lapsed, so the members-only areas are closed. The membership officer can restore it."
            : status === "suspended"
              ? "Your membership is suspended, so the members-only areas are closed. Contact the membership officer if you think this is wrong."
              : "Only active members can open this. Submit a membership application and, once the membership officer approves it, the page will unlock."}
      </p>
      <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-slate">
        Approval is a decision made by the membership officer in the database — nothing on this page can
        grant it.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="ink" size="sm">
          <Link href="/portal/application/">Your membership application</Link>
        </Button>
        <Button asChild variant="quiet" size="sm">
          <Link href="/portal/">Back to the dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
