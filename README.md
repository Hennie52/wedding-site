# Hennie & Jolinda — Eukalyptus Trouportaal 🌿

A complete, self-contained **Afrikaans wedding portal** — built to match your
Claude Design.

**Guest portal** (`index.html`)
- A private **access gate** — guests type a shared code (on your invitations) to enter
- Hero, live **countdown** to 7 Nov 2026, "Ons storie", weekend **programme**,
  photo **gallery** (with lightbox), accommodation, theme & dress, gifts/banking,
  **Q&A**, and a multi-step **RSVP** (who's coming, sleep-over, Sunday breakfast,
  dietary needs, 3 song requests, a message)

**Admin dashboard** (`admin.html`) — your private login
- **Oorsig** (overview stats) · **Gaste** (RSVP list + detail + CSV export) ·
  **Liedjies** (song requests) · **Begroting** (budget) · **Betalings**
  (payments/suppliers) · **Kamers/Tafels/Vloer/Groepe** (seating & room planner) ·
  **Redigeer teks** (edit every word on the site) · **Instellings** (gate code, date, venue)

Your text edits show on the live site **instantly** — no redeploy needed.

> **Start here.** Below is how to test it now, then the 3 manual steps (with guides).

---

## ⚡ The 3 things only you can do (≈ 30–45 min)

| Step | What | Guide | Cost |
|------|------|-------|------|
| 1 | Create the free database (Supabase) | [`docs/01-SUPABASE-OPSTELLING.md`](docs/01-SUPABASE-OPSTELLING.md) | Free |
| 2 | Put the site online (free host) | [`docs/02-ONTPLOOI.md`](docs/02-ONTPLOOI.md) | Free |
| 3 | Buy & connect a `.co.za` address | [`docs/02-ONTPLOOI.md`](docs/02-ONTPLOOI.md) | ~R80–150/yr |

Editing your text afterwards: [`docs/03-REDIGEER-TEKS.md`](docs/03-REDIGEER-TEKS.md).

---

## 🖥️ Test it on your computer right now (no setup needed)

1. Open a terminal in this `Website` folder.
2. First time only: `npm install`
3. Start it: `npm run dev`
4. Open **http://localhost:3000**
5. At the gate, type the demo code **`troue2026`** to enter.

You'll see the site exactly as guests will. In this "demo mode" RSVPs aren't
**saved** yet (a note shows after you submit) — that switches on automatically
once you finish Step 1 (Supabase). The admin page will say "not set up yet" until
then. Press **Ctrl + C** to stop.

---

## 📁 What's in this folder

```
Website/
├─ public/                     ← THIS is your website (the part that goes online)
│  ├─ index.html               ← the guest portal
│  ├─ admin.html               ← your private admin dashboard
│  ├─ beplanner.html           ← the seating/room planner (used inside admin)
│  └─ assets/
│     ├─ css/   portal.css, admin.css
│     ├─ js/
│     │  ├─ config.js          ← ⚠️ paste your Supabase keys here (Step 1)
│     │  ├─ content-schema.js  ← every editable text field + Afrikaans defaults
│     │  ├─ portal.js          ← guest-site logic
│     │  └─ admin.js           ← admin logic
│     └─ foto/                 ← your optimised photos + gallery.json
├─ supabase/schema.sql         ← paste this into Supabase once (Step 1)
├─ docs/                       ← the three step-by-step guides
├─ scripts/                    ← image optimiser + local test server
└─ design-import/              ← your original Claude Design files (reference only, not deployed)
```

---

## ✏️ How editing works

- **Text & photos** (names, dates, story, programme, accommodation, Q&A, bank, the
  **gate code**, section photos, **and the gallery**) → all edited in **Admin →
  Redigeer teks**, which is laid out like a copy of your front page. Text supports
  **bold**/*italic*; photos upload straight from your computer (auto-resized). Shows
  on the live site immediately — no redeploy. *(Photo upload needs the one-time
  storage step — see [`docs/03-REDIGEER-TEKS.md`](docs/03-REDIGEER-TEKS.md).)*
- **Budget & payments** → saved to your database (synced across devices).
- **Seating & rooms planner** → saved **in the browser you use** (per-device).

---

## 🔁 Changing photos later

The portal uses photos named for their spot: `wandel` (hero), `ring` &
`opgooi` (story), `familie` (theme), plus the 8-photo gallery. To swap them, put
new images with the **same names** into
`design-import/eucalyptus-wedding-portal/project/assets/foto/` and run:

```
node scripts/optimize-design-images.mjs
```

Then re-deploy (Step 2).

---

## ❓ Help

Each guide in `docs/` spells out every click. Start with
[`docs/01-SUPABASE-OPSTELLING.md`](docs/01-SUPABASE-OPSTELLING.md).
