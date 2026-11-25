"use client";

import type { Attempt, Question, QuizSession } from "@/lib/types";
import { SAMPLE_QUESTIONS } from "@/data/sample-questions";
import { uid } from "@/lib/utils";

/**
 * Offline Demo Mode storage — used when Supabase env vars are absent.
 * Everything lives in localStorage so the full app (add, bank, quiz,
 * leaderboard, analytics) is explorable before connecting Supabase.
 */

const K = {
  questions: "aahbank:questions",
  sessions: "aahbank:sessions",
  attempts: "aahbank:attempts",
  name: "aahbank:name",
  seeded: "aahbank:seeded",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the app still works in-memory for the session.
  }
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(K.seeded)) return;
  if (!read<Question[]>(K.questions, []).length) {
    write(K.questions, SAMPLE_QUESTIONS);
  }
  write(K.seeded, "1");
}

export const demoStore = {
  ensureSeeded,

  listQuestions(): Question[] {
    ensureSeeded();
    return read<Question[]>(K.questions, []);
  },
  saveQuestion(q: Question) {
    const all = read<Question[]>(K.questions, []).filter((x) => x.id !== q.id);
    all.unshift(q);
    write(K.questions, all);
  },
  deleteQuestion(id: string) {
    write(
      K.questions,
      read<Question[]>(K.questions, []).filter((x) => x.id !== id),
    );
  },

  listSessions(): QuizSession[] {
    return read<QuizSession[]>(K.sessions, []);
  },
  saveSession(s: QuizSession) {
    const all = read<QuizSession[]>(K.sessions, []).filter((x) => x.id !== s.id);
    all.unshift(s);
    write(K.sessions, all);
  },

  listAttempts(): Attempt[] {
    return read<Attempt[]>(K.attempts, []);
  },
  saveAttempt(a: Attempt) {
    const all = read<Attempt[]>(K.attempts, []);
    all.push(a);
    write(K.attempts, all);
  },

  getName(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(K.name) || null;
  },
  setName(name: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(K.name, name);
  },

  createSession(total: number): QuizSession {
    const session: QuizSession = {
      id: uid(),
      userId: "local-guest",
      total,
      answered: 0,
      correct: 0,
      finished: false,
      createdAt: new Date().toISOString(),
    };
    this.saveSession(session);
    return session;
  },
};
