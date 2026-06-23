# BefitAfrica (BFA)

**Africa's No. 1 Fitness NGO — "Fit to Lead."**

BefitAfrica is a community fitness web application for members across hubs in Lagos, Nigeria and beyond. It is a full-featured community platform — live GPS activity tracking, clock-in/clock-out attendance, health monitoring, community chat, challenges, events, and hub management.

Built as a **zero-build static app** (plain `React.createElement`, no Node build step) so it can be deployed by dragging files into GitHub and letting Vercel auto-deploy.

---

## Features

- **Live GPS Activity Tracking** — real geolocation (Walk / Run / Jog / Cycling / Hike / HIIT and more) with a hyperrealistic 3D map, real distance via the haversine formula, pace, heart rate, calories and steps. Comparable to Strava / Nike Run Club.
- **Attendance Clock** — members clock in and out of fitness programs at their hub; the most active members are recognised on a leaderboard.
- **Health Dashboard** — BMI, weight, blood pressure, resting heart rate, blood sugar and a 6-month progress timeline, plus a BFA Impact Score.
- **Registration** — full member onboarding: occupation (50 options + "Other"), all world countries, Nigeria's 36 states + FCT with every Local Government Area, address (used to assign the nearest hub), body metrics, fitness goals and a participation waiver.
- **Email verification** — new members verify their email before activation. (See note on email below.)
- **Persistent login** — members stay signed in across sessions; no re-registration each visit.
- **Community** — general, inter-hub and intra-hub chat channels.
- **Challenges & Events** — join challenges, register for events, view leaderboards.
- **Admin (Abiola only)** — member management with full biodata and password reset, hub management, and analytics. These controls are restricted to the Executive Director.
- **Fully responsive** — works on phones, tablets and desktops, with a mobile bottom-nav and drawer.

---

## Demo accounts

| Role   | Email                     | Password   |
|--------|---------------------------|------------|
| Admin  | abiola@befitafrica.org    | BFA@2026   |
| Member | tunde@befitafrica.org     | member123  |

Only the admin account (Abiola Awokiyesi, Executive Director) can access member management, hubs, analytics, and password resets.

---

## Project files

```
index.html            App shell, fonts, animations, script tags
data.js               Reference data + persistence (members, countries, states/LGAs, occupations, goals, hubs)
app.js                The full application (all React components)
bfa-logo.png          BefitAfrica logo
package.json          Project metadata + local dev script
vercel.json           Vercel config (clean URLs, security headers)
.gitignore            Files Git should ignore
DEPLOYMENT_GUIDE.md   Step-by-step deployment for non-developers
```

---

## Run locally

No build step. From the project folder:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

> GPS tracking needs **HTTPS** to work in the browser. On `localhost` it works for testing; once deployed to Vercel (which is HTTPS) it works on real devices. GPS accuracy also depends on the device's hardware.

---

## Notes on email & data

- **Email verification:** sending real verification emails requires a backend mail service. In this static deployment the verification step is simulated in-app (the member taps a "verify" button that stands in for the email link). The flow, tokens and "unverified users can't log in" rule are all real; only the email delivery is mocked. Adding a small backend later enables real emails with no UI changes.
- **Storage:** member and activity data is stored in the browser's `localStorage`. This is perfect for demos and single-device use. Multi-user, multi-device persistence requires a backend database (a planned future step).

---

© 2026 BefitAfrica. All rights reserved.
