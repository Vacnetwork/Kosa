import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PHOTOS, type ProjectCard } from "@/content/demo";

/**
 * The projects are the section's material: their names run together as one
 * paragraph at statement size, each with a small inline frame holding that
 * project's photograph. The heading stays a heading.
 */
export function ProjectsChapter({ projects }: { projects: ProjectCard[] }) {
  const years = projects.map((project) => Number(project.year)).filter((year) => !Number.isNaN(year));
  const span = `${Math.min(...years)}–${Math.max(...years)}`;

  return (
    <section aria-labelledby="projects-heading" className="bg-paper px-[var(--margin)] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px]">
        <Reveal>
          <h2 id="projects-heading" className="t-h2 max-w-[24ch] text-navy">
            What the association has built
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <p className="mt-8 text-[clamp(22px,3.2vw,36px)] font-[family-name:var(--font-display)] font-bold leading-[1.25] tracking-tight text-navy">
            {projects.map((project, index) => {
              const photo = PHOTOS[project.photo];
              return (
                <span key={project.slug}>
                  <Link
                    href={`/welfare/#${project.slug}`}
                    className="group inline-flex items-baseline gap-2 underline decoration-transparent decoration-[3px] underline-offset-[5px] transition-colors hover:decoration-gold"
                  >
                    {project.title}
                    {index < 3 ? (
                      <span className="inline-block h-[0.8em] w-[1.2em] translate-y-[0.06em] overflow-hidden bg-navy align-baseline">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.srcSmall}
                          alt=""
                          aria-hidden="true"
                          width={photo.width}
                          height={photo.height}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-125"
                        />
                      </span>
                    ) : null}
                  </Link>
                  {index < projects.length - 1 ? <span className="text-slate/70">, </span> : <span>.</span>}
                </span>
              );
            })}
          </p>
        </Reveal>

        <Reveal delay={140} className="mt-8">
          <p className="max-w-[58ch] text-[15px] leading-relaxed text-slate">
            {projects.length} projects, {span}. Each has a named owner on the executive and a written
            handover, so it outlives the committee that started it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
