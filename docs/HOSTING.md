# Hosting AAHBank — the complete step-by-step guide

This takes **~20 minutes** and costs **$0** (both Supabase and Vercel have free tiers).
When you're done, your app is live at `https://your-project.vercel.app` with a real
database, real accounts, and a real class leaderboard.

---

## The big picture

| Piece | What it does | Where it runs |
|---|---|---|
| **Vercel** | Hosts the website + the API routes | the internet |
| **Supabase** | The database (Postgres) + user accounts (Auth) | the internet |
| **GitHub** | Stores the code; Vercel re-deploys on every push | the internet |

The app needs **3 API keys**, and here is exactly where each one goes:

| Key | Name in env vars | Public or secret? | Goes in |
|---|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Public | Vercel env vars + `.env.local` |
| anon / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Vercel env vars + `.env.local` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` | **SECRET — never share** | Vercel env vars + `.env.local` |

> Until you add these keys, the site runs in **Demo Mode**: everything works, but data
> is stored in your browser's localStorage only. That's why the preview works before
> you configure anything.

---

## Part 1 — Create the Supabase project (database + accounts)

1. Go to **[supabase.com](https://supabase.com)** → **Start your project** → sign in with GitHub.
2. Click **New project**.
   - **Name:** `aahbank` (anything works)
   - **Database Password:** click *Generate a password*, **save it somewhere safe** (you almost never need it, but it's unrecoverable).
   - **Region:** pick the one closest to you (e.g. *East US (North Virginia)* for Michigan).
   - Click **Create new project** and wait ~2 minutes while it provisions.

### 1b. Create the tables

1. In your new project's sidebar click **SQL Editor** (the `>_` icon).
2. Click **New query**.
3. Open `supabase/migrations/0001_init.sql` **from this repo**, copy **the entire file**, paste it into the SQL editor, and click **Run** (bottom right, or `Ctrl+Enter`).
4. You should see `Success. No rows returned`. This created:
   - `profiles` — one row per student account (display name, hide-from-leaderboard flag)
   - `questions` — the question bank
   - `quiz_sessions` — one row per quiz attempt
   - `attempts` — one row per graded answer
   - Row Level Security policies + a trigger that auto-creates a profile on signup
   - 8 sample starter questions (delete that last block first if you want an empty bank)

Verify: click **Table Editor** in the sidebar — you should see the four tables.

### 1c. Collect your three keys

1. Sidebar → **Project Settings** (gear icon) → **API**.
2. Copy these three values:
   - **Project URL** — looks like `https://abcdefghijklmnop.supabase.co`
   - **Project API keys →** `anon` / `publishable` (a long `eyJ…` string)
   - **Project API keys →** `service_role` (another `eyJ…` string — **this one is a master key, never post it anywhere public**)

### 1d. Allow email signups (recommended for a class)

- Sidebar → **Authentication** → **Sign In / Providers** → **Email** is enabled by default.
- For a school project where students shouldn't need email confirmation:
  - **Authentication → Sign In / Providers → Email →** turn **"Confirm email"** OFF, and
  - **Authentication → Users** shows every signed-up student.

---

## Part 2 — Run it locally (optional but nice)

```bash
# in the AAHBank folder
cp .env.example .env.local
```

Open `.env.local` and paste your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service...role...key...
```

Then:

```bash
npm install     # first time only
npm run dev     # http://localhost:3000
```

> `.env.local` is git-ignored — it will never be committed. There is **no way**
> to leak the service key through GitHub as long as you only ever put it in
> `.env.local` or Vercel's Environment Variables screen.

---

## Part 3 — Push the code to GitHub

If this repo is already on GitHub (`MoBamba106/AAHBank`), just commit and push:

```bash
git add -A
git commit -m "Rebuild AAHBank as Next.js + Supabase + Vercel app"
git push origin main
```

(Or merge the pull request from the working branch — Vercel will build whatever
`main` contains.)

---

## Part 4 — Deploy to Vercel

1. Go to **[vercel.com](https://vercel.com)** → **Sign up with GitHub** (same account).
2. Dashboard → **Add New… → Project**.
3. Find **AAHBank** in the repo list → **Import**.
4. Vercel auto-detects Next.js — leave **Framework Preset = Next.js**, build command
   `next build`, no changes needed.
5. **Before clicking Deploy**, open **Environment Variables** (step 3 of the import screen,
   or later under *Project → Settings → Environment Variables*) and add **all three**:

   | Name | Value | Environment |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefghijklmnop.supabase.co` | Production + Preview + Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon `eyJ…` key | Production + Preview + Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service_role `eyJ…` key | Production + Preview + Development |

   Paste each **Name** and **Value** exactly — no quotes, no spaces, no trailing slash on the URL.
6. Click **Deploy**. First build takes ~1–2 minutes.
7. You'll get a URL like `https://aahbank.vercel.app` (or `aahbank-<your-name>.vercel.app`).
   **That's your live website.**

### Redeploying later

Every `git push` to `main` redeploys automatically. If you ever change env vars,
you must trigger a redeploy for them to take effect:
**Project → Deployments → ⋯ on the newest one → Redeploy.**

---

## Part 5 — Verify everything works

1. Open your Vercel URL. The footer should **no longer say "Demo mode"**.
2. Click **Sign in** → **Create account** with a school email + password.
3. Go to **Add questions** → paste a question with `A) … B) … C) … D) …` lines → **Save**.
4. Go to **Quiz mode** → answer some questions.
5. Go to **Analytics** — you should see your charts populated.
6. Open Supabase → **Table Editor** → `attempts` — your graded answers are rows now.
7. Have a friend sign up and quiz too — **Leaderboard** fills in.

If the footer still says Demo Mode, an env var is missing/misspelled → check
Vercel → Settings → Environment Variables, then redeploy.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Footer says “Demo mode” on Vercel | `NEXT_PUBLIC_*` vars missing → add them, **Redeploy** |
| “Sign in to add questions” but signup fails | Supabase → Auth → check Email provider enabled; disable “Confirm email” for classroom use |
| `Failed to fetch` on every page | `NEXT_PUBLIC_SUPABASE_URL` wrong (typo, trailing slash) |
| Leaderboard/Analytics 500 | `SUPABASE_SERVICE_ROLE_KEY` missing or rotated → update it in Vercel |
| API error `JWT expired` | Your Supabase project paused (free tier pauses after ~1 week of inactivity) → Supabase dashboard → **Restore project** |
| Questions save but don't appear | The migration wasn't run → redo Part 1b |
| Deleting a question fails | You can only delete questions **you** added (author check) |

---

## What each API key does (mental model)

- **`NEXT_PUBLIC_SUPABASE_URL`** — the address of your database. Safe in the browser.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — the browser's "guest badge". It can only do what
  Row Level Security allows (read the bank, edit your own rows). Safe in the browser.
- **`SUPABASE_SERVICE_ROLE_KEY`** — the server's master key, used only by the Next.js API
  routes running on Vercel's servers. It bypasses RLS, which is what lets the
  leaderboard aggregate across students. **Server-side only — it never reaches the browser.**

## Optional extras (not required)

- **Vercel Analytics** is already wired up (`@vercel/analytics`). View it on
  Vercel → your project → **Analytics** tab. No key needed.
- **Custom domain:** Vercel → Project → Settings → Domains → add `aahbank.yourdomain.com`
  and follow the DNS instructions.
- **Passwordless “magic link” sign-in:** Supabase → Auth → Providers → Email → enable magic links.
