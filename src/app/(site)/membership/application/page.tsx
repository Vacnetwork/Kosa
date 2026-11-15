import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Crest } from "@/components/brand/crest";
import { PrintFormButton } from "@/components/site/print-form-button";
import { Button } from "@/components/ui/button";
import {
  COMMUNICATION_OPTIONS,
  HEARD_ABOUT_OPTIONS,
  KOSA,
  PAPER_APPLICATION_EMAIL,
} from "@/lib/brand";

/**
 * The form's own wording, kept apart from the site's house style on purpose:
 * this page reproduces the printed sheet, and the sheet says "Programs",
 * "Kakoma Secondary School" and "Associate/Friend". The online application
 * (which is the association's live data entry) uses the site's spelling from
 * `@/lib/brand`; this list must not drift from the paper.
 */
const FLYER_CATEGORIES = [
  "Former Student",
  "Former Staff",
  "Associate/Friend of Kakoma Secondary School",
  "Other (please specify)",
];

const FLYER_INTERESTS = [
  "Welfare Programs",
  "Mentorship",
  "School Development Initiatives",
  "Fundraising",
  "Investment Programs",
  "Events & Reunions",
  "Other (please specify)",
];

export const metadata: Metadata = {
  title: "Membership application form",
  description:
    "The KOSA membership application form, printable, as the association issues it: personal details, membership category, how you heard about KOSA, areas of interest, communication preferences, next of kin and beneficiary, the declaration and the payment details.",
  alternates: { canonical: "/membership/application/" },
};

/**
 * The association's paper application form, reproduced as a page you can print.
 *
 * It is deliberately a document, not a second web form: the portal's own
 * application (`/portal/application/`) is the path that creates an account, and
 * this page exists so the committee can print the same sheet it has always
 * handed out, for a reunion, a funeral, a WhatsApp group, and so a member
 * without an email address is not shut out of joining.
 *
 * Every field, option, box and line of the printed form is here in its order.
 * The print stylesheet strips the site's chrome and lays the sheet out on A4.
 */
