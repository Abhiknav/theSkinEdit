"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DayRail, SlotGrid } from "@/components/booking/Calendar";
import { Field, Notice, SubmitButton } from "@/components/site/Field";
import { buildIcs, downloadIcs } from "@/lib/ics";
import type { PublicAppointment, PublicSlot } from "@/lib/types";
import { formatDay, formatTime } from "@/lib/types";
import { useAvailability } from "@/lib/useAvailability";

const EASE = [0.16, 1, 0.3, 1] as const;

type Action = "none" | "reschedule" | "cancel";

export function ManageBooking() {
  const params = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [appointment, setAppointment] = useState<PublicAppointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<Action>("none");
  const [flash, setFlash] = useState<string | null>(null);

  async function call(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { appointment?: PublicAppointment; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Something went wrong.");
      setAppointment(payload.appointment!);
      return payload.appointment!;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setFlash(null);
    setAction("none");
    await call("/api/appointments/lookup", { reference, phone });
  }

  if (!appointment) {
    return (
      <form onSubmit={lookup} className="card mx-auto max-w-xl space-y-7 p-7 sm:p-9">
        <p className="text-[0.93rem] leading-relaxed text-soft">
          Your reference is in the confirmation email — it looks like{" "}
          <span className="font-mono text-copper">SE-7KQ4M2</span>. With the phone number you booked
          on, that is all you need.
        </p>

        <Field
          label="Booking reference"
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          required
          autoCapitalize="characters"
        />
        <Field
          label="Mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          required
        />

        {error && <Notice>{error}</Notice>}

        <SubmitButton busy={busy}>Find my booking</SubmitButton>

        <p className="text-[0.8rem] leading-relaxed text-faint">
          Lost the reference? Call{" "}
          <a href="tel:+918792982600" className="text-copper">
            +91 87929 82600
          </a>{" "}
          and the clinic will find it.
        </p>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AnimatePresence>{flash && <Notice tone="success">{flash}</Notice>}</AnimatePresence>

      <BookingCard appointment={appointment} />

      {error && <Notice>{error}</Notice>}

      {appointment.status === "confirmed" && (
        <>
          {!appointment.canChange && (
            <Notice tone="info">
              Changes close {appointment.cutoffHours} hours before an appointment. Please call the
              clinic on +91 87929 82600 and the team will help.
            </Notice>
          )}

          {appointment.canChange && action === "none" && (
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => setAction("reschedule")} className="btn btn-ghost">
                Move to another time
                <span className="arw" aria-hidden>
                  →
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAction("cancel")}
                className="text-[0.86rem] text-faint transition-colors hover:text-copper"
              >
                Cancel appointment
              </button>
            </div>
          )}

            {action === "reschedule" && (
              <motion.div
                key="reschedule"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <RescheduleCalendar
                  appointment={appointment}
                  busy={busy}
                  onCancel={() => setAction("none")}
                  onPick={async (slot) => {
                    const updated = await call("/api/appointments/reschedule", {
                      reference: appointment.reference,
                      phone,
                      slotId: slot.id,
                    });
                    if (updated) {
                      setAction("none");
                      setFlash(
                        `Moved to ${formatDay(updated.startAt)} at ${formatTime(updated.startAt)}. A new confirmation is on its way.`,
                      );
                    }
                  }}
                />
              </motion.div>
            )}

            {action === "cancel" && (
              <motion.div
                key="cancel"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="card space-y-5 p-7"
              >
                <h4 className="font-display text-[1.5rem] text-ink">Cancel this appointment?</h4>
                <p className="text-[0.93rem] leading-relaxed text-soft">
                  The slot returns to the calendar immediately and someone else may take it. There is
                  no charge for cancelling.
                </p>
                <div className="flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      const updated = await call("/api/appointments/cancel", {
                        reference: appointment.reference,
                        phone,
                      });
                      if (updated) {
                        setAction("none");
                        setFlash("Cancelled. The slot has been released.");
                      }
                    }}
                    className="btn btn-copper"
                  >
                    {busy ? "Cancelling…" : "Yes, cancel it"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("none")}
                    className="text-[0.86rem] text-faint transition-colors hover:text-ink"
                  >
                    Keep my appointment
                  </button>
                </div>
              </motion.div>
            )}
        </>
      )}

      {appointment.status === "cancelled" && (
        <a href="#book" className="btn btn-primary">
          Book a new appointment
          <span className="arw" aria-hidden>
            →
          </span>
        </a>
      )}

      <button
        type="button"
        onClick={() => {
          setAppointment(null);
          setAction("none");
          setFlash(null);
        }}
        className="text-[0.84rem] text-faint transition-colors hover:text-copper"
      >
        Look up a different booking
      </button>
    </div>
  );
}

