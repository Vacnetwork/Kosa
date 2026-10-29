/**
 * DEMO CONTENT — every value in this file is sample content for a working
 * demonstration of the site. It is labelled "Demo" wherever it is rendered,
 * and none of it is an official KOSA record: no real committee members, no
 * real fees, no real contact addresses, no invented testimonials presented as
 * genuine. Replace it by seeding the database (supabase/seed.sql) — the app
 * reads from Supabase as soon as it is configured, and falls back to these
 * fixtures only when it is not.
 */
import type {
  AlumniCard,
  Announcement,
  EventRow,
  GalleryItem,
  NewsPost,
  WelfareRequest,
} from "@/lib/types";

/**
 * Illustrations, generated with AI for this build.
 *
 * These are NOT photographs of Kakoma Senior Secondary School, of its students
 * or of its alumni — no such photographs were supplied, and inventing a
 * documentary record of a real school would misrepresent it. They are
 * AI-generated images (Pollinations, Sana model, free tier), used as editorial
 * illustration and labelled as such wherever they appear. Replace them with the
 * association's own photographs when it has them: drop the files in
 * public/photos/ and update this map.
 */
export interface Photo {
  src: string;
  srcSmall: string;
  alt: string;
  credit: string;
  creditUrl: string;
  licence: string;
  width: number;
  height: number;
  generated?: boolean;
}

const AI_CREDIT = "AI-generated illustration";

export const PHOTOS: Record<string, Photo> = {
  compound: {
    src: "/photos/compound.webp",
    srcSmall: "/photos/compound-sm.webp",
    alt: "A single-storey brick classroom block with a red metal roof on a green school compound",
    credit: AI_CREDIT,
    creditUrl: "",
    licence: "not a photograph",
    width: 1600,
    height: 988,
    generated: true,
  },
  students: {
    src: "/photos/students.webp",
    srcSmall: "/photos/students-sm.webp",
    alt: "Three students in dark uniforms walking away from the camera along a tree-lined school path",
    credit: AI_CREDIT,
    creditUrl: "",
    licence: "not a photograph",
    width: 1600,
    height: 988,
    generated: true,
  },
  gathering: {
    src: "/photos/ceremony.webp",
    srcSmall: "/photos/ceremony-sm.webp",
    alt: "A courtyard assembly of seated students and parents facing a school building",
    credit: AI_CREDIT,
    creditUrl: "",
    licence: "not a photograph",
    width: 1600,
    height: 988,
    generated: true,
  },
  alumni: {
    src: "/photos/alumni.webp",
    srcSmall: "/photos/alumni-sm.webp",
    alt: "Adults talking together outdoors under trees at a school reunion, backlit by late sun",
    credit: AI_CREDIT,
    creditUrl: "",
    licence: "not a photograph",
    width: 1600,
    height: 988,
    generated: true,
  },
  classroom: {
    src: "/photos/classroom.webp",
    srcSmall: "/photos/classroom-sm.webp",
    alt: "An empty classroom with wooden desks in rows, a blackboard and tall windows",
    credit: AI_CREDIT,
    creditUrl: "",
    licence: "not a photograph",
    width: 1600,
    height: 988,
    generated: true,
  },
  market: {
    src: "/photos/market.webp",
    srcSmall: "/photos/market-sm.webp",
    alt: "A small-town market street with produce stalls under corrugated-iron awnings",
    credit: AI_CREDIT,
    creditUrl: "",
    licence: "not a photograph",
    width: 1600,
    height: 988,
    generated: true,
  },
};

export const CREDIT_LINE =
  "Every picture on this site is an AI-generated illustration, not a photograph of Kakoma Senior Secondary School or of its students and alumni. Replace them with the association's own photographs when they exist.";


