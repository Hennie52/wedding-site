# Step 1 — Set up the database (Supabase) 🗄️

This is where guests' RSVPs get saved, and where your editable text lives.
It's **free**. Takes about 15 minutes. Do this once.

---

## 1.1 Create a Supabase account & project

1. Go to **https://supabase.com** and click **Start your project** → sign up
   (the free plan is perfect — no card needed).
2. Click **New project**.
3. Fill in:
   - **Name:** `hennie-jolinda` (anything you like)
   - **Database Password:** click *Generate a password* and **save it somewhere**
     (you won't need it often, but keep it safe).
   - **Region:** choose the one closest to South Africa — **`West EU (London)`**
     or **`Central EU (Frankfurt)`** are the best choices.
4. Click **Create new project** and wait ~2 minutes while it sets up.

---

## 1.2 Create the tables (paste the SQL)

1. In the left menu, click **SQL Editor**.
2. Click **+ New query**.
3. Open the file **`supabase/schema.sql`** from this project, copy **everything**
   in it, and paste it into the editor.
4. Click **Run** (bottom right).
5. You should see **"Success. No rows returned"** — that's correct. ✅

This creates the tables (`content`, `rsvps`, `planner`), a **photo storage area**
(the `foto` bucket, for photos you upload in the admin), and the security rules that
let guests submit RSVPs while keeping the guest list, planner and uploads private to
you. It's safe to **re-run this whole script any time** (e.g. after an update) — it
won't delete your data.

---

## 1.3 Create your admin login

This is the email + password *you* will use to log into the Admin page.

1. Left menu → **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter **your email** and a **password you'll remember**.
4. ✅ Tick **Auto Confirm User** (so you can log in immediately).
5. Click **Create user**.

**Recommended (for safety):** stop random people from signing up.
- Left menu → **Authentication** → **Sign In / Providers** (or **Providers** →
  **Email**).
- Turn **OFF** "Allow new users to sign up" (also called *Enable signups*).
- Your own login still works; this only blocks strangers from creating accounts.

---

## 1.4 Copy your keys into the site

1. Left menu → **Project Settings** (the gear) → **API**.
2. You'll see:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Project API keys → `anon` `public`** — a long string.
3. Open the file **`public/assets/js/config.js`** in this project and paste them:

   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abcdefgh.supabase.co",   // ← your Project URL
     anonKey: "eyJhbGciOi....(long key)",   // ← your anon public key
   };
   ```

> 🔒 **Is it safe to put these in the file?** Yes. The `anon public` key is
> designed to be used in the browser. Your database is protected by the security
> rules from step 1.2 — the key alone can't read your RSVP list or change your
> text. Only your logged-in admin account can.

---

## 1.5 Test it locally

1. In the terminal: `npm run dev`
2. Open **http://localhost:3000**.
3. At the gate, type the code **`troue2026`** (you can change this later — see
   below) and enter.
4. Scroll to **RSVP**, fill it in, and submit — the thank-you message should now
   appear **without** the "demo mode, not saved" note ✅ (that means it saved).
5. Go to **http://localhost:3000/admin.html**, log in with the email/password
   from step 1.3, then check:
   - **Gaste** tab → your test RSVP is there (click the row for full detail; try
     "Voer uit (CSV)").
   - **Oorsig** → the counts updated.
   - **Redigeer teks** → change something, click **Stoor**, refresh the main site
     to see it update live.

## 1.6 Set your own gate code

The site ships with the demo code `troue2026`. To change it:
- Admin → **Instellings** (or **Redigeer teks**) → **Toegangskode** → type your
  own code (e.g. `hjtroue`) → **Stoor**. Print that code on your invitations.

🎉 Your database is fully set up. Next: **[Step 2 — Deploy & domain](02-ONTPLOOI.md)**.

---

### Troubleshooting

- **RSVP still shows "demo mode, not saved"?** Check `config.js` — both `url` and
  `anonKey` must be filled in (with quotes), then refresh.
- **RSVP says it failed?** Make sure you ran the SQL in step 1.2 (the `rsvps`,
  `content` and `planner` tables must exist).
- **Admin says "not set up yet"?** Same as above — `config.js` needs your keys.
- **Can't log in to admin?** Re-check the email/password, and that you ticked
  *Auto Confirm User*. Reset a password under Authentication → Users → (click the
  user).
