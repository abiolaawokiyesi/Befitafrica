# BefitAfrica — Deployment Guide (for non-developers)

This guide gets BefitAfrica live on the internet using **GitHub** + **Vercel**. No coding or build tools required. Takes about 10 minutes.

You will upload 7 files. That's it.

---

## What you need

1. A free **GitHub** account — https://github.com
2. A free **Vercel** account — https://vercel.com (sign up with your GitHub account to make this easier)
3. The BefitAfrica project files (the ones in this folder):
   - `index.html`
   - `data.js`
   - `app.js`
   - `bfa-logo.png`
   - `package.json`
   - `vercel.json`
   - `.gitignore`

> Keep all 7 files together. Do **not** rename them.

---

## Step 1 — Create a GitHub repository

1. Go to https://github.com and sign in.
2. Click the **+** (top-right) → **New repository**.
3. Name it `befitafrica` (or anything you like).
4. Leave it **Public** (or Private — both work with Vercel).
5. Click **Create repository**.

---

## Step 2 — Upload the files

1. On the new empty repository page, click **uploading an existing file** (the link in the middle of the page).
2. Drag all 7 BefitAfrica files into the upload box.
   - If your computer hides files that start with a dot, the `.gitignore` may not appear — that's fine, it's optional for the app to run.
3. Scroll down and click **Commit changes**.

---

## Step 3 — Deploy with Vercel

1. Go to https://vercel.com and sign in **with GitHub**.
2. Click **Add New… → Project**.
3. Find your `befitafrica` repository and click **Import**.
4. Leave every setting at its default. **Do not** set a build command or framework — this is a static app.
   - Framework Preset: **Other**
   - Build Command: leave empty
   - Output Directory: leave empty
5. Click **Deploy**.

After about a minute you'll get a live URL like `https://befitafrica.vercel.app`. Open it — BefitAfrica is live.

---

## Step 4 — Log in

Use the administrator account:

- **Email:** abiola@befitafrica.org
- **Password:** BFA@2026

Change this password after your first sign-in (Settings). Only this account can manage members, hubs, analytics and reset passwords. There are no demo members — the community starts empty and grows as real people register.

---

## Making changes later

To update the app (for example, a new logo or text):

1. Open your repository on GitHub.
2. Click the file you want to change → the pencil (✏️) icon → edit → **Commit changes**.
   - To replace the logo, delete `bfa-logo.png` and upload a new file with the **same name**.
3. Vercel automatically redeploys within a minute. Refresh your site to see the change.

---

## Important notes

- **GPS tracking:** the app shows a real **OpenStreetMap** map and draws each member's live route on it. This works automatically on your Vercel site because Vercel serves over HTTPS (required for browser location). Accuracy depends on each member's device and open-sky conditions. The first time a member starts an activity, their browser asks for location permission — they must tap **Allow**. The map needs an internet connection to load its map tiles.
- **Email verification:** members confirm their email in-app to activate their account, and unverified accounts cannot log in. Sending the actual confirmation email requires a backend mail service. Reference code to add real two-way verification (clickable link + 6-digit code) is included in the `email-verification-backend/` folder for when you're ready to add a backend.
- **Data storage:** information is saved in each visitor's browser (localStorage). Great for demos and pitches. For shared, multi-device data you'll later add a database — that's a planned next step and doesn't change anything you deploy today.

---

## Troubleshooting

- **Blank page:** make sure `index.html`, `data.js` and `app.js` are all in the repository and spelled exactly. `data.js` must be present — the app needs it.
- **Logo missing:** confirm the file is named exactly `bfa-logo.png`.
- **GPS not working:** confirm you're on the `https://…vercel.app` URL (not a local file), and that the member tapped **Allow** for location.

---

Need help? Keep this guide handy and follow the steps in order. © 2026 BefitAfrica.
