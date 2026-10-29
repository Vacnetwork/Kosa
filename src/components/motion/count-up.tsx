"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { EASE_OUT, prefersReducedMotion } from "@/components/motion/motion-policy";

/**
 * The impact figure counts up once, when it comes into view.
 *
 * The number is the section's whole claim, so it is the one value on the site
 * worth animating: a reader watching "0 → 47" understands it as a count of
 * people rather than a piece of decoration. The server-rendered markup already
 * holds the final figure — this only replays it — so no JavaScript, no reduced
 * motion and any failed bundle all show the real number immediately.
 */
export function CountUp({
  value,
  className,
  duration = 1500,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || value <= 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    const counter = { value: 0 };
    let animation: { pause: () => void } | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          animation = animate(counter, {
            value,
            duration,
            ease: EASE_OUT,
            onUpdate: () => {
              node.textContent = Math.round(counter.value).toLocaleString("en-GB");
            },
            onComplete: () => {
              node.textContent = value.toLocaleString("en-GB");
            },
          });
        });
      },
      { threshold: 0.4 },
    );

    node.textContent = "0";
    observer.observe(node);

    return () => {
      observer.disconnect();
      animation?.pause();
      node.textContent = value.toLocaleString("en-GB");
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-GB")}
    </span>
  );
}
