import { NextResponse } from "next/server";

import { BOOKING_ERROR_STATUS } from "./db/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as object, init);
}

/**
 * Duck-typed rather than `instanceof`: the bundler can hand the route and the
 * driver two copies of the errors module, which would make instanceof lie and
 * turn a clean 409 into a 500.
 */
function asBookingError(error: unknown): { code: string; message: string } | null {
  if (error instanceof Error && error.name === "BookingError") {
    const code = (error as Error & { code?: unknown }).code;
    if (typeof code === "string") return { code, message: error.message };
  }
  return null;
}

/** Same reasoning, for validation errors. */
function asZodIssue(error: unknown): string | null {
  if (error instanceof Error && error.name === "ZodError") {
    const issues = (error as Error & { issues?: { message?: string }[] }).issues;
    if (Array.isArray(issues)) return issues[0]?.message ?? "That does not look right.";
  }
  return null;
}

/** One place that turns domain and validation errors into honest HTTP. */
export function fail(error: unknown) {
  const issue = asZodIssue(error);
  if (issue) {
    return NextResponse.json({ error: issue, code: "INVALID_INPUT" }, { status: 422 });
  }

  const booking = asBookingError(error);
  if (booking) {
    return NextResponse.json(
      { error: booking.message, code: booking.code },
      { status: BOOKING_ERROR_STATUS[booking.code] ?? 400 },
    );
  }

  console.error("[api] unhandled", error);
  return NextResponse.json({ error: "Something went wrong on our side.", code: "INTERNAL" }, { status: 500 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
