# Deploying — and editing from your phone

The site is a Next.js app with API routes, so it needs a host that runs server code.
GitHub Pages cannot serve it. Vercel can, and it deploys straight from this repo.

---

## One-time setup (5 minutes, on a laptop)

### 1. Import the repo into Vercel

1. Go to **https://vercel.com/new**
2. Sign in **with GitHub** (use the account that owns `Abhiknav/theSkinEdit`)
3. Find **theSkinEdit** in the list and press **Import**
4. Leave every build setting alone — Vercel detects Next.js on its own
5. Add the environment variables below *before* pressing Deploy (or add them after
   and redeploy)
6. Press **Deploy**

You get a live URL like `https://the-skin-edit.vercel.app` in about two minutes.

### 2. Environment variables

In Vercel: **Project → Settings → Environment Variables**. Tick *Production*,
*Preview* and *Development* for each.

**Required — the doctor dashboard throws without these:**

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | Any long random string. Generate one at https://generate-secret.vercel.app/32 |
| `DOCTOR_EMAIL` | The email Dr Bansal signs in with |
| `DOCTOR_PASSWORD` | A real password — **not** the `skinedit` dev default |
| `DATABASE_URL` | Postgres connection string. Not needed to preview the design, but **appointments are lost without it** — see [Connecting the database](#️-connecting-the-database) |

**You do not need to set a site URL** — the app reads Vercel's own
`VERCEL_PROJECT_PRODUCTION_URL`, which is always present and switches to your custom
domain by itself the day you add one. Set `NEXT_PUBLIC_SITE_URL` only if you want to
force a specific address; it overrides everything else.

**Optional, add when ready:**

| Name | What it turns on |
| --- | --- |
| `RESEND_API_KEY` | Sends confirmation emails for real instead of logging them |
| `NOTIFICATION_FROM` | e.g. `The Skin Edit <appointments@theskinedit.in>` |
| `CRON_SECRET` | Locks the cron endpoint to Vercel's scheduler |

### 3. Custom domain (whenever you have one)

**Project → Settings → Domains → Add** `theskinedit.in`, then point the DNS records
Vercel shows you at your registrar. Nothing else to change — links in emails and the
page metadata follow the new domain on the next deploy by themselves.

---

## ⚠️ Connecting the database

**Until `DATABASE_URL` is set, appointments are lost.** Without it the app falls back
to a file store. On Vercel that file lives in the temp directory of whichever server
instance handled the request — not shared with the other instances, and wiped when one
restarts. So a patient books, sees a confirmation, and the appointment is simply not in
the diary when you open it. Nothing errors; it just is not there. The dashboard shows a
warning while the site is in this state.

The Postgres driver, schema, transactions and row locks are already written. Connecting
a database is the only step left, and it takes about ten minutes.

### 1. Create the database

Either provider is free to start and both work as-is:

- **Neon** — https://neon.tech → *New Project* → copy the connection string shown
- **Supabase** — https://supabase.com → *New Project* → *Connect* → *Connection string*
  → **URI**, and replace `[YOUR-PASSWORD]` with the database password you chose

You want the string that begins `postgresql://`. Either provider's pooled or direct
string works; TLS is handled by the app, so no `sslmode` parameter is needed.

### 2. Create the tables, once, from a laptop

From the project folder, with your own connection string in the quotes:

```bash
npm install
DATABASE_URL="postgresql://..." npm run db:setup
```

It prints `Schema applied.` and creates eight tables: `doctors`, `patients`,
`availability_rules`, `availability_blocks`, `slots`, `appointments`, `feedback`,
`notifications`. The script is idempotent — running it twice is harmless, so it is also
how you apply schema changes later.

### 3. Give the variable to Vercel

**Project → Settings → Environment Variables → Add**

- Name: `DATABASE_URL`
- Value: the same connection string
- Tick **Production**, **Preview** and **Development**

### 4. Redeploy

**Deployments → the most recent one → ⋯ → Redeploy.** Environment variables are read at
build and boot, so an existing deployment will not pick it up on its own.

On the first request after that, the app inserts Dr Bansal's record and her four
weekly consulting rules by itself. There is nothing to seed by hand.

### 5. Check it worked

1. Open the live site and book a test appointment
2. Sign in at `/doctor` — it should appear under **Upcoming**, and the storage warning
   on that page should be gone
3. Cancel the test appointment; the slot returns to the calendar immediately

If the warning is still there, `DATABASE_URL` did not reach the running deployment —
check the spelling of the variable name and that you redeployed after adding it.

### Anything already booked is gone

Appointments taken before the database existed were only ever in a temp folder. They
cannot be recovered, so anyone who booked will need to book again.

### One thing to decide first

`patients.phone` is currently `unique`, and a booking overwrites the name and email on
the matching row. Two people sharing a phone number — common in a family — end up on
one record, and the newer booking silently renames the older appointment. Fixing that
properly changes the schema, so it is much easier to do **before** this database has
real appointments in it than after.

## Vercel Hobby is free — but not for a clinic

Vercel’s free Hobby plan is **non-commercial personal use only**. Their fair use
guidelines define commercial usage as any deployment used for the financial gain of
anyone involved in producing it, and list *“advertising the sale of a product or
service”* and *“receiving payment to create, update, or host the site”* as examples.

A clinic site that advertises consultations and takes appointments is commercial.
**The live site needs a Pro plan — $20 per developer per month.** Vercel does enforce
this and can pause deployments.

Hobby is fine while this is a private preview with no patients on it. It is not a
long-term answer.

### Capacity is not the problem

Hobby includes 1,000,000 function invocations, 100 GB data transfer and 4 CPU-hours a
month. A single-doctor clinic will not come close to any of those. The only reason to
pay is the commercial-use clause — and the cron limit below.

### What Hobby actually restricts for this app

| | Hobby | Pro |
| --- | --- | --- |
| Cron frequency | **once per day**, fired anywhere in a ±59 min window | once per minute, precise |
| Function max duration | 300s (5 min) | 300s, configurable higher |

The cron limit is why `vercel.json` schedules the notification job daily. A faster
expression **fails at deploy time** on Hobby with “Hobby accounts are limited to daily
cron jobs”. On Pro, change it to `*/15 * * * *` so reminders and feedback requests land
near their intended time.

The 5-minute function ceiling means the live-calendar connection reconnects every few
minutes rather than staying open indefinitely. Booking is correct either way and the
calendar re-reads on each reconnect.

---

## Editing from your phone

Once Vercel is connected, **every push to `main` deploys automatically.** No commands,
no laptop.

### The easy way — GitHub in a mobile browser

1. Open **https://github.com/Abhiknav/theSkinEdit** on your phone
2. Navigate to the file you want to change
3. Tap the **pencil ✏️** icon
4. Make your edit
5. Scroll down, tap **Commit changes**
6. Wait ~2 minutes — Vercel builds and the live site updates

The GitHub mobile app works the same way, and Vercel's own app (iOS/Android) will
show you the build progress and notify you when it is live.

### What you can safely change from a phone

Almost all the words on the site live in **one file**:

**`src/lib/content.ts`**

| Looking for | Find this in the file |
| --- | --- |
| The big headline | `HERO` → `title` and `accent` |
| Paragraph under the headline | `HERO` → `sub` |
| The four credentials in the hero | `HERO_FACTS` |
| About text | `ABOUT` → `body` |
| Treatment names and descriptions | `SERVICES` |
| The three rules | `APPROACH` |
| FAQ questions and answers | `FAQS` |
| Phone, email, consulting hours | `CLINIC` |

Change the text between the quote marks. Leave the punctuation around it alone —
the commas, quotes and braces are what keep the file valid.

**If a build fails**, Vercel emails you and the live site stays on the last working
version. Nothing breaks for patients. Go back to the file, fix the typo, commit again.

### Changing Dr Bansal's photograph

Replace `public/dr-akshi-bansal.jpg` with a new file of the same name. On a phone:
open that file on GitHub → **⋯** → **Delete**, commit, then **Add file → Upload files**
with the new one named exactly `dr-akshi-bansal.jpg`.

---

## Preview before it goes live

Any branch other than `main` gets its own preview URL instead of touching the live
site. From a phone, when GitHub asks where to commit, choose **"Create a new branch
and start a pull request"** — Vercel comments on the pull request with a preview link.
Merge it when you are happy.

