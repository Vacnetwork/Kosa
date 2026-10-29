"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { signUp } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { signUpSchema, type SignUpInput } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const { backendConfigured } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setServerError(null);
    try {
      const result = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      if (result.session) {
        toast.success("Account created. Welcome to the portal.");
        router.replace("/portal/");
        return;
      }
      setSentTo(values.email);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Could not create the account. Try again in a moment.",
      );
    }
  }

  if (sentTo) {
    return (
      <AuthCard
        title="Check your email to verify your address"
        lede={
          <>
            We sent a verification link to <strong className="text-navy">{sentTo}</strong>. Open it on this
            device to finish setting up your account.
          </>
        }
        footer={
          <span>
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="text-navy underline decoration-2 underline-offset-4"
            >
              Start again
            </button>
            .
          </span>
        }
      >
        <ol className="flex flex-col gap-4">
          {[
            {
              title: "1. Verify your email",
              body: "The link in that message confirms the address belongs to you. If it expires, ask for a new one from the verification page.",
            },
            {
              title: "2. Submit the membership application",
              body: "A verified account is not yet a membership. The application records your cohort and why you are joining.",
            },
            {
              title: "3. Wait for the membership officer",
              body: "The membership officer approves applications. When yours is approved, the directory, mentorship and welfare areas open.",
            },
          ].map((step) => (
            <li key={step.title} className="border-l-2 border-paper-dim pl-4">
              <p className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                {step.title}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-slate">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="ink" size="md">
            <Link href="/verify-email/">Verify or resend the email</Link>
          </Button>
          <Button asChild variant="quiet" size="md">
            <Link href="/login/">Go to sign in</Link>
          </Button>
        </div>

        <Notice tone="info" className="mt-6">
          If an account already exists for that address, Supabase sends no new verification message and
          shows no error — that is deliberate, so nobody can test which addresses are registered. Try
          signing in instead.
        </Notice>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      lede="An account lets you keep your details current and track a membership application. Membership itself is granted by the membership officer after review."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login/" className="text-navy underline decoration-2 underline-offset-4">
            Sign in
          </Link>
          .
        </span>
      }
    >
      {!backendConfigured ? (
        <Notice tone="warning" title="Accounts are not available in this build" className="mb-5">
          No Supabase backend is configured, so no account can be created. This page is here so the flow is
          complete; it will work once the project URL and anon key are set at build time.
        </Notice>
      ) : null}

      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Field id="fullName" label="Full name" required error={errors.fullName?.message}>
          {(props) => (
            <Input {...props} {...register("fullName")} autoComplete="name" placeholder="As it appears on your records" />
          )}
        </Field>

        <Field
          id="email"
          label="Email address"
          required
          hint="Used to sign in, to verify the account and for association notices."
          error={errors.email?.message}
        >
          {(props) => (
            <Input {...props} {...register("email")} type="email" autoComplete="email" inputMode="email" />
          )}
        </Field>

        <Field
          id="password"
          label="Password"
          required
          hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
          error={errors.password?.message}
        >
          {(props) => (
            <Input {...props} {...register("password")} type="password" autoComplete="new-password" />
          )}
        </Field>

        <Field id="confirmPassword" label="Confirm password" required error={errors.confirmPassword?.message}>
          {(props) => (
            <Input {...props} {...register("confirmPassword")} type="password" autoComplete="new-password" />
          )}
        </Field>

        <Turnstile className="flex flex-col gap-2" />

        {serverError ? (
          <Notice tone="error" title="Could not create the account">
            {serverError}
          </Notice>
        ) : null}

        <Button type="submit" variant="primary" size="block" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-[13px] leading-relaxed text-slate">
          Creating an account does not make you a member. After verifying your email you will be asked to
          submit the membership application for review.
        </p>
      </form>
    </AuthCard>
  );
}
