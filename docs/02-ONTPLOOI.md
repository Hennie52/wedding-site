# Step 2 & 3 — Put the site online + connect a domain 🌍

We'll host the site **free** on **Netlify**, then point a South African
**`.co.za`** web address at it. (Cloudflare Pages instructions are at the bottom
as an alternative — either is fine.)

> Do **Step 1 (Supabase)** first, so the live site can save RSVPs.

---

## Step 2 — Deploy (free) on Netlify

### Option A — Drag & drop (easiest, 2 minutes)

Great for getting online fast.

1. Go to **https://app.netlify.com** and sign up (free, use Google/GitHub/email).
2. Once logged in, go to **https://app.netlify.com/drop**.
3. Open your file explorer to this project and drag the **`public`** folder
   onto the page. **Important: drag the `public` folder, not the whole project.**
4. Wait ~20 seconds. Netlify gives you a live link like
   `https://random-name-12345.netlify.app`. **Your site is live!** 🎉
5. Test it: open the link, submit a test RSVP, log into `/admin.html`.

> ⚠️ With drag & drop, whenever you change **code or photos** you must drag the
> `public` folder again to update. (Changing **text** via the Admin page needs no
> re-upload — it's instant.) For easy updates, consider Option B.

### Option B — Connect to GitHub (auto-updates, recommended long-term)

So that future changes deploy automatically when you save them.

1. Create a free **GitHub** account (https://github.com) if you don't have one.
2. Create a new empty repository, e.g. `wedding-site`.
3. In a terminal in this `Website` folder:
   ```
   git add .
   git commit -m "Wedding site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/wedding-site.git
   git push -u origin main
   ```
4. In Netlify: **Add new site → Import an existing project → GitHub →** pick your
   repo.
5. Set:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `public`
6. Click **Deploy**. Done — and every `git push` now updates the site.

---

## Step 2.5 — Rename your site (optional, nice)

In Netlify → **Site configuration → Change site name** → e.g.
`hennie-en-jolinda` → your link becomes `https://hennie-en-jolinda.netlify.app`.
You can share this immediately, even before buying a domain.

---

## Step 3 — Buy & connect a `.co.za` domain

A `.co.za` address (like `hennie-en-jolinda.co.za`) costs roughly **R80–R150 per
year**.

### 3.1 Buy the domain

Use any South African registrar — popular, reputable ones:

| Registrar | Site | Notes |
|-----------|------|-------|
| **Domains.co.za** | domains.co.za | Cheapest `.co.za`, simple |
| **Afrihost** | afrihost.com | Very popular, great support |
| **Xneelo** | xneelo.co.za | Solid, business-grade |

1. Search for the name you want (e.g. `hennie-en-jolinda.co.za`).
2. Buy it. You only need the **domain** — you do **not** need their hosting
   (Netlify is your host).

### 3.2 Connect it to Netlify

1. In Netlify → **Domain management → Add a domain** → type your
   `yourname.co.za` → **Verify** → **Add domain**.
2. Netlify will show you the DNS records to set. The simplest method:
   - In your **registrar's control panel**, find **DNS settings** for the domain.
   - Add the records Netlify shows you. Usually:
     - An **A record** for the bare domain (`@`) → Netlify's IP `75.2.60.5`
     - A **CNAME record** for `www` → `your-site-name.netlify.app`
   - (Netlify shows the exact values for your site — always use what *it* shows.)
3. Save. DNS changes can take anywhere from a few minutes to a few hours.
4. Back in Netlify, it will detect the domain and automatically give you **free
   HTTPS (the padlock)**. You're live on your own address. 🔒🎉

> Not sure about DNS? Each registrar above has a "How do I point my domain to an
> external host / Netlify" help article, or their support will set the records
> for you if you give them the values from Netlify.

---

## ✅ Final go-live checklist

- [ ] Supabase keys are in `public/assets/js/config.js` (Step 1.4)
- [ ] You deployed the **`public`** folder (not the whole project)
- [ ] At the gate, your code lets you in
- [ ] A test RSVP saves (no "demo mode" note) and appears in **Admin → Gaste**
- [ ] You set your own gate code + changed placeholders (dates, venue, bank,
      story) in Admin — see [`03-REDIGEER-TEKS.md`](03-REDIGEER-TEKS.md)
- [ ] `admin.html` login works on the live site
- [ ] (Optional) custom `.co.za` domain shows the site with the padlock

---

## Alternative host — Cloudflare Pages

If you prefer Cloudflare (also free, has servers in Johannesburg & Cape Town):

1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages**.
2. Connect your GitHub repo (Option B above) **or** "Direct Upload" the `public`
   folder.
3. Build settings: **Build command** empty, **Build output directory** `public`.
4. Deploy. To use a `.co.za` domain, add it under the project's **Custom
   domains** and follow Cloudflare's DNS steps.
