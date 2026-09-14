import { randomUUID } from "node:crypto";

import type { Doctor, Slot, Store } from "../db/types";
import { dateKeyInZone, eachDateKey, parseClockTime, parseDateKey, zonedParts, zonedToUtc } from "./time";

/** How far ahead the public calendar opens. */
export const BOOKING_HORIZON_DAYS = 56;
/** Patients cannot self-serve a change inside this window — they call the clinic. */
export const CHANGE_CUTOFF_HOURS = 4;
/** Smallest gap between "now" and a bookable slot. */
export const LEAD_TIME_MINUTES = 60;

/**
 * Materialise slot rows from the doctor's weekly rules for a date range.
 *
 * Availability is never computed on the fly at read time: rows exist, which is
 * what lets a booking take a row-level lock and what will let a second doctor
 * be added without touching this logic.
 */
export async function ensureSlots(store: Store, doctor: Doctor, from: Date, to: Date): Promise<void> {
  const rules = (await store.listAvailabilityRules(doctor.id)).filter((r) => r.active);
  const existing = await store.listSlots(doctor.id, from.toISOString(), to.toISOString());
  const now = Date.now();
  const createdAt = new Date().toISOString();

  // Every start time the current rules say should exist in this window.
  const valid = new Map<string, { endAt: string; modes: Slot["modes"] }>();

  for (const dateKey of eachDateKey(from, to, doctor.timezone)) {
    const { year, month, day } = parseDateKey(dateKey);
    const noonUtc = zonedToUtc(year, month, day, 12, 0, doctor.timezone);
    const weekday = zonedParts(noonUtc, doctor.timezone).weekday;

    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;
      const start = parseClockTime(rule.start_time);
      const end = parseClockTime(rule.end_time);
      const dayStart = zonedToUtc(year, month, day, start.hour, start.minute, doctor.timezone);
      const dayEnd = zonedToUtc(year, month, day, end.hour, end.minute, doctor.timezone);
      const step = Math.max(5, rule.slot_minutes) * 60000;

      for (let t = dayStart.getTime(); t + step <= dayEnd.getTime() + 1; t += step) {
        if (t < from.getTime() || t >= to.getTime() || t < now) continue;
        const iso = new Date(t).toISOString();
        if (!valid.has(iso)) valid.set(iso, { endAt: new Date(t + step).toISOString(), modes: rule.modes });
      }
    }
  }

  const known = new Set(existing.map((s) => s.start_at));
  const generated: Slot[] = [...valid.entries()]
    .filter(([startAt]) => !known.has(startAt))
    .map(([startAt, { endAt, modes }]) => ({
      id: randomUUID(),
      doctor_id: doctor.id,
      start_at: startAt,
      end_at: endAt,
      status: "open" as const,
      modes,
      created_at: createdAt,
    }));

  if (generated.length > 0) {
    await store.insertSlotsIgnoringConflicts(generated);
  }

  // An open slot the rules no longer cover is withdrawn from the public calendar.
  // It can still be referenced by a cancelled appointment, so it is blocked
  // rather than deleted.
  for (const slot of existing) {
    if (slot.status !== "open") continue;
    if (valid.has(slot.start_at)) continue;
    await store.blockOpenSlots(doctor.id, slot.start_at, slot.end_at);
  }

  // Re-apply blocks so a newly generated slot never lands inside blocked time.
  const blocks = await store.listBlocks(doctor.id, from.toISOString(), to.toISOString());
  for (const block of blocks) {
    await store.blockOpenSlots(doctor.id, block.start_at, block.end_at);
  }
}

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

/**
 * The shape the calendar consumes. Booked and blocked slots are returned too —
 * showing a struck-through slot reads as an honest live calendar, and it keeps
 * layout stable when a slot disappears under a patient mid-session.
 */
export function groupSlotsByDay(slots: Slot[], doctor: Doctor, mode?: string): AvailabilityDay[] {
  const cutoff = Date.now() + LEAD_TIME_MINUTES * 60000;
  const byDay = new Map<string, PublicSlot[]>();

  for (const slot of slots) {
    if (mode && !slot.modes.includes(mode as never)) continue;
    const startMs = new Date(slot.start_at).getTime();
    if (startMs < Date.now()) continue;
    const key = dateKeyInZone(new Date(slot.start_at), doctor.timezone);
    const list = byDay.get(key) ?? [];
    list.push({
      id: slot.id,
      startAt: slot.start_at,
      endAt: slot.end_at,
      available: slot.status === "open" && startMs >= cutoff,
      modes: slot.modes,
    });
    byDay.set(key, list);
  }

  const todayKey = dateKeyInZone(new Date(), doctor.timezone);

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, list]) => {
      const { year, month, day } = parseDateKey(dateKey);
      const reference = zonedToUtc(year, month, day, 12, 0, doctor.timezone);
      const fmt = (options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat("en-IN", { timeZone: doctor.timezone, ...options }).format(reference);
      return {
        dateKey,
        label: fmt({ weekday: "long", day: "numeric", month: "long" }),
        weekdayShort: fmt({ weekday: "short" }),
        dayOfMonth: fmt({ day: "2-digit" }),
        monthShort: fmt({ month: "short" }),
        isToday: dateKey === todayKey,
        total: list.length,
        open: list.filter((s) => s.available).length,
        slots: list.sort((a, b) => a.startAt.localeCompare(b.startAt)),
      };
    });
}
