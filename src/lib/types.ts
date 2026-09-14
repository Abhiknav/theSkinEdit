/** Client-side mirrors of the API payloads — no server imports cross this line. */

export type ConsultMode = "clinic" | "online";

export interface PublicSlot {
  id: string;
  startAt: string;
  endAt: string;
  available: boolean;
  modes: string[];
}

export interface AvailabilityDay {
  dateKey: string;
  label: string;
  weekdayShort: string;
  dayOfMonth: string;
  monthShort: string;
  isToday: boolean;
  total: number;
  open: number;
  slots: PublicSlot[];
}

export interface AvailabilityData {
  doctor: { id: string; name: string; timezone: string };
  horizonDays: number;
  cutoffHours: number;
  days: AvailabilityDay[];
}

export interface PublicAppointment {
  reference: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  mode: ConsultMode;
  startAt: string;
  endAt: string;
  patientName: string;
  patientEmail: string;
  reason: string | null;
  canChange: boolean;
  cutoffHours: number;
}

export const IST = "Asia/Kolkata";

export function formatTime(iso: string, timeZone = IST) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatDay(iso: string, timeZone = IST) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatShortDay(iso: string, timeZone = IST) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
