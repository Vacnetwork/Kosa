import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { DEMO_PROJECTS, PHOTOS} from "@/content/demo";

export const metadata: Metadata = {
  title: "Welfare & projects",
  description:
    "The five welfare categories, how to apply through the member portal, how confidentiality works, how every decision is recorded and audited, and the projects members have funded.",
  alternates: { canonical: "/welfare/" },
};

const CATEGORIES = [
  {
    name: "Bereavement",
    body: "A death in the family, and the costs that arrive with it: transport, food, and the funeral itself, often before a household has had time to plan.",
  },
  {
    name: "Medical",
    body: "A hospital bill, a procedure, or medicine that a household cannot meet in the week it is needed.",
  },
  {
    name: "Education",
    body: "Fees, uniforms or examination registration, where a family's income cannot cover them in the term they fall due.",
  },
  {
    name: "Hardship",
    body: "The sudden kind: a fire, a flood, a lost job, a harvest that failed, or a business that closed without warning.",
  },
  {
    name: "Other",
    body: "Anything the other four do not fit. The desk reads it and routes it rather than returning it unread.",
  },
];

const APPLY = [
  {
    name: "Sign in",
    body: "The welfare form lives in the portal, behind your membership. A request is never anonymous to the desk, and it is never visible to anyone else.",
  },
  {
    name: "Choose a category",
    body: "One line on what happened, then the account: what the money is for, what has already been paid, and what the household can carry itself.",
  },
  {
    name: "Say what you need",
    body: "An amount is optional. If you know it, give it; if you do not, the desk works it out with you rather than turning the request away.",
  },
  {
    name: "The desk reviews",
    body: "Requests are read in the order they arrive. Urgent medical cases are flagged so they are seen first, and the member can follow the status without asking anyone in person.",
  },
];

const CONFIDE = [
  {
    name: "Who reads it",
    body: "The welfare desk and the treasurer. Not the directory, not the announcements, and not other members.",
  },
  {
    name: "What is published",
    body: "Totals and categories, never names: how many requests were met, in which month, and from which fund.",
  },
  {
    name: "Where it is held",
    body: "In the member database, readable only through the portal's role permissions. Welfare details are not part of the public register.",
  },
];

const RECORD = [
  {
    name: "A status",
    body: "Submitted, reviewing, approved or declined, and disbursed once the money has moved. The member sees the same status the committee does.",
  },
  {
    name: "A reason",
    body: "Whoever decides writes a note. It is attached to the request and readable by the member, whether the answer was yes or no.",
  },
  {
    name: "A record of who",
    body: "The account that decided it and the date. A decision cannot be made without an account, so it cannot be made anonymously.",
  },
  {
    name: "An audit line",
    body: "Every decision is written to an audit log the executive can read, so a change of committee does not lose the reasoning behind a payment.",
  },
];

export default function WelfarePage() {
  return (
    <>
      <PageHero
        id="welfare-title"
        lines={["Welfare", "& projects"]}
        lede="Two halves of the same work: a member in difficulty can ask for help without explaining it in public, and the association builds things the whole community uses."
        photo={PHOTOS.skyline}
      />

      <section aria-labelledby="cover-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="cover-heading" className="t-h1 text-navy">
                What it covers
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-slate">
                A request is filed under one of five headings. The heading decides what the desk asks first,
                not whether the request is heard.
              </p>
            </Reveal>
          </div>

          <ul className="mt-10 flex flex-col gap-2">
            {CATEGORIES.map((item, index) => (
              <Reveal
                as="li"
                key={item.name}
                delay={index * 50}
                className="grid gap-2 bg-paper px-6 py-5 md:grid-cols-[220px_1fr] md:items-baseline md:gap-8 md:px-8"
              >
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="max-w-[58ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="apply-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="apply-heading" className="t-h1 text-navy">
                How to apply
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-navy">
                A request is four short moves, all inside the member portal. No form is downloaded, and no
                letter has to be delivered by hand.
              </p>
            </Reveal>
          </div>

          <ol className="mt-10 flex flex-col gap-2">
            {APPLY.map((item, index) => (
              <Reveal
                as="li"
                key={item.name}
                delay={index * 60}
                className="grid gap-2 bg-white px-6 py-6 md:grid-cols-[220px_1fr] md:items-baseline md:gap-8 md:px-8"
              >
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="max-w-[58ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={100} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild variant="ink" size="lg" className="w-full sm:w-auto">
              <Link href="/login/">Sign in to apply</Link>
            </Button>
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-slate">
              The welfare desk opens with an approved membership.{" "}
              <Link
                href="/membership/"
                className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
              >
                See the four steps
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="confide-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="confide-heading" className="t-h1 text-white">
                Confidentiality
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-white/85">
                Asking for help is not a public act. Nothing about a welfare request is published to the
                membership, and a member does not have to explain their circumstances to a committee in
                person.
              </p>
            </Reveal>
          </div>

          <ul className="mt-10 grid gap-2 md:grid-cols-3">
            {CONFIDE.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 60} className="bg-navy-deep px-6 py-6">
                <h3 className="t-h3 text-gold">{item.name}</h3>
                <p className="mt-3 max-w-[38ch] text-[16px] leading-relaxed text-white/80">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="record-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="record-heading" className="t-h1 text-navy">
                How it is recorded
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-slate">
                A decision is not a telephone call. Every one leaves four marks, so the fund can be explained
                a year later to someone who was not in the room.
              </p>
            </Reveal>
          </div>

          <ul className="mt-10 grid gap-2 md:grid-cols-2">
            {RECORD.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 60} className="bg-paper px-6 py-6">
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="projects-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="projects-heading" className="t-h1 text-navy">
                Projects
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[17px] leading-relaxed text-slate">
                Works the members agreed to fund together, each with a status and a year. The entries below come
                from the demo project record and stand in for the association&rsquo;s own list.
              </p>
              <DemoTag className="mt-5" label="Demo projects" />
            </Reveal>
          </div>

          <ul className="mt-10 grid gap-2 md:grid-cols-2">
            {DEMO_PROJECTS.map((project, index) => (
              <Reveal
                as="li"
                key={project.slug}
                delay={index * 50}
                className="scroll-mt-24 bg-white px-6 py-7"
              >
                <article id={project.slug} className="scroll-mt-24">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="t-h2 max-w-[20ch] text-navy">{project.title}</h3>
                    <p className="text-[15px] text-slate">
                      {project.status} · {project.year}
                    </p>
                  </div>
                  <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                    {project.summary}
                  </p>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="talk-heading" className="bg-navy px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-6 md:grid-cols-12 md:items-center md:gap-12">
          <div className="md:col-span-8">
            <Reveal>
              <h2 id="talk-heading" className="t-h2 text-white">
                Talk to the desk
              </h2>
            </Reveal>
            <Reveal delay={60} className="mt-3">
              <p className="max-w-[54ch] text-[17px] leading-relaxed text-white/80">
                If you are not sure which category fits, or whether a case is one the fund can meet, ask before
                you file. A question costs nothing.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-4 md:justify-self-end">
            <Button asChild variant="onDark" size="lg" className="w-full sm:w-auto">
              <Link href="/contact/">Ask a question</Link>
            </Button>
          </Reveal>
        </div>
      </section>
      <PhotoBand
        keys={["dancers", "market", "marketWomen"]}
        caption="Photographs of Gulu and Acholi life from Wikimedia Commons (CC BY-SA 4.0 / CC0). They show the world around KOSA, not the association itself."
      />
    </>
  );
}