export default function ApplicationFormPage() {
  return (
    <>
      <div className="no-print bg-paper px-[var(--margin)] pb-6 pt-10">
        <div className="mx-auto flex w-full max-w-[900px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-slate">Membership</p>
            <h1 className="mt-2 t-h2 text-navy">The printed application form</h1>
            <p className="mt-3 max-w-[58ch] text-[16px] leading-relaxed text-slate">
              This is the association&rsquo;s own form, word for word. Print it, complete it in block letters and
              return it with proof of payment. Applying online is faster: the same questions, and the officer
              receives it immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrintFormButton />
            <Button asChild variant="primary" size="md">
              <Link href="/register/">Apply online instead</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-paper px-[var(--margin)] pb-16 print:bg-white print:p-0">
        <article className="print-sheet mx-auto w-full max-w-[900px] bg-white px-8 py-10  md:px-12 md:py-14 print:max-w-none print:px-0 print:py-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-navy pb-6">
            <div className="flex items-center gap-4">
              <Crest className="h-20 w-auto md:h-24" />
              <div>
                <p className="font-[family-name:var(--font-display)] text-[13px] font-bold text-gold">
                  Kakoma Old Students&rsquo; Association
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-extrabold leading-none tracking-tight text-navy md:text-[32px]">
                  KOSA
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-slate">
                  {KOSA.motto}
                  <br />
                  {KOSA.tagline}
                </p>
              </div>
            </div>
            <div className="text-[13px] leading-relaxed text-navy">
              <p>{KOSA.contact.phone}</p>
              <p>{PAPER_APPLICATION_EMAIL}</p>
              <p className="max-w-[26ch]">{KOSA.contact.postal}</p>
            </div>
          </div>

          <div className="mt-6 bg-navy px-4 py-3 text-center">
            <p className="font-[family-name:var(--font-display)] text-[17px] font-extrabold text-white">
              Membership application form
            </p>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-navy">
            Welcome to the Kakoma Old Students Association (KOSA). Please complete this form in{" "}
            <strong>block letters</strong> and submit it along with your membership fee.
          </p>

          <Section number={1} title="Personal information">
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2" />
              <Ticks label="Gender" options={["Male", "Female"]} />
              <Field label="Date of birth" />
              <Field label="Year of completion / service" />
              <Field label="Student / staff number (if any)" />
              <Field label="National ID / passport no." />
              <Field label="Occupation / profession" />
              <Field label="Organization / company" />
              <Field label="Postal address" />
              <Field label="District" />
              <Field label="Country" />
              <Field label="Phone" />
              <Field label="Email" />
            </div>
          </Section>

          <Section number={2} title="Membership category" hint="Tick one">
            <ul className="grid gap-2 sm:grid-cols-2">
              {FLYER_CATEGORIES.map((category) => (
                <Tick key={category} label={category} />
              ))}
            </ul>
          </Section>

          <Section number={3} title="How did you hear about KOSA?">
            <ul className="grid gap-2 sm:grid-cols-2">
              {HEARD_ABOUT_OPTIONS.map((option) => (
                <Tick key={option} label={option} />
              ))}
            </ul>
          </Section>

          <Section number={4} title="Areas of interest" hint="Tick all that apply">
            <ul className="grid gap-2 sm:grid-cols-2">
              {FLYER_INTERESTS.map((area) => (
                <Tick key={area} label={area} />
              ))}
            </ul>
          </Section>

          <Section number={5} title="Communication preferences">
            <p className="text-[15px] text-navy">I would like to receive updates via:</p>
            <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
              {COMMUNICATION_OPTIONS.map((option) => (
                <Tick key={option.value} label={option.label} />
              ))}
            </ul>
          </Section>

          <Section number={6} title="Next of kin & beneficiary information">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                  Next of kin
                  <span className="mt-0.5 block text-[13px] font-medium text-slate">
                    Person to contact in case of emergency
                  </span>
                </h3>
                <div className="mt-3 grid gap-4">
                  <Field label="Full name" />
                  <Field label="Relationship" />
                  <Field label="Phone" />
                  <Field label="Email (if any)" />
                  <Field label="Address" />
                </div>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy">
                  Beneficiary
                  <span className="mt-0.5 block text-[13px] font-medium text-slate">
                    In the event of death, membership benefits to be given to Mother, Father, Wife, Husband,
                    Biological Child or Guardian
                  </span>
                </h3>
                <div className="mt-3 grid gap-4">
                  <Field label="Full name" />
                  <Field label="Relationship" />
                  <Field label="Phone" />
                  <Field label="Email (if any)" />
                  <Field label="Address" />
                </div>
              </div>
            </div>
          </Section>

          <Section number={7} title="Declaration">
            <p className="text-[15px] leading-relaxed text-navy">
              I hereby apply for membership in Kakoma Old Students Association (KOSA). I agree to abide by the
              Constitution, objectives and decisions of the Association.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field label="Signature" />
              <Field label="Date" />
            </div>
          </Section>

          <div className="mt-8 border-2 border-navy">
            <p className="bg-navy px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-white">
              Payment information
            </p>
            <div className="grid gap-6 px-4 py-4 sm:grid-cols-2">
              <p className="text-[14px] leading-relaxed text-navy">
                KOSA charges a non-refundable membership and annual subscription fee to support administrative
                and event costs. Details are provided in the Constitution.
              </p>
              <dl className="grid gap-1 text-[14px] leading-relaxed">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate">Account name:</dt>
                  <dd className="font-semibold text-navy">{KOSA.payments.accountName}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate">Account number:</dt>
                  <dd className="font-mono font-semibold text-navy">{KOSA.payments.accountNumber}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate">Bank:</dt>
                  <dd className="font-semibold text-navy">{KOSA.payments.bank}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate">Treasurer:</dt>
                  <dd className="text-navy">
                    {KOSA.payments.treasurerMobile.map((line) => `${line.network} ${line.number}`).join(" / ")}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-slate">Name:</dt>
                  <dd className="text-navy">{KOSA.payments.treasurerName}</dd>
                </div>
              </dl>
            </div>
            <p className="border-t border-navy/30 px-4 py-3 text-center text-[14px] font-semibold text-navy">
              Upon payment you should be provided with a receipt to confirm your payment.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6 border-t-2 border-navy pt-5">
            <div className="text-[13px] leading-relaxed text-navy">
              <p className="font-[family-name:var(--font-display)] text-[14px] font-bold">
                Submit the completed form and proof of payment to:
              </p>
              <p>KOSA, {KOSA.contact.postal}</p>
              <p>{PAPER_APPLICATION_EMAIL}</p>
              <p className="mt-2">
                Or apply online at kosa-website.pages.dev/register, the same questions, read by the
                membership officer straight away.
              </p>
            </div>
            <div className="flex items-end gap-4">
              <div className="text-right">
                <p className="font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                  Thank you for joining
                </p>
                <p className="font-[family-name:var(--font-display)] text-[14px] font-bold text-navy">
                  a lifelong community.
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-[13px] font-bold text-gold">
                  {KOSA.tagline}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/kosa-join-qr.svg"
                alt="QR code that opens the KOSA membership page"
                width={96}
                height={96}
                className="h-24 w-24"
              />
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="form-section mt-7 border-t border-paper-dim pt-5">
      <h3 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-[16px] font-extrabold text-navy">
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center bg-navy text-[13px] text-white">
          {number}
        </span>
        {title}
        {hint ? (
          <span className="text-[12px] font-semibold normal-case tracking-normal text-slate">({hint})</span>
        ) : null}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** A labelled rule to write on, as the printed form has. */
function Field({ label, className }: { label: string; className?: string }) {
  return (
    <div className={className}>
      <span className="block text-[12px] font-semibold text-slate">{label}:</span>
      <span aria-hidden="true" className="mt-1 block h-6 border-b border-navy/45" />
    </div>
  );
}

/** A printed tick box with its label. */
function Tick({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2 text-[14px] leading-snug text-navy">
      <span aria-hidden="true" className="mt-[3px] block h-3.5 w-3.5 shrink-0 border border-navy" />
      <span>{label}</span>
    </li>
  );
}

function Ticks({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <span className="block text-[12px] font-semibold text-slate">{label}:</span>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {options.map((option) => (
          <Tick key={option} label={option} />
        ))}
      </ul>
    </div>
  );
}
