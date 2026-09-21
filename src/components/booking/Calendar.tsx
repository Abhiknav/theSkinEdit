"use client";

import { motion } from "framer-motion";

import type { AvailabilityDay, PublicSlot, SlotState } from "@/lib/types";
import { formatTime } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Horizontal rail of consulting days — only days with slots ever appear. */
export function DayRail({
  days,
  selected,
  onSelect,
}: {
  days: AvailabilityDay[];
  selected: string | null;
  onSelect: (dateKey: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pt-1 pb-2">
      <div className="flex gap-2.5">
        {days.map((day, i) => {
          const active = day.dateKey === selected;
          const full = day.open === 0;
          return (
            <motion.button
              key={day.dateKey}
              type="button"
              onClick={() => onSelect(day.dateKey)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.025, 0.35), ease: EASE }}
              className={`relative flex min-w-[4.9rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-4 py-3.5 transition-all duration-300 ${
                active
                  ? "border-deep bg-deep text-white"
                  : full
                    ? "border-border bg-card/60 text-faint"
                    : "border-border bg-card text-ink hover:-translate-y-0.5 hover:border-copper"
              }`}
            >
              <span className="font-mono text-[0.58rem] tracking-[0.12em] uppercase opacity-70">
                {day.weekdayShort}
              </span>
              <span className="font-display text-[1.5rem] leading-none">{day.dayOfMonth}</span>
              <span className="font-mono text-[0.55rem] tracking-[0.1em] uppercase opacity-70">
                {day.monthShort}
              </span>
              <span
                className={`mt-1 font-mono text-[0.55rem] tracking-[0.08em] uppercase ${
                  active ? "text-copper-soft" : full ? "text-faint" : "text-copper"
                }`}
              >
                {full ? "Fully booked" : `${day.open} free`}
              </span>
              {day.isToday && (
                <span
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 font-mono text-[0.5rem] tracking-[0.12em] uppercase ${
                    active ? "bg-copper text-white" : "bg-copper-wash text-copper"
                  }`}
                >
                  Today
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const STATE_COPY: Record<SlotState, { caption: string; aria: string }> = {
  open: { caption: "", aria: "available" },
  booked: { caption: "Booked", aria: "already booked" },
  too_soon: { caption: "Too soon", aria: "too soon to book online" },
};

/**
 * Time grid for one day.
 *
 * Booked times stay on the grid and say so. Hiding them would leave a patient
 * guessing whether a gap means "taken" or "the clinic does not run then", and
 * it is the visible diary that makes the remaining times feel real. Every
 * unbookable chip carries its reason in words, not just a grey tint.
 */
export function SlotGrid({
  day,
  selectedSlotId,
  onSelect,
}: {
  day: AvailabilityDay | undefined;
  selectedSlotId: string | null;
  onSelect: (slot: PublicSlot) => void;
}) {
  if (!day) {
    return (
      <p className="rounded-2xl border border-border bg-card p-8 text-center text-[0.92rem] text-faint">
        Choose a date to see the times available.
      </p>
    );
  }

  const hasBooked = day.slots.some((s) => s.state === "booked");
  const hasTooSoon = day.slots.some((s) => s.state === "too_soon");

  return (
    <motion.div
      key={day.dateKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="font-display text-[1.35rem] text-ink">{day.label}</h4>
        <span className="font-mono text-[0.6rem] tracking-[0.12em] text-faint uppercase">
          {day.open} available
          {day.booked > 0 && ` · ${day.booked} booked`}
        </span>
      </div>

      {/* The key is only worth showing when there is something to explain. */}
      {(hasBooked || hasTooSoon) && (
        <ul className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Key className="border-border bg-card">Available</Key>
          {hasBooked && <Key className="slot-taken border-line bg-tint">Booked</Key>}
          {hasTooSoon && <Key className="border-line bg-transparent">Too soon</Key>}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {day.slots.map((slot, i) => {
          const active = slot.id === selectedSlotId;
          const { caption, aria } = STATE_COPY[slot.state];

          return (
            <motion.button
              key={slot.id}
              type="button"
              disabled={!slot.available}
              onClick={() => onSelect(slot)}
              aria-label={`${formatTime(slot.startAt)} — ${active ? "selected" : aria}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: Math.min(i * 0.018, 0.25) }}
              whileTap={slot.available ? { scale: 0.96 } : undefined}
              className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 transition-all duration-250 ${
                active
                  ? "border-copper bg-copper text-white shadow-[var(--shadow-sm)]"
                  : slot.state === "open"
                    ? "border-border bg-card text-ink hover:-translate-y-0.5 hover:border-copper hover:text-copper"
                    : slot.state === "booked"
                      ? "slot-taken cursor-not-allowed border-line bg-tint text-soft"
                      : "cursor-not-allowed border-line bg-transparent text-faint"
              }`}
            >
              <span
                className={`text-[0.92rem] leading-none ${
                  slot.state === "booked" ? "line-through decoration-soft/50" : ""
                }`}
              >
                {formatTime(slot.startAt)}
              </span>
              {caption && (
                <span className="font-mono text-[0.54rem] tracking-[0.12em] uppercase">
                  {caption}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {day.open === 0 && (
        <p className="mt-4 text-[0.9rem] text-faint">
          {day.booked > 0
            ? "Every consulting time on this day is booked. Try another date — cancellations reappear here instantly."
            : "No more times can be booked online for this day. Try another date, or call the clinic."}
        </p>
      )}
    </motion.div>
  );
}

/** One swatch in the grid's key. */
function Key({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <li className="flex items-center gap-2 font-mono text-[0.58rem] tracking-[0.1em] text-faint uppercase">
      <span aria-hidden className={`h-4 w-6 shrink-0 rounded-[5px] border ${className}`} />
      {children}
    </li>
  );
}
