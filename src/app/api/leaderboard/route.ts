import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProfileRow = { id: string; display_name: string | null; hide_leaderboard: boolean };
type QuestionRow = { id: string; author_id: string | null; difficulty: string };
type AttemptRow = { user_id: string; question_id: string; is_correct: boolean; created_at: string };

function top(list: LeaderboardEntry[], n = 10) {
  return list.slice(0, n);
}

/**
 * Public leaderboards across signed-up accounts — the SAT Nexus pattern:
 * six boards, an All-Time / This Week toggle, and a hide-from-leaderboard
 * profile option respected server-side.
 */
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get("timeframe") === "week" ? "week" : "all";
    const weekAgoIso = new Date(Date.now() - 7 * 864e5).toISOString();

    const db = createSupabaseServiceClient();

    const [{ data: profileRows }, { data: questionRows }, attemptRes] = await Promise.all([
      db.from("profiles").select("id, display_name, hide_leaderboard"),
      db.from("questions").select("id, author_id, difficulty"),
      db
        .from("attempts")
        .select("user_id, question_id, is_correct, created_at")
        .gte("created_at", timeframe === "week" ? weekAgoIso : "1970-01-01T00:00:00Z")
        .order("created_at", { ascending: false })
        .limit(20000),
    ]);

    const profiles = (profileRows ?? []) as ProfileRow[];
    const questions = (questionRows ?? []) as QuestionRow[];
    const attempts = (attemptRes.data ?? []) as AttemptRow[];
    const questionById = new Map(questions.map((q) => [q.id, q]));

    const visible = new Set(profiles.filter((p) => !p.hide_leaderboard).map((p) => p.id));
    const nameFor = (id: string) => {
      const p = profiles.find((x) => x.id === id);
      if (!p) return `Student ${id.slice(0, 6)}`;
      const name = p.display_name?.trim();
      if (name && name.toLowerCase() !== "student") return name;
      return `Student ${id.slice(0, 6)}`;
    };

    // Per-user aggregates.
    type Agg = { attempts: number; correct: number; hardCorrect: number; hardAttempts: number };
    const agg = new Map<string, Agg>();
    for (const a of attempts) {
      if (!visible.has(a.user_id)) continue;
      const cur = agg.get(a.user_id) ?? { attempts: 0, correct: 0, hardCorrect: 0, hardAttempts: 0 };
      cur.attempts += 1;
      if (a.is_correct) cur.correct += 1;
      const q = questionById.get(a.question_id);
      if (q?.difficulty === "Hard") {
        cur.hardAttempts += 1;
        if (a.is_correct) cur.hardCorrect += 1;
      }
      agg.set(a.user_id, cur);
    }

    // Questions added per author (respects the timeframe filter).
    const added = new Map<string, number>();
    for (const q of questions) {
      if (!q.author_id || !visible.has(q.author_id)) continue;
      added.set(q.author_id, (added.get(q.author_id) ?? 0) + 1);
    }

    const named: { id: string; name: string; agg: Agg }[] = [...agg.entries()]
      .filter(([, a]) => a.attempts > 0)
      .map(([id, a]) => ({ id, name: nameFor(id), agg: a }));

    const mostQuestions: LeaderboardEntry[] = top(
      [...added.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({ userId: id, name: nameFor(id), value: count, detail: "questions added to the bank" })),
    );

    const mostAccurate: LeaderboardEntry[] = top(
      named
        .filter((n) => n.agg.attempts >= 10)
        .sort((a, b) => b.agg.correct / b.agg.attempts - a.agg.correct / a.agg.attempts || b.agg.attempts - a.agg.attempts)
        .map((n) => ({
          userId: n.id,
          name: n.name,
          value: Math.round((n.agg.correct / n.agg.attempts) * 100),
          detail: `${n.agg.correct}/${n.agg.attempts} over 10+ questions`,
        })),
    );

    const mostAnswers: LeaderboardEntry[] = top(
      named
        .slice()
        .sort((a, b) => b.agg.attempts - a.agg.attempts)
        .map((n) => ({ userId: n.id, name: n.name, value: n.agg.attempts, detail: `${n.agg.correct} correct` })),
    );

    const hardestMastered: LeaderboardEntry[] = top(
      named
        .filter((n) => n.agg.hardAttempts > 0)
        .sort((a, b) => b.agg.hardCorrect - a.agg.hardCorrect || b.agg.hardAttempts - a.agg.hardAttempts)
        .map((n) => ({
          userId: n.id,
          name: n.name,
          value: n.agg.hardCorrect,
          detail: `${n.agg.hardCorrect}/${n.agg.hardAttempts} hard correct`,
        })),
    );

    // "Best this week" always uses the rolling 7-day window.
    const weekAgg = new Map<string, { attempts: number; correct: number }>();
    for (const a of attempts) {
      if (!visible.has(a.user_id) || a.created_at < weekAgoIso) continue;
      const cur = weekAgg.get(a.user_id) ?? { attempts: 0, correct: 0 };
      cur.attempts += 1;
      if (a.is_correct) cur.correct += 1;
      weekAgg.set(a.user_id, cur);
    }
    const bestThisWeek: LeaderboardEntry[] = top(
      [...weekAgg.entries()]
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .map(([id, v]) => ({ userId: id, name: nameFor(id), value: v.attempts, detail: `${v.correct} correct this week` })),
    );

    return NextResponse.json({
      boards: { mostQuestions, mostAccurate, mostAnswers, hardestMastered, bestThisWeek },
      totalRankedUsers: named.length + [...added.keys()].filter((id) => !agg.has(id)).length,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
