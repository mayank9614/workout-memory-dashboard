import React, { useEffect, useMemo, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Dumbbell, Plus, TrendingUp, Activity, Sparkles, Loader2, Trash2, X, Heart, Trophy, Flame, Zap, Send, MessageCircle } from "lucide-react";

// ── Seed data ──────────────────────────────────────────────────────────────
const seedLogs = [
  {
    id: 3,
    date: "2026-03-25",
    workout: "Legs",
    title: "Legs",
    energy: "",
    pump: "",
    pain: "",
    notes: "Low-back-conscious leg session with squat work, Romanian deadlifts, split squats, and machine isolation work.",
    exercises: [
      { name: "Warm-up — Bodyweight Squats", setsReps: "1×15", weight: "Bodyweight", notes: "Completed" },
      { name: "Warm-up — Lunges", setsReps: "2×10 each side", weight: "Bodyweight", notes: "Completed" },
      { name: "Back Squat", setsReps: "1×5, 4×5, 1×AMRAP", weight: "20 kg each side, 35 kg each side, 20 kg each side", notes: "Warm-up set at 20 kg, 4 working sets at 35 kg, then AMRAP at 20 kg" },
      { name: "Romanian Deadlift", setsReps: "4×12", weight: "10 kg", notes: "Completed" },
      { name: "Bulgarian Split Squat", setsReps: "3×10 each leg", weight: "Bodyweight", notes: "Completed" },
      { name: "Leg Extension", setsReps: "4×12", weight: "40 kg", notes: "Completed" },
      { name: "Leg Curl", setsReps: "3×10", weight: "30 kg", notes: "Completed" },
    ],
  },
  {
    id: 1,
    date: "2026-03-23",
    workout: "Push",
    title: "Push — Performance Builder",
    energy: "High",
    pump: "Good",
    pain: "None",
    notes: "Completed full session cleanly. Strong pressing output.",
    exercises: [
      { name: "Barbell Bench Press", setsReps: "5×5", weight: "80 kg", notes: "Last set AMRAP = 20 reps" },
      { name: "Incline Dumbbell Press", setsReps: "4×8–10", weight: "20 kg each hand", notes: "Completed" },
      { name: "Low-to-High Cable Fly", setsReps: "3×12–15", weight: "15 kg", notes: "Completed" },
      { name: "Seated Dumbbell Shoulder Press", setsReps: "3×8–10", weight: "15 kg", notes: "Completed" },
      { name: "Lateral Raise Mechanical Set", setsReps: "4 rounds", weight: "5 kg", notes: "12 strict / 8 partial / 10s hold" },
      { name: "Close-Grip Bench Press", setsReps: "3×6–8", weight: "40 kg", notes: "Completed" },
      { name: "Rope Pushdown", setsReps: "3×12–15", weight: "40 kg", notes: "Completed" },
      { name: "Push-ups", setsReps: "2×AMRAP", weight: "Bodyweight", notes: "Set 1 = 10, Set 2 = 10" },
    ],
  },
  {
    id: 2,
    date: "2026-03-25",
    workout: "Pull",
    title: "Pull",
    energy: "",
    pump: "",
    pain: "",
    notes: "Good pulling session. Rows need progression relative to pressing strength.",
    exercises: [
      { name: "Lat Pulldown", setsReps: "5×6", weight: "80 kg", notes: "Completed" },
      { name: "Barbell Row", setsReps: "4×12", weight: "25 kg / 27.5 kg total", notes: "Mixed working sets" },
      { name: "Chest-Supported Row", setsReps: "4×10", weight: "32.5 kg each side", notes: "Completed" },
      { name: "Face Pull / Rear Delt Fly", setsReps: "3×15", weight: "40 kg", notes: "Completed" },
      { name: "EZ Bar Curl", setsReps: "3×12", weight: "30 kg total", notes: "Completed" },
      { name: "Hammer Curl", setsReps: "2×15", weight: "10 kg dumbbell", notes: "Completed" },
      { name: "Farmer's Carry", setsReps: "20 steps", weight: "30 kg each side", notes: "Optional finisher" },
    ],
  },
];

const templates = {
  Push: [
    "Barbell Bench Press",
    "Incline Dumbbell Press",
    "Low-to-High Cable Fly",
    "Seated Dumbbell Shoulder Press",
    "Lateral Raise Mechanical Set",
    "Close-Grip Bench Press",
    "Rope Pushdown",
    "Push-ups",
  ],
  Pull: [
    "Lat Pulldown / Pull-ups",
    "Barbell Row / Machine Row",
    "Chest-Supported Row / Seated Cable Row",
    "Face Pull / Rear Delt Fly",
    "EZ Bar Curl / DB Curl",
    "Hammer Curl / Cable Curl",
    "Farmer's Carry / Optional Finisher",
  ],
  Legs: [
    "Squat Variant",
    "Romanian Deadlift / Leg Curl",
    "Bulgarian Split Squat",
    "Leg Extension",
    "Hamstring Curl",
    "Calf Raise",
    "Core Work",
  ],
};

