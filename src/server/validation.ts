import { z } from "zod";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Indian mobile numbers, with or without +91 / 0 prefix. */
const PHONE = /^(?:\+?91[\s-]?)?(?:0)?[6-9]\d{9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => PHONE.test(value), { message: "Enter a valid 10-digit Indian mobile number." });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => EMAIL.test(value), { message: "Enter a valid email address." });

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(80, "That name is too long.");

export const modeSchema = z.enum(["clinic", "online"]);

export const createBookingSchema = z.object({
  slotId: z.string().min(1, "Choose a slot."),
  mode: modeSchema,
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  reason: z.string().trim().max(280, "Please keep this under 280 characters.").optional().nullable(),
  // DPDP Act 2023 — explicit, recorded consent before any detail is stored.
  consent: z.literal(true, { message: "Please accept the privacy notice to continue." }),
});

export const lookupSchema = z.object({
  reference: z.string().trim().min(4, "Enter your booking reference."),
  phone: phoneSchema,
});

export const rescheduleSchema = lookupSchema.extend({
  slotId: z.string().min(1, "Choose a new slot."),
  mode: modeSchema.optional(),
});

export const feedbackSchema = z.object({
  reference: z.string().trim().optional().nullable(),
  patientName: nameSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Tell us a little more — at least 10 characters.").max(1200),
  consent: z.literal(true, { message: "Please confirm we may review and publish this." }),
});

export const availabilityRuleSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  slot_minutes: z.coerce.number().int().min(5).max(120),
  modes: z.array(modeSchema).min(1, "Pick at least one consultation type."),
  active: z.boolean(),
});

export const availabilityPayloadSchema = z.object({
  rules: z.array(availabilityRuleSchema).max(30),
});

export const blockSchema = z.object({
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  reason: z.string().trim().max(120).optional().nullable(),
});

export const appointmentStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["confirmed", "completed", "no_show", "cancelled"]),
});

export const feedbackStatusSchema = z.object({
  feedbackId: z.string().min(1),
  status: z.enum(["pending", "published", "hidden"]),
});

/** Strip a phone down to its last 10 digits so +91/0 variants compare equal. */
export function normalisePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}
