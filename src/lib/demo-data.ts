"use client";

import type { AnswerKey, LeaderboardPayload, StatsPayload } from "@/lib/types";
import { demoStore } from "@/lib/demo-store";
import { todayKey } from "@/lib/utils";

/** Demo-mode payloads, computed entirely from localStorage. */

function displayName(): string {
  return demoStore.getName() || "Guest (you)";
}

export function demoLeaderboard(): LeaderboardPayload {
  const attempts = demoStore.listAttempts();
  const sessions = demoStore.listSessions().filter((s) => s.finished);
  const questions = demoStore.listQuestions().filter((q) => q.authorId === "local-guest");
  const correct = attempts.filter((a) => a.isCorrect).length;
  const weekAgo = Date.now() - 7 * 864e5;
  const weekAttempts = attempts.filter((a) => Date.parse(a.createdAt) >= weekAgo);
  const hardCorrect = attempts.filter((a) => {
    if (!a.isCorrect) return false;
    return demoStore.listQuestions().find((q) => q.id === a.questionId)?.difficulty === "Hard";
  }).length;

  const me = demoStore.getName() || "Guest (you)";
  const entry = (value: number, detail: string) => ({ userId: "local-guest", name: me, value, detail });

  return {
    boards: {
      mostQuestions: questions.length ? [entry(questions.length, "questions added to the bank")] : [],
      mostAccurate: attempts.length >= 10 ? [entry(Math.round((correct / attempts.length) * 100), `${correct}/${attempts.length} over 10+ questions`)] : [],
      mostAnswers: attempts.length ? [entry(attempts.length, `${correct} correct`)] : [],
      hardestMastered: hardCorrect ? [entry(hardCorrect, "Hard questions answered correctly")] : [],
      bestThisWeek: weekAttempts.length ? [entry(weekAttempts.length, `${weekAttempts.filter((a) => a.isCorrect).length} correct this week`)] : [],
    },
    totalRankedUsers: attempts.length || sessions.length || questions.length ? 1 : 0,
  };
}

export function demoStats(): StatsPayload {
  const attempts = demoStore.listAttempts();
  const sessions = demoStore.listSessions().filter((s) => s.finished);
  const questions = demoStore.listQuestions();
  const correct = attempts.filter((a) => a.isCorrect).length;

  const byDifficultyMap = new Map<string, { total: number; correct: number }>();
  const byCategoryMap = new Map<string, { total: number; correct: number }>();
  const activityMap = new Map<string, { total: number; correct: number }>();

  for (const a of attempts) {
    const q = questions.find((x) => x.id === a.questionId);
    const diff = q?.difficulty ?? "Medium";
    const cat = q?.category ?? "General";
    const day = todayKey(new Date(a.createdAt));
    byDifficultyMap.set(diff, add(byDifficultyMap.get(diff), a.isCorrect));
    byCategoryMap.set(cat, add(byCategoryMap.get(cat), a.isCorrect));
    activityMap.set(day, add(activityMap.get(day), a.isCorrect));
  }

  // Fill the last 14 days so the chart shows a continuous timeline.
  const activity: StatsPayload["activity"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = todayKey(d);
    const row = activityMap.get(key) ?? { total: 0, correct: 0 };
    activity.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, attempts: row.total, correct: row.correct });
  }

  return {
    totalAttempts: attempts.length,
    uniqueQuestions: new Set(attempts.map((a) => a.questionId)).size,
    totalCorrect: correct,
    accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
    quizzesTaken: sessions.length,
    questionsInBank: questions.length,
    byDifficulty: [...byDifficultyMap.entries()].map(([difficulty, v]) => ({ difficulty, ...v })),
    byCategory: [...byCategoryMap.entries()].map(([category, v]) => ({ category, ...v })).sort((a, b) => b.total - a.total),
    activity,
    recentAttempts: attempts
      .slice(-8)
      .reverse()
      .map((a) => {
        const q = questions.find((x) => x.id === a.questionId);
        return {
          question: q?.question ?? "Question removed",
          chosen: a.chosen,
          correct: (q?.correct ?? "A") as AnswerKey,
          isCorrect: a.isCorrect,
          at: a.createdAt,
        };
      }),
  };
}

function add(v: { total: number; correct: number } | undefined, isCorrect: boolean) {
  const base = v ?? { total: 0, correct: 0 };
  return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0) };
}
