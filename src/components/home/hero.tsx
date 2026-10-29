import Link from "next/link";
import { KOSA } from "@/lib/brand";

/**
 * The hero: two flat fields meeting at a hard seam, and one headline that
 * crosses it — navy above the waterline, gold below. Built from two identical
 * copies of the headline, the lower one clipped to the navy field and hidden
 * from assistive technology, so the letterforms split exactly at the seam at
 * every width. The navigation above carries the mark and the one action.
 */
export function Hero() {
  const centre = "flex flex-col items-center justify-center text-center";

  const headline = (tone: "top" | "bottom") => {
    const Tag = tone === "top" ? "h1" : "p";
    return (
      <Tag
        id={tone === "top" ? "hero-title" : undefined}
        aria-hidden={tone === "bottom" ? "true" : undefined}
        className={`t-display uppercase ${tone === "top" ? "text-navy" : "text-gold"}`}
      >
        <span className="line-mask">
          <span style={{ animationDelay: "80ms" }}>United by</span>
        </span>
        <span className="line-mask">
          <span style={{ animationDelay: "190ms" }}>our past</span>
        </span>
      </Tag>
    );
  };

  return (
    <section aria-labelledby="hero-title" className="relative isolate h-[86svh] min-h-[520px] w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[54%] bg-paper md:h-1/2" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-navy md:h-1/2" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col justify-center px-[var(--margin)]">
        <div className="relative w-full">
          <div className={centre}>{headline("top")}</div>
          <div
            className={`pointer-events-none absolute inset-0 ${centre}`}
            style={{ clipPath: "inset(var(--seam) 0 0 0)" }}
          >
            {headline("bottom")}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-[var(--margin)] pb-7">
          <div className="fade-up mx-auto flex max-w-[62ch] flex-col items-center gap-3 text-center">
            <p className="text-[17px] leading-relaxed text-white/90 md:text-[20px]">
              The alumni association of {KOSA.school}, Rakai District. Find your year again, support
              the students behind you, and carry the school forward together.
            </p>
            <p className="font-[family-name:var(--font-display)] text-[13px] font-bold text-gold">
              {KOSA.tagline}
            </p>
            <p className="text-[14px] text-white/70">
              Already on the register?{" "}
              <Link href="/login/" className="font-semibold text-white underline decoration-gold decoration-2 underline-offset-4">
                Sign in to the member portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
