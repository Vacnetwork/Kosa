"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "animejs";
import { EASE_OUT, prefersReducedMotion } from "@/components/motion/motion-policy";

/**
 * A picture that arrives the way a press photograph is put down: the frame
 * opens across the image (a clip wipe) while the picture itself settles from a
 * slightly closer crop. Used for the lead story on the homepage — the one place
 * on the site where a whole photograph is the subject.
 *
 * The finished state is the stylesheet's default, so the picture is fully
 * visible before the script runs, with JavaScript off, and under reduced motion.
 */
export function ClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const frame = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = frame.current;
    const image = node?.querySelector("img");
    if (!node || !image) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    let animation: { pause: () => void } | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          animation = animate(image, {
            clipPath: ["inset(0% 0% 0% 100%)", "inset(0% 0% 0% 0%)"],
            scale: [1.06, 1],
            duration: 1100,
            delay,
            ease: EASE_OUT,
          });
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      animation?.pause();
      image.style.clipPath = "";
      image.style.transform = "";
    };
  }, [delay]);

  return (
    <div ref={frame} className={className}>
      {children}
    </div>
  );
}
