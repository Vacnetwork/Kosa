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
import { signIn } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { signInSchema, type SignInInput } from "@/lib/validation";

/** Internal paths only — an open redirect is not worth the convenience. */
function safeNext(raw: string | null): string {
  if (!raw) return "/portal/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/portal/";
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const { backendConfigured, session, loading } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    setServerError(null);
    try {
      await signIn(values);
      toast.success("Signed in");
      router.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in.";
      setServerError(
        /invalid login credentials/i.test(message)
          ? "That email and password do not match an account. Check both and try again. If you have just registered, verify your email first."
          : message,
      );
    }
  }

  return (
    <AuthCard
      title="Sign in"
      lede="Your account holds your membership record, directory listing and requests. Access to member areas depends on your membership status."
      footer={
        <div className="flex flex-col gap-2">
          <span>
            New here?{" "}
            <Link href="/register/" className="text-navy underline decoration-2 underline-offset-4">
              Create an account
            </Link>
            .
          </span>
          <span>
            Cannot sign in?{" "}
            <Link
              href="/forgot-password/"
              className="text-navy underline decoration-2 underline-offset-4"
            >
              Reset your password
            </Link>
            .
          </span>
        </div>
      }
    >
      {!backendConfigured ? (
        <Notice tone="warning" title="Sign-in is not available in this build" className="mb-5">
          No Supabase backend is configured, so there is nothing to authenticate against. Set
          <code className="mx-1 bg-paper px-1 text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code>
          and
          <code className="mx-1 bg-paper px-1 text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          at build time to enable it.
        </Notice>
      ) : null}

      {!loading && session ? (
        <Notice tone="success" title="You are already signed in" className="mb-5">
          This browser has an active session for {session.user.email}. Continue to the{" "}
          <Link href="/portal/" className="underline decoration-2 underline-offset-4">
            member portal
          </Link>
          , or sign in below with another account.
        </Notice>
      ) : null}

      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Field id="email" label="Email address" required error={errors.email?.message}>
          {(props) => (
            <Input {...props} {...register("email")} type="email" autoComplete="email" inputMode="email" />
          )}
        </Field>

        <Field id="password" label="Password" required error={errors.password?.message}>
          {(props) => (
            <Input {...props} {...register("password")} type="password" autoComplete="current-password" />
          )}
        </Field>

        <Turnstile className="flex flex-col gap-2" />

        {serverError ? (
          <Notice tone="error" title="Could not sign in">
            {serverError}
          </Notice>
        ) : null}

        <Button type="submit" variant="primary" size="block" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-[13px] leading-relaxed text-slate">
          Signing in happens directly in your browser. Access to each record is enforced by the database,
          not by this page. If you arrived from a members-only page, you will be returned to it.
        </p>
      </form>
    </AuthCard>
  );
}
