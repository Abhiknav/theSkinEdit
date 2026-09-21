"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { DayRail, SlotGrid } from "@/components/booking/Calendar";
import { ModeToggle } from "@/components/booking/ModeToggle";
import { ConsentCheckbox, Field, Notice, SubmitButton, TextArea } from "@/components/site/Field";
import { buildIcs, downloadIcs } from "@/lib/ics";
import type { ConsultMode, PublicAppointment, PublicSlot } from "@/lib/types";
import { formatDay, formatTime } from "@/lib/types";
import { useAvailability } from "@/lib/useAvailability";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Roughly the fixed header, so the card is not tucked under it. */
const HEADER_CLEARANCE = 92;
const CONFIRMATION_ID = "booking-confirmed";

export function BookingFlow() {
  const [mode, setMode] = useState<ConsultMode>("clinic");
  const { data, loading, error, liveTick, connected, reload } = useAvailability(mode);

  const [dateKey, setDateKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<PublicSlot | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<PublicAppointment | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => data?.days ?? [], [data]);
  const activeDay = days.find((d) => d.dateKey === dateKey);

  useEffect(() => {
    if (days.length === 0) return;
    if (dateKey && days.some((d) => d.dateKey === dateKey)) return;
    setDateKey((days.find((d) => d.open > 0) ?? days[0]).dateKey);
  }, [days, dateKey]);

  // The slot stopped being bookable under us — say which, rather than failing
  // at submit. A slot can also simply age past the lead time while the form is
  // open, which is not the same thing as someone else taking it.
  useEffect(() => {
    if (!slot || !data) return;
    const current = data.days.flatMap((d) => d.slots).find((c) => c.id === slot.id);
    if (current?.available) return;
    setSlot(null);
    setLiveNotice(
      current?.state === "too_soon"
        ? "That time is now too close to book online. Please pick a later one, or call the clinic."
        : "That time was booked a moment ago. Please pick another — the calendar is already up to date.",
    );
  }, [liveTick, data, slot]);

  /**
   * Confirming replaces the whole flow — day rail, time grid and form — with a
   * single card. The document loses roughly a screen of height above the fold,
   * so the browser keeps its scroll offset and the viewport lands on whatever
   * section follows. Re-anchor on the booking section so the confirmation is
   * what the patient is actually looking at.
   */
  useEffect(() => {
    if (!confirmed) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Wait for the collapsed layout to paint, or the target offset is stale.
    const frame = requestAnimationFrame(() => {
      // The card itself, not the section: anchoring on the section would leave
      // its heading and tabs filling a phone screen with the confirmation
      // below the fold, which is the thing the patient needs to read.
      const target =
        document.getElementById(CONFIRMATION_ID) ?? document.getElementById("book");
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_CLEARANCE;
      window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [confirmed]);

  function chooseSlot(next: PublicSlot) {
    setSlot(next);
    setLiveNotice(null);
    setFormError(null);
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!slot) return;
    setBusy(true);
    setFormError(null);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, mode, fullName, phone, email, reason: reason || null, consent }),
      });
      const payload = (await response.json()) as { appointment?: PublicAppointment; error?: string; code?: string };
      if (!response.ok) {
        if (payload.code === "SLOT_TAKEN" || payload.code === "SLOT_NOT_FOUND") {
          setSlot(null);
          void reload(true);
          setLiveNotice(payload.error ?? "That slot has just been taken.");
          return;
        }
        throw new Error(payload.error ?? "Could not confirm the booking.");
      }
      setConfirmed(payload.appointment!);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not confirm the booking.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmed) return <Confirmation appointment={confirmed} />;

  return (
    /* min-w-0 on both columns: without it the scrolling day rail forces the grid
       track wider than the page and pushes the summary off the right edge. */
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:items-start lg:gap-14">
      <div className="min-w-0 space-y-12">
        <section>
          <StepHead n="01" title="Choose your consultation" />
          <div className="mt-5">
            <ModeToggle
              value={mode}
              onChange={(next) => {
                setMode(next);
                setSlot(null);
              }}
            />
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepHead n="02" title="Pick a time" />
            <span className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.14em] text-faint uppercase">
              <span className="relative flex h-1.5 w-1.5">
                {connected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper/60" />
                )}
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${connected ? "bg-copper" : "bg-faint"}`}
                />
              </span>
              {connected ? "Live" : "Reconnecting"}
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {loading && !data && <CalendarSkeleton />}
            {error && <Notice>{error}</Notice>}
            {liveNotice && <Notice tone="info">{liveNotice}</Notice>}

            {data && days.length === 0 && (
              <p className="rounded-2xl border border-border bg-card p-8 text-center text-[0.92rem] text-faint">
                No slots open in the next {data.horizonDays} days for this consultation type. Try the
                other type, or call the clinic.
              </p>
            )}

            {days.length > 0 && (
              <>
                <DayRail
                  days={days}
                  selected={dateKey}
                  onSelect={(key) => {
                    setDateKey(key);
                    setSlot(null);
                  }}
                />
                <SlotGrid day={activeDay} selectedSlotId={slot?.id ?? null} onSelect={chooseSlot} />
              </>
            )}
          </div>
        </section>

        <div ref={detailsRef}>
          <AnimatePresence>
            {slot && (
              <motion.section
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <StepHead n="03" title="Your details" />
                <form onSubmit={submit} className="mt-6 space-y-7">
                  <div className="grid gap-7 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                    <Field
                      label="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      hint="For your reference number and reminders."
                    />
                  </div>
                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    hint="Your confirmation arrives here immediately."
                  />
                  <TextArea
                    label="What would you like to discuss? (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    hint="A line is plenty. Please don't include medical records — we don't store them."
                  />

                  <ConsentCheckbox checked={consent} onChange={setConsent}>
                    I agree to The Skin Edit storing my name, phone and email to manage this
                    appointment, under the DPDP Act 2023. No medical records are stored on this site
                    and I can ask for my details to be deleted at any time.
                  </ConsentCheckbox>

                  {formError && <Notice>{formError}</Notice>}

                  <div className="flex flex-wrap items-center gap-5 pt-1">
                    <SubmitButton busy={busy} disabled={!consent}>
                      Confirm appointment
                    </SubmitButton>
                    <button
                      type="button"
                      onClick={() => setSlot(null)}
                      className="text-[0.86rem] text-faint transition-colors hover:text-copper"
                    >
                      Pick another time
                    </button>
                  </div>
                </form>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Summary mode={mode} slot={slot} cutoffHours={data?.cutoffHours ?? 4} />
    </div>
  );
}

function StepHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-[0.66rem] tracking-[0.14em] text-copper">{n}</span>
      <h3 className="font-display text-[1.6rem] text-ink sm:text-[1.85rem]">{title}</h3>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2.5 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[6.2rem] min-w-[4.9rem] animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}

/** Sticky recap — confirms the choice the instant a slot is picked. */
function Summary({
  mode,
  slot,
  cutoffHours,
}: {
  mode: ConsultMode;
  slot: PublicSlot | null;
  cutoffHours: number;
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-28">
      <div className="card overflow-hidden">
        <div className="border-b border-line px-7 py-5">
          <span className="label">Your appointment</span>
        </div>

        <div className="space-y-5 px-7 py-7">
          <Row label="Consultation" value={mode === "online" ? "Online" : "In person"} />

            {slot ? (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="space-y-5"
              >
                <Row label="Date" value={formatDay(slot.startAt)} />
                <Row label="Time" value={`${formatTime(slot.startAt)} — ${formatTime(slot.endAt)}`} />
                <div className="flex items-center gap-3 rounded-2xl border border-copper-soft bg-copper-wash px-4 py-3 text-[0.82rem] text-copper">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 20 }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-copper text-[0.7rem] text-white"
                  >
                    ✓
                  </motion.span>
                  Held while you finish — not booked until you confirm.
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[0.9rem] leading-relaxed text-faint"
              >
                Pick a date and time — it appears here before anything is confirmed.
              </motion.p>
            )}

          <ul className="space-y-2.5 border-t border-line pt-5 text-[0.8rem] leading-relaxed text-faint">
            <li>No account needed.</li>
            <li>Free to move or cancel up to {cutoffHours} hours before.</li>
            <li>Fees are settled at the consultation.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.58rem] tracking-[0.16em] text-faint uppercase">{label}</div>
      <div className="mt-1.5 font-display text-[1.25rem] text-ink">{value}</div>
    </div>
  );
}

function Confirmation({ appointment }: { appointment: PublicAppointment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      id={CONFIRMATION_ID}
      className="mx-auto max-w-2xl scroll-mt-28"
    >
      <div className="card px-7 py-12 text-center sm:px-14">
        <motion.div
          initial={{ scale: 0, rotate: -14 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.12 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-copper text-2xl text-white"
        >
          ✓
        </motion.div>

        <h3 className="mt-7 font-display text-[2.2rem] text-ink">You&rsquo;re confirmed.</h3>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-soft">
          A confirmation is on its way to {appointment.patientEmail}. Keep the reference below — it
          is all you need to change this appointment yourself.
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          <Cell label="Reference" value={appointment.reference} />
          <Cell label="When" value={`${formatDay(appointment.startAt)}, ${formatTime(appointment.startAt)}`} />
          <Cell label="Type" value={appointment.mode === "online" ? "Online" : "In person"} />
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
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
            className="btn btn-primary"
          >
            Add to calendar
            <span className="arw" aria-hidden>
              →
            </span>
          </button>
          <a href="#manage" className="text-[0.86rem] text-faint transition-colors hover:text-copper">
            Manage this booking
          </a>
        </div>

        <p className="mt-8 text-[0.82rem] leading-relaxed text-faint">
          Please arrive ten minutes early with any previous reports. Free changes up to{" "}
          {appointment.cutoffHours} hours before.
        </p>
      </div>
    </motion.div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-tint px-5 py-5">
      <div className="font-mono text-[0.56rem] tracking-[0.16em] text-faint uppercase">{label}</div>
      <div className="mt-2 font-display text-[1.05rem] text-ink">{value}</div>
    </div>
  );
}