const futureDate = (days: number, hour = 10) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_EVENTS: EventRow[] = [
  {
    id: "demo-event-agm",
    slug: "annual-general-meeting",
    title: "Annual General Meeting (demo)",
    summary:
      "The association's yearly meeting: reports from the executive, the welfare fund and the bursary committee, plus elections.",
    description:
      "Members hear the year's reports, agree the welfare and bursary allocations for the coming year, and elect the executive committee. Registration helps the organising team plan seating and refreshments.\n\nThis entry is demo content. Replace it with the real meeting notice once the association secretariat publishes it.",
    starts_at: futureDate(21, 9),
    ends_at: futureDate(21, 15),
    venue: "Kakoma community hall (venue to confirm)",
    category: "Governance",
    capacity: 400,
    cover_image_url: PHOTOS.compound.src,
    is_published: true,
    created_by: null,
    created_at: futureDate(-30),
    updated_at: futureDate(-30),
  },
  {
    id: "demo-event-mentorship",
    slug: "career-mentorship-clinic",
    title: "Career and mentorship clinic (demo)",
    summary:
      "Small-group sessions where senior alumni work through CVs, interviews and course choices with recent leavers.",
    description:
      "Thirty-minute small-group clinics run by alumni volunteers in teaching, health, law, engineering, business and public service. Bring a CV on paper or on a phone; no printing is required.\n\nDemo content.",
    starts_at: futureDate(34, 14),
    ends_at: futureDate(34, 17),
    venue: "Online (link sent to registered members)",
    category: "Mentorship",
    capacity: 120,
    cover_image_url: PHOTOS.gathering.src,
    is_published: true,
    created_by: null,
    created_at: futureDate(-21),
    updated_at: futureDate(-21),
  },
  {
    id: "demo-event-bursary",
    slug: "bursary-award-ceremony",
    title: "Bursary award ceremony (demo)",
    summary:
      "Certificates and termly bursaries handed to the current year of supported students, with their guardians present.",
    description:
      "The bursary committee presents awards for the current academic year and reports on how the fund was spent, line by line.\n\nDemo content.",
    starts_at: futureDate(58, 11),
    ends_at: futureDate(58, 14),
    venue: "Kakoma (venue to confirm)",
    category: "Bursary",
    capacity: 250,
    cover_image_url: PHOTOS.classroom.src,
    is_published: true,
    created_by: null,
    created_at: futureDate(-14),
    updated_at: futureDate(-14),
  },
  {
    id: "demo-event-cleanup",
    slug: "community-cleanup-day",
    title: "Community clean-up day (demo)",
    summary:
      "Alumni, students and neighbours spend a Saturday on the market drainage and the school compound.",
    description:
      "Tools, gloves and water are provided. Families welcome; children must be accompanied.\n\nDemo content.",
    starts_at: futureDate(72, 8),
    ends_at: futureDate(72, 13),
    venue: "Meeting point: main market gate",
    category: "Community",
    capacity: 180,
    cover_image_url: PHOTOS.market.src,
    is_published: true,
    created_by: null,
    created_at: futureDate(-10),
    updated_at: futureDate(-10),
  },
  {
    id: "demo-event-reunion",
    slug: "decade-reunion-weekend",
    title: "Decade reunion weekend (demo)",
    summary:
      "Years in the same decade gather for a match, a dinner and a Sunday service.",
    description:
      "Years are grouped by decade rather than by single year, so older and newer leavers meet. Registration covers the dinner only; the match and service are free.\n\nDemo content.",
    starts_at: futureDate(96, 16),
    ends_at: futureDate(98, 12),
    venue: "Kakoma and the nearest town",
    category: "Reunion",
    capacity: 500,
    cover_image_url: PHOTOS.students.src,
    is_published: true,
    created_by: null,
    created_at: futureDate(-7),
    updated_at: futureDate(-7),
  },
];

