# Step 4 — Use your admin dashboard ✏️

Everything on the site is yours to change, from **`/admin.html`** — log in with
the email & password you created in Supabase (Step 1.3). Text changes appear on
the live site **instantly**.

---

## The tabs

- **Oorsig** — at-a-glance numbers: who's coming, total guests (for catering),
  song requests, days to go.
- **Gaste** — every RSVP. Click a row for the full answer; search/filter; **Voer
  uit (CSV)** downloads the list for Excel.
- **Liedjies** — all the song requests from guests (links open to listen).
- **Begroting** — your budget: edit *begroot / bestee / betaal* per line; totals
  update live. (Saved to your database — synced.)
- **Betalings** — suppliers & payments; click a status to cycle
  *uitstaande → deposito → betaal*.
- **Kamers / Tafels / Vloer / Groepe** — drag guests into rooms and tables, lay
  out the floor plan, and group guests. *(Saved to your database — synced across
  devices.)*
- **Redigeer teks** — your **live front page** with edit buttons (see below).
- **Instellings** — the key settings: **gate code**, names, date, venue, etc.

---

## ⭐ Change these first

- **Instellings** → the **Toegangskode** (the code guests type to enter — print it
  on your invitations), the **wedding date/time** (used by the countdown), and the
  **venue**.
- **Redigeer teks** → fill in the placeholders marked with `[ ... ]` or `—`:
  - **Ons storie** (chapters 1 & 2) — your real story 💛
  - **Program** — adjust the Friday/Saturday/Sunday timeline
    (one line each: `tyd | titel | beskrywing`)
  - **Verblyf** — your accommodation options (`naam | afstand | beskrywing`)
  - **Geskenke** → **Bankbesonderhede** (`etiket | waarde`)
  - **Vrae & antwoorde** — the Q&A (`vraag | antwoord`)
  - **Kontak** — Hennie & Jolinda's phone numbers
- After any change, scroll down and click **Stoor**.

> **List fields** (program, accommodation, bank, Q&A) use one item per line, with
> parts separated by `|`. The hint under each box shows the exact format.

---

## ✨ The live editor (Redigeer teks)

The **Redigeer teks** tab shows your **actual front page** with editing switched on.
Hover over anything and it highlights; click to change it. Every change **saves
straight to the database** and shows on the live site immediately.

- **Edit any text** → click it. A box opens with the words. Make it **bold** with
  `**asterisks**` or *italic* with `*one asterisk*`. Click **Stoor**.
- **Replace any photo** → click the photo (Hero, story photos, Tema). Pick a file —
  it's **resized automatically** and uploaded.
- **Lists** (Program, Verblyf, Vrae & antwoorde, Bankbesonderhede) → each has an
  **"✎ Wysig …"** button. One item per line, parts separated by `|` (the hint in the
  box shows the exact format).

### "Ons storie" — add / remove / flip blocks
- Click a story block to edit its **chapter label, title, text, and photo**.
- The **"⟵ Foto: links / Foto: regs ⟶"** button flips the photo to the left or right
  with the text on the other side.
- **"Verwyder blok"** removes it; **"+ Voeg storie-blok by"** (under the section)
  adds a new one.

### Gallery
- Under the gallery, click **"⚙ Bestuur galery-foto's"** to upload many photos at
  once, reorder them (↑ ↓), give captions, or remove them. Click **Stoor**.

> **One-time step for photos:** uploading needs the storage area. In Supabase →
> **SQL Editor**, paste **all** of `supabase/schema.sql` and **Run** it again (safe
> to re-run) — this adds the `foto` storage bucket. You only do this once.

Photos are resized in your browser before upload, so even big phone photos stay fast.

---

## Tips

- The **countdown date** must look like `2026-11-07T16:00:00` (year-month-day T
  hour:minute). 
- To **hide** something (e.g. a bank line), clear that line and save.
- Forgot your admin password? Reset it in Supabase → **Authentication → Users →**
  click your user.
- The **gate**: guests only need to enter the code once per device. To preview the
  site as a guest again, open it in a private/incognito window.
