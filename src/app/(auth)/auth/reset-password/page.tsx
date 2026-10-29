"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PageLoading } from "@/components/ui/spinner";
import { updatePassword } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { z } from "zod";

type ResetInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { loading, session, backendConfigured } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetInput) {
    setServerError(null);
    try {
      await updatePassword(values.password);
      setDone(true);
      toast.success("Password updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the password.";
      setServerError(
        /session|token|expired|jwt/i.test(message)
          ? "The recovery session has expired or was already used. Request a fresh reset link and open it on this device."
          : message,
      );
    }
  }

  if (loading) {
    return <PageLoading label="Checking your reset link" />;
  }

  if (!backendConfigured) {
    return (
      <AuthCard title="Reset your password">
        <Notice tone="warning" title="Not available in this build">
          No Supabase backend is configured, so there is no recovery session to use. Set the project URL
          and anon key at build time and request a link from the forgot-password page.
        </Notice>
      </AuthCard>
    );
  }

  if (!session) {
    return (
      <AuthCard
        title="This reset link cannot be used"
        lede="The link has expired, has already been used, or was opened in a different browser from the one that requested it."
        footer={
          <span>
            <Link href="/login/" className="text-navy underline decoration-2 underline-offset-4">
              Back to sign in
            </Link>
          </span>
        }
      >
        <p className="text-[15px] leading-relaxed text-navy">
          Password reset links are single-use and time-limited. Request a new one and open it in this
          browser; the form will then appear here.
        </p>
        <div className="mt-6">
          <Button asChild variant="primary" size="md">
            <Link href="/forgot-password/">Request a new link</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Your password has been changed"
        lede="Use the new password the next time you sign in. Any other browser still signed in with the old password will be asked to sign in again."
        footer={
          <span>
            Changed your mind? You can{" "}
            <Link href="/forgot-password/" className="text-navy underline decoration-2 underline-offset-4">
              reset it again
            </Link>
            .
          </span>
        }
      >
        <Button type="button" variant="primary" size="block" onClick={() => router.replace("/portal/")}>
          Continue to the member portal
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      lede={`You are signed in as ${session.user.email}. Choose a password you have not used elsewhere.`}
      footer={
        <span>
          <Link href="/portal/" className="text-navy underline decoration-2 underline-offset-4">
            Cancel and return to the portal
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Field
          id="password"
          label="New password"
          required
          hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
          error={errors.password?.message}
        >
          {(props) => (
            <Input {...props} {...register("password")} type="password" autoComplete="new-password" />
          )}
        </Field>

        <Field id="confirmPassword" label="Confirm new password" required error={errors.confirmPassword?.message}>
          {(props) => (
            <Input {...props} {...register("confirmPassword")} type="password" autoComplete="new-password" />
          )}
        </Field>

        {serverError ? (
          <Notice tone="error" title="Could not update the password">
            {serverError}
          </Notice>
        ) : null}

        <Button type="submit" variant="primary" size="block" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthCard>
  );
}
