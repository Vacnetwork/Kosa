"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ApiError, sendContactMessage } from "@/lib/api";
import { contactSchema, type ContactInput } from "@/lib/validation";

const SECRETARIAT_ADDRESS = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";

/**
 * The site's only general-purpose form. It writes through the api layer, so the
 * same code path works against Supabase once the project is configured; while
 * no backend exists, the message is handed to the visitor's own mail app and
 * the page says plainly that no secretariat address is published yet.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<{ subject: string; body: string } | null>(null);

  async function onSubmit(values: ContactInput) {
    setError(null);
    setFallback(null);
    try {
      await sendContactMessage(values);
      setSent(true);
      reset();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "The message could not be sent. Try again in a moment.",
      );
      if (err instanceof ApiError && /not configured|no backend/i.test(err.message)) {
        setFallback({
          subject: values.subject,
          body: `${values.message}\n\n${values.name}\n${values.email}`,
        });
      }
    }
  }

  const mailtoHref = fallback
    ? `mailto:${SECRETARIAT_ADDRESS}?subject=${encodeURIComponent(fallback.subject)}&body=${encodeURIComponent(fallback.body)}`
    : "#";

  return (
    <div aria-live="polite">
      {sent ? (
        <Notice tone="success" title="Your message is on its way" className="mb-8">
          The secretariat reads messages in the portal. If you asked for a reply, it will come to the
          address you gave.
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="The message was not sent" className="mb-8">
          <p>{error}</p>
          {fallback ? (
            <div className="mt-3">
              <a
                href={mailtoHref}
                className="font-semibold underline decoration-2 underline-offset-4"
              >
                Open this message in your email app
              </a>
              <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed">
                {SECRETARIAT_ADDRESS
                  ? "The link fills in the subject and the text you wrote; send it from your own address."
                  : "The association has not supplied a secretariat address for this build, so the link opens without a recipient. That address must be configured before this form goes live."}
              </p>
            </div>
          ) : null}
        </Notice>
      ) : null}

      <form method="post" noValidate onSubmit={handleSubmit(onSubmit)} className="flex max-w-[640px] flex-col gap-6">
        <Field id="contact-name" label="Your name" required error={errors.name?.message}>
          {(field) => <Input {...field} {...register("name")} autoComplete="name" />}
        </Field>

        <Field
          id="contact-email"
          label="Email address"
          required
          error={errors.email?.message}
          hint="Replies go here, so use an address you can open."
        >
          {(field) => <Input {...field} {...register("email")} type="email" autoComplete="email" />}
        </Field>

        <Field id="contact-subject" label="Subject" required error={errors.subject?.message}>
          {(field) => <Input {...field} {...register("subject")} />}
        </Field>

        <Field
          id="contact-message"
          label="Message"
          required
          error={errors.message?.message}
          hint="If you are a member, add your graduation year; it helps the desk find your record."
        >
          {(field) => <Textarea {...field} {...register("message")} rows={9} />}
        </Field>

        <Turnstile />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
          <p className="text-[14px] leading-relaxed text-slate">
            Your name, address and message are kept for the secretariat only.
          </p>
        </div>
      </form>
    </div>
  );
}
