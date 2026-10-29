"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { resendVerificationEmail } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { session, backendConfigured } = useAuth();
  const [email, setEmail] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  const address = email ?? session?.user.email ?? "";

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    if (!address.includes("@")) {
      setServerError("Enter the email address you registered with.");
      return;
    }
    setPending(true);
    try {
      await resendVerificationEmail(address.trim().toLowerCase());
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      toast.success("Verification email sent");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not resend the verification email.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email address"
      lede="The account exists, but the address has to be confirmed before you can submit a membership application or sign in reliably."
      footer={
        <span>
          Already verified?{" "}
          <Link href="/login/" className="text-navy underline decoration-2 underline-offset-4">
            Sign in
          </Link>
          {" · "}
          <Link href="/register/" className="text-navy underline decoration-2 underline-offset-4">
            Create another account
          </Link>
        </span>
      }
    >
      <ol className="mb-6 flex flex-col gap-3 text-[15px] leading-relaxed text-navy">
        <li className="border-l-2 border-paper-dim pl-4">
          Open the message headed “Confirm your signup” from the association&apos;s mail sender.
        </li>
        <li className="border-l-2 border-paper-dim pl-4">
          The link returns you here and signs you in; it can only be used once.
        </li>
        <li className="border-l-2 border-paper-dim pl-4">
          If it has expired, send yourself a fresh one below. Nothing is lost — your account stays as it is.
        </li>
      </ol>

      {!backendConfigured ? (
        <Notice tone="warning" title="Verification email cannot be sent from this build" className="mb-5">
          No Supabase backend is configured, so no email can be generated. Set
          <code className="mx-1 bg-paper px-1 text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code>
          and
          <code className="mx-1 bg-paper px-1 text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          at build time and the button below will work.
        </Notice>
      ) : null}

      <form method="post" onSubmit={handleResend} noValidate className="flex flex-col gap-5">
        <Field
          id="email"
          label="Email address"
          required
          hint="The address on the account you are verifying."
          error={undefined}
        >
          {(props) => (
            <Input
              {...props}
              value={address}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              inputMode="email"
            />
          )}
        </Field>

        {sent ? (
          <Notice tone="success" title="A new verification email has been sent">
            It can take a minute or two to arrive. Check the spam folder before requesting another; the
            button unlocks again after {COOLDOWN_SECONDS} seconds.
          </Notice>
        ) : null}

        {serverError ? (
          <Notice tone="error" title="Could not send the email">
            {serverError}
          </Notice>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="block"
          disabled={pending || cooldown > 0 || !backendConfigured}
        >
          {pending
            ? "Sending…"
            : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend verification email"}
        </Button>

        <p className="text-[13px] leading-relaxed text-slate">
          This only resends the verification message. It does not submit a membership application, and it
          cannot verify the address on your behalf.
        </p>
      </form>
    </AuthCard>
  );
}
