"use client";

import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { requestPasswordReset } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { z } from "zod";

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { backendConfigured } = useAuth();
  const [sent, setSent] = React.useState<{ email: string; uncertain: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotInput) {
    let uncertain = false;
    try {
      await requestPasswordReset(values.email);
    } catch {
      // Deliberately identical to the success path: the response must not
      // reveal whether an account exists, nor whether the address was accepted.
      uncertain = true;
    }
    setSent({ email: values.email, uncertain });
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        lede="If an account exists for that address, a password reset link is on its way. The message usually arrives within a few minutes."
        footer={
          <span>
            Remembered it?{" "}
            <Link href="/login/" className="text-navy underline decoration-2 underline-offset-4">
              Back to sign in
            </Link>
            .
          </span>
        }
      >
        <p className="text-[15px] leading-relaxed text-navy">
          The link opens a page where you choose a new password. It can be used once and expires; if it has
          expired, request another from this page.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Notice tone="info">
            Nothing arrived? Check the spam folder, then try again. The page shows the same message whether
            or not an account exists, so it cannot be used to discover who is registered.
          </Notice>
          {sent.uncertain ? (
            <Notice tone="warning" title="The request could not be confirmed">
              The browser did not get a clear answer from the server — this can happen on a weak
              connection. If no email arrives within a few minutes, submit the form again.
            </Notice>
          ) : null}
        </div>

        <div className="mt-6">
          <Button type="button" variant="ink" size="md" onClick={() => setSent(null)}>
            Send another request
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      lede="Enter the email address on your account and we will send a link to choose a new password."
      footer={
        <span>
          <Link href="/login/" className="text-navy underline decoration-2 underline-offset-4">
            Back to sign in
          </Link>
          {" · "}
          <Link href="/register/" className="text-navy underline decoration-2 underline-offset-4">
            Create an account
          </Link>
        </span>
      }
    >
      {!backendConfigured ? (
        <Notice tone="warning" title="Password reset is not available in this build" className="mb-5">
          No Supabase backend is configured, so no reset email can be sent.
        </Notice>
      ) : null}

      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Field
          id="email"
          label="Email address"
          required
          hint="Use the address you registered with."
          error={errors.email?.message}
        >
          {(props) => (
            <Input {...props} {...register("email")} type="email" autoComplete="email" inputMode="email" />
          )}
        </Field>

        <Turnstile className="flex flex-col gap-2" />

        <Button type="submit" variant="primary" size="block" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-[13px] leading-relaxed text-slate">
          For privacy, this page never says whether an address is registered. The same confirmation
          appears either way.
        </p>
      </form>
    </AuthCard>
  );
}
