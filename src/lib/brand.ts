/**
 * Brand + identity constants for Kakoma Old Students Association.
 * Anything in here is stated in the brief. Nothing factual about the
 * association (contacts, committee, fees) is invented anywhere in the app:
 * unverified values are labelled as demo content in the UI.
 */
export const KOSA = {
  name: "Kakoma Old Students Association",
  shortName: "KOSA",
  motto: "United by Our Past, Committed to Our Future.",
  tagline: "Connect \u2022 Support \u2022 Empower",
  colors: {
    navy: "#102B60",
    gold: "#C99A20",
    white: "#FFFFFF",
    paper: "#F3F5F9",
  },
} as const;

export const DEMO_LABEL = "Demo data";

export const NAV_LINKS = [
  { href: "/about/", label: "About" },
  { href: "/membership/", label: "Membership" },
  { href: "/events/", label: "Events" },
  { href: "/news/", label: "News & Stories" },
  { href: "/welfare/", label: "Welfare & Projects" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact" },
] as const;
