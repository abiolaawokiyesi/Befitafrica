# BefitAfrica Backend — Setup Guide (Supabase)

This turns BefitAfrica from a single-device app into a real **multi-user, multi-device** app. After this, when a member registers on their phone, you (admin) see them immediately, and accounts you create can be logged into from anywhere.

**Recommendation:** we're using **Supabase** — a free, hosted backend with a real database and built-in login + email verification. No server for you to run or maintain. The free tier covers far more than BFA needs.

Estimated time: ~30–40 minutes, no coding.

---

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and click **Start your project** → sign in with GitHub or email.
2. Click **New project**.
   - **Name:** BefitAfrica
   - **Database password:** choose a strong one and save it somewhere safe.
   - **Region:** pick the closest (e.g. *West EU (London)* or *Africa* if shown).
3. Click **Create new project** and wait ~2 minutes for it to provision.

---

## Step 2 — Create the database tables

1. In your project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file **`schema.sql`** (included in this folder), copy ALL of it, paste into the editor.
4. Click **Run**. You should see "Success." This creates all the tables (members, activities, attendance, events, challenges, messages, health logs) and the security rules.

---

## Step 3 — Turn on email verification

1. Go to **Authentication → Providers → Email**.
2. Make sure **Email** is enabled and **Confirm email** is ON. (This is the real two-way verification — Supabase emails each new member a confirmation link automatically, and they can't log in until they click it.)
3. Go to **Authentication → URL Configuration** and set **Site URL** to your live app address (e.g. `https://befitafrica.vercel.app`). This is where the confirmation link sends people back.

> Supabase's built-in email works out of the box for testing. For production volume, connect your own email sender under **Authentication → Emails → SMTP** later (optional).

---

## Step 4 — Your keys are already filled in ✓

Your Project URL and anon public key have already been added to **`data-supabase.js`**, and **`index.html`** is already wired to load it. You do not need to edit either file.

(For reference, the values used: project `uhtwarstkylpqjvzunna.supabase.co`. If you ever rotate your anon key in Supabase, update the top of `data-supabase.js`.)

## Step 5 — Already wired ✓

`index.html` already includes the Supabase library and loads `data-supabase.js` after `data.js`. The `app.js` cloud edits are already applied too (see APP_CHANGES.md). Nothing to do here — just deploy all the files together (including `data-supabase.js`).

---

## Step 6 — Create the admin account (Abiola)

1. Run the app, go to **Create account**, and register with `abiola@befitafrica.org`.
2. Check that email's inbox and click the Supabase confirmation link.
3. Back in Supabase, open the **SQL Editor** and run:
   ```sql
   update public.members set role='admin', verified=true
   where email='abiola@befitafrica.org';
   ```
   This promotes that account to administrator (the only one who can manage members, hubs, analytics, and reset passwords).

That's it. From now on:
- Members register on their own phones → they appear in your Members list instantly.
- You create or edit accounts → those people can log in from any device.
- Clock-ins, activities, the leaderboard, chat, events and challenges are all shared across the whole community in real time.

---

## Costs

Supabase free tier: 50,000 monthly active users and 500 MB database — well beyond BFA's needs for a long time. If BFA grows past that, the Pro plan is ~US$25/month. No charges unless you choose to upgrade.

## Where your data lives

Everything is in your own Supabase project's Postgres database. You can view/export it anytime from the Supabase **Table Editor**, and it's standard SQL, so you're never locked in.
