import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PhotoFigure } from "@/components/site/photo-figure";
import { Button } from "@/components/ui/button";
import { DemoTag } from "@/components/ui/demo-tag";
import { DEMO_PROJECTS, PHOTOS } from "@/content/demo";
import { KOSA, OBJECTIVES } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who KOSA is for, what the association does with the register, the welfare desk, the bursary fund, projects and mentorship, and how it is governed.",
  alternates: { canonical: "/about/" },
};

const ROLES = [
  {
    name: "The executive",
    body: "Elected by the members. It sets the year's priorities, agrees how the welfare fund and the bursary fund are divided, and answers for both at the annual meeting.",
  },
  {
    name: "The membership officer",
    body: "Reads every application, checks the graduation year against the year record, and approves, returns or declines it with a note the applicant can read.",
  },
  {
    name: "The event managers",
    body: "Publish dates, venues and capacities, keep the RSVP lists, and close registration when a room is full rather than turning people away at the door.",
  },
  {
    name: "The treasurer",
    body: "Records each contribution against the member who made it and holds the fund's statements for the annual report.",
  },
];

const WORK = [
  {
    name: "The register",
    body: "A verified list of old students by graduation year. It lets a class find itself, and it lets the executive reach a year without a chain of phone calls.",
  },
  {
    name: "Welfare",
    body: "A member facing bereavement, a medical bill or sudden hardship applies to the welfare desk. Requests are confidential and every decision carries a written note.",
  },
  {
    name: "Bursaries",
    body: "Termly support for students whose families cannot meet the cost: fees, uniforms and examination registration, agreed by the committee each term.",
  },
  {
    name: "Projects",
    body: "Works the members agree to fund together, such as the ICT room and the market drainage, each with a named owner and a written handover.",
  },
  {
    name: "Mentorship",
    body: "Senior members volunteer their time for clinics and one-to-one conversations about courses, interviews and first jobs.",
  },
];

const TIMELINE = [...DEMO_PROJECTS].sort((a, b) => Number(a.year) - Number(b.year));

