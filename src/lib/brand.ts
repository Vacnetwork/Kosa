/**
 * Brand and identity constants for Kakoma Old Students Association.
 *
 * Everything here is taken from the association's own material: the brief
 * (colours, motto, tagline) and the supplied "Guideline to Joining" poster and
 * membership application form (school name, contact details, payment
 * instructions, objectives, vision, mission, core values, membership
 * categories). Nothing is invented.
 */
export const KOSA = {
  name: "Kakoma Old Students Association",
  shortName: "KOSA",
  school: "Kakoma Senior Secondary School",
  motto: "United by Our Past, Committed to Our Future.",
  tagline: "Connect \u2022 Support \u2022 Empower",
  colors: {
    navy: "#102B60",
    gold: "#C99A20",
    white: "#FFFFFF",
    paper: "#F3F5F9",
  },
  contact: {
    phone: "0752328735",
    phoneInternational: "+256 752 328735",
    email: "info@kosa.or.ug",
    website: "kosa.or.ug",
    websiteUrl: "https://kosa.or.ug",
    postal: "P.O. Box 123, Kakoma \u2013 Rakai District, Uganda",
    district: "Rakai District",
    country: "Uganda",
  },
  payments: {
    accountName: "Kakoma Old Students Association KOSA",
    accountNumber: "3100107599",
    bank: "Centenary Development Bank Limited",
    treasurerMobile: [
      { network: "Airtel", number: "0700626093" },
      { network: "MTN", number: "0782489161" },
    ],
    treasurerName: "Namukasa Phiona Kinsambwe",
    note: "KOSA charges a non-refundable membership and annual subscription fee to support administrative and event costs. Details are provided in the Constitution.",
    receiptNote: "Upon payment you should be provided with a receipt to confirm your payment.",
  },
  vision:
    "A united and empowered community of Kakoma Old Students contributing to the sustainable development of our members, our school and society.",
  mission:
    "To unite, connect and mobilise Kakoma Old Students to support one another, strengthen our school, nurture professional and personal growth, and contribute positively to community development.",
  coreValues: [
    { name: "Unity", note: "One body across every year of completion." },
    { name: "Integrity", note: "Members' money and decisions are on the record." },
    { name: "Service", note: "Time and skill given back to the school." },
    { name: "Excellence", note: "Standards held high in what the association funds." },
    { name: "Solidarity", note: "Members stand with each other in difficulty." },
  ] as const,
} as const;

/** Membership categories, exactly as the application form lists them. */
export const MEMBERSHIP_CATEGORIES = [
  { value: "former_student", label: "Former student of Kakoma Senior Secondary School" },
  { value: "former_staff", label: "Former staff" },
  { value: "associate", label: "Associate or friend of Kakoma Senior Secondary School" },
  { value: "other", label: "Other (describe below)" },
] as const;

/** Areas of interest, exactly as the application form lists them. */
export const AREAS_OF_INTEREST = [
  "Welfare programmes",
  "Mentorship",
  "School development initiatives",
  "Fundraising",
  "Investment programmes",
  "Events and reunions",
] as const;

/** The association's objectives, from its published material. */
export const OBJECTIVES = [
  "Promote unity and networking among all Kakoma Old Students, regardless of their year of completion or location.",
  "Support Kakoma Senior Secondary School through fundraising, mentorship, infrastructure development, academic support and other initiatives that enhance the school's growth.",
  "Promote professional and personal development through mentorship, skills development, career guidance, knowledge sharing and networking opportunities.",
  "Establish a strong welfare and solidarity system to support members during important life events and times of need.",
  "Mobilise resources and partnerships to finance sustainable projects benefiting KOSA members, the school and surrounding communities.",
  "Encourage entrepreneurship and economic empowerment among members through business networking, investment opportunities, training and access to relevant information.",
  "Promote leadership, integrity and responsible citizenship by encouraging members to use their knowledge, skills and experience to serve society.",
  "Preserve the heritage and values of Kakoma Senior Secondary School while strengthening the relationship between the school, current students and former students.",
  "Encourage mentorship of current students by connecting them with successful Old Students who can provide career, academic and life guidance.",
  "Build a vibrant and sustainable association with transparent leadership, effective governance, strong membership participation and accountable financial management.",
] as const;

/** The six steps to joining, from the "How to join KOSA" guideline. */
export const JOIN_STEPS = [
  {
    title: "Confirm your eligibility",
    body: "Membership is open to all former students of Kakoma Senior Secondary School, to former staff, and to long-term contributors to the school.",
  },
  {
    title: "Complete the membership form",
    body: "Fill in the KOSA membership application in the portal — your year of completion or service, your category of membership and how you would like to be involved.",
  },
  {
    title: "Pay the membership fee",
    body: "KOSA charges a non-refundable membership and annual subscription fee to support administrative and event costs. The amounts are set out in the Constitution.",
  },
  {
    title: "Join the communication platforms",
    body: "Once registered you are added to the official KOSA WhatsApp group, the email list for updates and events, and the association's social media platforms.",
  },
  {
    title: "Participate and contribute",
    body: "Attend the meetings and reunions, take part in fundraising or mentorship programmes, share opportunities and ideas, and join the welfare and investment programmes.",
  },
  {
    title: "Keep your record current",
    body: "Your profile and visibility settings are yours to manage: what other members see, whether you can be contacted, and which programmes you want to hear about.",
  },
] as const;

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
