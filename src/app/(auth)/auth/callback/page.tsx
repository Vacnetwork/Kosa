"use client";

/**
 * The query string and hash exist only after mount, so this screen reads them
 * in an effect and records the outcome in state. That is the whole component.
 */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageLoading } from "@/components/ui/spinner";
import { getSupabase } from "@/lib/supabase";

/**
 * Landing point for emailed links (email verification, magic links, recovery).
 *
 * Supabase parses the session out of the URL on client initialisation; this
 * component waits for that session to exist, then forwards to the portal — or
 * to the password form when the link is a recovery link. It renders no content
 * of its own beyond that wait.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [problem, setProblem] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = params.get("type") ?? hash.get("type");
    const errorDescription = params.get("error_description") ?? hash.get("error_description");
    const errorCode = params.get("error_code") ?? hash.get("error_code");

    if (errorDescription || errorCode) {
      setProblem(
        errorDescription?.replace(/\+/g, " ") ??
          "The link could not be verified. It may have expired or already been used.",
      );
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setProblem("This build has no Supabase backend configured, so the link cannot be completed.");
      return;
    }

    const destination = type === "recovery" ? "/auth/reset-password/" : "/portal/";
    let finished = false;

    const go = () => {
      if (finished) return;
      finished = true;
      router.replace(destination);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    const timer = window.setTimeout(() => {
      if (finished) return;
      setProblem(
        "No session was created from this link. Verification links work once and expire; request a new one from the verification page.",
      );
    }, 12_000);

    return () => {
      window.clearTimeout(timer);
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  if (!problem) {
    return <PageLoading label="Completing sign-in" />;
  }

  return (
    <div className="bg-white px-6 py-8 quiet-border">
      <h1 className="font-[family-name:var(--font-display)] text-[24px] font-extrabold leading-tight text-navy">
        That link did not work
      </h1>
      <Notice tone="error" title="Could not complete sign-in" className="mt-4">
        {problem}
      </Notice>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="primary" size="md">
          <Link href="/verify-email/">Request a new verification email</Link>
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/login/">Sign in</Link>
        </Button>
        <Button asChild variant="quiet" size="md">
          <Link href="/forgot-password/">Reset your password</Link>
        </Button>
      </div>
    </div>
  );
}
