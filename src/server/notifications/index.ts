import "server-only";

import type { AppointmentDetail, Doctor, NotificationChannel, NotificationJob, NotificationKind, Store } from "../db/types";
import { renderMessage, renderWhatsApp } from "./templates";

/**
 * Notification pipeline.
 *
 * Triggers: confirmation (immediate) → reminder 24h before → feedback request
 * shortly after the slot ends. Jobs are rows, so adding a trigger is adding a
 * row type, and a cron hit on /api/cron/notifications drains what is due.
 *
 * Email is live when RESEND_API_KEY is set; otherwise every message is logged
 * to the console so the flow is fully observable in development.
 * WhatsApp (MSG91 / Gupshup) is stubbed — see sendWhatsApp below.
 */

const FROM = process.env.NOTIFICATION_FROM ?? "The Skin Edit <onboarding@resend.dev>";

export interface DeliveryResult {
  ok: boolean;
  detail: string;
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<DeliveryResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[notify:email:dry-run] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
    return { ok: true, detail: "logged (no RESEND_API_KEY)" };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });
  if (error) return { ok: false, detail: error.message ?? "resend error" };
  return { ok: true, detail: "sent via resend" };
}

/**
 * [DEFERRED] WhatsApp Business API — MSG91 or Gupshup.
 * Both need an approved template and a business number, so this logs today and
 * becomes a fetch() to the provider once credentials exist. Nothing else in the
 * pipeline changes: the job rows and triggers already carry channel='whatsapp'.
 */
async function sendWhatsApp(to: string, body: string): Promise<DeliveryResult> {
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) {
    console.info(`[notify:whatsapp:dry-run] to=${to}\n${body}`);
    return { ok: true, detail: "logged (WhatsApp provider not configured)" };
  }
  console.info(`[notify:whatsapp:pending-integration] to=${to}`);
  return { ok: true, detail: "provider configured but integration deferred" };
}

export async function deliver(
  job: Pick<NotificationJob, "kind" | "channel">,
  appointment: AppointmentDetail,
  doctor: Doctor,
): Promise<DeliveryResult> {
  if (job.channel === "email") {
    const message = renderMessage(job.kind, appointment, doctor);
    return sendEmail(appointment.patient.email, message.subject, message.html, message.text);
  }
  return sendWhatsApp(appointment.patient.phone, renderWhatsApp(job.kind, appointment, doctor));
}

const channelsFor = (): NotificationChannel[] =>
  process.env.MSG91_AUTH_KEY ? ["email", "whatsapp"] : ["email"];

/** Confirmation now, reminder 24h before, feedback request 2h after the slot. */
export async function scheduleForBooking(store: Store, appointment: AppointmentDetail) {
  await enqueue(store, appointment, ["confirmation", "reminder_24h", "feedback_request"]);
}

/**
 * After a reschedule: the patient already has a confirmation, so only the
 * time-dependent jobs are re-queued against the new slot.
 */
export async function scheduleReminders(store: Store, appointment: AppointmentDetail) {
  await enqueue(store, appointment, ["reminder_24h", "feedback_request"]);
}

async function enqueue(store: Store, appointment: AppointmentDetail, kinds: NotificationKind[]) {
  const start = new Date(appointment.slot.start_at).getTime();
  const end = new Date(appointment.slot.end_at).getTime();
  const now = Date.now();

  const when: Record<string, number> = {
    confirmation: now,
    reschedule: now,
    cancellation: now,
    reminder_24h: start - 24 * 3600 * 1000,
    feedback_request: end + 2 * 3600 * 1000,
  };

  await store.enqueueNotifications(
    kinds
      .filter((kind) => when[kind] > now || kind === "confirmation" || kind === "reschedule" || kind === "cancellation")
      .flatMap((kind) =>
        channelsFor().map((channel) => ({
          appointment_id: appointment.id,
          kind,
          channel,
          send_at: new Date(Math.max(when[kind], now)).toISOString(),
          status: "pending" as const,
        })),
      ),
  );
}

export async function scheduleOneOff(store: Store, appointment: AppointmentDetail, kind: NotificationKind) {
  await store.enqueueNotifications(
    channelsFor().map((channel) => ({
      appointment_id: appointment.id,
      kind,
      channel,
      send_at: new Date().toISOString(),
      status: "pending" as const,
    })),
  );
}

/** Drains due jobs. Called by the cron route and opportunistically after a booking. */
export async function runDueNotifications(store: Store, doctor: Doctor, limit = 25) {
  const due = await store.dueNotifications(new Date().toISOString(), limit);
  const results: { id: string; kind: NotificationKind; ok: boolean; detail: string }[] = [];

  for (const job of due) {
    const appointment = await findAppointment(store, doctor.id, job.appointment_id);
    if (!appointment) {
      await store.markNotification(job.id, "skipped", "appointment missing");
      continue;
    }
    if (appointment.status === "cancelled" && job.kind !== "cancellation") {
      await store.markNotification(job.id, "skipped", "appointment cancelled");
      continue;
    }
    try {
      const result = await deliver(job, appointment, doctor);
      await store.markNotification(job.id, result.ok ? "sent" : "failed", result.ok ? null : result.detail);
      results.push({ id: job.id, kind: job.kind, ok: result.ok, detail: result.detail });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown error";
      await store.markNotification(job.id, "failed", detail);
      results.push({ id: job.id, kind: job.kind, ok: false, detail });
    }
  }
  return results;
}

async function findAppointment(store: Store, doctorId: string, appointmentId: string) {
  // Wide window: a job may fire for an appointment months out or just past.
  const from = new Date(Date.now() - 370 * 24 * 3600 * 1000).toISOString();
  const to = new Date(Date.now() + 370 * 24 * 3600 * 1000).toISOString();
  const all = await store.listAppointments(doctorId, from, to);
  return all.find((a) => a.id === appointmentId) ?? null;
}
