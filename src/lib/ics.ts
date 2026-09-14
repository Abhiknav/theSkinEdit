/** Minimal .ics builder so a confirmed appointment lands in the patient's calendar. */
export function buildIcs(input: {
  reference: string;
  startAt: string;
  endAt: string;
  mode: "clinic" | "online";
  patientName: string;
}): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const location =
    input.mode === "online" ? "Online video consultation" : "Manipal Hospital, Sarjapur Road, Bengaluru";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Skin Edit//Appointments//EN",
    "BEGIN:VEVENT",
    `UID:${input.reference}@theskinedit.in`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(input.startAt)}`,
    `DTEND:${stamp(input.endAt)}`,
    "SUMMARY:Consultation with Dr Akshi Bansal",
    `DESCRIPTION:The Skin Edit — booking reference ${input.reference}. Manage at theskinedit.in/my-bookings`,
    `LOCATION:${location}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment with Dr Akshi Bansal in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
