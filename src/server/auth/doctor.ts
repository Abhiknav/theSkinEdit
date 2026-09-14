import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { BookingError } from "../db/errors";

/**
 * Doctor authentication.
 *
 * MVP: a single credential pair checked against env, issued as a signed,
 * httpOnly session cookie. Deliberately small and swappable.
 *
 * [SCALE] Replace with Clerk or Supabase Auth when a second doctor joins —
 * only this file changes: keep `requireDoctor()` returning { email }, and every
 * route and page guard downstream keeps working. Inviting a doctor then becomes
 * inviting a user in the provider's dashboard.
 */

const COOKIE = "se_doctor";
const MAX_AGE_SECONDS = 60 * 60 * 12;

const DEV_PASSWORD = "skinedit";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production.");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-do-not-ship-000000");
  }
  return new TextEncoder().encode(value);
}

export function doctorEmail(): string {
  return (process.env.DOCTOR_EMAIL ?? "akshi@theskinedit.in").toLowerCase();
}

function expectedPassword(): string {
  const value = process.env.DOCTOR_PASSWORD;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("DOCTOR_PASSWORD must be set in production.");
  }
  return DEV_PASSWORD;
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function login(email: string, password: string): Promise<void> {
  const emailOk = constantTimeEquals(email.trim().toLowerCase(), doctorEmail());
  const passwordOk = constantTimeEquals(password, expectedPassword());
  if (!emailOk || !passwordOk) {
    throw new BookingError("UNAUTHORIZED", "That email and password do not match.");
  }

  const token = await new SignJWT({ role: "doctor", email: doctorEmail() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export interface DoctorSession {
  email: string;
}

export async function getSession(): Promise<DoctorSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "doctor") return null;
    return { email: String(payload.email ?? doctorEmail()) };
  } catch {
    return null;
  }
}

export async function requireDoctor(): Promise<DoctorSession> {
  const session = await getSession();
  if (!session) throw new BookingError("UNAUTHORIZED", "Please sign in.");
  return session;
}
