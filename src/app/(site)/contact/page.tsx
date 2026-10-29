import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Write to the KOSA secretariat, and see how membership applications, welfare requests and event bookings are each handled through the member portal.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        id="contact-title"
        lines={["Contact"]}
        lede="The association's official address and telephone number are not published in this build. Messages written here are held for the secretariat, which reads them in the portal."
      />

      <section aria-labelledby="write-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <Reveal>
              <h2 id="write-heading" className="t-h1 text-navy">
                Write to the desk
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-4">
              <p className="max-w-[52ch] text-[17px] leading-relaxed text-slate md:text-[18px]">
                Use this form for anything that is not an application, a welfare request or an RSVP. Those
                three have their own route through the portal, explained below.
              </p>
            </Reveal>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside className="md:col-span-5">
            <Reveal delay={120} className="flex flex-col gap-2">
              <div className="bg-paper px-6 py-6">
                <h3 className="t-h3 text-navy">Where messages go</h3>
                <p className="mt-2 max-w-[40ch] text-[16px] leading-relaxed text-slate">
                  A message is stored for the secretariat rather than sent to a mailbox, so it survives a
                  change of officer and can be answered by whoever holds the role.
                </p>
              </div>
              <div className="bg-paper px-6 py-6">
                <h3 className="t-h3 text-navy">What to say</h3>
                <p className="mt-2 max-w-[40ch] text-[16px] leading-relaxed text-slate">
                  Your graduation year if you are a member, and which desk you need: membership, welfare,
                  events or projects. It saves a round of questions.
                </p>
              </div>
              <div className="bg-navy px-6 py-6">
                <p className="max-w-[38ch] text-[17px] leading-relaxed text-white/85">
                  No address or telephone number is invented anywhere on this site. Until the association
                  supplies one, the form is the only route in.
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <section aria-labelledby="applications-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-4">
            <h2 id="applications-heading" className="t-h2 text-navy">
              Applications
            </h2>
          </Reveal>
          <div className="md:col-span-8">
            <Reveal delay={60}>
              <p className="max-w-[58ch] text-[18px] leading-relaxed text-navy md:text-[19px]">
                An application is not made by email. Create an account, verify the address, then submit the
                form with your full name, your graduation year and a short paragraph.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-4">
              <p className="max-w-[58ch] text-[17px] leading-relaxed text-slate">
                The membership officer reads it and the decision, with its note, appears in your portal. If
                something is missing the application comes back for more information rather than being
                declined.
              </p>
            </Reveal>
            <Reveal delay={160} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="ink" size="md" className="w-full sm:w-auto">
                <Link href="/membership/">See the four steps</Link>
              </Button>
              <Link
                href="/login/"
                className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[16px] font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
              >
                Track my application
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="welfare-contact-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-4">
            <h2 id="welfare-contact-heading" className="t-h2 text-white">
              Welfare
            </h2>
          </Reveal>
          <div className="md:col-span-8">
            <Reveal delay={60}>
              <p className="max-w-[58ch] text-[18px] leading-relaxed text-white/85 md:text-[19px]">
                A welfare request is filed in the portal, never by letter, so that it stays confidential and a
                decision can be traced back to a date and an officer.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-4">
              <p className="max-w-[58ch] text-[17px] leading-relaxed text-white/75">
                If you are unsure whether a case fits, write here first and the secretariat routes the
                question to the welfare desk. A question is not a request.
              </p>
            </Reveal>
            <Reveal delay={160} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="onDark" size="md" className="w-full sm:w-auto">
                <Link href="/welfare/">How welfare works</Link>
              </Button>
              <Link
                href="/login/"
                className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[16px] font-bold text-white underline decoration-gold decoration-2 underline-offset-4"
              >
                Sign in to apply
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="events-contact-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-4">
            <h2 id="events-contact-heading" className="t-h2 text-navy">
              Events
            </h2>
          </Reveal>
          <div className="md:col-span-8">
            <Reveal delay={60}>
              <p className="max-w-[58ch] text-[18px] leading-relaxed text-navy md:text-[19px]">
                Dates, venues and capacities are published on the events page by the event managers. A place
                is reserved from the event page once you are signed in.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-4">
              <p className="max-w-[58ch] text-[17px] leading-relaxed text-slate">
                Bringing a group, or need a date moved? Write here and say so; the secretariat passes the
                message to the event managers, who keep the RSVP list.
              </p>
            </Reveal>
            <Reveal delay={160} className="mt-6">
              <Button asChild variant="ink" size="md" className="w-full sm:w-auto">
                <Link href="/events/">See what is on</Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
