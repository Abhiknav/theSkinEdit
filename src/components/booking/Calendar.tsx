"use client";

import { motion } from "framer-motion";

import type { AvailabilityDay, PublicSlot } from "@/lib/types";
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
                {full ? "Full" : `${day.open} free`}
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

/** Time grid for one day. Taken slots stay visible, struck through — an honest diary. */
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

  return (
      <motion.div
        key={day.dateKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h4 className="font-display text-[1.35rem] text-ink">{day.label}</h4>
          <span className="font-mono text-[0.6rem] tracking-[0.12em] text-faint uppercase">
            {day.open} of {day.total} free
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {day.slots.map((slot, i) => {
            const active = slot.id === selectedSlotId;
            return (
              <motion.button
                key={slot.id}
                type="button"
                disabled={!slot.available}
                onClick={() => onSelect(slot)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: Math.min(i * 0.018, 0.25) }}
                whileTap={slot.available ? { scale: 0.96 } : undefined}
                className={`rounded-xl border px-3 py-3.5 text-[0.92rem] transition-all duration-250 ${
                  active
                    ? "border-copper bg-copper text-white shadow-[var(--shadow-sm)]"
                    : slot.available
                      ? "border-border bg-card text-ink hover:-translate-y-0.5 hover:border-copper hover:text-copper"
                      : "cursor-not-allowed border-line bg-transparent text-faint/60 line-through"
                }`}
              >
                {formatTime(slot.startAt)}
              </motion.button>
            );
          })}
        </div>

        {day.open === 0 && (
          <p className="mt-4 text-[0.9rem] text-faint">
            Every slot this day is taken. Try another date — cancellations reappear here instantly.
          </p>
        )}
      </motion.div>
  );
}
