import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The joining flow, drawn as one connected rail: account, application, officer
 * review, membership. Four steps, in order, with the one you are on marked.
 *
 * On a phone the rail scrolls horizontally and the next step is deliberately
 * left peeking (each card is 68% of the viewport, so 32% of the next one shows)
 * — closure tells the reader the flow continues without a hint or an arrow.
 * From md up all four sit side by side on a single hairline.
 */
const STEPS = [
  {
    key: "account",
    label: "Account",
    body: "An email and a password. Verifying the email proves the address works.",
    href: "/register/",
  },
  {
    key: "application",
    label: "Application",
    body: "Your year, your category, and why you are joining. Five answers at most.",
    href: "/portal/application/",
  },
  {
    key: "review",
    label: "Officer review",
    body: "The membership officer checks the year against the register and records a decision.",
    href: "/portal/application/",
  },
  {
    key: "member",
    label: "Member",
    body: "Directory, events, welfare and the year wall open on the same account.",
    href: "/portal/",
  },
] as const;

export type FlowStep = (typeof STEPS)[number]["key"];

export function FlowSteps({ current, className }: { current: FlowStep; className?: string }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <nav aria-label="Joining steps" className={cn("w-full", className)}>
      <ol className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:pb-0">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step.key}
              aria-current={active ? "step" : undefined}
              className={cn(
                "basis-[74%] shrink-0 snap-start border-t-2 pt-3 md:basis-auto md:shrink",
                done ? "border-navy" : active ? "border-gold" : "border-paper-dim",
              )}
            >
              <p
                className={cn(
                  "font-[family-name:var(--font-display)] text-[13px] font-bold",
                  active ? "text-navy" : done ? "text-navy/80" : "text-slate",
                )}
              >
                <span className="tabular-nums">{index + 1}</span>{" "}
                {done ? (
                  <Link href={step.href} className="underline decoration-1 underline-offset-4 hover:decoration-2">
                    {step.label}
                  </Link>
                ) : (
                  step.label
                )}
              </p>
              <p
                className={cn(
                  "mt-1 text-[14px] leading-snug",
                  active ? "text-navy" : "text-slate",
                )}
              >
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
