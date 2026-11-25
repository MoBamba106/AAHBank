"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useApi, apiPost, apiPatch, apiDelete, mutateKey } from "@/lib/api-client";
import { demoStore } from "@/lib/demo-store";
import { demoLeaderboard, demoStats } from "@/lib/demo-data";
import { uid, normalizeText } from "@/lib/utils";
import type { AnswerKey, Question, QuestionDraft, LeaderboardPayload, StatsPayload, AuthUser } from "@/lib/types";

const live = isSupabaseConfigured();

/**
 * Unified data hooks — every page talks to these instead of caring whether
 * the app is running against Supabase or in offline Demo Mode.
 */

export type QuestionsFilter = { search?: string; sort?: "newest" | "oldest"; category?: string; difficulty?: string };

function filterDemoQuestions(filter: QuestionsFilter): Question[] {
  let list = demoStore.listQuestions();
  if (filter.category && filter.category !== "all") list = list.filter((q) => q.category === filter.category);
  if (filter.difficulty && filter.difficulty !== "all") list = list.filter((q) => q.difficulty === filter.difficulty);
  if (filter.search?.trim()) {
    const s = filter.search.toLowerCase();
    list = list.filter(
      (q) =>
        q.question.toLowerCase().includes(s) ||
        Object.values(q.answers).some((a) => a.toLowerCase().includes(s)),
    );
  }
  list = [...list].sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    return filter.sort === "oldest" ? ta - tb : tb - ta;
  });
  return list;
}

