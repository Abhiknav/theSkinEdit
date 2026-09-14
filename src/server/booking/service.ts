import "server-only";

import { getPrimaryDoctor, getStore } from "../db";
import { BookingError } from "../db/errors";
import type { AppointmentDetail, ConsultMode, Feedback } from "../db/types";
import { scheduleForBooking, scheduleOneOff, scheduleReminders } from "../notifications";
import { publishSlotChange } from "../realtime/bus";
import { normalisePhone } from "../validation";
import { BOOKING_HORIZON_DAYS, CHANGE_CUTOFF_HOURS, ensureSlots, groupSlotsByDay, type AvailabilityDay } from "./slots";

/**
 * Booking business logic.
 *
 * Deliberately free of HTTP: every export here takes plain arguments and
 * returns plain data, so lifting this module into a standalone NestJS service
 * later is a copy, not a rewrite. API routes are thin adapters over it.
 */

export interface AvailabilityResult {
  doctor: { id: string; name: string; timezone: string };
  horizonDays: number;
  cutoffHours: number;
  days: AvailabilityDay[];
}

export async function getAvailability(options: { mode?: ConsultMode; days?: number } = {}): Promise<AvailabilityResult> {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const days = Math.min(options.days ?? BOOKING_HORIZON_DAYS, BOOKING_HORIZON_DAYS);

  const from = new Date();
  const to = new Date(from.getTime() + days * 24 * 3600 * 1000);

  await ensureSlots(store, doctor, from, to);
  const slots = await store.listSlots(doctor.id, from.toISOString(), to.toISOString());

  return {
    doctor: { id: doctor.id, name: doctor.full_name, timezone: doctor.timezone },
    horizonDays: days,
    cutoffHours: CHANGE_CUTOFF_HOURS,
    days: groupSlotsByDay(slots, doctor, options.mode),
  };
}

export interface PublicAppointment {
  reference: string;
  status: AppointmentDetail["status"];
  mode: ConsultMode;
  startAt: string;
  endAt: string;
  patientName: string;
  patientEmail: string;
  reason: string | null;
  canChange: boolean;
  cutoffHours: number;
}

function toPublic(appointment: AppointmentDetail): PublicAppointment {
  return {
    reference: appointment.reference,
    status: appointment.status,
    mode: appointment.mode,
    startAt: appointment.slot.start_at,
    endAt: appointment.slot.end_at,
    patientName: appointment.patient.full_name,
    patientEmail: appointment.patient.email,
    reason: appointment.reason,
    canChange: appointment.status === "confirmed" && !isInsideCutoff(appointment),
    cutoffHours: CHANGE_CUTOFF_HOURS,
  };
}

function isInsideCutoff(appointment: AppointmentDetail): boolean {
  const start = new Date(appointment.slot.start_at).getTime();
  return start - Date.now() < CHANGE_CUTOFF_HOURS * 3600 * 1000;
}

export async function createBooking(input: {
  slotId: string;
  mode: ConsultMode;
  fullName: string;
  phone: string;
  email: string;
  reason?: string | null;
}): Promise<PublicAppointment> {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();

  const appointment = await store.bookSlot({
    doctorId: doctor.id,
    slotId: input.slotId,
    mode: input.mode,
    patient: { fullName: input.fullName, phone: input.phone, email: input.email },
    reason: input.reason ?? null,
    consent: true,
  });

  publishSlotChange(doctor.id, [appointment.slot_id]);
  await scheduleForBooking(store, appointment);
  // Send the confirmation immediately rather than waiting for the next cron tick.
  void drainSoon();

  return toPublic(appointment);
}

/** Verifies the caller owns this booking: reference plus the phone it was made with. */
async function authorise(reference: string, phone: string): Promise<AppointmentDetail> {
  const store = await getStore();
  const appointment = await store.findAppointmentByReference(reference);
  if (!appointment) throw new BookingError("NOT_FOUND", "No booking matches that reference and phone number.");
  if (normalisePhone(appointment.patient.phone) !== normalisePhone(phone)) {
    throw new BookingError("NOT_FOUND", "No booking matches that reference and phone number.");
  }
  return appointment;
}

export async function lookupBooking(reference: string, phone: string): Promise<PublicAppointment> {
  return toPublic(await authorise(reference, phone));
}

export async function rescheduleBooking(
  reference: string,
  phone: string,
  newSlotId: string,
  mode?: ConsultMode,
): Promise<PublicAppointment> {
  const store = await getStore();
  const existing = await authorise(reference, phone);
  if (existing.status !== "confirmed") {
    throw new BookingError("NOT_ACTIVE", "This booking is no longer active.");
  }
  if (isInsideCutoff(existing)) {
    throw new BookingError(
      "TOO_LATE",
      `Changes close ${CHANGE_CUTOFF_HOURS} hours before the appointment. Please call the clinic on +91 87929 82600.`,
    );
  }

  const previousSlotId = existing.slot_id;
  const updated = await store.rescheduleAppointment(existing.id, newSlotId, mode);

  publishSlotChange(updated.doctor_id, [previousSlotId, updated.slot_id]);
  await store.cancelPendingNotifications(updated.id, ["reminder_24h", "feedback_request"]);
  await scheduleReminders(store, updated);
  await scheduleOneOff(store, updated, "reschedule");
  void drainSoon();

  return toPublic(updated);
}

export async function cancelBooking(reference: string, phone: string): Promise<PublicAppointment> {
  const store = await getStore();
  const existing = await authorise(reference, phone);
  if (existing.status === "cancelled") return toPublic(existing);
  if (isInsideCutoff(existing)) {
    throw new BookingError(
      "TOO_LATE",
      `Cancellations close ${CHANGE_CUTOFF_HOURS} hours before the appointment. Please call the clinic on +91 87929 82600.`,
    );
  }

  const cancelled = await store.cancelAppointment(existing.id);
  publishSlotChange(cancelled.doctor_id, [cancelled.slot_id]);
  await store.cancelPendingNotifications(cancelled.id);
  await scheduleOneOff(store, cancelled, "cancellation");
  void drainSoon();

  return toPublic(cancelled);
}

export async function submitFeedback(input: {
  reference?: string | null;
  patientName: string;
  rating: number;
  comment: string;
}): Promise<Feedback> {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();

  let appointmentId: string | null = null;
  if (input.reference) {
    const appointment = await store.findAppointmentByReference(input.reference);
    if (appointment) appointmentId = appointment.id;
  }

  return store.createFeedback({
    doctorId: doctor.id,
    appointmentId,
    patientName: input.patientName,
    rating: input.rating,
    comment: input.comment,
  });
}

export interface PublicTestimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  publishedAt: string | null;
}

export async function listPublishedTestimonials(): Promise<PublicTestimonial[]> {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const published = await store.listFeedback(doctor.id, "published");
  return published.map((f) => ({
    id: f.id,
    name: f.patient_name,
    rating: f.rating,
    comment: f.comment,
    publishedAt: f.published_at,
  }));
}

/**
 * Fire-and-forget notification drain so a confirmation lands immediately.
 * The cron route remains the reliable path; this is just a latency shortcut.
 */
async function drainSoon() {
  try {
    const store = await getStore();
    const doctor = await getPrimaryDoctor();
    const { runDueNotifications } = await import("../notifications");
    await runDueNotifications(store, doctor, 10);
  } catch (error) {
    console.warn("[notify] opportunistic drain failed", error);
  }
}

export { BookingError };
