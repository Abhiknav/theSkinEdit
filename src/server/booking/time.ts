/**
 * Timezone helpers. Availability is authored in clinic-local wall time
 * ("Tuesday 13:30") and stored as absolute instants, so the calendar stays
 * correct for a patient booking from another timezone.
 */

export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return (asUTC - date.getTime()) / 60000;
}

/** Wall-clock time in `timeZone` to the absolute instant it represents. */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = new Date(naive - tzOffsetMinutes(new Date(naive), timeZone) * 60000);
  // Second pass settles dates that sit near a DST transition (a no-op for IST).
  return new Date(naive - tzOffsetMinutes(firstPass, timeZone) * 60000);
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  dateKey: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const raw = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = Number(raw("year"));
  const month = Number(raw("month"));
  const day = Number(raw("day"));
  const hour = Number(raw("hour")) % 24;
  const minute = Number(raw("minute"));
  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday: Math.max(0, WEEKDAYS.indexOf(raw("weekday"))),
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

/** "2026-09-15" in the given timezone. */
export function dateKeyInZone(date: Date, timeZone: string): string {
  return zonedParts(date, timeZone).dateKey;
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function parseClockTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

/** Yields consecutive date keys in `timeZone`, inclusive of both ends. */
export function eachDateKey(from: Date, to: Date, timeZone: string): string[] {
  const keys: string[] = [];
  const endKey = dateKeyInZone(to, timeZone);
  let cursor = new Date(from.getTime());
  for (let i = 0; i < 400; i += 1) {
    const key = dateKeyInZone(cursor, timeZone);
    keys.push(key);
    if (key >= endKey) break;
    cursor = new Date(cursor.getTime() + 24 * 3600 * 1000);
  }
  return keys;
}
