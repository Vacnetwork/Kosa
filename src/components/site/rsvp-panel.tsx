"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, registerForEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/**
 * RSVP is the one place on the public site that writes: it needs a signed-in
 * session and an active membership, and it says so plainly rather than hiding
 * the control behind a disabled button.
 */
export function RsvpPanel({ eventId }: { eventId: string }) {
  const { loading, session, isMember, memberStatus, backendConfigured } = useAuth();
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function reserve() {
    setState("saving");
    setError(null);
    try {
      await registerForEvent(eventId);
      setState("done");
    } catch (err) {
      setState("idle");
      setError(
        err instanceof ApiError
          ? err.message
          : "The registration did not go through. Check your connection and try again.",
      );
    }
  }

  if (loading) return <Spinner label="Checking your membership" />;

  if (!session) {
    return (
      <div>
        <p className="max-w-[52ch] text-[18px] leading-relaxed text-white/85">
          Sign in to reserve a place. Registration is tied to a member account, so the organisers know who
          is coming and can reach you if the date moves.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
            <Link href="/login/">Sign in to RSVP</Link>
          </Button>
          <Button asChild variant="onDark" size="lg" className="w-full sm:w-auto">
            <Link href="/register/">Create an account</Link>
          </Button>
        </div>
        <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-white/60">
          No account yet? Membership takes four steps, and the membership page sets each one out before you
          start.
          {!backendConfigured
            ? " This demonstration build has no register connected, so signing in is not yet possible here."
            : null}
        </p>
      </div>
    );
  }

  if (!backendConfigured) {
    return (
      <Notice tone="info" title="No backend is connected to this build">
        On the live site, a signed-in member reserves a place here and the registration appears in their
        portal history. This demonstration build has no register behind it, so nothing can be recorded.
      </Notice>
    );
  }

  if (!isMember) {
    return (
      <Notice tone="warning" title="Your membership is not active yet">
        {memberStatus === "pending"
          ? "Your application is with the membership officer. RSVP opens the moment it is approved."
          : `Your membership is ${memberStatus === "none" ? "not on the register" : memberStatus}. The membership officer can tell you what is needed to restore it.`}{" "}
        <Link href="/login/" className="font-semibold underline decoration-2 underline-offset-4">
          Track my application
        </Link>
      </Notice>
    );
  }

  if (state === "done") {
    return (
      <Notice tone="success" title="Your place is reserved">
        The registration is recorded against your membership and will appear in your portal under events.
        If the date or venue changes, the event managers will reach you at the address on your account.
      </Notice>
    );
  }

  return (
    <div aria-live="polite">
      <Button variant="primary" size="lg" onClick={reserve} disabled={state === "saving"} className="w-full sm:w-auto">
        {state === "saving" ? "Reserving your place…" : "Reserve my place"}
      </Button>
      {error ? (
        <Notice tone="error" title="We could not record that" className="mt-4 max-w-[56ch]">
          {error}
        </Notice>
      ) : null}
    </div>
  );
}
