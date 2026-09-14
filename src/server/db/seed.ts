import { randomInt } from "node:crypto";

import type { AvailabilityRule, Doctor } from "./types";

/** Single doctor today — a row, not a hardcode. Adding partners is adding rows. */
export const DOCTOR_SLUG = "akshi-bansal";
export const DOCTOR_ID = "11111111-1111-4111-8111-111111111111";

export const DEFAULT_DOCTOR: Doctor = {
  id: DOCTOR_ID,
  slug: DOCTOR_SLUG,
  full_name: "Dr Akshi Bansal",
  title: "Sr. Consultant Dermatologist",
  email: "hello@theskinedit.in",
  phone: "+918792982600",
  timezone: "Asia/Kolkata",
  created_at: "2024-01-01T00:00:00.000Z",
};

/** Her real consulting hours, in clinic-local (IST) wall time. */
export const DEFAULT_RULES: AvailabilityRule[] = [
  { id: "", doctor_id: DOCTOR_ID, weekday: 2, start_time: "13:30", end_time: "17:30", slot_minutes: 20, modes: ["clinic", "online"], active: true },
  { id: "", doctor_id: DOCTOR_ID, weekday: 4, start_time: "13:30", end_time: "17:30", slot_minutes: 20, modes: ["clinic", "online"], active: true },
  { id: "", doctor_id: DOCTOR_ID, weekday: 5, start_time: "17:00", end_time: "20:00", slot_minutes: 20, modes: ["clinic", "online"], active: true },
  { id: "", doctor_id: DOCTOR_ID, weekday: 6, start_time: "13:30", end_time: "17:30", slot_minutes: 20, modes: ["clinic", "online"], active: true },
];

const ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ2345679"; // no look-alike characters

/** Patient-facing booking reference, e.g. SE-7KQ4M2. */
export function newReference(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return `SE-${out}`;
}