export const DEMO_NEWS: NewsPost[] = [
  {
    id: "demo-news-1",
    slug: "bursary-fund-terms-1",
    title: "The bursary fund covered a second term for eleven students (demo)",
    excerpt:
      "A short report on what the bursary fund paid for this term, what it did not cover, and what the committee needs before next term.",
    body:
      "This is demo content.\n\nThe bursary fund exists to keep students in school when a family's income cannot. This term the fund met fees for eleven students, and the committee publishes the shape of that spending without naming the students.\n\nWhat the fund paid for: fees, a set of uniforms, and examination registration. What it did not cover: boarding for two students whose families are still negotiating with the school.\n\nBefore next term, the committee needs three things: receipts for every payment, a short note from each school confirming attendance, and the guardians' contact details so follow-up does not rely on a student carrying messages.",
    cover_image_url: PHOTOS.gathering.src,
    author_name: "KOSA Welfare Desk (demo)",
    published_at: futureDate(-6),
    is_published: true,
  },
  {
    id: "demo-news-2",
    slug: "mentorship-clinic-report",
    title: "What came out of the first mentorship clinic (demo)",
    excerpt:
      "Forty-two recent leavers met alumni volunteers across six fields. The most common request was not a job — it was a conversation about which course to take.",
    body:
      "This is demo content.\n\nForty-two recent leavers joined the first clinic. Six alumni volunteers covered teaching, nursing, law, engineering, business and public service.\n\nTwo patterns stood out. First, most questions were about course and institution choices rather than employment. Second, almost every student asked for a follow-up conversation, which the association can answer by pairing people by field rather than running a single large event.",
    cover_image_url: PHOTOS.classroom.src,
    author_name: "KOSA Mentorship Group (demo)",
    published_at: futureDate(-18),
    is_published: true,
  },
  {
    id: "demo-news-3",
    slug: "drainage-project-handover",
    title: "Market drainage work was handed over to the traders' association (demo)",
    excerpt:
      "The association paid for materials; the traders' association organised the labour and now maintains the channels.",
    body:
      "This is demo content.\n\nThe association bought cement, sand and channel covers; the traders' association organised the labour and agreed to keep the channels clear.\n\nMaintenance is written into a one-page agreement held by both parties, so the work does not depend on any single person staying in office.",
    cover_image_url: PHOTOS.market.src,
    author_name: "KOSA Projects (demo)",
    published_at: futureDate(-40),
    is_published: true,
  },
];

export interface ProjectCard {
  slug: string;
  title: string;
  year: string;
  summary: string;
  photo: keyof typeof PHOTOS;
  status: "Running" | "Completed" | "Planned";
}

export const DEMO_PROJECTS: ProjectCard[] = [
  {
    slug: "bursary-fund",
    title: "Bursary fund",
    year: "1998",
    summary:
      "Termly fees, uniforms and examination registration for students whose families cannot meet the cost.",
    photo: "gathering",
    status: "Running",
  },
  {
    slug: "welfare-desk",
    title: "Welfare desk",
    year: "2004",
    summary:
      "Members facing bereavement, medical costs or sudden hardship apply to the welfare desk; the committee decides and records every decision.",
    photo: "classroom",
    status: "Running",
  },
  {
    slug: "market-drainage",
    title: "Market drainage",
    year: "2019",
    summary:
      "Channels and covers at the market entrance, handed over to the traders' association with a written maintenance agreement.",
    photo: "market",
    status: "Completed",
  },
  {
    slug: "ict-room",
    title: "ICT room",
    year: "2022",
    summary:
      "Refurbished computer room, power stabilisers and a stock of refurbished machines for the school's practical lessons.",
    photo: "students",
    status: "Running",
  },
  {
    slug: "girls-kits",
    title: "Girls' kit drive",
    year: "2023",
    summary:
      "Reusable sanitary kits and a term's supply of soap, delivered through the school's senior woman teacher.",
    photo: "compound",
    status: "Running",
  },
  {
    slug: "alumni-hall",
    title: "Alumni hall roof",
    year: "2027",
    summary:
      "Re-roofing the meeting hall so events can run through the rainy season. Planned, not yet funded.",
    photo: "compound",
    status: "Planned",
  },
];

