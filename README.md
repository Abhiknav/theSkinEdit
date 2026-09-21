# The Skin Edit — theskinedit.in

Brand site and real-time appointment platform for **Dr Akshi Bansal** — dermatologist, dermatosurgeon
and trichologist in Bengaluru. The Skin Edit is her own practice; she currently consults at Manipal
Hospital, Sarjapur Road and Whitefield.

Two jobs in one codebase: a boutique portfolio site, and a booking system where patients see the
real diary, confirm in one step, and change their own appointment without calling anyone.

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Nothing else is required — no database, no API keys. The app boots on a
local JSON store and seeds Dr Bansal's real consulting hours (Tue/Thu/Sat 1:30–5:30 PM, Fri 5–8 PM).

**Doctor dashboard:** http://localhost:3000/doctor — `akshi@theskinedit.in` / `skinedit` in development.

---

## Structure

One public page at `/`, with anchored sections. Old paths (`/book`, `/my-bookings`, `/about`…)
redirect to the matching anchor, so links already sent by email keep working.

| Anchor | Section |
| --- | --- |
| `#top` | Hero — portrait, headline, four credentials |
| `#about` | Who she is, credentials, European Board qualification, professional roles |
| `#treatments` | The eight areas of care, as an interactive index |
| `#approach` | The three principles behind every consultation, on a dark band |
| `#journey` | Clinical experience and education, side by side |
| `#papers` | Publications, conference presentations, recognition and roles |
| `#book` | Live calendar and booking, with a Manage booking tab at `#manage` |
| `#voices` | Approved patient experiences plus the submission form |
| `#faq` | Cancellation policy, online vs in person, first visit |
| `#contact` | Hours, phone, WhatsApp, where she consults |

The doctor dashboard stays separate: `/doctor` (sign in), `/doctor/appointments`,
`/doctor/availability`, `/doctor/feedback`.

### Design

Fraunces (display + italic accents), Plus Jakarta Sans (body), DM Mono (labels). Warm paper,
deep ink, copper accent from the letterhead. Sections alternate paper / tint / deep / cream, and
reveal on scroll from corners, tilts, blurs and wipes.

## Architecture

```
src/
  app/                     pages + API routes (thin HTTP adapters)
  components/              sections, site chrome, booking, doctor UI, motion system
  lib/                     copy, client types, live-availability hook, .ics
  server/
    booking/service.ts     patient-side business logic  (no HTTP, no React)
    booking/admin.ts       doctor-side business logic
    booking/slots.ts       slot materialisation from weekly rules
    booking/time.ts        clinic-timezone helpers
    db/                    Store contract + two drivers + schema.ts
    notifications/         job scheduling, delivery, templates
    auth/doctor.ts         session cookie (swap for Clerk/Supabase Auth)
    realtime/bus.ts        SSE pub/sub
```

**Business logic never touches HTTP.** Every export in `server/booking/*` takes plain arguments and
returns plain data, so lifting it into a standalone NestJS service later is a move, not a rewrite.

**Slots are rows, not a computation.** `availability_rules` (weekday + window + slot length) are
materialised into a `slots` table for the next eight weeks. That is what makes row-level locking
possible, and what makes a second doctor a matter of inserting rows rather than restructuring.

**Every table carries `doctor_id`** — `doctors`, `patients`, `slots`, `appointments`, `feedback`,
`notifications`, `availability_rules`, `availability_blocks`. There is one doctor today; she is a
row, not a hardcode.

**Double-booking is impossible by construction.** A booking opens a transaction, takes
`SELECT ... FOR UPDATE` on the slot, and a partial unique index on `appointments(slot_id)` backs it
up at the schema level. Verified: two simultaneous bookings on one slot return `201` and `409`.

**An appointment cannot be rewritten by a later one.** It stores the name, phone and email
exactly as given at booking, and everything that describes or contacts an appointment reads
those rather than the linked `patients` row. That row is a directory of latest contact
details, shared by everyone on the same number, so reading history through it meant a second
booking from one phone silently renamed the first. `patients.phone` is deliberately not
unique: a household shares a number, and two people on one phone are two patients.

---

## Storage — two drivers, one contract

| | When | What it is |
| --- | --- | --- |
| **File** | default | JSON document in `.data/`, mutations serialised through a process mutex |
| **Postgres** | `DATABASE_URL` set | real transactions, `FOR UPDATE` row locks, FK constraints |

To move to Supabase or Neon, set the connection string and restart:

```bash
# .env.local
DATABASE_URL=postgresql://...
```

