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
import { CalendarDays, Dumbbell, Plus, TrendingUp, Activity, Sparkles, Loader2, Trash2, X } from "lucide-react";

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

const LOGS_KEY = "wmd_logs";
const RECS_KEY = "wmd_recommendations";

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

// ── Gemini helper ──────────────────────────────────────────────────────────
async function fetchGeminiRecommendations(logs) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set. Add it to your .env file.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const logsText = logs
    .map(
      (log) =>
        `Date: ${log.date} | Type: ${log.workout} | Title: ${log.title}
Energy: ${log.energy || "N/A"} | Pump: ${log.pump || "N/A"} | Pain: ${log.pain || "N/A"}
Notes: ${log.notes}
Exercises:\n${log.exercises.map((e) => {
        const setsStr = e.sets
          ? e.sets.map((s, i) => `Set ${i + 1}: ${s.reps || "?"}reps @ ${s.weight || "?"}kg`).join(", ")
          : `${e.setsReps} @ ${e.weight}`;
        return `  - ${e.name}: ${setsStr}${e.notes ? ` (${e.notes})` : ""}`;
      }).join("\n")}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are an expert strength and conditioning coach. Analyze the following PPL (Push/Pull/Legs) workout logs and provide a structured coaching report.

${logsText}

Respond ONLY with a JSON object (no markdown fences) in this exact shape:
{
  "observations": ["string", ...],
  "push": { "title": "Next Push Session", "focus": "string", "actions": ["string", ...] },
  "pull": { "title": "Next Pull Session", "focus": "string", "actions": ["string", ...] },
  "legs": { "title": "Next Legs Session", "focus": "string", "actions": ["string", ...] },
  "warnings": ["string", ...]
}
Keep each string concise (1-2 sentences). "warnings" may be an empty array if there are no injury/overtraining concerns.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  // Strip markdown code fences if present
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
    exercises: templates.Push.map((x) => blankExercise(x)),
  });
  const [recommendations, setRecommendations] = useState(() => loadFromStorage(RECS_KEY, null));
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  // Load logs from Supabase on mount
  useEffect(() => {
    async function fetchLogs() {
      setSyncing(true);
      setSyncError("");
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        setSyncError("Could not connect to database. Showing local data.");
        const local = loadFromStorage(LOGS_KEY, []);
        setLogs(local);
        setSelectedId(local[0]?.id ?? null);
      } else if (data.length === 0) {
        // Supabase is empty — check if there's local data to migrate
        const local = loadFromStorage(LOGS_KEY, []);
        if (local.length > 0) {
          setPendingMigration(local);
          setLogs(local);
          setSelectedId(local[0]?.id ?? null);
        }
      } else {
        setLogs(data);
        setSelectedId(data[0]?.id ?? null);
        localStorage.setItem(LOGS_KEY, JSON.stringify(data));
      }
      setSyncing(false);
    }
    fetchLogs();
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

  const updateWorkoutType = (value) => {
    setForm((prev) => ({
      ...prev,
      workout: value,
      title: prev.title || value,
      exercises: templates[value].map((x) => blankExercise(x)),
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
      exercises: templates.Push.map((x) => blankExercise(x)),
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
      const data = await fetchGeminiRecommendations(logs);
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
          <TabsList className="grid w-full grid-cols-3 rounded-2xl">
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="current" className="text-xs sm:text-sm">Session</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm">AI Coaching</TabsTrigger>
          </TabsList>

          {/* History tab */}
          <TabsContent value="history">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <Card className="rounded-3xl border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg">Workout History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
              <SessionDetail log={selectedLog} />
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
                  <p className="text-sm text-zinc-500">Powered by Gemini — analyzes your last {logs.length} session{logs.length !== 1 ? "s" : ""}.</p>
                </div>
                <Button onClick={handleGetRecommendations} disabled={loadingAI || logs.length === 0} className="w-full rounded-2xl px-5 sm:w-auto">
                  {loadingAI ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />{recommendations ? "Refresh" : "Get Recommendations"}</>
                  )}
                </Button>
              </div>

              {aiError && (
                <Card className="rounded-3xl border-red-200 bg-red-50">
                  <CardContent className="p-5 text-sm text-red-700">{aiError}</CardContent>
                </Card>
              )}

              {!recommendations && !loadingAI && !aiError && (
                <Card className="rounded-3xl border-zinc-200 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="mb-3 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-500">Click "Get Recommendations" to analyze your workout history.</p>
                  </CardContent>
                </Card>
              )}

              {recommendations && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Observations */}
                  <Card className="rounded-3xl border-zinc-200 md:col-span-2">
                    <CardHeader><CardTitle className="text-base">Performance Observations</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.observations?.map((obs, i) => (
                          <li key={i} className="flex gap-2 text-sm text-zinc-700">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Push */}
                  <SessionPlanCard data={recommendations.push} color="blue" />

                  {/* Pull */}
                  <SessionPlanCard data={recommendations.pull} color="green" />

                  {/* Legs */}
                  <SessionPlanCard data={recommendations.legs} color="purple" />

                  {/* Warnings */}
                  {recommendations.warnings?.length > 0 && (
                    <Card className="rounded-3xl border-amber-200 bg-amber-50">
                      <CardHeader><CardTitle className="text-base text-amber-800">Injury / Recovery Notes</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations.warnings.map((w, i) => (
                            <li key={i} className="flex gap-2 text-sm text-amber-700">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
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

function SessionDetail({ log }) {
  if (!log) return (
    <Card className="rounded-3xl border-zinc-200">
      <CardContent className="flex items-center justify-center py-16 text-sm text-zinc-400">
        Select a session from the history.
      </CardContent>
    </Card>
  );

  return (
    <Card className="rounded-3xl border-zinc-200">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{log.title}</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">{log.date}</p>
          </div>
          <Badge variant="outline">{log.workout}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 grid-cols-3">
          <InfoBox label="Energy" value={log.energy || "—"} />
          <InfoBox label="Pump" value={log.pump || "—"} />
          <InfoBox label="Pain" value={log.pain || "—"} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Exercises</h3>
          <div className="space-y-3">
            {log.exercises.map((exercise, index) => (
              <div key={index} className="rounded-2xl border border-zinc-200 p-4">
                <div className="font-medium">{exercise.name}</div>
                {/* New per-set format */}
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
                  /* Legacy format */
                  <div className="mt-1 text-sm text-zinc-600">
                    {exercise.setsReps || "—"} • {exercise.weight || "—"}
                  </div>
                )}
                {exercise.notes && <div className="mt-2 text-sm text-zinc-500">{exercise.notes}</div>}
              </div>
            ))}
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

function SessionPlanCard({ data, color }) {
  if (!data) return null;
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card className={`rounded-3xl ${c.border} ${c.bg}`}>
      <CardHeader>
        <CardTitle className={`text-base ${c.title}`}>{data.title}</CardTitle>
        {data.focus && <p className={`text-sm ${c.focus} font-medium`}>{data.focus}</p>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {data.actions?.map((action, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-700">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${c.bullet}`} />
              {action}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
