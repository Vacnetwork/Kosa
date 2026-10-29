import Link from "next/link";
import { Crest } from "@/components/brand/crest";
import { CREDIT_LINE } from "@/content/demo";
import { KOSA, NAV_LINKS } from "@/lib/brand";
import { LocalTime } from "@/components/site/local-time";

/**
 * A footer of tiles: every cell used, no empty half. Text stays at 14px or
 * more, and the wordmark returns at full width in the ink tile.
 */
export function SiteFooter() {
  return (
    <footer className="bg-paper px-[var(--margin)] pb-[var(--margin)]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-2 md:grid-cols-12">
        <div className="flex flex-col justify-between gap-8 bg-white px-6 py-7 md:col-span-4 md:min-h-[220px]">
          <p className="t-h3 text-navy">One association, every year that ever sat in these classrooms.</p>
          <p className="text-[13px] leading-relaxed text-slate">
            {KOSA.name} is a not-for-profit alumni association. This build is a demonstration: sample
            events, figures and stories are labelled as demo content.
          </p>
        </div>
        <div className="bg-white px-6 py-7 md:col-span-3 md:min-h-[220px]">
          <p className="mb-4 font-[family-name:var(--font-display)] text-[13px] font-bold text-slate">Pages</p>
          <ul className="flex flex-col gap-2 text-[15px]">
            {NAV_LINKS.slice(0, 5).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-navy underline decoration-transparent decoration-2 underline-offset-4 hover:decoration-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white px-6 py-7 md:col-span-2 md:min-h-[220px]">
          <p className="mb-4 font-[family-name:var(--font-display)] text-[13px] font-bold text-slate">Where and when</p>
          <p className="text-[15px] text-navy">Uganda</p>
          <LocalTime />
        </div>
        <div className="flex flex-col justify-between gap-3 bg-white px-6 py-7 md:col-span-3 md:min-h-[220px]">
          <p className="font-[family-name:var(--font-display)] text-[13px] font-bold text-slate">Secretariat</p>
          <address className="flex flex-col gap-2 text-[15px] not-italic leading-relaxed text-navy">
            <span>{KOSA.contact.postal}</span>
            <a href={`tel:${KOSA.contact.phone}`} className="underline decoration-transparent decoration-2 underline-offset-4 hover:decoration-gold">
              {KOSA.contact.phone}
            </a>
            <a href={`mailto:${KOSA.contact.email}`} className="underline decoration-transparent decoration-2 underline-offset-4 hover:decoration-gold">
              {KOSA.contact.email}
            </a>
            <a href={KOSA.contact.websiteUrl} className="underline decoration-transparent decoration-2 underline-offset-4 hover:decoration-gold" rel="noopener">
              {KOSA.contact.website}
            </a>
          </address>
          <Link href="/contact/" className="font-[family-name:var(--font-display)] text-[15px] font-bold text-navy underline decoration-gold decoration-2 underline-offset-4">
            Write to the secretariat
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 bg-navy px-6 py-10 md:col-span-8 md:min-h-[260px]">
          <Crest className="h-20 w-auto" />
          <p className="text-center font-[family-name:var(--font-display)] text-[clamp(30px,6vw,64px)] font-extrabold leading-none tracking-tight text-white">
            KOSA
          </p>
          <p className="text-center text-[14px] text-white/80">{KOSA.motto}</p>
        </div>
        <Link
          href="/membership/"
          className="flex flex-col justify-between gap-6 bg-gold px-6 py-7 md:col-span-4 md:min-h-[260px]"
        >
          <span className="font-[family-name:var(--font-display)] text-[22px] font-extrabold leading-tight text-navy md:text-[26px]">
            Add your year to the register
          </span>
          <svg viewBox="0 0 48 24" aria-hidden="true" className="h-6 w-12 self-end" fill="none" stroke="currentColor" strokeWidth="4" color="#102B60">
            <path d="M2 12h42M32 2l12 10-12 10" />
          </svg>
        </Link>

        <p className="col-span-full mt-4 max-w-[92ch] text-[13px] leading-relaxed text-slate">{CREDIT_LINE}</p>
      </div>
    </footer>
  );
}
