# AAHBank · StudyBank

A class question bank, rebuilt as a professional full-stack web app:
scan questions in with **OCR**, build the shared bank, quiz yourself, track
**analytics**, and climb the class **leaderboard** — with **9 themes** and a
fully animated interface.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase
(Postgres + Auth) · Vercel · framer-motion · recharts · tesseract.js

```
AAHBank/
├── src/
│   ├── app/                    # Pages (App Router)
│   │   ├── page.tsx            # Home dashboard
│   │   ├── add/                # Add questions (manual + OCR scan + paste)
│   │   ├── bank/               # Browse / search / filter the bank
│   │   ├── quiz/               # Quiz mode: setup → runner → results
│   │   ├── leaderboard/        # Class leaderboard (podium + 5 boards)
│   │   ├── analytics/          # Recharts analytics dashboard
│   │   ├── login/              # Supabase email/password auth
│   │   └── api/                # Server API routes (questions, sessions,
│   │                           #   attempts, leaderboard, stats, profile, home)
│   ├── components/             # Nav shell, settings dialog, MagicGlow,
│   │                           #   Counter, page transitions, providers
│   ├── lib/                    # Supabase clients, data hooks, OCR parser,
│   │                           #   demo-mode store, theme map
│   └── data/                   # Sample questions for demo mode
├── supabase/migrations/        # SQL schema + RLS + trigger + seed
├── docs/HOSTING.md             # ⭐ Step-by-step hosting + API keys guide
├── legacy/                     # The original standalone HTML files
├── .env.example                # The 3 environment variables you need
└── package.json
```

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

With no environment variables the app runs in **Demo Mode** — everything
works with localStorage. To go live (real database + accounts + shared
leaderboard), follow **[docs/HOSTING.md](docs/HOSTING.md)**:

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor
2. Copy 3 keys from Supabase → Project Settings → API
3. Paste them into Vercel → Settings → Environment Variables
4. Deploy

## Feature map (what came from SATQuestionBank)

| Feature | Where | Notes |
|---|---|---|
| 9 themes (Soft Paper, Light, Charcoal, Obsidian, Highlighter, Liquid Glass, Paper, Cardboard, Maroon) | Settings dialog → Theme | `data-theme` on `<html>`, exact SAT Nexus palettes |
| Settings dialog | Sidebar → Settings | theme picker, text size, reduce motion, compact mode, sounds, hide-from-leaderboard, display name |
| Leaderboard | `/leaderboard` | podium + 5 boards + All-Time/This Week toggle + hide opt-out |
| Analytics | `/analytics` | totals, category/difficulty accuracy, donut split, 14-day timeline, recent attempts |
| Animations | everywhere | MagicGlow cursor glow, page transitions, staggered lists, odometer Counter, podium rise, button glow rings, skeleton shimmer, quiz pop/shake |
| OCR question scanning | `/add` | tesseract.js in-browser + the original text parser |

## Legacy

The original single-file site is preserved in `legacy/index.html` and
`legacy/studybank_fixed.html` (Firebase + one `<style>` block — the starting
point of this rebuild).