The Postgres driver applies `src/server/db/schema.ts` itself on its first connection,
creating the tables or bringing an older database up to date, then seeds the doctor row
and her consulting rules. A deployment therefore needs nothing but the variable — no
shell step, which matters when the site is administered from a phone. The statements
are all idempotent, guarded by a cheap "is it already current?" check so a warm database
costs nothing on a cold start, and serialised by a Postgres advisory lock so instances
booting together cannot race. `npm run db:setup` runs the same statements from a
terminal, and is optional.

Nothing else changes — `getStore()` picks the driver and every caller is driver-agnostic.

---

## Status — working vs deferred

### Working end to end
- Live calendar, eight-week horizon, per-mode (in-clinic / online) filtering
- Booking with no account — name, phone, email, recorded consent
- Transactional booking with row locking; concurrent bookings correctly refused
- Self-service reschedule and cancel, authorised by reference + phone, 4-hour cutoff
- Slot released back to the public calendar the instant an appointment is cancelled or moved
- Live updates over SSE — a slot taken in one browser disappears in another without a refresh
- Doctor sign-in, appointments board, availability editor, time-off blocks, feedback moderation
- Editing hours rebuilds the calendar without touching a single booked appointment
- Notification jobs: confirmation (immediate), reminder (24h before), feedback request (2h after)
- `.ics` calendar download on confirmation

### Stubbed, and why
| Item | State | To finish |
| --- | --- | --- |
| **Email** | Renders and logs to the server console | Set `RESEND_API_KEY` + a verified sending domain |
| **WhatsApp** | Job rows and templates exist; delivery logs only | MSG91 or Gupshup account, business number, approved templates |
| **Doctor auth** | Signed cookie against env credentials | Swap `server/auth/doctor.ts` for Clerk or Supabase Auth — `requireDoctor()` keeps its signature |
| **Realtime** | In-process pub/sub → SSE (correct for one instance) | Supabase Realtime on `slots`, or Redis pub/sub, behind the same route |
| **Photography** | Only Dr Bansal&rsquo;s portrait is real; there is no clinic yet, so no interiors | Clinic photography once premises open |
| **Testimonials** | None shown; the section explains that approved experiences will appear here | Nothing — the ribbon renders as soon as the first note is approved |
| **Pricing** | Not shown anywhere yet | Confirm indicative ranges, or keep it offline |
| **Map** | Removed — there is no clinic address to map yet | Add when premises open |
| **Payments** | Not built, by design | Razorpay — the booking flow has a clean seam before confirmation |
| **Patient accounts** | Not built, by design | `patients.auth_user_id` is already there; adding login needs no schema change |
| **OTP on booking** | Not built | Optional anti-spam step before confirm; the phone is already collected and validated |

---

## Environment

See `.env.example`. Everything is optional in development; in production, `AUTH_SECRET`,
`DOCTOR_EMAIL` and `DOCTOR_PASSWORD` are required and the app refuses to start without them.

## Notifications

Jobs are rows. A scheduler drains `/api/cron/notifications` every 15 minutes (`vercel.json` has the
Vercel Cron entry); set `CRON_SECRET` and the route requires `Authorization: Bearer <secret>`.
Confirmations are also drained immediately on booking so they do not wait for a tick.

## Deployment

**See [DEPLOY.md](DEPLOY.md)** — Vercel setup, the environment variables it needs, and how to
edit the site from a phone.

- **Frontend + API:** Vercel (single Next.js app; no separate backend needed yet)
- **Database:** Neon or Supabase, free tier to start — **required before real bookings**
- **Email:** Resend
- **Domain:** theskinedit.in

Without `DATABASE_URL` the app falls back to a temp-file store. That is wiped between
serverless invocations, so bookings made on a live deployment will not survive.

## Data protection (DPDP Act 2023)

- Explicit consent is captured at booking and stored as `consent_at`; the checkbox is not pre-ticked
- Only booking details are stored: name, phone, email, slot, and an optional one-line reason
- **No clinical notes or medical history are stored anywhere in this system.** If that scope ever
  changes, the compliance position changes with it — purpose limitation, retention and security
  obligations all tighten. Flag it before building it.
- Patients can request deletion; there is no public endpoint for that yet

---

## What is needed to finish

1. **Photography** — clinic interiors once premises exist, and any consented before/after sets
2. **Confirmation of the European Board claim** — the brief says she is the only dermatologist in India with EBDVD certification. It is currently written as a plain credential, not a boast. Confirm before making it a claim.
3. **Indicative pricing** per treatment, or confirmation that pricing stays offline
4. **A sending domain** for email (e.g. `appointments@theskinedit.in`) plus a Resend account
5. **WhatsApp Business number** and provider account, if WhatsApp reminders are wanted
6. **Dr Bansal's review of the copy** — it was written from her official bio and reads as a clinic
   voice, not a CV; she should own every line
7. **Confirmation of the cancellation window** — 4 hours is the current assumption
8. **A decision on consultation fees online** — not built, but the flow leaves room for it
