"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { EASE_OUT, prefersReducedMotion } from "@/components/motion/motion-policy";

/**
 * The hero's one authored beat: a gold hairline draws itself along the seam
 * between the paper field and the navy field, starting once both copies of the
 * headline have landed (the CSS line-mask entrance above runs 80 ms and 190 ms
 * with a 720 ms curve). It says "this is the waterline the words cross" without
 * touching the words themselves.
 *
 * Purely decorative: aria-hidden, and the no-JS stylesheet leaves it drawn.
 */
export function HeroSeam() {
  const rule = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = rule.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      node.style.transform = "scaleX(1)";
      return;
    }
    const animation = animate(node, {
      scaleX: [0, 1],
      duration: 920,
      delay: 560,
      ease: EASE_OUT,
    });
    return () => {
      animation.pause();
    };
  }, []);

  return (
    <div
      ref={rule}
      aria-hidden="true"
      className="hero-seam pointer-events-none absolute inset-x-0 top-[54%] z-20 h-[2px] bg-gold md:top-1/2"
    />
  );
}
