import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PHOTOS } from "@/content/demo";
import { Button } from "@/components/ui/button";
import { JOIN_STEPS, KOSA, MEMBERSHIP_CATEGORIES } from "@/lib/brand";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "What KOSA membership gives a member, the four steps from an account to an approved place on the register, what to prepare, and what the member portal opens.",
  alternates: { canonical: "/membership/" },
};

/* The six steps below are the association's own "How to join KOSA" guideline. */
const STEPS = JOIN_STEPS.map((step) => ({ name: step.title, body: step.body }));

const PREPARE = [
  {
    name: "Your graduation year",
    body: "The year you left Kakoma. If you are not certain, say so in the cohort note; the officer checks it during review.",
  },
  {
    name: "Your name as it was at school",
    body: "Names change. The school name is what a classmate or a teacher will recognise when the application is read.",
  },
  {
    name: "An email address you can open",
    body: "The verification link and every decision note go to it. Use one you will still have next term.",
  },
  {
    name: "One short paragraph",
    body: "Why you are applying, in your own words. Forty characters is the minimum; two or three sentences is plenty.",
  },
  {
    name: "A cohort note, if needed",
    body: "The class or stream you were in, or the name of a teacher, if your year is unclear.",
  },
];

const PORTAL = [
  {
    name: "The directory",
    body: "Search members by year, profession or town. You decide whether your own entry is visible to other members.",
  },
  {
    name: "Events and RSVP",
    body: "Published dates, venues and remaining capacity. Reserve a place and it is recorded in your history.",
  },
  {
    name: "Announcements",
    body: "Notices from the executive, the welfare desk and the event managers, in one place.",
  },
  {
    name: "Welfare",
    body: "Submit a request in confidence and follow its status without asking anyone in person.",
  },
  {
    name: "Mentorship",
    body: "Offer your time, or ask for a conversation with a member in the field you are aiming for.",
  },
  {
    name: "Contributions",
    body: "What you have given, to which fund, and the date it was recorded.",
  },
];