export default function AboutPage() {
  const photo = PHOTOS.classroom;

  return (
    <>
      <PageHero
        id="about-title"
        lines={["About", "KOSA"]}
        lede={`${KOSA.name} is the alumni body of ${KOSA.school}, Rakai District: one register, one welfare desk, and one fund for the students who come after us.`}
        photo={PHOTOS.gathering}
      />

      <section aria-labelledby="who-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-6">
            <Reveal>
              <h2 id="who-heading" className="t-h1 text-navy">
                Who it is for
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-6">
              <p className="max-w-[52ch] text-[18px] leading-relaxed text-slate md:text-[19px]">
                If you sat in a Kakoma classroom, this register is yours. It does not ask which year you
                left in, which stream you were in, or whether anyone from your class is still in touch with
                you. It asks for one thing: the year you finished, so your year can find you.
              </p>
            </Reveal>
            <Reveal delay={140} className="mt-6">
              <p className="max-w-[52ch] text-[17px] leading-relaxed text-slate">
                Membership is not a reward for a career. A member who left last year and a member who left
                fifty years ago hold the same place on the register, and the same right to ask the welfare
                desk for help.
              </p>
            </Reveal>
          </div>

          <ul className="flex flex-col gap-2 md:col-span-6">
            {[
              {
                name: "Every year group",
                body: "From the earliest year on the register to the class that left last year, each graduation year gathers in one place.",
              },
              {
                name: "Every trade and every town",
                body: "The register records the year, not the rank. Wherever a member has ended up, the year is the thing that is shared.",
              },
              {
                name: "The students still there",
                body: "The welfare desk and the bursary fund exist for the families and students behind every year, whether or not they have a member in their own house.",
              },
            ].map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 70} className="bg-paper px-6 py-6">
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="place-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-7">
            <PhotoFigure photo={photo} tone="dark" aspect="photo" />
          </Reveal>
          <div className="md:col-span-5 md:pt-4">
            <Reveal delay={80}>
              <h2 id="place-heading" className="t-h1 max-w-[16ch] text-white">
                The pictures
              </h2>
            </Reveal>
            <Reveal delay={140} className="mt-6">
              <p className="max-w-[44ch] text-[18px] leading-relaxed text-white/85">
                KOSA has not supplied photographs of its own yet. Until it does, these pages use images
                generated with AI for this build, labelled as illustrations wherever they appear.
              </p>
            </Reveal>
            <Reveal delay={200} className="mt-5">
              <p className="max-w-[44ch] text-[17px] leading-relaxed text-white/80">
                None of them is presented as a KOSA event or as a real photograph. When the association
                sends its own pictures, they replace these — the labelling is driven by the data, so
                swapping the files and their credits is all it takes.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="motto-heading" className="bg-gold px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-4">
            <h2 id="motto-heading" className="t-h2 text-navy">
              Our motto
            </h2>
          </Reveal>
          <div className="md:col-span-8">
            <Reveal delay={80}>
              <p className="max-w-[26ch] text-[clamp(24px,3.2vw,36px)] font-[family-name:var(--font-display)] font-extrabold leading-[1.15] tracking-tight text-navy">
                {KOSA.motto}
              </p>
            </Reveal>
            <Reveal delay={140} className="mt-6">
              <p className="max-w-[58ch] text-[17px] leading-relaxed text-navy/85">
                The past is the part we already share: the same classrooms, the same teachers, the same walk
                in. The future is the part that needs organising, which is what the register, the welfare
                desk and the bursary fund are for.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="purpose-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-6">
              <h2 id="purpose-heading" className="t-h1 max-w-[14ch] text-navy">
                Vision and mission
              </h2>
            </Reveal>
            <div className="md:col-span-6">
              <Reveal delay={60}>
                <h3 className="t-h3 text-slate">Vision</h3>
                <p className="mt-2 max-w-[46ch] text-[18px] leading-relaxed text-navy">{KOSA.vision}</p>
              </Reveal>
              <Reveal delay={110} className="mt-8">
                <h3 className="t-h3 text-slate">Mission</h3>
                <p className="mt-2 max-w-[46ch] text-[18px] leading-relaxed text-navy">{KOSA.mission}</p>
              </Reveal>
            </div>
          </div>

          <Reveal delay={60} className="mt-14">
            <h3 className="t-h2 text-navy">Core values</h3>
          </Reveal>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {KOSA.coreValues.map((value, index) => (
              <Reveal as="li" key={value.name} delay={index * 50} className="bg-paper px-5 py-5">
                <p className="font-[family-name:var(--font-display)] text-[19px] font-bold text-navy">{value.name}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{value.note}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="objectives-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-4">
              <h2 id="objectives-heading" className="t-h1 max-w-[12ch] text-navy">
                Our objectives
              </h2>
              <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-slate">
                As published by the association — the ten things KOSA exists to do, from welfare and
                mentorship to governance and the school&rsquo;s own development.
              </p>
            </Reveal>
            <ol className="md:col-span-8">
              {OBJECTIVES.map((objective, index) => (
                <Reveal
                  as="li"
                  key={objective}
                  delay={index * 30}
                  className={`px-5 py-4 text-[16px] leading-relaxed text-navy md:text-[17px] ${
                    index % 2 === 0 ? "bg-white" : "bg-paper"
                  }`}
                >
                  {objective}
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="work-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <Reveal>
            <h2 id="work-heading" className="t-h1 text-navy">
              What it does
            </h2>
            <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-slate md:text-[18px]">
              Five strands, all of them run from the same register. Each is administered in the member
              portal, so nothing depends on who happens to be at the end of a telephone.
            </p>
          </Reveal>

          <ul className="mt-10 grid gap-2 md:grid-cols-2">
            {WORK.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 60} className="bg-white px-6 py-6">
                <h3 className="t-h3 text-navy">{item.name}</h3>
                <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-slate md:text-[17px]">
                  {item.body}
                </p>
              </Reveal>
            ))}
            <Reveal as="li" delay={320} className="flex flex-col justify-between bg-navy px-6 py-6">
              <p className="max-w-[34ch] text-[19px] font-[family-name:var(--font-display)] font-bold leading-snug text-white">
                One account holds all five.
              </p>
              <Link
                href="/membership/"
                className="mt-6 inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[16px] font-bold text-gold underline decoration-2 underline-offset-4"
              >
                See what membership opens
              </Link>
            </Reveal>
          </ul>
        </div>
      </section>

      <section aria-labelledby="governance-heading" className="bg-navy px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="governance-heading" className="t-h1 text-white">
                How it is run
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[18px] leading-relaxed text-white/85">
                Four roles do the work between meetings. Who holds them changes; what each one is responsible
                for does not.
              </p>
            </Reveal>
          </div>

          <ul className="mt-10 grid gap-2 md:grid-cols-2">
            {ROLES.map((role, index) => (
              <Reveal as="li" key={role.name} delay={index * 60} className="bg-navy-deep px-6 py-7">
                <h3 className="t-h3 text-gold">{role.name}</h3>
                <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-white/80 md:text-[17px]">
                  {role.body}
                </p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120} className="mt-8">
            <p className="max-w-[62ch] text-[16px] leading-relaxed text-white/70">
              No names appear on this page. Committee members are real people, chosen by the association&rsquo;s
              own process, and this build does not invent them. Applications, welfare decisions,
              contributions and changes of role are written to an audit log the executive can read.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="history-heading" className="bg-white px-[var(--margin)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-5">
              <h2 id="history-heading" className="t-h1 text-navy">
                A short history
              </h2>
            </Reveal>
            <Reveal delay={80} className="md:col-span-7">
              <p className="max-w-[54ch] text-[17px] leading-relaxed text-slate">
                The association has not published its own minutes to this build. The milestones below are
                taken from the demo project record, in the order the projects appear there, and they stand in
                for a history that only the association can write.
              </p>
            </Reveal>
          </div>

          <ol className="mt-10 flex flex-col gap-2">
            {TIMELINE.map((project, index) => (
              <Reveal
                as="li"
                key={project.slug}
                delay={index * 50}
                className={`grid gap-3 px-5 py-6 md:grid-cols-[140px_1fr] md:items-baseline md:gap-8 md:px-8 ${
                  index % 2 === 0 ? "bg-paper" : "bg-white"
                }`}
              >
                <p className="font-[family-name:var(--font-display)] text-[28px] font-extrabold leading-none tracking-tight text-navy">
                  {project.year}
                </p>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="t-h3 text-navy">{project.title}</h3>
                    <p className="text-[14px] text-slate">{project.status}</p>
                  </div>
                  <p className="mt-2 max-w-[58ch] text-[16px] leading-relaxed text-slate">{project.summary}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <DemoTag className="mt-6" label="Demo timeline" />
        </div>
      </section>

      <section aria-labelledby="join-heading" className="bg-navy px-[var(--margin)] py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 md:grid-cols-12 md:items-end md:gap-12">
          <Reveal className="md:col-span-7">
            <h2 id="join-heading" className="t-h1 text-white">
              Take your place
            </h2>
            <p className="mt-4 max-w-[52ch] text-[18px] leading-relaxed text-white/85">
              Membership is open to anyone who attended Kakoma. It takes an account, a verified email address
              and one application.
            </p>
          </Reveal>
          <Reveal delay={80} className="flex flex-col gap-3 sm:flex-row md:col-span-5 md:justify-end">
            <Button asChild variant="onDark" size="lg" className="w-full sm:w-auto">
              <Link href="/membership/">Start an application</Link>
            </Button>
            <Link
              href="/contact/"
              className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-[17px] font-bold text-white underline decoration-gold decoration-2 underline-offset-4"
            >
              Ask a question
            </Link>
          </Reveal>
        </div>
      </section>
      <PhotoBand
        keys={["compound", "market", "alumni"]}
        caption="AI-generated illustrations, not photographs: no photograph of the school or its members was supplied, so these stand in and must be replaced with the association's own pictures."
      />
    </>
  );
}