export interface Achievement {
  name: string;
  year: number;
  field: string;
  note: string;
}

/** Placeholder achievements — shown as demo so no real person is misrepresented. */
export const DEMO_ACHIEVEMENTS: Achievement[] = [
  { name: "Class of 1999 (demo)", year: 1999, field: "Public health", note: "Two members now lead district health programmes." },
  { name: "Class of 2007 (demo)", year: 2007, field: "Engineering", note: "Solar mini-grid team serving three sub-counties." },
  { name: "Class of 2011 (demo)", year: 2011, field: "Teaching", note: "A year that now staffs the school's science department." },
  { name: "Class of 2018 (demo)", year: 2018, field: "Enterprise", note: "A farming cooperative run by four members from one class." },
];

export const DEMO_GALLERY: GalleryItem[] = [
  {
    id: "demo-gal-1",
    title: "The compound",
    caption: "A classroom block on the school compound.",
    image_url: PHOTOS.compound.src,
    credit: PHOTOS.compound.credit,
    album: "Places",
    cohort_year: 1999,
    is_published: true,
    uploaded_by: null,
    created_at: futureDate(-60),
  },
  {
    id: "demo-gal-2",
    title: "Walking in",
    caption: "Students on the path in, early morning.",
    image_url: PHOTOS.students.src,
    credit: PHOTOS.students.credit,
    album: "Places",
    cohort_year: 2007,
    is_published: true,
    uploaded_by: null,
    created_at: futureDate(-60),
  },
  {
    id: "demo-gal-3",
    title: "Classroom",
    caption: "Desks, blackboard and afternoon light.",
    image_url: PHOTOS.classroom.src,
    credit: PHOTOS.classroom.credit,
    album: "Community",
    cohort_year: 2011,
    is_published: true,
    uploaded_by: null,
    created_at: futureDate(-60),
  },
  {
    id: "demo-gal-4",
    title: "Assembly",
    caption: "A courtyard assembly of students and parents.",
    image_url: PHOTOS.gathering.src,
    credit: PHOTOS.gathering.credit,
    album: "Community",
    cohort_year: 2018,
    is_published: true,
    uploaded_by: null,
    created_at: futureDate(-60),
  },
  {
    id: "demo-gal-5",
    title: "Market street",
    caption: "A market street in town, a short walk from the school.",
    image_url: PHOTOS.market.src,
    credit: PHOTOS.market.credit,
    album: "Places",
    cohort_year: 2007,
    is_published: true,
    uploaded_by: null,
    created_at: futureDate(-60),
  },
];

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "demo-ann-1",
    title: "Membership applications are reviewed once a month (demo)",
    body:
      "The membership officer reviews the queue on the first week of each month. Applications that are missing the graduation year are returned for more information rather than rejected.",
    audience: "members",
    is_pinned: true,
    published_at: futureDate(-4),
    created_by: null,
  },
  {
    id: "demo-ann-2",
    title: "Welfare desk contact window (demo)",
    body:
      "Requests can be submitted through the portal at any time. The welfare desk responds within seven days, and urgent medical cases are flagged for the same week.",
    audience: "members",
    is_pinned: false,
    published_at: futureDate(-12),
    created_by: null,
  },
  {
    id: "demo-ann-3",
    title: "Event managers: publish dates eight weeks ahead (demo)",
    body:
      "So that years can plan travel, the event managers group publishes confirmed dates at least eight weeks before the event.",
    audience: "admins",
    is_pinned: false,
    published_at: futureDate(-20),
    created_by: null,
  },
];