export default function MembershipPage() {
  return (
    <>
      <PageHero
        id="membership-title"
        lines={["Membership"]}
        lede="Membership is open to anyone who attended Kakoma, in any year. It takes an account, a verified email address and one application; an officer reads the rest."
        photo={PHOTOS.elephant}
      >
        <Button asChild variant="onDark" size="md">
          <Link href="/register/">Create an account</Link>
        </Button>
      </PageHero>

      <section aria-labelledby="eligibility-heading" className="bg-navy px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-5">
            <h2 id="eligibility-heading" className="t-h2 max-w-[20ch] text-white">
              Who can join
            </h2>
            <p className="mt-4 max-w-[38ch] text-[17px] leading-relaxed text-white/80">
              The association is open beyond former students: staff who taught here and long-term friends of
              the school are members too. Choose your category when you apply.
            </p>
          </Reveal>
          <ul className="md:col-span-7">
            {MEMBERSHIP_CATEGORIES.map((category, index) => (
              <Reveal
                as="li"
                key={category.value}
                delay={index * 60}
                className={`px-5 py-5 ${index % 2 === 0 ? "bg-white/10" : "bg-white/5"}`}
              >
                <p className="font-[family-name:var(--font-display)] text-[19px] font-bold leading-snug text-white">
                  {category.label}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="why-heading" className="t-h1 text-navy">
              Why join
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              {
                name: "Find your year",
                body: "The directory lists members by graduation year. A class that lost touch can find itself again, and a new leaver can see who went before.",
              },
              {
                name: "Carry the school",
                body: "Members fund the bursary and the welfare desk. The register is how the association knows who to ask, and who the fund exists for.",
              },
              {
                name: "Be counted",
                body: "A cohort that is on the register can be reached, invited and represented. An empty year cannot.",
              },
            ].map((item, index) => (
              <Reveal key={item.name} delay={index * 70}>
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="mt-3 max-w-[40ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="steps-heading" className="t-h1 text-navy">
                How to join
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-slate">
                Six steps, in the association&rsquo;s own order: eligibility, the form, the subscription,
                the communication platforms, taking part, and keeping your record current. None of it is
                published to anyone else without your consent.
              </p>
            </Reveal>
          </div>

          <ol className="mt-10 flex flex-col gap-2">
            {STEPS.map((step, index) => (
              <Reveal
                as="li"
                key={step.name}
                delay={index * 60}
                className="grid gap-3 bg-white px-6 py-6 md:grid-cols-[260px_1fr] md:items-baseline md:gap-8 md:px-8 md:py-7"
              >
                <h3 className="t-h3 text-navy">{step.name}</h3>
                <p className="max-w-[58ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="prepare-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <Reveal>
              <h2 id="prepare-heading" className="t-h1 text-navy">
                What to prepare
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-5">
              <p className="max-w-[40ch] text-[17px] leading-relaxed text-slate">
                Five things, none of which needs a document from the school. Gather them before you start and
                the application takes a few minutes.
              </p>
            </Reveal>
            <Reveal delay={140} className="mt-8">
              <Button asChild variant="outline" size="md">
                <Link href="/register/">Start the first step</Link>
              </Button>
            </Reveal>
          </div>

          <ul className="flex flex-col gap-2 md:col-span-7">
            {PREPARE.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 50} className="bg-paper px-6 py-5">
                <h3 className="font-[family-name:var(--font-display)] text-[19px] font-bold leading-snug text-navy">
                  {item.name}
                </h3>
                <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-slate">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="portal-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="portal-heading" className="t-h1 text-white">
                Inside the portal
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-white/85">
                Approval opens six things, all under one account and all closed to anyone who is not a member.
              </p>
            </Reveal>
          </div>

          <ul className="mt-10 grid gap-2 md:grid-cols-3">
            {PORTAL.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 50} className="bg-navy-deep px-6 py-7">
                <h3 className="t-h3 text-gold">{item.name}</h3>
                <p className="mt-3 max-w-[38ch] text-[16px] leading-relaxed text-white/80">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="fees-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-5">
            <h2 id="fees-heading" className="t-h1 text-navy">
              Subscription and payment
            </h2>
            <p className="mt-5 max-w-[38ch] text-[17px] leading-relaxed text-slate">
              {KOSA.payments.note}
            </p>
            <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-slate">
              {KOSA.payments.receiptNote} Pay the association directly — this site collects no money and
              stores no card details.
            </p>
          </Reveal>
          <div className="md:col-span-7">
            <Reveal delay={80} className="bg-white px-6 py-7 md:px-8">
              <h3 className="t-h3 text-navy">Bank transfer</h3>
              <dl className="mt-4 flex flex-col gap-3 text-[16px] leading-relaxed">
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate">Account name</dt>
                  <dd className="font-semibold text-navy">{KOSA.payments.accountName}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate">Account number</dt>
                  <dd className="font-[family-name:var(--font-display)] text-[19px] font-extrabold tracking-tight text-navy">
                    {KOSA.payments.accountNumber}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate">Bank</dt>
                  <dd className="font-semibold text-navy">{KOSA.payments.bank}</dd>
                </div>
              </dl>

              <h3 className="mt-8 t-h3 text-navy">Mobile money</h3>
              <dl className="mt-4 flex flex-col gap-3 text-[16px] leading-relaxed">
                {KOSA.payments.treasurerMobile.map((line) => (
                  <div key={line.network} className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate">{line.network}</dt>
                    <dd className="font-semibold text-navy">{line.number}</dd>
                  </div>
                ))}
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate">Treasurer</dt>
                  <dd className="text-navy">{KOSA.payments.treasurerName}</dd>
                </div>
              </dl>

              <Notice tone="info" className="mt-7" title="Ask for a receipt">
                Send the reference or a photo of the receipt to {KOSA.contact.email} so the treasurer can
                record it against your name in the contribution records.
              </Notice>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="actions-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:items-end md:gap-12">
          <div className="md:col-span-7">
            <Reveal>
              <h2 id="actions-heading" className="t-h1 text-white">
                Two ways in
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-5">
              <p className="max-w-[50ch] text-[18px] leading-relaxed text-white/85">
                Start a new account, or sign in to see where an application has got to and what the officer
                has asked for.
              </p>
            </Reveal>
          </div>
          <Reveal delay={140} className="flex flex-col gap-3 md:col-span-5">
            <Button asChild variant="primary" size="block">
              <Link href="/register/">Create an account</Link>
            </Button>
            <Button asChild variant="onDark" size="block">
              <Link href="/login/">Track my application</Link>
            </Button>
          </Reveal>
        </div>
      </section>
      <PhotoBand
        keys={["skyline", "marketWomen", "market"]}
        caption="Photographs of Gulu and Acholi life from Wikimedia Commons (CC BY-SA 4.0 / CC0). They show the world around KOSA, not the association itself."
      />
    </>
  );
}
