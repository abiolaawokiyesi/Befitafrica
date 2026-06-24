# BefitAfrica (BFA)

**Africa's No. 1 Fitness NGO — "Fit to Lead."**

BefitAfrica is a community fitness web application for members across hubs in Lagos, Nigeria and beyond — live GPS activity tracking on a real map, clock-in/clock-out attendance, health monitoring, community chat, challenges, events, and hub management.

Built as a **zero-build static app** (plain `React.createElement`, no Node build step) so it deploys by dragging files into GitHub and letting Vercel auto-deploy.

---

## Features

- **Live GPS Activity Tracking** — real geolocation on a real **OpenStreetMap** map (via Leaflet). Walk / Run / Jog / Cycling / Hike / HIIT / Treadmill / Swim, with a live route line, GPS accuracy circle, real distance (haversine, accuracy-filtered), pace, heart rate, calories and step estimation.
- **Attendance Clock** — members clock in and out of fitness programs at their hub; the most active members appear on a leaderboard.
- **Health Dashboard** — log weight, blood pressure, heart rate, steps, blood sugar and more; track progress over time with a BFA Impact Score derived from real activity.
- **Registration** — full onboarding: occupation (50 + "Other"), all world countries, Nigeria's 36 states + FCT with every Local Government Area, address (used to assign the nearest hub), body metrics, fitness goals and a participation waiver.
- **Email verification** — new members verify before activation (see note below).
- **Persistent login** — members stay signed in across sessions.
- **Community** — general, inter-hub and intra-hub chat channels.
- **Challenges & Events** — admins create them; members join and register.
- **Admin (Abiola only)** — member management with full biodata and password reset, hub management, and analytics computed from real member data. Restricted to the Executive Director.
- **Fully responsive** — phones, tablets and desktops, with a mobile bottom-nav and drawer.

---

## Starts clean and real

The app ships ready for real use:

- The only pre-existing account is the **administrator** (the Executive Director). There are no demo members or fake statistics.
- New members start with **zero data** — distance, sessions, streak and health metrics all begin blank and grow only as the member actually trains, attends, and logs health checks.
- Events, challenges, hub membership, community messages and health logs all begin empty and fill with real activity.

### Administrator login

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | abiola@befitafrica.org | BFA@2026 |

Change this password after first sign-in (Settings). Only the admin can manage members, hubs, analytics, and reset passwords.

---

## Project files

```
index.html            App shell, fonts, animations, Leaflet + script tags
data.js               Reference data + persistence (members, countries, states/LGAs, occupations, goals, hubs, live stores)
app.js                The full application (all React components)
bfa-logo.png          BefitAfrica logo (transparent background)
package.json          Project metadata + local dev script
vercel.json           Vercel config (clean URLs, security headers)
.gitignore            Files Git should ignore
DEPLOYMENT_GUIDE.md   Step-by-step deployment for non-developers
email-verification-backend/   Reference code to add real two-way email verification later
```

---

## Run locally

No build step. From the project folder:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

> GPS tracking needs **HTTPS** in the browser. On `localhost` it works for testing; once deployed to Vercel (HTTPS) it works on real devices. Accuracy depends on the device's hardware and open-sky conditions.

---

## Notes on email & data

- **Email verification:** sending real verification emails requires a backend mail service. In this static deployment the verification step is completed in-app (the member confirms their address to activate). The flow, tokens and "unverified users can't log in" rule are all real; only outbound email delivery needs a backend. Reference code to add real two-way verification (clickable link + 6-digit OTP) is included in `email-verification-backend/`.
- **Storage:** member, activity, attendance, event, challenge, message and health data is stored in the browser's `localStorage`. Perfect for launch, demos and single-device use. Multi-user, multi-device persistence requires a backend database (a planned next step).

---

© 2026 BefitAfrica. All rights reserved.
