"use client";

import { useEffect, useState } from "react";

/** East Africa Time, shown live; renders a static fallback before hydration. */
export function LocalTime() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Kampala",
      }).format(new Date());
    setNow(format());
    const timer = window.setInterval(() => setNow(format()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return <p className="mt-1 text-[15px] text-slate">{now ? `${now} EAT` : "East Africa Time (UTC+3)"}</p>;
}
