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
| `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://the-skin-edit.vercel.app` (no trailing slash) |

**Optional, add when ready:**

| Name | What it turns on |
| --- | --- |
| `DATABASE_URL` | Real Postgres. **Read the warning below.** |
| `RESEND_API_KEY` | Sends confirmation emails for real instead of logging them |
| `NOTIFICATION_FROM` | e.g. `The Skin Edit <appointments@theskinedit.in>` |
| `CRON_SECRET` | Locks the cron endpoint to Vercel's scheduler |

### 3. Custom domain (whenever you have one)

**Project → Settings → Domains → Add** `theskinedit.in`, then point the DNS records
Vercel shows you at your registrar. Update `NEXT_PUBLIC_SITE_URL` to match afterwards.

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

---

## Automatic reminders

`vercel.json` schedules `/api/cron/notifications` once a day at 08:30 IST, which is
the fastest a Vercel Hobby account allows. On a Pro account, change the schedule to
`*/15 * * * *` for quarter-hourly checks, which makes reminders and feedback requests
land much closer to their intended time.
