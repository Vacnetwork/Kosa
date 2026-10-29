"use client";

/**
 * Shared motion policy for the public pages.
 *
 * Three moments use Anime.js (the hero seam, the impact figure, the lead-story
 * picture). Everything else stays on the CSS entrance already in globals.css.
 * All three read the same preference check, and all three keep their final
 * state in the server-rendered markup, so a blocked bundle or a reduced-motion
 * visitor sees the finished page rather than a frozen first frame.
 */

export const EASE_OUT = "outExpo";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