export function useQuestions(filter: QuestionsFilter = {}) {
  const { authEnabled } = useAuth();
  const [demoList, setDemoList] = React.useState<Question[] | null>(null);
  const query = new URLSearchParams();
  if (filter.search) query.set("q", filter.search);
  if (filter.sort) query.set("sort", filter.sort);
  if (filter.category && filter.category !== "all") query.set("category", filter.category);
  if (filter.difficulty && filter.difficulty !== "all") query.set("difficulty", filter.difficulty);

  const live_ = authEnabled && live;
  const api = useApi<{ questions: Question[] }>(live_ ? `/api/questions?${query.toString()}` : null, `questions:${query.toString()}`);

  React.useEffect(() => {
    if (!live_) setDemoList(filterDemoQuestions(filter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live_, filter.search, filter.sort, filter.category, filter.difficulty]);

  const questions = live_ ? (api.data?.questions ?? []) : (demoList ?? []);
  return {
    questions,
    loading: live_ ? api.loading && !api.data : false,
    error: live_ ? api.error : null,
    reload: () => {
      if (live_) api.reload();
      else setDemoList(filterDemoQuestions(filter));
      mutateKey("home");
      mutateKey("stats");
    },
  };
}

export async function createQuestion(draft: QuestionDraft, user: AuthUser): Promise<void> {
  if (live && !user.isGuest) {
    await apiPost("/api/questions", draft);
    mutateKey("questions:*");
  } else {
    demoStore.saveQuestion({
      id: uid(),
      question: draft.question,
      answers: draft.answers,
      correct: draft.correct,
      category: draft.category,
      difficulty: draft.difficulty,
      authorId: user.id,
      authorName: user.displayName || "Guest",
      createdAt: new Date().toISOString(),
    });
  }
  mutateKey("home");
  mutateKey("stats");
}

export async function removeQuestion(id: string, user: AuthUser): Promise<void> {
  if (live && !user.isGuest) {
    await apiDelete(`/api/questions/${id}`);
    mutateKey("questions:*");
  } else {
    demoStore.deleteQuestion(id);
  }
  mutateKey("home");
  mutateKey("stats");
}

export async function isDuplicateQuestion(question: string, user: AuthUser): Promise<boolean> {
  const norm = normalizeText(question);
  if (live && !user.isGuest) {
    const { questions } = await new Promise<{ questions: Question[] }>((resolve, reject) => {
      fetch(`/api/questions?q=${encodeURIComponent(question)}`)
        .then((r) => (r.ok ? r.json() : { questions: [] }))
        .then(resolve)
        .catch(reject);
    });
    return questions.some((q) => normalizeText(q.question) === norm);
  }
  return demoStore.listQuestions().some((q) => normalizeText(q.question) === norm);
}

/** Quiz session recording — works live and offline. */
export async function startQuizSession(total: number, user: AuthUser): Promise<string> {
  if (live && !user.isGuest) {
    const { sessionId } = await apiPost<{ sessionId: string }>("/api/sessions", { total });
    return sessionId;
  }
  return demoStore.createSession(total).id;
}

export async function recordAttempt(input: { sessionId: string; questionId: string; chosen: AnswerKey | null; isCorrect: boolean }, user: AuthUser): Promise<void> {
  if (live && !user.isGuest) {
    await apiPost("/api/attempts", input).catch(() => undefined);
  } else {
    demoStore.saveAttempt({ id: uid(), ...input, createdAt: new Date().toISOString() });
    const sessions = demoStore.listSessions();
    const session = sessions.find((s) => s.id === input.sessionId);
    if (session) {
      session.answered += 1;
      session.correct += input.isCorrect ? 1 : 0;
      demoStore.saveSession(session);
    }
  }
}

export async function finishQuizSession(sessionId: string, answered: number, correct: number, user: AuthUser): Promise<void> {
  if (live && !user.isGuest) {
    await apiPatch(`/api/sessions/${sessionId}`, { answered, correct, finished: true }).catch(() => undefined);
  } else {
    const session = demoStore.listSessions().find((s) => s.id === sessionId);
    if (session) {
      session.answered = answered;
      session.correct = correct;
      session.finished = true;
      demoStore.saveSession(session);
    }
  }
  mutateKey("home");
  mutateKey("stats");
  mutateKey("leaderboard");
}

export function useLeaderboard(timeframe: "all" | "week") {
  const { authEnabled } = useAuth();
  const live_ = authEnabled && live;
  const api = useApi<LeaderboardPayload>(live_ ? `/api/leaderboard?timeframe=${timeframe}` : null, "leaderboard");
  const [demo, setDemo] = React.useState<LeaderboardPayload | null>(null);
  React.useEffect(() => {
    if (!live_) setDemo(demoLeaderboard());
  }, [live_]);
  return {
    data: live_ ? api.data : demo,
    loading: live_ ? api.loading && !api.data : false,
    error: live_ ? api.error : null,
    reload: () => {
      if (live_) mutateKey("leaderboard");
      else setDemo(demoLeaderboard());
    },
  };
}

export function useStats() {
  const { authEnabled } = useAuth();
  const live_ = authEnabled && live;
  const api = useApi<StatsPayload>(live_ ? "/api/stats" : null, "stats");
  const [demo, setDemo] = React.useState<StatsPayload | null>(null);
  React.useEffect(() => {
    if (!live_) setDemo(demoStats());
  }, [live_]);
  return {
    data: live_ ? api.data : demo,
    loading: live_ ? api.loading && !api.data : false,
    error: live_ ? api.error : null,
    reload: () => {
      if (live_) mutateKey("stats");
      else setDemo(demoStats());
    },
  };
}

export type HomePayload = {
  questionsInBank: number;
  myQuestions: number;
  quizzesTaken: number;
  accuracy: number;
  topStudent: { name: string; detail: string } | null;
};

export function useHome() {
  const { authEnabled } = useAuth();
  const live_ = authEnabled && live;
  const api = useApi<HomePayload>(live_ ? "/api/home" : null, "home");
  const [demo, setDemo] = React.useState<HomePayload | null>(null);
  React.useEffect(() => {
    if (live_) return;
    const stats = demoStats();
    const lb = demoLeaderboard();
    setDemo({
      questionsInBank: stats.questionsInBank,
      myQuestions: demoStore.listQuestions().filter((q) => q.authorId === "local-guest").length,
      quizzesTaken: stats.quizzesTaken,
      accuracy: stats.accuracy,
      topStudent: lb.boards.mostAnswers[0] ? { name: lb.boards.mostAnswers[0].name, detail: lb.boards.mostAnswers[0].detail } : null,
    });
  }, [live_]);
  return {
    data: live_ ? api.data : demo,
    loading: live_ ? api.loading && !api.data : false,
    error: live_ ? api.error : null,
    reload: () => mutateKey("home"),
  };
}
