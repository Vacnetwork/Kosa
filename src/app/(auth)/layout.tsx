import Link from "next/link";
import { Crest } from "@/components/brand/crest";
import { KOSA } from "@/lib/brand";

/**
 * The auth shell: one navy field, one paper field. No portal navigation, no
 * sign-out button — nobody is signed in yet.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <aside className="flex flex-col justify-between bg-navy px-6 py-8 text-white md:px-10 md:py-12 lg:min-h-screen">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label={`${KOSA.name} home`}>
            <Crest className="h-11 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-display)] text-[19px] font-extrabold tracking-tight">
                KOSA
              </span>
              <span className="mt-1.5 max-w-[22ch] text-[13px] leading-snug text-white/75">
                {KOSA.name}
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-[13px] text-white/80 underline decoration-2 underline-offset-4 hover:text-white"
          >
            Back to the public site
          </Link>
        </div>

        <div className="mt-12 hidden max-w-md lg:block">
          <p className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.18em] text-white/60">
            Member portal
          </p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-[30px] font-bold leading-[1.1] tracking-tight">
            {KOSA.motto}
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/75">
            One account for your membership record, the alumni directory, events, announcements, the
            welfare desk and mentorship. Applications are reviewed by the membership officer, never
            automatically.
          </p>
        </div>

        <p className="mt-12 max-w-md border-t border-white/20 pt-4 text-[13px] leading-relaxed text-white/60">
          Your details are held in the association&apos;s database and shown only according to the
          visibility settings you choose.
        </p>
      </aside>

      <main id="main" className="flex items-start justify-center px-5 py-10 md:px-10 md:py-16">
        <div className="w-full max-w-[460px]">{children}</div>
      </main>
    </div>
  );
}
