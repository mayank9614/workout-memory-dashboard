# Workout Memory Dashboard

A personal fitness tracking web app built with React + Vite, backed by Supabase for cross-device persistence. Designed around a PPL (Push/Pull/Legs) training cycle with AI coaching powered by Google Gemini 2.0 Flash.

---

## Features

### Core Workout Tracking
- Log Push / Pull / Legs sessions with per-set reps and weight
- Per-session notes, energy, pump, and pain ratings
- Session history with delete support
- "Up Next" card in History tab — automatically suggests next PPL session based on the last logged workout

### AI Coaching (Gemini 2.0 Flash)
- **Bulk insights** — analyzes full history for tonnage trends, e1RM progression, plateau detection, Push:Pull volume ratio, deload signals, and abs integration recommendations
- **Per-session insight** — headline, what went well, improvement tip, next session tip, top lift
- **Real-time Coach Chat** — multi-turn conversation with context of the last 5 sessions; supports quick-prompt chips
- **Save to Routine** — accept AI exercise suggestions directly into the PPL routine or Supabase `routine_customizations` table

### Routine Management (Routine Tab)
- View and edit Push / Pull / Legs exercise lists
- Add or remove exercises inline
- Save current routine to Supabase `ppl_routines` table for cross-device sync
- AI-suggested customizations displayed and manageable in one place

### Cricket Fit Tab
- **Lower Back Rehab** — 7-day rotating program (McGill-inspired): daily exercises with prescription, streaks, and completion tracking
- **4-Week Abs Program** — McGill Big 3 progression (Foundation → Stabilization → Loading → Consolidation), 2 sessions/week (Session A after Push, Session B after Legs)
- **Gamified Cardio** — 8 gym-friendly drills (Rowing Machine, Stationary Bike, Treadmill Sprints, Agility Circuit, etc.) with XP levels (Bench Warmer → World Class)

### Sync and Persistence
- All data persisted to localStorage as primary store with Supabase as secondary (cross-device)
- **Force Sync** button in AI Coaching tab syncs all 6 data types to Supabase in one pass
- Migration banner on first load to move existing localStorage data to Supabase

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.2 + Vite 5.1 |
| Styling | Tailwind CSS + Shadcn/Radix UI |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| State | React `useState` + localStorage |

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## Supabase Tables

Run these in the Supabase SQL editor to set up all required tables:

```sql
-- Core workout logs
create table workout_logs (
  id bigint primary key,
  date text,
  workout text,
  title text,
  energy text,
  pump text,
  pain text,
  notes text,
  exercises jsonb
);

-- Lower back rehab daily completion
create table lower_back_log (
  date text primary key,
  completed_indices integer[]
);

-- Cardio sessions (gamified)
create table cardio_sessions (
  id text primary key,
  date text,
  drill_id text,
  name text,
  xp integer,
  notes text
);

-- Abs program session completion
create table abs_log (
  session_key text primary key,
  completed_indices integer[]
);

-- Generic key-value user settings (e.g. abs_week)
create table user_settings (
  key text primary key,
  value text
);

-- AI-suggested routine additions (from Coach Chat)
create table routine_customizations (
  id text primary key,
  created_at text,
  workout_type text,
  exercise_name text,
  prescription text,
  notes text,
  source_message text
);

-- Editable PPL routine exercise lists
create table ppl_routines (
  workout_type text primary key,
  exercise_names text[],
  updated_at text
);
```

---

## Getting Started

```bash
npm install
npm run dev       # development server at http://localhost:5173
npm run build     # production build to dist/
```

---

## Key Calculations

- **Tonnage**: `weight x reps x sets` per exercise, summed per session
- **e1RM**: Epley formula — `weight x (1 + reps / 30)`
- **Plateau detection**: same exercise e1RM variance < 2 kg across last 3 sessions of same workout type
- **Push:Pull ratio**: total Push tonnage / total Pull tonnage (ideal ~1.0)

---

## Commit History Highlights

| Commit | Feature |
|---|---|
| Latest | Routine tab with editable PPL lists + save to Supabase; README |
| `5b88a43` | Exercise variation suggestions in AI coaching |
| `77228c9` | One-time migration banner for local to Supabase |
| `d0ed062` | Supabase cross-device storage |
| `13b12a8` | Per-set reps and weight logging |
| `33a7a99` | Full mobile-friendly layout |