export const DEMO_ALUMNI: AlumniCard[] = [
  { id: "demo-m-1", full_name: "Aciro Grace (demo)", graduation_year: 1999, profession: "Public health officer", employer: "District health office", city: "Gulu", country: "Uganda", interests: ["Health", "Bursary fund"], avatar_url: null },
  { id: "demo-m-2", full_name: "Okello Samuel (demo)", graduation_year: 2004, profession: "Civil engineer", employer: "Roads contractor", city: "Kampala", country: "Uganda", interests: ["Infrastructure", "Mentorship"], avatar_url: null },
  { id: "demo-m-3", full_name: "Auma Beatrice (demo)", graduation_year: 2005, profession: "Teacher", employer: "Secondary school", city: "Gulu", country: "Uganda", interests: ["Education", "Girls' kits"], avatar_url: null },
  { id: "demo-m-4", full_name: "Lam David (demo)", graduation_year: 2008, profession: "Agronomist", employer: "Farmers' cooperative", city: "Nwoya", country: "Uganda", interests: ["Agriculture", "Enterprise"], avatar_url: null },
  { id: "demo-m-5", full_name: "Achieng Sarah (demo)", graduation_year: 2011, profession: "Nurse", employer: "Regional referral hospital", city: "Gulu", country: "Uganda", interests: ["Health", "Welfare"], avatar_url: null },
  { id: "demo-m-6", full_name: "Otto Michael (demo)", graduation_year: 2013, profession: "Accountant", employer: "SACCO", city: "Lira", country: "Uganda", interests: ["Treasury", "Audit"], avatar_url: null },
  { id: "demo-m-7", full_name: "Adong Ruth (demo)", graduation_year: 2015, profession: "Software developer", employer: "Remote (Kenya)", city: "Kampala", country: "Uganda", interests: ["ICT", "Mentorship"], avatar_url: null },
  { id: "demo-m-8", full_name: "Komakech Peter (demo)", graduation_year: 2016, profession: "Secondary school teacher", employer: "Kakoma", city: "Gulu", country: "Uganda", interests: ["Education", "Sports"], avatar_url: null },
  { id: "demo-m-9", full_name: "Akello Janet (demo)", graduation_year: 2018, profession: "Entrepreneur", employer: "Agro-processing", city: "Gulu", country: "Uganda", interests: ["Enterprise", "Bursary fund"], avatar_url: null },
  { id: "demo-m-10", full_name: "Opio Thomas (demo)", graduation_year: 2019, profession: "Lawyer", employer: "Legal aid clinic", city: "Kampala", country: "Uganda", interests: ["Governance", "Welfare"], avatar_url: null },
  { id: "demo-m-11", full_name: "Atim Prossy (demo)", graduation_year: 2021, profession: "Lab technician", employer: "Clinic network", city: "Gulu", country: "Uganda", interests: ["Health"], avatar_url: null },
  { id: "demo-m-12", full_name: "Odong Charles (demo)", graduation_year: 2022, profession: "Student", employer: "University", city: "Mbarara", country: "Uganda", interests: ["Mentorship", "ICT"], avatar_url: null },
];

export const DEMO_COHORTS: { year: number; members: number }[] = [
  { year: 1999, members: 34 },
  { year: 2004, members: 41 },
  { year: 2007, members: 38 },
  { year: 2011, members: 52 },
  { year: 2015, members: 47 },
  { year: 2018, members: 63 },
  { year: 2022, members: 29 },
];

export const DEMO_IMPACT = {
  active_members: 486,
  years: 27,
  projects: 6,
  bursaries_awarded: 118,
  demo: true,
};

export const DEMO_WELFARE_REQUESTS: WelfareRequest[] = [
  {
    id: "demo-wf-1",
    user_id: "demo-m-5",
    category: "medical",
    summary: "Help with a hospital bill after an accident (demo)",
    details: "Sample request used to demonstrate the welfare queue. Replace with real requests once the portal is live.",
    amount_requested: 1200000,
    currency: "UGX",
    status: "reviewing",
    is_confidential: true,
    created_at: futureDate(-9),
    updated_at: futureDate(-3),
    handled_by: null,
    decision_note: null,
  },
];
