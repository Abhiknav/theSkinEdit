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

That is all three. **You do not need to set a site URL** — the app reads Vercel's own
`VERCEL_PROJECT_PRODUCTION_URL`, which is always present and switches to your custom
domain by itself the day you add one. Set `NEXT_PUBLIC_SITE_URL` only if you want to
force a specific address; it overrides everything else.

**Optional, add when ready:**

| Name | What it turns on |
| --- | --- |
| `DATABASE_URL` | Real Postgres. **Read the warning below.** |
| `RESEND_API_KEY` | Sends confirmation emails for real instead of logging them |
| `NOTIFICATION_FROM` | e.g. `The Skin Edit <appointments@theskinedit.in>` |
| `CRON_SECRET` | Locks the cron endpoint to Vercel's scheduler |

### 3. Custom domain (whenever you have one)

**Project → Settings → Domains → Add** `theskinedit.in`, then point the DNS records
Vercel shows you at your registrar. Nothing else to change — links in emails and the
page metadata follow the new domain on the next deploy by themselves.

---

## ⚠️ Bookings do not persist yet

Without `DATABASE_URL`, the app stores data in a temporary file on the server.
On Vercel that file lives in a scratch directory that **is wiped between requests**,
so appointments made on the live site can vanish.

**This is fine for reviewing the design. It is not fine for real patients.**

To fix it, takes about ten minutes:

1. Create a free Postgres database at **https://neon.tech** or **https://supabase.com**
2. Copy the connection string into Vercel as `DATABASE_URL`
3. Run the schema once from your laptop:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:setup
   ```
4. Redeploy

Everything else is already written for it — the Postgres driver, transactions and
row locks exist and only wait for that one variable.

---

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