// ── Lower Back & Cricket Cardio constants ──────────────────────────────────
const LOWER_BACK_PROGRAM = [
  {
    focus: "Mobility Reset",
    classes: { border: "border-rose-200", bg: "bg-rose-50", title: "text-rose-800", bar: "bg-rose-400", badge: "bg-rose-100 text-rose-700" },
    exercises: [
      { name: "Cat-Cow Stretch", prescription: "2 × 10 slow reps", tip: "Coordinate breath with movement" },
      { name: "Child's Pose", prescription: "3 × 30s hold", tip: "Breathe into lower back tension" },
      { name: "Hip Flexor Lunge Stretch", prescription: "2 × 30s each side", tip: "Keep pelvis tucked under" },
      { name: "Knee-to-Chest Hug", prescription: "2 × 30s each side", tip: "Lying on back, gentle pull" },
      { name: "Thread the Needle", prescription: "2 × 20s each side", tip: "Releases thoracic & lumbar rotation" },
    ],
  },
  {
    focus: "McGill Big 3",
    classes: { border: "border-blue-200", bg: "bg-blue-50", title: "text-blue-800", bar: "bg-blue-400", badge: "bg-blue-100 text-blue-700" },
    exercises: [
      { name: "Modified Curl-Up", prescription: "3 × 8 reps", tip: "Maintain natural lumbar curve — don't flatten" },
      { name: "Bird Dog", prescription: "3 × 10 each side", tip: "Hips level, extend slow, 2s hold at top" },
      { name: "Side Plank", prescription: "3 × 20s each side", tip: "Stack or stagger feet, keep hips lifted" },
    ],
  },
  {
    focus: "Glute Activation",
    classes: { border: "border-orange-200", bg: "bg-orange-50", title: "text-orange-800", bar: "bg-orange-400", badge: "bg-orange-100 text-orange-700" },
    exercises: [
      { name: "Glute Bridge", prescription: "3 × 15 reps", tip: "Squeeze glutes hard, 1s hold at top" },
      { name: "Clamshell", prescription: "3 × 15 each side", tip: "Band optional, keep pelvis still" },
      { name: "Donkey Kick", prescription: "3 × 12 each side", tip: "Don't rotate the hip, brace core" },
      { name: "Hip Thrust (bodyweight)", prescription: "3 × 12 reps", tip: "Full hip extension, squeeze at top" },
    ],
  },
  {
    focus: "Core Stability",
    classes: { border: "border-emerald-200", bg: "bg-emerald-50", title: "text-emerald-800", bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" },
    exercises: [
      { name: "Dead Bug", prescription: "3 × 8 each side", tip: "Press lower back firmly into floor" },
      { name: "Plank", prescription: "3 × 30s", tip: "Breathe slowly, don't hold your breath" },
      { name: "Pallof Press / Isometric Hold", prescription: "3 × 10 each side", tip: "Resist rotation, keep hips square" },
      { name: "Bird Dog", prescription: "2 × 10 each side", tip: "Midweek McGill reinforcement" },
    ],
  },
  {
    focus: "Hip Mobility & Hinge",
    classes: { border: "border-purple-200", bg: "bg-purple-50", title: "text-purple-800", bar: "bg-purple-400", badge: "bg-purple-100 text-purple-700" },
    exercises: [
      { name: "90/90 Hip Stretch", prescription: "2 × 60s each side", tip: "Sit tall, lean gently forward" },
      { name: "Romanian Deadlift (light)", prescription: "3 × 12 reps", tip: "Hinge at hips, soft knees, neutral spine" },
      { name: "Good Morning (bodyweight)", prescription: "3 × 12 reps", tip: "Hands on hips, hinge till parallel" },
      { name: "Pigeon Pose", prescription: "2 × 45s each side", tip: "Key for cricketers — hip flexor & glute release" },
    ],
  },
  {
    focus: "McGill Progression",
    classes: { border: "border-blue-200", bg: "bg-blue-50", title: "text-blue-800", bar: "bg-blue-400", badge: "bg-blue-100 text-blue-700" },
    exercises: [
      { name: "Modified Curl-Up", prescription: "3 × 10 reps", tip: "+2 reps from Monday" },
      { name: "Bird Dog with 3s pause", prescription: "3 × 10 each side", tip: "3s hold at top, controlled return" },
      { name: "Side Plank with hip dip", prescription: "3 × 25s each side", tip: "+5s from Monday if able" },
      { name: "Single-Leg Glute Bridge", prescription: "3 × 10 each side", tip: "Progress from bilateral bridge" },
    ],
  },
  {
    focus: "Active Recovery",
    classes: { border: "border-teal-200", bg: "bg-teal-50", title: "text-teal-800", bar: "bg-teal-400", badge: "bg-teal-100 text-teal-700" },
    exercises: [
      { name: "Gentle Walk", prescription: "20–30 min", tip: "Low intensity — promotes circulation & healing" },
      { name: "Lumbar Extension Stretch", prescription: "3 × 30s", tip: "Lie face-down, prop on elbows gently" },
      { name: "Supine Twist", prescription: "2 × 30s each side", tip: "Breathe into the rotation" },
      { name: "Cat-Cow Stretch", prescription: "2 × 10 slow reps", tip: "Bookend the week with mobility" },
    ],
  },
];

const CRICKET_LEVELS = [
  { level: 1, name: "Bench Warmer", minXp: 0, maxXp: 150 },
  { level: 2, name: "12th Man", minXp: 150, maxXp: 400 },
  { level: 3, name: "Club Cricketer", minXp: 400, maxXp: 800 },
  { level: 4, name: "District Player", minXp: 800, maxXp: 1500 },
  { level: 5, name: "State Contender", minXp: 1500, maxXp: 2500 },
  { level: 6, name: "IPL Standard", minXp: 2500, maxXp: 4000 },
  { level: 7, name: "World Class", minXp: 4000, maxXp: 99999 },
];

const CARDIO_DRILLS = [
  { id: "treadmill_sprint", name: "Treadmill Sprints", xp: 50, emoji: "⚡", desc: "30s sprint / 30s walk × 10 — max effort HIIT" },
  { id: "agility_circuit", name: "Agility Circuit", xp: 45, emoji: "🔀", desc: "Cone drills, ladder, direction changes — builds fielding sharpness" },
  { id: "interval_run", name: "400m Intervals", xp: 40, emoji: "🏃", desc: "6 × 400m with 90s rest — cricket match aerobic capacity" },
  { id: "rowing_machine", name: "Rowing Machine", xp: 38, emoji: "🚣", desc: "20 min steady or 500m intervals — low-impact, back-friendly" },
  { id: "shuttle_run", name: "Shuttle Runs", xp: 35, emoji: "↔️", desc: "10m shuttles × 15, 45s rest — between-wickets speed" },
  { id: "steady_jog", name: "Steady Jog", xp: 30, emoji: "🌿", desc: "20–30 min easy aerobic base — gym treadmill or outdoors" },
  { id: "stationary_bike", name: "Stationary Bike", xp: 25, emoji: "🚴", desc: "30 min cycling — low impact, great during lower back recovery" },
  { id: "yoga_flex", name: "Yoga / Flexibility", xp: 20, emoji: "🧘", desc: "Lower back focused yoga & mobility flow" },
];

// ── 4-week Abs Starter Program ──────────────────────────────────────────────
const ABS_PROGRAM = [
  {
    week: 1, name: "Foundation",
    sessions: [
      { label: "Session A (end of Push day)", exercises: [
        { name: "Modified Curl-Up", prescription: "1 pyramid: 5→3→1 reps", tip: "8s hold each rep, keep natural lumbar curve" },
        { name: "Dead Bug (arms only)", prescription: "2 × 6 each side", tip: "Lower one arm overhead, legs stay in tabletop" },
        { name: "Glute Bridge", prescription: "2 × 10 reps", tip: "2s squeeze at top — targets the glutes driving lower back pain" },
      ]},
      { label: "Session B (end of Legs day)", exercises: [
        { name: "Bird Dog", prescription: "1 pyramid: 5→3→1 each side", tip: "8s hold, hips perfectly level" },
        { name: "Side Plank (knee-down)", prescription: "2 × 5 each side", tip: "5s hold per rep — knee-down is the safe regression" },
        { name: "Cat-Cow", prescription: "2 × 10 slow reps", tip: "Coordinate breath — warm-down for the spine" },
      ]},
    ],
  },
  {
    week: 2, name: "Stabilization",
    sessions: [
      { label: "Session A (end of Push day)", exercises: [
        { name: "Modified Curl-Up", prescription: "2 pyramids: 5→3→1 reps", tip: "8s hold, move to full version if pain-free" },
        { name: "Dead Bug (full)", prescription: "2 × 8 each side", tip: "Opposite arm + leg simultaneously, 3s pause" },
        { name: "Glute Bridge", prescription: "3 × 12 reps", tip: "2s hold — add band around knees for more glute activation" },
      ]},
      { label: "Session B (end of Legs day)", exercises: [
        { name: "Bird Dog", prescription: "2 pyramids: 5→3→1 each side", tip: "8s hold, focus on not letting the hip rotate" },
        { name: "Side Plank (knee-down)", prescription: "2 × 5 each side", tip: "8s hold per rep — increase from 5s last week" },
        { name: "Single-Leg Glute Bridge", prescription: "2 × 10 each side", tip: "Extend one leg, keep hips level" },
      ]},
    ],
  },
  {
    week: 3, name: "Loading",
    sessions: [
      { label: "Session A (end of Push day)", exercises: [
        { name: "Modified Curl-Up", prescription: "3 pyramids: 5→3→1 reps", tip: "10s hold each rep — added time under tension" },
        { name: "Dead Bug", prescription: "3 × 8 each side", tip: "4s pause at bottom — slow the eccentric" },
        { name: "Glute Bridge", prescription: "3 × 15 reps", tip: "Or add single-leg if bilateral is easy" },
      ]},
      { label: "Session B (end of Legs day)", exercises: [
        { name: "Bird Dog with 3s pause", prescription: "3 pyramids: 5→3→1 each side", tip: "10s hold, squeeze glute at top of each rep" },
        { name: "Side Plank (attempt full)", prescription: "3 × 5 each side", tip: "8-10s hold — try feet-stacked if knee version is easy" },
        { name: "Single-Leg Glute Bridge", prescription: "3 × 12 each side", tip: "Controlled lowering phase" },
      ]},
    ],
  },
  {
    week: 4, name: "Consolidation",
    sessions: [
      { label: "Session A (end of Push day)", exercises: [
        { name: "Modified Curl-Up", prescription: "3 pyramids: 6→4→2 reps", tip: "10s hold — expanded pyramid vs Week 3" },
        { name: "Dead Bug", prescription: "3 × 10 each side", tip: "4s pause — consider light ankle weight if ready" },
        { name: "Hip Thrust (bodyweight)", prescription: "3 × 12 reps", tip: "Full hip extension — prepare for barbell version" },
      ]},
      { label: "Session B (end of Legs day)", exercises: [
        { name: "Bird Dog with 3s pause", prescription: "3 pyramids: 6→4→2 each side", tip: "10s hold" },
        { name: "Side Plank (full)", prescription: "3 × 5 each side", tip: "10s hold — add hip dip if stable" },
        { name: "Pallof Press / Isometric Hold", prescription: "3 × 10 each side", tip: "Anti-rotation — resist twist, hips square" },
      ]},
    ],
  },
];

const LOGS_KEY = "wmd_logs";
const RECS_KEY = "wmd_recommendations";
const LB_LOG_KEY = "wmd_lb_log";
const CARDIO_LOG_KEY = "wmd_cardio_log";
const ABS_LOG_KEY = "wmd_abs_log";
const ABS_WEEK_KEY = "wmd_abs_week";
const SESSION_INSIGHTS_KEY = "wmd_session_insights";
const COACH_CHAT_KEY = "wmd_coach_chat";
const ROUTINE_CUSTOMIZATIONS_KEY = "wmd_routine_customizations";
const ROUTINES_KEY = "wmd_ppl_routines";

const QUICK_PROMPTS = [
  "Lower back-safe alternative to bent-over barbell row",
  "Can I train legs today with lower back pain?",
  "What should my next Push session focus on?",
  "Best gym cardio to improve cricket fielding stamina",
  "I feel weak today — should I deload or push through?",
  "Add a shoulder variation to my next Push day",
];

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function blankExercise(name = "") {
  return { name, sets: [{ reps: "", weight: "" }], notes: "" };
}

function blankSet() {
  return { reps: "", weight: "" };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Workout metrics computation ─────────────────────────────────────────────
function parseExerciseTonnage(ex) {
  try {
    if (ex.sets && Array.isArray(ex.sets)) {
      return ex.sets.reduce((s, set) => s + (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0), 0);
    }
    if (ex.setsReps && ex.weight) {
      const m = ex.setsReps.match(/(\d+)[×xX](\d+)/);
      const w = ex.weight.match(/[\d.]+/);
      if (m && w) return parseInt(m[1]) * parseInt(m[2]) * parseFloat(w[0]);
    }
  } catch (_) {}
  return 0;
}

function parseExerciseE1RM(ex) {
  // Epley formula: w × (1 + reps/30)
  try {
    if (ex.sets && Array.isArray(ex.sets)) {
      return ex.sets.reduce((best, s) => {
        const r = parseFloat(s.reps) || 0, w = parseFloat(s.weight) || 0;
        if (!r || !w) return best;
        return Math.max(best, w * (1 + r / 30));
      }, 0);
    }
    if (ex.setsReps && ex.weight) {
      const m = ex.setsReps.match(/(\d+)[×xX](\d+)/);
      const w = ex.weight.match(/[\d.]+/);
      if (m && w) return parseFloat(w[0]) * (1 + parseInt(m[2]) / 30);
    }
  } catch (_) {}
  return 0;
}

function computeWorkoutMetrics(logs) {
  if (!logs || logs.length === 0) return null;

  // Per-session tonnage
  const sessionTonnages = logs.map((log) => ({
    date: log.date, type: log.workout,
    tonnage: Math.round(log.exercises.reduce((s, ex) => s + parseExerciseTonnage(ex), 0)),
  }));

  // Best e1RM per exercise (most recent value)
  const e1RMMap = {};
  [...logs].reverse().forEach((log) => {
    log.exercises.forEach((ex) => {
      const v = parseExerciseE1RM(ex);
      if (v > 0) e1RMMap[ex.name] = Math.round(v);
    });
  });

  // Plateau detection: same exercise in last 3 sessions of same type, e1RM variance < 2 kg
  const plateauExercises = [];
  ["Push", "Pull", "Legs"].forEach((type) => {
    const typeLogs = logs.filter((l) => l.workout === type).slice(0, 3);
    if (typeLogs.length < 2) return;
    const exNames = [...new Set(typeLogs.flatMap((l) => l.exercises.map((e) => e.name)))];
    exNames.forEach((name) => {
      const vals = typeLogs.map((l) => {
        const ex = l.exercises.find((e) => e.name === name);
        return ex ? parseExerciseE1RM(ex) : null;
      }).filter((v) => v !== null && v > 0);
      if (vals.length >= 2 && Math.max(...vals) - Math.min(...vals) < 2) {
        plateauExercises.push(name);
      }
    });
  });

  // Push:Pull tonnage balance
  const pushTon = sessionTonnages.filter((s) => s.type === "Push").reduce((a, s) => a + s.tonnage, 0);
  const pullTon = sessionTonnages.filter((s) => s.type === "Pull").reduce((a, s) => a + s.tonnage, 0);
  const pushPullRatio = pullTon > 0 ? (pushTon / pullTon).toFixed(2) : "N/A";

  // Unique training weeks
  const weekCount = new Set(logs.map((l) => {
    const d = new Date(l.date);
    return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
  })).size;

  const recentTonnages = sessionTonnages.slice(0, 5).map((s) => s.tonnage);
  const avgTonnage = recentTonnages.length ? Math.round(recentTonnages.reduce((a, b) => a + b, 0) / recentTonnages.length) : 0;
  const painSessions = logs.filter((l) => l.pain && l.pain !== "" && l.pain.toLowerCase() !== "none").length;

  return {
    totalSessions: logs.length,
    weekCount,
    avgTonnage,
    recentTonnages,
    estimatedE1RMs: e1RMMap,
    plateauExercises: [...new Set(plateauExercises)],
    pushPullRatio,
    pushSessions: logs.filter((l) => l.workout === "Push").length,
    pullSessions: logs.filter((l) => l.workout === "Pull").length,
    legSessions: logs.filter((l) => l.workout === "Legs").length,
    painSessions,
  };
}

// ── Gemini helper ──────────────────────────────────────────────────────────
async function fetchGeminiRecommendations(logs, metrics) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set. Add it to your .env file.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are a certified strength and conditioning coach with expertise in PPL programming, injury prevention, and beginner progression. Always prioritize safety. Give specific numbers (sets, reps, weights) not vague advice. Flag overtraining or injury risk immediately.`,
  });

  const logsText = logs.slice(0, 10).map((log) =>
    `Date: ${log.date} | Type: ${log.workout} | Energy: ${log.energy || "N/A"} | Pain: ${log.pain || "N/A"}
Notes: ${log.notes || "none"}
Exercises: ${log.exercises.map((e) => {
      const setsStr = e.sets
        ? e.sets.map((s, i) => `Set ${i + 1}: ${s.reps || "?"}r @ ${s.weight || "?"}kg`).join(", ")
        : `${e.setsReps} @ ${e.weight}`;
      return `${e.name}: ${setsStr}`;
    }).join(" | ")}`
  ).join("\n\n---\n\n");

  const metricsText = metrics ? `
<computed_metrics>
  total_sessions: ${metrics.totalSessions}
  training_weeks: ${metrics.weekCount}
  avg_session_tonnage_kg: ${metrics.avgTonnage}
  recent_5_session_tonnages_kg: [${metrics.recentTonnages.join(", ")}]
  push_pull_tonnage_ratio: ${metrics.pushPullRatio} (ideal is ~1.0; >1.2 means overdoing push vs pull)
  sessions_with_pain_noted: ${metrics.painSessions}
  plateau_candidate_exercises: [${metrics.plateauExercises.join(", ") || "none detected"}]
  estimated_e1rms_kg: ${JSON.stringify(metrics.estimatedE1RMs)}
</computed_metrics>` : "";

  const prompt = `<user_context>
  Training split: Push / Pull / Legs (PPL)
  Known issue: Lower back pain — exercises must respect lumbar health
  Sport: Cricket player — needs fielding stamina and rotational power
  Goal: Hypertrophy + athletic performance
  Abs status: Has NOT been doing direct abs work — beginner level, needs safe introduction
</user_context>
${metricsText}

<recent_sessions>
${logsText}
</recent_sessions>

Analyze this athlete's data and respond ONLY with a JSON object (no markdown fences) in this exact shape:
{
  "observations": ["2-3 high-level performance observations based on actual data"],
  "tonnage_insight": "One sentence on volume trend — is it increasing, flat, or concerning?",
  "deload_signal": { "needed": false, "reason": "string — explain why or why not" },
  "plateau_alerts": [
    { "exercise": "name", "recommendation": "specific next-step to break plateau" }
  ],
  "strength_gains": [
    { "exercise": "name", "observation": "positive trend noted" }
  ],
  "abs_integration": {
    "schedule": "Which PPL days to add abs and why (e.g. end of Push + end of Legs)",
    "starter_exercises": ["Exercise 1 with sets/reps", "Exercise 2 with sets/reps", "Exercise 3 with sets/reps"],
    "key_tip": "Most important cue for someone with lower back pain starting abs"
  },
  "push": {
    "title": "Next Push Session title",
    "focus": "string",
    "actions": ["specific action 1", "specific action 2"],
    "variations": [{ "swap": "current exercise", "with": "alternative", "reason": "why" }]
  },
  "pull": {
    "title": "Next Pull Session title",
    "focus": "string",
    "actions": ["specific action 1", "specific action 2"],
    "variations": [{ "swap": "current exercise", "with": "alternative", "reason": "why" }]
  },
  "legs": {
    "title": "Next Legs Session title",
    "focus": "string",
    "actions": ["specific action 1", "specific action 2"],
    "variations": [{ "swap": "current exercise", "with": "alternative", "reason": "why" }]
  },
  "warnings": ["string — injury or recovery concern, or empty array"]
}
Rules: Keep strings concise (1-2 sentences). plateau_alerts and strength_gains may be empty arrays. abs_integration.starter_exercises should be 3 beginner-safe exercises.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(clean);
}

// ── Per-session insight ─────────────────────────────────────────────────────
async function fetchSessionInsight(log) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are a certified strength coach. Analyse a single workout session and give sharp, data-backed feedback. Be specific — reference actual exercises, weights, and reps from the data. Keep every string under 2 sentences.",
  });

  // Compute session stats
  const tonnage = Math.round(log.exercises.reduce((s, ex) => s + parseExerciseTonnage(ex), 0));
  const totalSets = log.exercises.reduce((s, ex) => s + (ex.sets ? ex.sets.length : 1), 0);
  const topLift = log.exercises.reduce((best, ex) => {
    const v = parseExerciseE1RM(ex);
    return v > best.val ? { name: ex.name, val: v } : best;
  }, { name: "", val: 0 });

  const exerciseSummary = log.exercises.map((ex) => {
    const setsStr = ex.sets
      ? ex.sets.map((s, i) => `Set ${i + 1}: ${s.reps || "?"}r @ ${s.weight || "?"}kg`).join(", ")
      : `${ex.setsReps} @ ${ex.weight}`;
    const e1rm = parseExerciseE1RM(ex);
    return `- ${ex.name}: ${setsStr}${e1rm > 0 ? ` (est. 1RM: ${Math.round(e1rm)}kg)` : ""}${ex.notes ? ` | ${ex.notes}` : ""}`;
  }).join("\n");

  const prompt = `<session>
  Date: ${log.date} | Type: ${log.workout} | Title: ${log.title}
  Energy: ${log.energy || "N/A"} | Pump: ${log.pump || "N/A"} | Pain/Injury: ${log.pain || "None"}
  Session notes: ${log.notes || "none"}
  Total tonnage: ${tonnage} kg | Total sets: ${totalSets}
  Top estimated 1RM: ${topLift.name || "N/A"}${topLift.val > 0 ? ` @ ${Math.round(topLift.val)} kg` : ""}

  Exercises:
${exerciseSummary}
</session>

Respond ONLY with a JSON object (no markdown fences):
{
  "headline": "A punchy 1-line session summary (e.g. 'Solid push day — 3,200 kg volume, bench PR incoming')",
  "total_tonnage": ${tonnage},
  "top_lift": "Exercise name + est. 1RM (e.g. 'Bench Press — ~95 kg')",
  "what_went_well": ["string", "string"],
  "improve_next": ["string", "string"],
  "next_session_tip": "One specific action focus for the NEXT time this workout type comes up"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(clean);
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WorkoutMemoryDashboard() {
  const [logs, setLogs] = useState(() => loadFromStorage(LOGS_KEY, []));
  const [selectedId, setSelectedId] = useState(null);
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [pendingMigration, setPendingMigration] = useState([]);
  const [migrating, setMigrating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(),
    workout: "Push",
    title: "",
    energy: "",
    pump: "",
    pain: "",
    notes: "",
    exercises: (loadFromStorage(ROUTINES_KEY, templates).Push || templates.Push).map((x) => blankExercise(x)),
  });
  const [recommendations, setRecommendations] = useState(() => loadFromStorage(RECS_KEY, null));
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [lowerBackLog, setLowerBackLog] = useState(() => loadFromStorage(LB_LOG_KEY, {}));
  const [cardioLog, setCardioLog] = useState(() => loadFromStorage(CARDIO_LOG_KEY, []));
  const [absLog, setAbsLog] = useState(() => loadFromStorage(ABS_LOG_KEY, {})); // { "date_weekIdx_sessionIdx": [completedExerciseIndices] }
  const [absWeek, setAbsWeek] = useState(() => loadFromStorage(ABS_WEEK_KEY, 1));
  const [sessionInsights, setSessionInsights] = useState(() => loadFromStorage(SESSION_INSIGHTS_KEY, {}));
  const [loadingInsightId, setLoadingInsightId] = useState(null);
  const [forceSyncing, setForceSyncing] = useState(false);
  const [forceSyncMsg, setForceSyncMsg] = useState("");
  const [coachChat, setCoachChat] = useState(() => loadFromStorage(COACH_CHAT_KEY, []));
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = React.useRef(null);
  const [routineCustomizations, setRoutineCustomizations] = useState(() => loadFromStorage(ROUTINE_CUSTOMIZATIONS_KEY, []));
  const [addingToRoutine, setAddingToRoutine] = useState(null);
  const [savedRoutine, setSavedRoutine] = useState(() => loadFromStorage(ROUTINES_KEY, templates));
  const [routineNewExercise, setRoutineNewExercise] = useState({ Push: "", Pull: "", Legs: "" });
  const [routineSaving, setRoutineSaving] = useState(false);
  const [routineSaveMsg, setRoutineSaveMsg] = useState(""); // { messageId, workoutType, exerciseName, prescription, notes }

  // Load all data from Supabase on mount
  useEffect(() => {
    async function fetchAll() {
      setSyncing(true);
      setSyncError("");

      // Workout logs
      const { data: logsData, error: logsError } = await supabase
        .from("workout_logs")
        .select("*")
        .order("date", { ascending: false });

      if (logsError) {
        setSyncError("Could not connect to database. Showing local data.");
        const local = loadFromStorage(LOGS_KEY, []);
        setLogs(local);
        setSelectedId(local[0]?.id ?? null);
      } else if (logsData.length === 0) {
        const local = loadFromStorage(LOGS_KEY, []);
        if (local.length > 0) {
          setPendingMigration(local);
          setLogs(local);
          setSelectedId(local[0]?.id ?? null);
        }
      } else {
        setLogs(logsData);
        setSelectedId(logsData[0]?.id ?? null);
        localStorage.setItem(LOGS_KEY, JSON.stringify(logsData));
      }

      // Lower back log
      const { data: lbData, error: lbError } = await supabase
        .from("lower_back_log")
        .select("*");
      if (!lbError && lbData.length > 0) {
        const mapped = lbData.reduce((acc, row) => {
          acc[row.date] = row.completed_indices || [];
          return acc;
        }, {});
        setLowerBackLog(mapped);
        localStorage.setItem(LB_LOG_KEY, JSON.stringify(mapped));
      }

      // Cardio sessions
      const { data: cardioData, error: cardioError } = await supabase
        .from("cardio_sessions")
        .select("*")
        .order("date", { ascending: false });
      if (!cardioError && cardioData.length > 0) {
        const mapped = cardioData.map((r) => ({
          id: r.id, date: r.date, drillId: r.drill_id,
          name: r.name, xp: r.xp, notes: r.notes,
        }));
        setCardioLog(mapped);
        localStorage.setItem(CARDIO_LOG_KEY, JSON.stringify(mapped));
      }

      // Abs log
      const { data: absData, error: absError } = await supabase.from("abs_log").select("*");
      if (!absError && absData && absData.length > 0) {
        const mapped = absData.reduce((acc, row) => {
          acc[row.session_key] = row.completed_indices || [];
          return acc;
        }, {});
        setAbsLog(mapped);
        localStorage.setItem(ABS_LOG_KEY, JSON.stringify(mapped));
      }

      // User settings (abs_week)
      const { data: settingsData, error: settingsError } = await supabase.from("user_settings").select("*");
      if (!settingsError && settingsData) {
        const weekRow = settingsData.find((r) => r.key === "abs_week");
        if (weekRow) {
          const week = parseInt(weekRow.value, 10);
          if (week >= 1 && week <= 4) {
            setAbsWeek(week);
            localStorage.setItem(ABS_WEEK_KEY, JSON.stringify(week));
          }
        }
      }

      // PPL routines (stored as JSON in user_settings under key "ppl_routine")
      const { data: routineRow, error: routineError } = await supabase
        .from("user_settings")
        .select("value")
        .eq("key", "ppl_routine")
        .maybeSingle();
      if (!routineError && routineRow?.value) {
        try {
          const mapped = JSON.parse(routineRow.value);
          if (mapped.Push && mapped.Pull && mapped.Legs) {
            setSavedRoutine(mapped);
            localStorage.setItem(ROUTINES_KEY, JSON.stringify(mapped));
          }
        } catch (_) { /* ignore parse error, keep localStorage default */ }
      }

      // Routine customizations
      const { data: rcData, error: rcError } = await supabase
        .from("routine_customizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (!rcError && rcData && rcData.length > 0) {
        const mapped = rcData.map((r) => ({
          id: r.id, createdAt: r.created_at, workoutType: r.workout_type,
          exerciseName: r.exercise_name, prescription: r.prescription,
          notes: r.notes, sourceMessage: r.source_message,
        }));
        setRoutineCustomizations(mapped);
        localStorage.setItem(ROUTINE_CUSTOMIZATIONS_KEY, JSON.stringify(mapped));
      }

      setSyncing(false);
    }
    fetchAll();
  }, []);

  // Cache recommendations
  useEffect(() => {
    if (recommendations) localStorage.setItem(RECS_KEY, JSON.stringify(recommendations));
  }, [recommendations]);

  const selectedLog = useMemo(
    () => logs.find((l) => l.id === selectedId) || logs[0],
    [logs, selectedId]
  );

  const stats = useMemo(() => ({
    totalSessions: logs.length,
    pushCount: logs.filter((l) => l.workout === "Push").length,
    pullCount: logs.filter((l) => l.workout === "Pull").length,
    legCount: logs.filter((l) => l.workout === "Legs").length,
  }), [logs]);

  const nextWorkout = useMemo(() => {
    if (logs.length === 0) return "Push";
    const cycle = { Push: "Pull", Pull: "Legs", Legs: "Push" };
    return cycle[logs[0].workout] || "Push";
  }, [logs]);

  const liveMetrics = useMemo(() => computeWorkoutMetrics(logs), [logs]);

  // Auto-scroll chat to bottom on new messages
  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachChat, chatLoading]);

  const sendCoachMessage = async (text) => {
    const msg = (text || chatInput).trim();
    if (!msg || chatLoading) return;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;

    const userMsg = { role: "user", text: msg, id: Date.now() };
    // Snapshot history BEFORE state update (state is async)
    const historyForGemini = coachChat.filter((m) => !m.isError);
    const newChat = [...coachChat, userMsg];
    setCoachChat(newChat);
    setChatInput("");
    setChatLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `You are a personal strength & conditioning coach. Here is your athlete's profile:
