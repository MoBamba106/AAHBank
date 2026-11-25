import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { AnswerKey, StatsPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Personal analytics for the signed-in student (SAT Nexus /api/stats pattern). */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Sign in to see your analytics." }, { status: 401 });

    const db = createSupabaseServiceClient();
    const [attemptRes, sessionRes, bankRes, questionRes] = await Promise.all([
      db
        .from("attempts")
        .select("question_id, chosen, is_correct, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10000),
      db.from("quiz_sessions").select("id").eq("user_id", user.id).eq("finished", true),
      db.from("questions").select("id", { count: "exact", head: true }),
      db.from("questions").select("id, question, correct, category, difficulty"),
    ]);

    const attempts = (attemptRes.data ?? []) as {
      question_id: string;
      chosen: string | null;
      is_correct: boolean;
      created_at: string;
    }[];
    const questions = (questionRes.data ?? []) as {
      id: string;
      question: string;
      correct: string;
      category: string;
      difficulty: string;
    }[];
    const byId = new Map(questions.map((q) => [q.id, q]));

    const totalCorrect = attempts.filter((a) => a.is_correct).length;
    const byDifficulty = new Map<string, { total: number; correct: number }>();
    const byCategory = new Map<string, { total: number; correct: number }>();
    const activity = new Map<string, { attempts: number; correct: number }>();
    const cutoff = Date.now() - 14 * 864e5;

    for (const a of attempts) {
      const q = byId.get(a.question_id);
      const diff = q?.difficulty ?? "Medium";
      const cat = q?.category ?? "General";
      const row = { total: 0, correct: 0 };
      const dRow = byDifficulty.get(diff) ?? row;
      dRow.total += 1;
      if (a.is_correct) dRow.correct += 1;
      byDifficulty.set(diff, dRow);
      const cRow = byCategory.get(cat) ?? { total: 0, correct: 0 };
      cRow.total += 1;
      if (a.is_correct) cRow.correct += 1;
      byCategory.set(cat, cRow);
      if (Date.parse(a.created_at) >= cutoff) {
        const key = dayKey(new Date(a.created_at));
        const aRow = activity.get(key) ?? { attempts: 0, correct: 0 };
        aRow.attempts += 1;
        if (a.is_correct) aRow.correct += 1;
        activity.set(key, aRow);
      }
    }

    const timeline: StatsPayload["activity"] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const row = activity.get(dayKey(d)) ?? { attempts: 0, correct: 0 };
      timeline.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, ...row });
    }

    const payload: StatsPayload = {
      totalAttempts: attempts.length,
      uniqueQuestions: new Set(attempts.map((a) => a.question_id)).size,
      totalCorrect,
      accuracy: attempts.length ? Math.round((totalCorrect / attempts.length) * 100) : 0,
      quizzesTaken: (sessionRes.data ?? []).length,
      questionsInBank: bankRes.count ?? 0,
      byDifficulty: [...byDifficulty.entries()].map(([difficulty, v]) => ({ difficulty, ...v })),
      byCategory: [...byCategory.entries()].map(([category, v]) => ({ category, ...v })).sort((a, b) => b.total - a.total),
      activity: timeline,
      recentAttempts: attempts.slice(0, 8).map((a) => ({
        question: byId.get(a.question_id)?.question ?? "Question removed",
        chosen: (["A", "B", "C", "D"].includes(a.chosen ?? "") ? a.chosen : null) as AnswerKey | null,
        correct: (byId.get(a.question_id)?.correct ?? "A") as AnswerKey,
        isCorrect: a.is_correct,
        at: a.created_at,
      })),
    };

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
