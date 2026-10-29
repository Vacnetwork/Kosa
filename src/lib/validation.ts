import { z } from "zod";

export const GRADUATION_YEAR_MIN = 1950;
const CURRENT_YEAR = new Date().getFullYear();

const graduationYear = z
  .number({ message: "Choose your graduation year" })
  .int("Use a whole year")
  .min(GRADUATION_YEAR_MIN, `Year must be ${GRADUATION_YEAR_MIN} or later`)
  .max(CURRENT_YEAR + 1, "That year is in the future");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Enter your full name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const applicationSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name").max(120),
  graduationYear,
  cohortNote: z.string().trim().max(160).optional().or(z.literal("")),
  membershipCategory: z.enum(["former_student", "former_staff", "associate", "other"], {
    message: "Choose the category that fits you",
  }),
  areasOfInterest: z.array(z.string().trim().max(60)).max(8, "Choose up to eight").default([]),
  communicationPreference: z.enum(["whatsapp", "email", "sms", "all"]),
  motivation: z
    .string()
    .trim()
    .min(40, "Write at least 40 characters so the committee can assess the application")
    .max(2000, "Keep this under 2000 characters"),
  consent: z.literal(true, { message: "Please confirm the declaration" }),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name").max(120),
  preferredName: z.string().trim().max(60).optional().or(z.literal("")),
  graduationYear,
  profession: z.string().trim().max(120).optional().or(z.literal("")),
  employer: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  interests: z.string().trim().max(300).optional().or(z.literal("")),
  bio: z.string().trim().max(1200, "Keep your bio under 1200 characters").optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url("Enter a full URL").optional().or(z.literal("")),
  directoryVisibility: z.enum(["members", "hidden"]),
  allowContactByMembers: z.boolean(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(3, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  subject: z.string().trim().min(3, "Add a subject").max(160),
  message: z.string().trim().min(20, "Write at least 20 characters").max(2000),
});

export const welfareRequestSchema = z.object({
  category: z.enum(["bereavement", "medical", "education", "hardship", "other"]),
  summary: z.string().trim().min(10, "Summarise the request in one line").max(160),
  details: z.string().trim().min(40, "Give the committee enough detail").max(2000),
  amountRequested: z.coerce.number().min(0).max(100000000).optional(),
  isConfidential: z.boolean(),
});

export const contributionSchema = z.object({
  memberId: z.string().uuid("Choose a member").optional().or(z.literal("")),
  campaign: z.string().trim().min(2, "Name the campaign or fund").max(120),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  currency: z.string().trim().length(3, "Use a 3-letter code"),
  method: z.string().trim().max(60).optional().or(z.literal("")),
  reference: z.string().trim().max(80).optional().or(z.literal("")),
  receivedAt: z.string().min(1, "Choose the date received"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const eventSchema = z.object({
  title: z.string().trim().min(4, "Give the event a title").max(140),
  slug: z
    .string()
    .trim()
    .min(3, "Add a short URL slug")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  summary: z.string().trim().min(20, "Write a one-line summary").max(240),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  startsAt: z.string().min(1, "Choose a start date and time"),
  endsAt: z.string().optional().or(z.literal("")),
  venue: z.string().trim().max(160).optional().or(z.literal("")),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(0).max(100000).optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(4, "Give the announcement a title").max(140),
  body: z.string().trim().min(20, "Write at least 20 characters").max(4000),
  audience: z.enum(["members", "admins"]),
  isPinned: z.boolean(),
});

export const galleryItemSchema = z.object({
  title: z.string().trim().min(2, "Give the picture a title").max(120),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Upload the picture first, or paste its URL"),
  credit: z.string().trim().max(200).optional().or(z.literal("")),
  album: z.string().trim().max(60).optional().or(z.literal("")),
  cohortYear: z.coerce.number().int().min(GRADUATION_YEAR_MIN).max(CURRENT_YEAR + 1).optional(),
});

export const mentorshipOfferSchema = z.object({
  expertise: z.string().trim().min(3, "Name your area of expertise").max(120),
  availability: z.string().trim().max(120).optional().or(z.literal("")),
  isAccepting: z.boolean(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type WelfareRequestInput = z.infer<typeof welfareRequestSchema>;
export type ContributionInput = z.infer<typeof contributionSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;