function BookingCard({ appointment }: { appointment: PublicAppointment }) {
  const tone =
    appointment.status === "confirmed"
      ? "border-copper-soft bg-copper-wash text-copper"
      : "border-border bg-tint text-faint";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="card overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-7 py-5">
        <span className="label">Booking {appointment.reference}</span>
        <span
          className={`rounded-full border px-3 py-1 font-mono text-[0.58rem] tracking-[0.14em] uppercase ${tone}`}
        >
          {appointment.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-7 px-7 py-7 sm:grid-cols-2">
        <Detail label="Patient" value={appointment.patientName} />
        <Detail label="Consultation" value={appointment.mode === "online" ? "Online" : "In person"} />
        <Detail label="Date" value={formatDay(appointment.startAt)} />
        <Detail label="Time" value={`${formatTime(appointment.startAt)} — ${formatTime(appointment.endAt)}`} />
        {appointment.reason && <Detail label="Note" value={appointment.reason} />}
      </div>

      {appointment.status === "confirmed" && (
        <div className="border-t border-line px-7 py-4">
          <button
            type="button"
            onClick={() =>
              downloadIcs(
                `the-skin-edit-${appointment.reference}.ics`,
                buildIcs({
                  reference: appointment.reference,
                  startAt: appointment.startAt,
                  endAt: appointment.endAt,
                  mode: appointment.mode,
                  patientName: appointment.patientName,
                }),
              )
            }
            className="text-[0.82rem] text-faint transition-colors hover:text-copper"
          >
            Add to calendar
          </button>
        </div>
      )}
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.56rem] tracking-[0.16em] text-faint uppercase">{label}</div>
      <div className="mt-2 font-display text-[1.2rem] text-ink">{value}</div>
    </div>
  );
}

function RescheduleCalendar({
  appointment,
  busy,
  onPick,
  onCancel,
}: {
  appointment: PublicAppointment;
  busy: boolean;
  onPick: (slot: PublicSlot) => void;
  onCancel: () => void;
}) {
  const { data, loading } = useAvailability(appointment.mode);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const days = useMemo(() => data?.days ?? [], [data]);

  useEffect(() => {
    if (days.length === 0) return;
    if (dateKey && days.some((d) => d.dateKey === dateKey)) return;
    setDateKey((days.find((d) => d.open > 0) ?? days[0]).dateKey);
  }, [days, dateKey]);

  return (
    <div className="card space-y-6 p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-display text-[1.5rem] text-ink">Pick a new time</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-[0.82rem] text-faint transition-colors hover:text-ink"
        >
          Keep current time
        </button>
      </div>

      {loading && !data && <div className="h-32 animate-pulse rounded-2xl bg-tint" />}

      {days.length > 0 && (
        <>
          <DayRail days={days} selected={dateKey} onSelect={setDateKey} />
          <div className={busy ? "pointer-events-none opacity-50" : undefined}>
            <SlotGrid day={days.find((d) => d.dateKey === dateKey)} selectedSlotId={null} onSelect={onPick} />
          </div>
          <p className="text-[0.8rem] text-faint">
            Choosing a time moves your appointment straight away — the old slot is released in the
            same step.
          </p>
        </>
      )}
    </div>
  );
}