- Training split: Push / Pull / Legs (PPL)
- Known issue: LOWER BACK PAIN — always suggest spine-safe alternatives; never recommend exercises that compress the lumbar spine
- Sport: Cricket (plays weekends) — fielding stamina and rotational power matter
- Currently on Week ${absWeek} of the 4-week McGill Big 3 abs program
- Recent sessions: ${logs.slice(0, 5).map((l) => `${l.date} ${l.workout} (${l.exercises.map((e) => e.name).join(", ")})`).join(" | ") || "none yet"}

Be specific: give real exercise names with sets/reps when suggesting. Keep replies concise and practical.`,
      });

      const chat = model.startChat({
        history: historyForGemini.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      const result = await chat.sendMessage(msg);
      const aiMsg = { role: "model", text: result.response.text(), id: Date.now() + 1 };
      const finalChat = [...newChat, aiMsg];
      setCoachChat(finalChat);
      localStorage.setItem(COACH_CHAT_KEY, JSON.stringify(finalChat));
    } catch (err) {
      const errMsg = { role: "model", text: `Sorry, something went wrong: ${err.message}`, id: Date.now() + 1, isError: true };
      setCoachChat([...newChat, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearCoachChat = () => {
    setCoachChat([]);
    localStorage.removeItem(COACH_CHAT_KEY);
  };

  const saveRoutineCustomization = async (form) => {
    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString().slice(0, 10),
      workoutType: form.workoutType,
      exerciseName: form.exerciseName.trim(),
      prescription: form.prescription.trim(),
      notes: form.notes.trim(),
      sourceMessage: form.sourceMessage,
    };
    const updated = [entry, ...routineCustomizations];
    setRoutineCustomizations(updated);
    localStorage.setItem(ROUTINE_CUSTOMIZATIONS_KEY, JSON.stringify(updated));
    setAddingToRoutine(null);
    const { error } = await supabase.from("routine_customizations").insert({
      id: entry.id, created_at: entry.createdAt, workout_type: entry.workoutType,
      exercise_name: entry.exerciseName, prescription: entry.prescription,
      notes: entry.notes, source_message: entry.sourceMessage,
    });
    if (error) console.error("Routine customization sync failed:", error.message);
  };

  const saveRoutineToDB = async () => {
    setRoutineSaving(true);
    setRoutineSaveMsg("");
    const { error } = await supabase
      .from("user_settings")
      .upsert({ key: "ppl_routine", value: JSON.stringify(savedRoutine) }, { onConflict: "key" });
    if (error) {
      setRoutineSaveMsg("Save failed: " + error.message);
    } else {
      localStorage.setItem(ROUTINES_KEY, JSON.stringify(savedRoutine));
      setRoutineSaveMsg("✓ Routine saved.");
    }
    setRoutineSaving(false);
    setTimeout(() => setRoutineSaveMsg(""), 3000);
  };

  const deleteRoutineCustomization = async (id) => {
    const updated = routineCustomizations.filter((c) => c.id !== id);
    setRoutineCustomizations(updated);
    localStorage.setItem(ROUTINE_CUSTOMIZATIONS_KEY, JSON.stringify(updated));
    await supabase.from("routine_customizations").delete().eq("id", id);
  };

  const addCustomizationToSession = (customization) => {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, blankExercise(customization.exerciseName)],
    }));
  };

  const startSuggestedSession = () => {
    setForm({
      date: todayStr(),
      workout: nextWorkout,
      title: "",
      energy: "",
      pump: "",
      pain: "",
      notes: "",
      exercises: (savedRoutine[nextWorkout] || templates[nextWorkout]).map((x) => blankExercise(x)),
    });
    setOpen(true);
  };

  const updateWorkoutType = (value) => {
    setForm((prev) => ({
      ...prev,
      workout: value,
      title: prev.title || value,
      exercises: (savedRoutine[value] || templates[value]).map((x) => blankExercise(x)),
    }));
  };

  const updateExercise = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.exercises];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, exercises: next };
    });
  };

  const addExercise = () =>
    setForm((prev) => ({ ...prev, exercises: [...prev.exercises, blankExercise("")] }));

  const removeExercise = (index) =>
    setForm((prev) => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== index) }));

  const addSet = (exIndex) =>
    setForm((prev) => {
      const next = [...prev.exercises];
      next[exIndex] = { ...next[exIndex], sets: [...next[exIndex].sets, blankSet()] };
      return { ...prev, exercises: next };
    });

  const removeSet = (exIndex, setIndex) =>
    setForm((prev) => {
      const next = [...prev.exercises];
      next[exIndex] = { ...next[exIndex], sets: next[exIndex].sets.filter((_, i) => i !== setIndex) };
      return { ...prev, exercises: next };
    });

  const updateSet = (exIndex, setIndex, field, value) =>
    setForm((prev) => {
      const next = [...prev.exercises];
      const sets = [...next[exIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      next[exIndex] = { ...next[exIndex], sets };
      return { ...prev, exercises: next };
    });

  const saveLog = async () => {
    const cleanExercises = form.exercises.filter(
      (e) => e.name.trim() || e.sets.some((s) => s.reps.trim() || s.weight.trim()) || e.notes.trim()
    );
    const newLog = {
      id: Date.now(),
      ...form,
      title: form.title || form.workout,
      exercises: cleanExercises,
    };

    // Optimistic update — UI responds instantly
    setLogs((prev) => [newLog, ...prev]);
    setSelectedId(newLog.id);
    setRecommendations(null);
    localStorage.removeItem(RECS_KEY);
    setOpen(false);
    setForm({
      date: todayStr(),
      workout: "Push",
      title: "",
      energy: "",
      pump: "",
      pain: "",
      notes: "",
      exercises: (savedRoutine.Push || templates.Push).map((x) => blankExercise(x)),
    });

    // Persist to Supabase
    const { error } = await supabase.from("workout_logs").insert(newLog);
    if (error) {
      console.error("Supabase insert failed:", error.message);
      setSyncError("Saved locally but failed to sync to database.");
    } else {
      setSyncError("");
      localStorage.setItem(LOGS_KEY, JSON.stringify([newLog, ...logs]));
    }
  };

  const deleteLog = async (id) => {
    const remaining = logs.filter((l) => l.id !== id);
    setLogs(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? null);
    localStorage.setItem(LOGS_KEY, JSON.stringify(remaining));

    const { error } = await supabase.from("workout_logs").delete().eq("id", id);
    if (error) console.error("Supabase delete failed:", error.message);
  };

  const toggleLowerBackExercise = async (index) => {
    const today = todayStr();
    const currentDone = lowerBackLog[today] || [];
    const nextIndices = currentDone.includes(index)
      ? currentDone.filter((i) => i !== index)
      : [...currentDone, index];
    const updated = { ...lowerBackLog, [today]: nextIndices };
    setLowerBackLog(updated);
    localStorage.setItem(LB_LOG_KEY, JSON.stringify(updated));
    const { error } = await supabase
      .from("lower_back_log")
      .upsert({ date: today, completed_indices: nextIndices });
    if (error) console.error("LB sync failed:", error.message);
  };

  const toggleAbsExercise = async (sessionKey, index) => {
    const currentDone = absLog[sessionKey] || [];
    const nextIndices = currentDone.includes(index)
      ? currentDone.filter((i) => i !== index)
      : [...currentDone, index];
    const updated = { ...absLog, [sessionKey]: nextIndices };
    setAbsLog(updated);
    localStorage.setItem(ABS_LOG_KEY, JSON.stringify(updated));
    const { error } = await supabase
      .from("abs_log")
      .upsert({ session_key: sessionKey, completed_indices: nextIndices });
    if (error) console.error("Abs sync failed:", error.message);
  };

  const advanceAbsWeek = async () => {
    const next = Math.min(absWeek + 1, 4);
    setAbsWeek(next);
    localStorage.setItem(ABS_WEEK_KEY, JSON.stringify(next));
    const { error } = await supabase
      .from("user_settings")
      .upsert({ key: "abs_week", value: String(next) });
    if (error) console.error("Abs week sync failed:", error.message);
  };

  const generateSessionInsight = async (log) => {
    setLoadingInsightId(log.id);
    try {
      const insight = await fetchSessionInsight(log);
      setSessionInsights((prev) => {
        const updated = { ...prev, [log.id]: insight };
        localStorage.setItem(SESSION_INSIGHTS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Session insight failed:", err.message);
    } finally {
      setLoadingInsightId(null);
    }
  };

  const forceSyncToSupabase = async () => {
    setForceSyncing(true);
    setForceSyncMsg("");
    const errors = [];

    // Workout logs
    if (logs.length > 0) {
      const { error } = await supabase.from("workout_logs").upsert(logs, { onConflict: "id" });
      if (error) errors.push(`Workout logs: ${error.message}`);
    }

    // Lower back log
    const lbEntries = Object.entries(lowerBackLog).map(([date, completed_indices]) => ({ date, completed_indices }));
    if (lbEntries.length > 0) {
      const { error } = await supabase.from("lower_back_log").upsert(lbEntries);
      if (error) errors.push(`Lower back: ${error.message}`);
    }

    // Abs log
    const absEntries = Object.entries(absLog).map(([session_key, completed_indices]) => ({ session_key, completed_indices }));
    if (absEntries.length > 0) {
      const { error } = await supabase.from("abs_log").upsert(absEntries);
      if (error) errors.push(`Abs log: ${error.message}`);
    }

    // Abs week
    const { error: weekError } = await supabase
      .from("user_settings")
      .upsert({ key: "abs_week", value: String(absWeek) });
    if (weekError) errors.push(`Abs week: ${weekError.message}`);

    // Cardio sessions
    if (cardioLog.length > 0) {
      const entries = cardioLog.map((s) => ({
        id: s.id, date: s.date, drill_id: s.drillId,
        name: s.name, xp: s.xp, notes: s.notes,
      }));
      const { error } = await supabase.from("cardio_sessions").upsert(entries, { onConflict: "id" });
      if (error) errors.push(`Cardio: ${error.message}`);
    }

    // Routine customizations
    if (routineCustomizations.length > 0) {
      const entries = routineCustomizations.map((c) => ({
        id: c.id, created_at: c.createdAt, workout_type: c.workoutType,
        exercise_name: c.exerciseName, prescription: c.prescription,
        notes: c.notes, source_message: c.sourceMessage,
      }));
      const { error } = await supabase.from("routine_customizations").upsert(entries, { onConflict: "id" });
      if (error) errors.push(`Routine customizations: ${error.message}`);
    }

    setForceSyncMsg(errors.length === 0
      ? "✓ All data synced to Supabase."
      : `Synced with errors — ${errors.join(" | ")}`
    );
    setForceSyncing(false);
  };

  const logCardioSession = async (drill, notes = "") => {
    const entry = { id: Date.now(), date: todayStr(), drillId: drill.id, name: drill.name, xp: drill.xp, notes };
    setCardioLog((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem(CARDIO_LOG_KEY, JSON.stringify(updated));
      return updated;
    });
    await supabase.from("cardio_sessions").insert({
      id: entry.id,
      date: entry.date,
      drill_id: entry.drillId,
      name: entry.name,
      xp: entry.xp,
      notes: entry.notes,
    });
  };

  const migrateToSupabase = async () => {
    setMigrating(true);
    const { error } = await supabase.from("workout_logs").insert(pendingMigration);
    if (error) {
      setSyncError("Migration failed: " + error.message);
    } else {
      setPendingMigration([]);
      setSyncError("");
    }
    setMigrating(false);
  };

  const handleGetRecommendations = async () => {
    setLoadingAI(true);
    setAiError("");
    try {
      const metrics = computeWorkoutMetrics(logs);
      const data = await fetchGeminiRecommendations(logs, metrics);
      setRecommendations(data);
    } catch (err) {
      setAiError(err.message || "Failed to get recommendations.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Sync status */}
        {syncing && (
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Syncing with database…
          </div>
        )}
        {/* Force sync bar */}
        {!syncing && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2">
            <span className={`text-xs ${forceSyncMsg.startsWith("✓") ? "text-green-600" : forceSyncMsg ? "text-red-600" : "text-zinc-400"}`}>
              {forceSyncMsg || "Auto-sync active — use Force Sync if data seems out of date."}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={forceSyncToSupabase}
              disabled={forceSyncing}
              className="shrink-0 rounded-xl h-7 px-3 text-xs"
            >
              {forceSyncing ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Syncing…</> : "Force Sync"}
            </Button>
          </div>
        )}
        {syncError && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
            {syncError}
          </div>
        )}
        {pendingMigration.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-blue-800">
              <span className="font-semibold">{pendingMigration.length} local log{pendingMigration.length !== 1 ? "s" : ""} found</span>
              {" "}— not yet saved to database. Migrate now to access them on all devices.
            </div>
            <Button
              size="sm"
              onClick={migrateToSupabase}
              disabled={migrating}
              className="shrink-0 rounded-xl bg-blue-700 hover:bg-blue-800 text-white"
            >
              {migrating ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Migrating…</> : "Migrate to Database"}
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Workout Memory Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">
              PPL split tracker — log sessions, review history, and get AI coaching insights.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full rounded-2xl px-5 sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Workout Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-2xl sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>New Workout Entry</DialogTitle>
              </DialogHeader>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">Date</label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Workout Type</label>
                  <Select value={form.workout} onValueChange={updateWorkoutType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Push">Push</SelectItem>
                      <SelectItem value="Pull">Pull</SelectItem>
                      <SelectItem value="Legs">Legs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Optional session title" />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">Energy</label>
                  <Input value={form.energy} onChange={(e) => setForm({ ...form, energy: e.target.value })} placeholder="High / Medium / Low" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Pump</label>
                  <Input value={form.pump} onChange={(e) => setForm({ ...form, pump: e.target.value })} placeholder="Good / Average / Great" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Pain / Injury</label>
                  <Input value={form.pain} onChange={(e) => setForm({ ...form, pain: e.target.value })} placeholder="None / Lower back / Shoulder" />
                </div>
              </div>

              {/* Saved coach suggestions for this workout type */}
              {routineCustomizations.filter((c) => c.workoutType === form.workout).length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Saved Coach Suggestions for {form.workout}
                  </p>
                  {routineCustomizations.filter((c) => c.workoutType === form.workout).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-emerald-200 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-zinc-800">{c.exerciseName}</span>
                        {c.prescription && <span className="ml-2 text-xs text-zinc-500">{c.prescription}</span>}
                        {c.notes && <p className="text-xs text-zinc-400 mt-0.5 truncate">{c.notes}</p>}
                      </div>
                      <Button size="sm" onClick={() => addCustomizationToSession(c)} className="shrink-0 rounded-xl h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        + Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Exercises</h3>
                  <Button variant="outline" size="sm" onClick={addExercise}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Exercise
                  </Button>
                </div>
                {form.exercises.map((exercise, exIdx) => (
                  <Card key={exIdx} className="rounded-2xl border-zinc-200 shadow-sm">
                    <CardContent className="p-3 space-y-3">
                      {/* Exercise name + delete */}
                      <div className="flex items-center gap-2">
                        <Input
                          value={exercise.name}
                          onChange={(e) => updateExercise(exIdx, "name", e.target.value)}
                          placeholder="Exercise name"
                          className="flex-1 font-medium"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeExercise(exIdx)} className="shrink-0 text-zinc-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Per-set rows */}
                      <div className="space-y-2">
                        {exercise.sets.map((set, setIdx) => (
                          <div key={setIdx} className="flex items-center gap-2">
                            <span className="w-12 shrink-0 text-xs font-medium text-zinc-400">Set {setIdx + 1}</span>
                            <Input
                              value={set.reps}
                              onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                              placeholder="Reps"
                              className="w-20 text-center"
                            />
                            <span className="shrink-0 text-xs text-zinc-400">reps @</span>
                            <Input
                              value={set.weight}
                              onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                              placeholder="Weight"
                              className="flex-1 text-center"
                            />
                            {exercise.sets.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeSet(exIdx, setIdx)} className="shrink-0 h-7 w-7 text-zinc-300 hover:text-red-400">
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add set + notes */}
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => addSet(exIdx)} className="text-xs h-7 px-3">
                          <Plus className="mr-1 h-3 w-3" />
                          Add Set
                        </Button>
                        <Input
                          value={exercise.notes}
                          onChange={(e) => updateExercise(exIdx, "notes", e.target.value)}
                          placeholder="Notes (optional)"
                          className="flex-1 text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Session Notes</label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="How did the session feel? Progression notes, fatigue, pain, or performance details."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveLog} className="rounded-2xl px-6">Save Entry</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatCard icon={<Dumbbell className="h-4 w-4" />} label="Total Sessions" value={stats.totalSessions} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Push Sessions" value={stats.pushCount} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Pull Sessions" value={stats.pullCount} />
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Leg Sessions" value={stats.legCount} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl">
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="current" className="text-xs sm:text-sm">Session</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm">AI Coaching</TabsTrigger>
            <TabsTrigger value="cricket" className="text-xs sm:text-sm">Cricket Fit</TabsTrigger>
            <TabsTrigger value="routine" className="text-xs sm:text-sm">Routine</TabsTrigger>
          </TabsList>

          {/* History tab */}
          <TabsContent value="history">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <Card className="rounded-3xl border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg">Workout History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Next session suggestion */}
                  {logs.length > 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Up Next</div>
                        <div className="mt-0.5 text-sm font-bold text-zinc-800">{nextWorkout} Day</div>
                        <div className="text-xs text-zinc-500">Last was {logs[0].workout}</div>
                      </div>
                      <Button size="sm" onClick={startSuggestedSession} className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs">
                        <Plus className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                    </div>
                  )}
                  {logs.length === 0 && (
                    <p className="text-sm text-zinc-400">No sessions logged yet.</p>
                  )}
                  {logs.map((log) => (
                    <div key={log.id} className="relative group">
                      <button
                        onClick={() => setSelectedId(log.id)}
                        className={`w-full rounded-2xl border p-4 pr-10 text-left transition ${
                          selectedId === log.id
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{log.title}</div>
                            <div className={`text-xs ${selectedId === log.id ? "text-zinc-300" : "text-zinc-500"}`}>{log.date}</div>
                          </div>
                          <Badge variant={selectedId === log.id ? "secondary" : "outline"}>{log.workout}</Badge>
                        </div>
                      </button>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition opacity-40 group-hover:opacity-100"
                        title="Delete log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <SessionDetail log={selectedLog} insight={sessionInsights[selectedLog?.id]} loadingInsight={loadingInsightId === selectedLog?.id} onGenerateInsight={generateSessionInsight} />
            </div>
          </TabsContent>

          {/* Selected session tab */}
          <TabsContent value="current">
            <SessionDetail log={selectedLog} />
          </TabsContent>

          {/* AI Coaching tab */}
          <TabsContent value="ai">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">AI Coaching Insights</h2>
                  <p className="text-sm text-zinc-500">Gemini analyzes tonnage, e1RM trends, plateaus & more across your {logs.length} session{logs.length !== 1 ? "s" : ""}.</p>
                </div>
                <Button onClick={handleGetRecommendations} disabled={loadingAI || logs.length === 0} className="w-full rounded-2xl px-5 sm:w-auto">
                  {loadingAI ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />{recommendations ? "Refresh Insights" : "Get Insights"}</>
                  )}
                </Button>
              </div>

              {/* Live metrics bar — always visible */}
              {liveMetrics && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Sessions", value: liveMetrics.totalSessions },
                    { label: "Weeks Training", value: liveMetrics.weekCount },
                    { label: "Avg Tonnage", value: `${liveMetrics.avgTonnage} kg` },
                    { label: "Push:Pull", value: liveMetrics.pushPullRatio },
                  ].map((m) => (
                    <Card key={m.label} className="rounded-2xl border-zinc-200">
                      <CardContent className="p-3">
                        <div className="text-xs text-zinc-500">{m.label}</div>
                        <div className="mt-0.5 text-lg font-bold text-zinc-800">{m.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {aiError && (
                <Card className="rounded-3xl border-red-200 bg-red-50">
                  <CardContent className="p-5 text-sm text-red-700">{aiError}</CardContent>
                </Card>
              )}

              {!recommendations && !loadingAI && !aiError && (
                <Card className="rounded-3xl border-zinc-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="mb-3 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-500">Hit "Get Insights" to analyze your training with computed tonnage, e1RM, and plateau signals.</p>
                  </CardContent>
                </Card>
              )}

              {recommendations && (
                <div className="grid gap-4 md:grid-cols-2">

                  {/* Observations + Tonnage */}
                  <Card className="rounded-3xl border-zinc-200 md:col-span-2">
                    <CardHeader><CardTitle className="text-base">Performance Observations</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">
                        {recommendations.observations?.map((obs, i) => (
                          <li key={i} className="flex gap-2 text-sm text-zinc-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />{obs}
                          </li>
                        ))}
                      </ul>
                      {recommendations.tonnage_insight && (
                        <div className="mt-2 rounded-2xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm text-zinc-600">
                          <span className="font-medium text-zinc-700">Volume trend: </span>{recommendations.tonnage_insight}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Deload signal */}
                  {recommendations.deload_signal?.needed && (
                    <Card className="rounded-3xl border-orange-200 bg-orange-50 md:col-span-2">
                      <CardHeader><CardTitle className="text-base text-orange-800">Deload Recommended</CardTitle></CardHeader>
                      <CardContent className="text-sm text-orange-700">{recommendations.deload_signal.reason}</CardContent>
                    </Card>
                  )}

                  {/* Plateau alerts */}
                  {recommendations.plateau_alerts?.length > 0 && (
                    <Card className="rounded-3xl border-yellow-200 bg-yellow-50">
                      <CardHeader><CardTitle className="text-base text-yellow-800">Plateau Alerts</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations.plateau_alerts.map((p, i) => (
                            <li key={i} className="text-sm text-yellow-800">
                              <span className="font-medium">{p.exercise}:</span> {p.recommendation}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Strength gains */}
                  {recommendations.strength_gains?.length > 0 && (
                    <Card className="rounded-3xl border-green-200 bg-green-50">
                      <CardHeader><CardTitle className="text-base text-green-800">Strength Gains</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations.strength_gains.map((g, i) => (
                            <li key={i} className="text-sm text-green-800">
                              <span className="font-medium">{g.exercise}:</span> {g.observation}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Abs integration */}
                  {recommendations.abs_integration && (
                    <Card className="rounded-3xl border-violet-200 bg-violet-50 md:col-span-2">
                      <CardHeader><CardTitle className="text-base text-violet-800">Abs Integration Plan</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-violet-700">{recommendations.abs_integration.schedule}</p>
                        <ul className="space-y-1">
                          {recommendations.abs_integration.starter_exercises?.map((ex, i) => (
                            <li key={i} className="flex gap-2 text-sm text-violet-800">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />{ex}
                            </li>
                          ))}
                        </ul>
                        {recommendations.abs_integration.key_tip && (
                          <div className="rounded-2xl bg-violet-100 border border-violet-200 px-4 py-2 text-xs text-violet-700 italic">
                            Tip: {recommendations.abs_integration.key_tip}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Push / Pull / Legs session plans */}
                  <SessionPlanCard data={recommendations.push} color="blue" />
                  <SessionPlanCard data={recommendations.pull} color="green" />
                  <SessionPlanCard data={recommendations.legs} color="purple" />

                  {/* Warnings */}
                  {recommendations.warnings?.length > 0 && (
                    <Card className="rounded-3xl border-amber-200 bg-amber-50 md:col-span-2">
                      <CardHeader><CardTitle className="text-base text-amber-800">Injury / Recovery Notes</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations.warnings.map((w, i) => (
                            <li key={i} className="flex gap-2 text-sm text-amber-700">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{w}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ── Saved routine customizations ── */}
              {routineCustomizations.length > 0 && (
                <div className="mt-2">
                  <Card className="rounded-3xl border-emerald-200 bg-emerald-50">
                    <CardHeader>
                      <CardTitle className="text-base text-emerald-800">Saved Routine Additions</CardTitle>
                      <p className="text-sm text-emerald-600">These appear in your workout form whenever you log the matching day</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {["Push", "Pull", "Legs"].map((type) => {
                        const entries = routineCustomizations.filter((c) => c.workoutType === type);
                        if (!entries.length) return null;
                        return (
                          <div key={type}>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">{type} Day</p>
                            {entries.map((c) => (
                              <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-zinc-800">{c.exerciseName}</div>
                                  {c.prescription && <div className="text-xs text-zinc-500">{c.prescription}</div>}
                                  {c.notes && <div className="text-xs text-zinc-400 mt-0.5">{c.notes}</div>}
                                  <div className="text-xs text-zinc-300 mt-0.5">Added {c.createdAt}</div>
                                </div>
                                <button
                                  onClick={() => deleteRoutineCustomization(c.id)}
                                  className="text-zinc-300 hover:text-red-400 transition shrink-0 mt-0.5"
                                  title="Remove"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Coach Chat ── always visible */}
              <div className="mt-2">
                <Card className="rounded-3xl border-zinc-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-zinc-500" />
                          Ask Your Coach
                        </CardTitle>
                        <p className="text-sm text-zinc-500 mt-0.5">Real-time answers — your workout history &amp; profile are already loaded</p>
                      </div>
                      {coachChat.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearCoachChat} className="text-xs text-zinc-400 h-7 px-2 rounded-xl hover:text-red-500">
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Message history */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {coachChat.length === 0 && (
                        <p className="text-sm text-zinc-400 text-center py-8">
                          Ask anything — exercise alternatives, session tweaks, whether to train with pain…
                        </p>
                      )}
                      {coachChat.map((msg) => (
                        <div key={msg.id} className="space-y-1">
                          <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "bg-zinc-900 text-white rounded-br-md"
                                : msg.isError
                                ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-md"
                                : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                          {/* Save to routine button — only on AI messages */}
                          {msg.role === "model" && !msg.isError && (
                            <div className="flex justify-start pl-1">
                              {addingToRoutine?.messageId === msg.id ? (
                                <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                                  <p className="text-xs font-semibold text-emerald-700">Save exercise to routine</p>
                                  <select
                                    value={addingToRoutine.workoutType}
                                    onChange={(e) => setAddingToRoutine((p) => ({ ...p, workoutType: e.target.value }))}
                                    className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs text-zinc-800"
                                  >
                                    <option value="Push">Push Day</option>
                                    <option value="Pull">Pull Day</option>
                                    <option value="Legs">Legs Day</option>
                                  </select>
                                  <Input
                                    value={addingToRoutine.exerciseName}
                                    onChange={(e) => setAddingToRoutine((p) => ({ ...p, exerciseName: e.target.value }))}
                                    placeholder="Exercise name (e.g. Chest-Supported Row)"
                                    className="rounded-xl text-xs h-8"
                                  />
                                  <Input
                                    value={addingToRoutine.prescription}
                                    onChange={(e) => setAddingToRoutine((p) => ({ ...p, prescription: e.target.value }))}
                                    placeholder="Sets / reps (e.g. 3 × 12)"
                                    className="rounded-xl text-xs h-8"
                                  />
                                  <Input
                                    value={addingToRoutine.notes}
                                    onChange={(e) => setAddingToRoutine((p) => ({ ...p, notes: e.target.value }))}
                                    placeholder="Notes (optional)"
                                    className="rounded-xl text-xs h-8"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveRoutineCustomization(addingToRoutine)}
                                      disabled={!addingToRoutine.exerciseName.trim()}
                                      className="rounded-xl h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                                    >
                                      Save to Routine
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setAddingToRoutine(null)}
                                      className="rounded-xl h-7 px-3 text-xs text-zinc-400"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddingToRoutine({ messageId: msg.id, workoutType: "Push", exerciseName: "", prescription: "", notes: "", sourceMessage: msg.text })}
                                  className="text-xs text-zinc-400 hover:text-emerald-600 transition flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" /> Save to routine
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-100 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex gap-1 items-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Quick prompt chips — show when chat is empty */}
                    {coachChat.length === 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {QUICK_PROMPTS.map((p) => (
                          <button
                            key={p}
                            onClick={() => sendCoachMessage(p)}
                            disabled={chatLoading}
                            className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition disabled:opacity-40"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input row */}
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCoachMessage(); } }}
                        placeholder="e.g. Give me a lower-back safe row variation…"
                        className="rounded-2xl flex-1"
                        disabled={chatLoading}
                      />
                      <Button
                        onClick={() => sendCoachMessage()}
                        disabled={!chatInput.trim() || chatLoading}
                        className="rounded-2xl shrink-0 w-10 p-0"
                      >
                        {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Cricket Fit tab */}
          <TabsContent value="cricket">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Cricket Fit</h2>
                <p className="text-sm text-zinc-500">Lower back rehab + 4-week abs program + gamified gym cardio.</p>
              </div>
              <LowerBackCard lowerBackLog={lowerBackLog} onToggle={toggleLowerBackExercise} />
              <AbsProgramCard absWeek={absWeek} absLog={absLog} onToggle={toggleAbsExercise} onAdvanceWeek={advanceAbsWeek} />
              <CardioChallenge cardioLog={cardioLog} onLog={logCardioSession} />
            </div>
          </TabsContent>

          {/* Routine tab */}
          <TabsContent value="routine">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">My PPL Routine</h2>
                <p className="text-sm text-zinc-500">Edit your Push / Pull / Legs exercise lists and save to the database.</p>
              </div>

              {["Push", "Pull", "Legs"].map((type) => (
                <Card key={type} className="rounded-3xl border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-zinc-500" />
                      {type} Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(savedRoutine[type] || []).map((ex, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm">{ex}</span>
                        <button
                          onClick={() => {
                            const updated = { ...savedRoutine, [type]: savedRoutine[type].filter((_, i) => i !== idx) };
                            setSavedRoutine(updated);
                            localStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Remove exercise"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder={`Add ${type} exercise…`}
                        value={routineNewExercise[type]}
                        onChange={(e) => setRoutineNewExercise((prev) => ({ ...prev, [type]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && routineNewExercise[type].trim()) {
                            const updated = { ...savedRoutine, [type]: [...(savedRoutine[type] || []), routineNewExercise[type].trim()] };
                            setSavedRoutine(updated);
                            localStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
                            setRoutineNewExercise((prev) => ({ ...prev, [type]: "" }));
                          }
                        }}
                        className="rounded-xl text-sm h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 px-3 shrink-0"
                        onClick={() => {
                          if (!routineNewExercise[type].trim()) return;
                          const updated = { ...savedRoutine, [type]: [...(savedRoutine[type] || []), routineNewExercise[type].trim()] };
                          setSavedRoutine(updated);
                          localStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
                          setRoutineNewExercise((prev) => ({ ...prev, [type]: "" }));
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* AI-suggested routine customizations */}
              {routineCustomizations.length > 0 && (
                <Card className="rounded-3xl border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      AI Suggestions Added
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {routineCustomizations.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                        <div>
                          <div className="text-sm font-medium text-zinc-800">{c.exercise_name} <Badge variant="outline" className="ml-1 text-xs">{c.workout_type}</Badge></div>
                          {c.prescription && <div className="text-xs text-zinc-500 mt-0.5">{c.prescription}</div>}
                          {c.notes && <div className="text-xs text-zinc-400 mt-0.5">{c.notes}</div>}
                        </div>
                        <button
                          onClick={() => deleteRoutineCustomization(c.id)}
                          className="shrink-0 rounded-lg p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition mt-0.5"
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={saveRoutineToDB}
                  disabled={routineSaving}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white"
                >
                  {routineSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save to Database
                </Button>
                {routineSaveMsg && (
                  <span className={`text-sm ${routineSaveMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
                    {routineSaveMsg}
                  </span>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value }) {
  return (
    <Card className="rounded-3xl border-zinc-200 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm text-zinc-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-3 text-zinc-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

function SessionDetail({ log, insight, loadingInsight, onGenerateInsight }) {
  if (!log) return (
    <Card className="rounded-3xl border-zinc-200">
      <CardContent className="flex items-center justify-center py-16 text-sm text-zinc-400">
        Select a session from the history.
      </CardContent>
    </Card>
  );

  // Compute session stats
  const tonnage = Math.round(log.exercises.reduce((s, ex) => s + parseExerciseTonnage(ex), 0));
  const totalSets = log.exercises.reduce((s, ex) => s + (ex.sets ? ex.sets.length : 1), 0);
  const topLift = log.exercises.reduce((best, ex) => {
    const v = parseExerciseE1RM(ex);
    return v > best.val ? { name: ex.name, val: Math.round(v) } : best;
  }, { name: "", val: 0 });

  return (
    <Card className="rounded-3xl border-zinc-200">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{log.title}</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">{log.date}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{log.workout}</Badge>
            <Button
              size="sm"
              variant={insight ? "outline" : "default"}
              onClick={() => onGenerateInsight(log)}
              disabled={loadingInsight}
              className="rounded-xl h-8 px-3 text-xs"
            >
              {loadingInsight ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Analyzing…</>
              ) : insight ? (
                <><Sparkles className="mr-1.5 h-3 w-3" />Refresh Insight</>
              ) : (
                <><Sparkles className="mr-1.5 h-3 w-3" />AI Insight</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-zinc-900 text-white p-3 text-center">
            <div className="text-xs text-zinc-400 uppercase tracking-wide">Volume</div>
            <div className="mt-1 text-lg font-bold">{tonnage > 0 ? `${tonnage.toLocaleString()} kg` : "—"}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Sets</div>
            <div className="mt-1 text-lg font-bold text-zinc-800">{totalSets}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Top e1RM</div>
            <div className="mt-1 text-sm font-bold text-zinc-800 leading-tight">{topLift.val > 0 ? `${topLift.val} kg` : "—"}</div>
          </div>
        </div>

        {/* AI Insight panel */}
        {insight && (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900 text-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-sm font-semibold">{insight.headline}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {insight.what_went_well?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">What went well</p>
                  <ul className="space-y-1">
                    {insight.what_went_well.map((w, i) => (
                      <li key={i} className="flex gap-2 text-xs text-zinc-300">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insight.improve_next?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Improve next time</p>
                  <ul className="space-y-1">
                    {insight.improve_next.map((w, i) => (
                      <li key={i} className="flex gap-2 text-xs text-zinc-300">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-yellow-400" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {insight.next_session_tip && (
              <div className="border-t border-zinc-700 pt-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Next session focus</p>
                <p className="text-xs text-zinc-200">{insight.next_session_tip}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 grid-cols-3">
          <InfoBox label="Energy" value={log.energy || "—"} />
          <InfoBox label="Pump" value={log.pump || "—"} />
          <InfoBox label="Pain" value={log.pain || "—"} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Exercises</h3>
          <div className="space-y-3">
            {log.exercises.map((exercise, index) => {
              const e1rm = parseExerciseE1RM(exercise);
              return (
                <div key={index} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{exercise.name}</div>
                    {e1rm > 0 && <span className="text-xs text-zinc-400 shrink-0">e1RM ~{Math.round(e1rm)} kg</span>}
                  </div>
                  {exercise.sets ? (
                    <div className="mt-2 space-y-1">
                      {exercise.sets.map((set, si) => (
                        <div key={si} className="flex items-center gap-3 text-sm text-zinc-600">
                          <span className="w-10 shrink-0 text-xs text-zinc-400">Set {si + 1}</span>
                          <span className="font-medium">{set.reps || "—"} reps</span>
                          <span className="text-zinc-400">@</span>
                          <span className="font-medium">{set.weight || "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-zinc-600">{exercise.setsReps || "—"} • {exercise.weight || "—"}</div>
                  )}
                  {exercise.notes && <div className="mt-2 text-sm text-zinc-500">{exercise.notes}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Session Notes</h3>
          <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-700">
            {log.notes || "No notes added."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-zinc-800">{value}</div>
    </div>
  );
}

const colorMap = {
  blue: { border: "border-blue-200", bg: "bg-blue-50", title: "text-blue-800", bullet: "bg-blue-400", focus: "text-blue-700" },
  green: { border: "border-green-200", bg: "bg-green-50", title: "text-green-800", bullet: "bg-green-400", focus: "text-green-700" },
  purple: { border: "border-purple-200", bg: "bg-purple-50", title: "text-purple-800", bullet: "bg-purple-400", focus: "text-purple-700" },
};

// ── AbsProgramCard ──────────────────────────────────────────────────────────
function AbsProgramCard({ absWeek, absLog, onToggle, onAdvanceWeek }) {
  const weekData = ABS_PROGRAM[absWeek - 1];
  const today = new Date().toISOString().slice(0, 10);

  const sessionCompletion = weekData.sessions.map((session, sIdx) => {
    const key = `${today}_w${absWeek}_s${sIdx}`;
    const done = absLog[key] || [];
    return { key, done, total: session.exercises.length, allDone: done.length === session.exercises.length };
  });

  const weekComplete = sessionCompletion.every((s) => s.allDone);

  return (
    <Card className="rounded-3xl border-violet-200 bg-violet-50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base text-violet-800 flex items-center gap-2">
              4-Week Abs Starter Program
            </CardTitle>
            <p className="text-sm text-violet-700 mt-0.5 font-medium">
              Week {absWeek} of 4 — {weekData.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Week progress dots */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((w) => (
                <div key={w} className={`h-2.5 w-2.5 rounded-full border ${
                  w < absWeek ? "bg-violet-500 border-violet-500"
                  : w === absWeek ? "bg-violet-300 border-violet-500"
                  : "bg-white border-violet-200"
                }`} />
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-violet-600 mt-1">Add these at the end of your Push and Legs sessions. Never before heavy compounds.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {weekData.sessions.map((session, sIdx) => {
          const { key, done, allDone } = sessionCompletion[sIdx];
          return (
            <div key={sIdx} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-700">{session.label}</h4>
                <span className="text-xs text-violet-500">{done.length}/{session.exercises.length}</span>
              </div>
              {allDone && (
                <div className="rounded-xl bg-green-100 border border-green-200 p-2 text-xs text-green-700 text-center font-medium">
                  Session complete!
                </div>
              )}
              {session.exercises.map((ex, eIdx) => {
                const isDone = done.includes(eIdx);
                return (
                  <button
                    key={eIdx}
                    onClick={() => onToggle(key, eIdx)}
                    className={`w-full flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      isDone ? "border-green-300 bg-green-50" : "border-violet-200 bg-white hover:bg-violet-50"
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      isDone ? "border-green-500 bg-green-500" : "border-violet-300"
                    }`}>
                      {isDone && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${isDone ? "line-through text-zinc-400" : "text-zinc-800"}`}>{ex.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{ex.prescription}</div>
                      <div className="text-xs text-zinc-400 mt-0.5 italic">{ex.tip}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}

        {weekComplete && absWeek < 4 && (
          <div className="rounded-2xl bg-violet-100 border border-violet-300 p-4 text-center space-y-2">
            <p className="text-sm font-semibold text-violet-800">Week {absWeek} sessions done!</p>
            <p className="text-xs text-violet-600">Complete this week's sessions a few times before advancing.</p>
            <Button onClick={onAdvanceWeek} size="sm" className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              Advance to Week {absWeek + 1}
            </Button>
          </div>
        )}
        {absWeek === 4 && (
          <div className="rounded-2xl bg-green-100 border border-green-200 p-3 text-sm text-green-700 text-center font-medium">
            You've completed the 4-week program! Next: Hollow body holds, Pallof press, Ab wheel rollouts.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── LowerBackCard ───────────────────────────────────────────────────────────
function LowerBackCard({ lowerBackLog, onToggle }) {
  const today = new Date();
  const dayIndex = today.getDay();
  const program = LOWER_BACK_PROGRAM[dayIndex];
  const todayStr = today.toISOString().slice(0, 10);
  const completed = lowerBackLog[todayStr] || [];
  const totalExercises = program.exercises.length;
  const completedCount = completed.length;
  const allDone = completedCount === totalExercises;

  // Streak: count consecutive days with at least 1 exercise done
  const streak = React.useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if ((lowerBackLog[ds] || []).length > 0) count++;
      else break;
    }
    return count;
  }, [lowerBackLog]);

  const c = program.classes;

  return (
    <Card className={`rounded-3xl ${c.border} ${c.bg}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className={`text-base flex items-center gap-2 ${c.title}`}>
              <Heart className="h-4 w-4" />
              Today's Lower Back Program
            </CardTitle>
            <p className={`text-sm font-medium mt-0.5 ${c.title} opacity-80`}>
              {today.toLocaleDateString("en-US", { weekday: "long" })} — {program.focus}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {streak > 0 && (
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
                <Flame className="h-3 w-3" /> {streak} day streak
              </span>
            )}
            <span className={`text-xs ${c.title} opacity-60`}>{completedCount}/{totalExercises} done</span>
          </div>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : c.bar}`}
            style={{ width: `${totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {allDone && (
          <div className="rounded-2xl bg-green-100 border border-green-200 p-3 text-sm text-green-700 font-medium text-center">
            All done for today! Your lower back will thank you.
          </div>
        )}
        {program.exercises.map((ex, i) => {
          const done = completed.includes(i);
          return (
            <button
              key={i}
              onClick={() => onToggle(i)}
              className={`w-full flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                done ? "border-green-300 bg-green-50" : "border-white/60 bg-white/50 hover:bg-white/80"
              }`}
            >
              <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
                done ? "border-green-500 bg-green-500" : "border-zinc-300"
              }`}>
                {done && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${done ? "line-through text-zinc-400" : "text-zinc-800"}`}>{ex.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{ex.prescription}</div>
                <div className="text-xs text-zinc-400 mt-0.5 italic">{ex.tip}</div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── CardioChallenge ─────────────────────────────────────────────────────────
function CardioChallenge({ cardioLog, onLog }) {
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [cardioNotes, setCardioNotes] = useState("");

  const totalXP = cardioLog.reduce((sum, s) => sum + s.xp, 0);
  const currentLevel = CRICKET_LEVELS.reduce((acc, l) => (totalXP >= l.minXp ? l : acc), CRICKET_LEVELS[0]);
  const nextLevel = CRICKET_LEVELS[currentLevel.level] || null;
  const xpInLevel = totalXP - currentLevel.minXp;
  const xpRange = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const progress = Math.min((xpInLevel / xpRange) * 100, 100);

  // Cardio streak: consecutive days with at least 1 session
  const cardioStreak = React.useMemo(() => {
    const dateSet = new Set(cardioLog.map((s) => s.date));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (dateSet.has(d.toISOString().slice(0, 10))) count++;
      else break;
    }
    return count;
  }, [cardioLog]);

  const handleLog = () => {
    if (!selectedDrill) return;
    onLog(selectedDrill, cardioNotes);
    setSelectedDrill(null);
    setCardioNotes("");
  };

  return (
    <div className="space-y-4">
      {/* Level card */}
      <Card className="rounded-3xl border-zinc-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Cricket Cardio Challenge
              </CardTitle>
              <p className="text-sm text-zinc-500">Build the stamina to field a full innings without gassing out</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-zinc-800">{totalXP} XP</div>
              <div className="text-xs text-zinc-500">Level {currentLevel.level}</div>
              {cardioStreak > 0 && (
                <div className="flex items-center justify-end gap-1 mt-1 text-xs font-semibold text-orange-600">
                  <Flame className="h-3 w-3" /> {cardioStreak}d streak
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-zinc-700">{currentLevel.name}</span>
              {nextLevel && (
                <span className="text-xs text-zinc-400">{nextLevel.minXp - totalXP} XP to {nextLevel.name}</span>
              )}
            </div>
            <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CRICKET_LEVELS.map((l) => (
              <span
                key={l.level}
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border transition ${
                  l.level === currentLevel.level
                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                    : l.level < currentLevel.level
                    ? "bg-zinc-100 text-zinc-500 border-zinc-200"
                    : "bg-white text-zinc-300 border-dashed border-zinc-200"
                }`}
              >
                {l.level < currentLevel.level ? "✓ " : ""}{l.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log a session */}
      <Card className="rounded-3xl border-zinc-200">
        <CardHeader>
          <CardTitle className="text-base">Log a Session</CardTitle>
          <p className="text-sm text-zinc-500">Pick a drill to earn XP toward your next level</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {CARDIO_DRILLS.map((drill) => (
              <button
                key={drill.id}
                onClick={() => setSelectedDrill(selectedDrill?.id === drill.id ? null : drill)}
                className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                  selectedDrill?.id === drill.id
                    ? "border-zinc-900 bg-zinc-900"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{drill.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${selectedDrill?.id === drill.id ? "text-white" : "text-zinc-800"}`}>
                      {drill.name}
                    </span>
                    <span className={`text-xs font-bold shrink-0 ${selectedDrill?.id === drill.id ? "text-yellow-300" : "text-yellow-600"}`}>
                      +{drill.xp} XP
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${selectedDrill?.id === drill.id ? "text-zinc-400" : "text-zinc-500"}`}>
                    {drill.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {selectedDrill && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                <span>{selectedDrill.emoji}</span>
                <span>{selectedDrill.name}</span>
                <Badge className="ml-auto bg-yellow-100 text-yellow-700 border-yellow-200 border">+{selectedDrill.xp} XP</Badge>
              </div>
              <Textarea
                value={cardioNotes}
                onChange={(e) => setCardioNotes(e.target.value)}
                placeholder="Notes — duration, how you felt, distance, heart rate..."
                className="min-h-[60px] text-sm"
              />
              <Button onClick={handleLog} className="rounded-2xl w-full">
                <Zap className="mr-2 h-4 w-4" />
                Log Session (+{selectedDrill.xp} XP)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sessions */}
      {cardioLog.length > 0 && (
        <Card className="rounded-3xl border-zinc-200">
          <CardHeader><CardTitle className="text-base">Recent Sessions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cardioLog.slice(0, 8).map((session) => (
              <div key={session.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                <span className="text-lg shrink-0">
                  {CARDIO_DRILLS.find((d) => d.id === session.drillId)?.emoji || "🏃"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-800">{session.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{session.date}{session.notes ? ` — ${session.notes}` : ""}</div>
                </div>
                <span className="text-xs font-bold text-yellow-600 shrink-0">+{session.xp} XP</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SessionPlanCard({ data, color }) {
  if (!data) return null;
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card className={`rounded-3xl ${c.border} ${c.bg}`}>
      <CardHeader>
        <CardTitle className={`text-base ${c.title}`}>{data.title}</CardTitle>
        {data.focus && <p className={`text-sm ${c.focus} font-medium`}>{data.focus}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <ul className="space-y-2">
          {data.actions?.map((action, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-700">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${c.bullet}`} />
              {action}
            </li>
          ))}
        </ul>

        {/* Variations */}
        {data.variations?.length > 0 && (
          <div>
            <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${c.title} opacity-70`}>
              Variations to try
            </div>
            <div className="space-y-2">
              {data.variations.map((v, i) => (
                <div key={i} className="rounded-xl border border-white/60 bg-white/50 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-zinc-500 line-through">{v.swap}</span>
                    <span className="text-zinc-400">→</span>
                    <span className={`font-semibold ${c.title}`}>{v.with}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{v.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
