import "server-only";

import { getPrimaryDoctor, getStore } from "../db";
import type { AppointmentStatus, AvailabilityRule, ConsultMode, FeedbackStatus } from "../db/types";
import { publishSlotChange } from "../realtime/bus";
import { BOOKING_HORIZON_DAYS, ensureSlots } from "./slots";

/** Doctor-side operations. Same separation as the patient service: no HTTP in here. */

export async function getSchedule() {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const from = new Date();
  const to = new Date(from.getTime() + BOOKING_HORIZON_DAYS * 24 * 3600 * 1000);
  const [rules, blocks] = await Promise.all([
    store.listAvailabilityRules(doctor.id),
    store.listBlocks(doctor.id, from.toISOString(), to.toISOString()),
  ]);
  return { doctor, rules, blocks };
}

export async function saveAvailabilityRules(rules: Omit<AvailabilityRule, "id" | "doctor_id">[]) {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();

  const from = new Date();
  const to = new Date(from.getTime() + BOOKING_HORIZON_DAYS * 24 * 3600 * 1000);

  const saved = await store.replaceAvailabilityRules(doctor.id, rules);
  // Unbooked slots are disposable — drop and rebuild them from the new rules.
  // Booked slots are never touched, so a patient never loses an appointment
  // because the doctor edited her hours.
  await store.deleteOpenSlots(doctor.id, from.toISOString(), to.toISOString());
  await ensureSlots(store, doctor, from, to);
  publishSlotChange(doctor.id, []);

  return saved;
}

export async function addBlock(startAt: string, endAt: string, reason: string | null) {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const block = await store.createBlock(doctor.id, startAt, endAt, reason);
  const { conflicts } = await store.blockOpenSlots(doctor.id, startAt, endAt);
  publishSlotChange(doctor.id, []);
  return { block, conflicts };
}

export async function removeBlock(blockId: string) {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const from = new Date();
  const to = new Date(from.getTime() + BOOKING_HORIZON_DAYS * 24 * 3600 * 1000);
  const blocks = await store.listBlocks(doctor.id, from.toISOString(), to.toISOString());
  const target = blocks.find((b) => b.id === blockId);
  await store.deleteBlock(doctor.id, blockId);
  if (target) {
    await store.unblockSlots(doctor.id, target.start_at, target.end_at);
    // Any block still covering that window wins again.
    for (const block of blocks.filter((b) => b.id !== blockId)) {
      await store.blockOpenSlots(doctor.id, block.start_at, block.end_at);
    }
  }
  publishSlotChange(doctor.id, []);
}

/**
 * Whether the dashboard can trust what it is showing.
 *
 * Without DATABASE_URL the app falls back to the file store. Locally that is
 * one process reading one file and everything works. On a serverless host it
 * writes to the instance's own temp directory, which is not shared between
 * instances and is wiped on a cold start — so a booking taken by one instance
 * is simply not there when another serves this page. That failure is silent
 * and looks exactly like "my appointments are not showing up", which is why
 * the dashboard says it out loud.
 */
export interface StorageHealth {
  durable: boolean;
  /** True when the store is also not shared between requests. */
  ephemeral: boolean;
}

export async function getStorageHealth(): Promise<StorageHealth> {
  const store = await getStore();
  if (store.kind === "postgres") return { durable: true, ephemeral: false };
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  return { durable: false, ephemeral: serverless };
}

export interface DashboardAppointment {
  id: string;
  reference: string;
  startAt: string;
  endAt: string;
  mode: ConsultMode;
  status: AppointmentStatus;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string | null;
}

export async function getAppointments(daysBack = 7, daysForward = 60): Promise<DashboardAppointment[]> {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const from = new Date(Date.now() - daysBack * 24 * 3600 * 1000);
  const to = new Date(Date.now() + daysForward * 24 * 3600 * 1000);
  const rows = await store.listAppointments(doctor.id, from.toISOString(), to.toISOString());
  return rows.map((a) => ({
    id: a.id,
    reference: a.reference,
    startAt: a.slot.start_at,
    endAt: a.slot.end_at,
    mode: a.mode,
    status: a.status,
    patientName: a.patient.full_name,
    patientPhone: a.patient.phone,
    patientEmail: a.patient.email,
    reason: a.reason,
  }));
}

export async function setAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  const updated = await store.updateAppointmentStatus(doctor.id, appointmentId, status);
  if (status === "cancelled") {
    await store.cancelPendingNotifications(updated.id);
    publishSlotChange(doctor.id, [updated.slot_id]);
  }
  return updated;
}

export async function getFeedback() {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  return store.listFeedback(doctor.id);
}

export async function setFeedbackStatus(feedbackId: string, status: FeedbackStatus) {
  const store = await getStore();
  const doctor = await getPrimaryDoctor();
  return store.updateFeedbackStatus(doctor.id, feedbackId, status);
}
