export type AnswerKey = "A" | "B" | "C" | "D";

export type Question = {
  id: string;
  question: string;
  answers: Record<AnswerKey, string>;
  correct: AnswerKey;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
};

export type QuestionDraft = {
  question: string;
  answers: Record<AnswerKey, string>;
  correct: AnswerKey;
  category: string;
  difficulty: Question["difficulty"];
};

export type QuizSession = {
  id: string;
  userId: string;
  total: number;
  answered: number;
  correct: number;
  finished: boolean;
  createdAt: string;
};

export type Attempt = {
  id: string;
  sessionId: string;
  questionId: string;
  chosen: AnswerKey | null;
  isCorrect: boolean;
  createdAt: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  isGuest: boolean;
};

export type Profile = {
  displayName: string | null;
  hideLeaderboard: boolean;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  value: number;
  detail: string;
};

export type LeaderboardPayload = {
  boards: {
    mostQuestions: LeaderboardEntry[];
    mostAccurate: LeaderboardEntry[];
    mostAnswers: LeaderboardEntry[];
    hardestMastered: LeaderboardEntry[];
    bestThisWeek: LeaderboardEntry[];
  };
  totalRankedUsers: number;
};

export type StatsPayload = {
  totalAttempts: number;
  uniqueQuestions: number;
  totalCorrect: number;
  accuracy: number;
  quizzesTaken: number;
  questionsInBank: number;
  byDifficulty: { difficulty: string; total: number; correct: number }[];
  byCategory: { category: string; total: number; correct: number }[];
  activity: { date: string; attempts: number; correct: number }[];
  recentAttempts: { question: string; chosen: AnswerKey | null; correct: AnswerKey; isCorrect: boolean; at: string }[];
};

export const CATEGORIES = [
  "General",
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Unit 5",
  "Review",
  "Vocabulary",
] as const;

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
