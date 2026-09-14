import { siteUrl } from "@/lib/site";

import type { AppointmentDetail, Doctor, NotificationKind } from "../db/types";

export function formatSlot(startAt: string, timeZone: string) {
  const date = new Date(startAt);
  const day = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return { day, time, full: `${day} at ${time}` };
}

export interface RenderedMessage {
  subject: string;
  text: string;
  html: string;
}

const SITE_URL = siteUrl();

function shell(heading: string, body: string, footer: string) {
  return `<div style="margin:0;padding:32px;background:#fdfaf6;font-family:Helvetica,Arial,sans-serif;color:#121820">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e8ddd0;padding:36px 32px">
    <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#b4693f">The Skin Edit</div>
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#55606e;margin-top:6px">by Dr Akshi Bansal</div>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:28px 0 16px">${heading}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #e8ddd0;margin:28px 0" />
    <p style="font-size:13px;line-height:1.7;color:#55606e;margin:0">${footer}</p>
  </div>
</div>`;
}

export function renderMessage(
  kind: NotificationKind,
  appointment: AppointmentDetail,
  doctor: Doctor,
): RenderedMessage {
  const when = formatSlot(appointment.slot.start_at, doctor.timezone);
  const where =
    appointment.mode === "online"
      ? "Online video consultation — a joining link follows on the day."
      : "In person — please arrive 10 minutes early. Clinic address and directions follow with your reminder.";
  const manageUrl = `${SITE_URL}/?ref=${appointment.reference}#manage`;

  const detailBlock = `
    <table style="width:100%;font-size:15px;line-height:1.9;border-collapse:collapse">
      <tr><td style="color:#55606e;width:120px">When</td><td><strong>${when.full}</strong></td></tr>
      <tr><td style="color:#55606e">Consultation</td><td>${appointment.mode === "online" ? "Online" : "In clinic"}</td></tr>
      <tr><td style="color:#55606e">Reference</td><td><strong style="letter-spacing:0.08em">${appointment.reference}</strong></td></tr>
    </table>`;

  switch (kind) {
    case "confirmation":
      return {
        subject: `Appointment confirmed — ${when.full}`,
        text: `Your appointment with Dr Akshi Bansal is confirmed for ${when.full}. Reference ${appointment.reference}. Manage it at ${manageUrl}`,
        html: shell(
          `You are confirmed, ${appointment.patient.full_name.split(" ")[0]}.`,
          `<p style="font-size:15px;line-height:1.8;margin:0 0 20px">${where}</p>${detailBlock}
           <p style="margin:28px 0 0"><a href="${manageUrl}" style="display:inline-block;background:#121820;color:#ffffff;text-decoration:none;padding:13px 24px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase">Manage booking</a></p>`,
          `Need to move it? Reschedule or cancel yourself up to 4 hours before, using reference <strong>${appointment.reference}</strong> and your phone number. Inside 4 hours, call +91 87929 82600.`,
        ),
      };
    case "reschedule":
      return {
        subject: `Appointment moved — ${when.full}`,
        text: `Your appointment has been moved to ${when.full}. Reference ${appointment.reference}.`,
        html: shell(
          "Your appointment has moved.",
          `<p style="font-size:15px;line-height:1.8;margin:0 0 20px">The new time is below. Nothing else has changed.</p>${detailBlock}`,
          `Manage this booking any time at <a href="${manageUrl}" style="color:#b4693f">theskinedit.in</a>.`,
        ),
      };
    case "cancellation":
      return {
        subject: `Appointment cancelled — ${appointment.reference}`,
        text: `Your appointment on ${when.full} has been cancelled.`,
        html: shell(
          "Your appointment is cancelled.",
          `<p style="font-size:15px;line-height:1.8;margin:0 0 20px">The slot on <strong>${when.full}</strong> has been released. No charge applies.</p>`,
          `Whenever you are ready, the live calendar is at <a href="${SITE_URL}/#book" style="color:#b4693f">theskinedit.in</a>.`,
        ),
      };
    case "reminder_24h":
      return {
        subject: `Tomorrow — ${when.time} with Dr Akshi Bansal`,
        text: `Reminder: your appointment is on ${when.full}. Reference ${appointment.reference}.`,
        html: shell(
          "A reminder for tomorrow.",
          `<p style="font-size:15px;line-height:1.8;margin:0 0 20px">${where}</p>${detailBlock}`,
          `Cannot make it? Reschedule free of charge up to 4 hours before at <a href="${manageUrl}" style="color:#b4693f">theskinedit.in</a>.`,
        ),
      };
    case "feedback_request":
      return {
        subject: "How was your visit?",
        text: `Thank you for visiting The Skin Edit. Share a note: ${SITE_URL}/?ref=${appointment.reference}#voices`,
        html: shell(
          "Thank you for visiting.",
          `<p style="font-size:15px;line-height:1.8;margin:0 0 20px">If you have a minute, a short note about your visit helps other patients decide — and tells us what to keep doing.</p>
           <p style="margin:24px 0 0"><a href="${SITE_URL}/?ref=${appointment.reference}#voices" style="display:inline-block;background:#b4693f;color:#ffffff;text-decoration:none;padding:13px 24px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase">Leave a note</a></p>`,
          "Nothing is published without review, and never with your full name unless you ask.",
        ),
      };
  }
}

/** WhatsApp template body — kept plain; providers approve templates separately. */
export function renderWhatsApp(kind: NotificationKind, appointment: AppointmentDetail, doctor: Doctor): string {
  const when = formatSlot(appointment.slot.start_at, doctor.timezone);
  switch (kind) {
    case "confirmation":
      return `The Skin Edit: Hi ${appointment.patient.full_name.split(" ")[0]}, your appointment with Dr Akshi Bansal is confirmed for ${when.full}. Ref ${appointment.reference}. Manage it at ${SITE_URL}/#manage`;
    case "reminder_24h":
      return `The Skin Edit: Reminder — your appointment with Dr Akshi Bansal is ${when.full}. Ref ${appointment.reference}.`;
    case "reschedule":
      return `The Skin Edit: Your appointment has moved to ${when.full}. Ref ${appointment.reference}.`;
    case "cancellation":
      return `The Skin Edit: Your appointment on ${when.full} is cancelled. Ref ${appointment.reference}.`;
    case "feedback_request":
      return `The Skin Edit: Thank you for visiting. A short note about your visit: ${SITE_URL}/#voices`;
  }
}
