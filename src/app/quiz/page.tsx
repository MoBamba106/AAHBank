"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Loader2, Play, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { Counter } from "@/components/react-bits/Counter";
import { RequireAccount } from "@/components/require-account";
import { useAuth } from "@/components/auth-provider";
import { finishQuizSession, recordAttempt, startQuizSession, useQuestions } from "@/lib/data";
import { useSettings } from "@/components/settings-provider";
import { ANSWER_KEYS, cn, shuffle } from "@/lib/utils";
import { CATEGORIES, DIFFICULTIES, type AnswerKey, type Question } from "@/lib/types";

type Phase = "setup" | "running" | "results";

function QuizInner() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { questions: bank } = useQuestions({ sort: "newest" });
  const [phase, setPhase] = React.useState<Phase>("setup");
  const [count, setCount] = React.useState(10);
  const [category, setCategory] = React.useState("all");
  const [difficulty, setDifficulty] = React.useState("all");

  const [deck, setDeck] = React.useState<Question[]>([]);
  const [index, setIndex] = React.useState(0);
  const [chosen, setChosen] = React.useState<AnswerKey | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<{ question: Question; chosen: AnswerKey | null; isCorrect: boolean }[]>([]);

  const pool = React.useMemo(
    () =>
      bank.filter(
        (q) =>
          (category === "all" || q.category === category) &&
          (difficulty === "all" || q.difficulty === difficulty),
      ),
    [bank, category, difficulty],
  );

  const start = async () => {
    if (pool.length === 0) return toast.error("No questions match those filters yet.");
    const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
    try {
      const sid = await startQuizSession(picked.length, user);
      setSessionId(sid);
    } catch {
      setSessionId(null); // offline-friendly: quiz still runs locally
    }
    setDeck(picked);
    setIndex(0);
    setScore(0);
    setResults([]);
    setChosen(null);
    setRevealed(false);
    setPhase("running");
  };

  const answer = async (key: AnswerKey) => {
    if (revealed) return;
    const q = deck[index];
    const isCorrect = key === q.correct;
    setChosen(key);
    setRevealed(true);
    if (isCorrect) setScore((s) => s + 1);
    setResults((r) => [...r, { question: q, chosen: key, isCorrect }]);
    if (sessionId) {
      await recordAttempt({ sessionId, questionId: q.id, chosen: key, isCorrect }, user);
    }
  };

  const next = async () => {
    if (index + 1 >= deck.length) {
      if (sessionId) await finishQuizSession(sessionId, deck.length, score, user);
      setPhase("results");
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    setRevealed(false);
  };

  const playSound = (correct: boolean) => {
    if (!settings.soundEffects) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(correct ? 520 : 220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(correct ? 780 : 160, ctx.currentTime + 0.16);
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.22);
    } catch { /* audio unavailable */ }
  };
  React.useEffect(() => {
    if (revealed && chosen) playSound(deck[index].correct === chosen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const current = deck[index];
  const progress = deck.length ? (index / deck.length) * 100 : 0;

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Practice</p>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Quiz mode</h1>
        </div>

        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <GlassCard hover={false} className="p-6">
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-[12.5px] font-bold text-[var(--ink-soft)]">How many questions?</p>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 20, 25].map((n) => (
                        <button
                          key={n}
                          className={cn("btn", count === n ? "btn-primary" : "btn-soft")}
                          onClick={() => setCount(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {pool.length > 0 && count > pool.length && (
                      <p className="mt-2 text-[12px] font-semibold text-[var(--warn)]">
                        Only {pool.length} match — the quiz will use all of them.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Category</span>
                      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="all">All categories</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Difficulty</span>
                      <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        <option value="all">All difficulty</option>
                        {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--line-soft)] pt-4">
                    <p className="text-[13px] text-[var(--ink-faint)]">
                      {pool.length} question{pool.length === 1 ? "" : "s"} available with these filters.
                    </p>
                    <button className="btn btn-primary" onClick={() => void start()} disabled={pool.length === 0}>
                      <Play className="h-4 w-4" /> Start quiz
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {phase === "running" && current && (
            <motion.div key="running" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {/* Progress bar */}
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--paper-deep)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    animate={{ width: `${Math.max(progress, 4)}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 0.8, 0.36, 1] }}
                  />
                </div>
                <span className="font-mono text-[12px] font-bold text-[var(--ink-faint)]">
                  {index + 1}/{deck.length} · {score} correct
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, ease: [0.22, 0.8, 0.36, 1] }}
                >
                  <GlassCard hover={false} className="p-6">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="badge soft-tone soft-tone-teal">{current.category}</span>
                      <span className="badge soft-tone soft-tone-yellow">{current.difficulty}</span>
                    </div>
                    <p className="font-display mt-3 text-xl font-bold leading-snug text-[var(--ink)]">{current.question}</p>

                    <div className="mt-5 grid gap-2.5">
                      {ANSWER_KEYS.filter((k) => current.answers[k]).map((k) => {
                        const isChosen = chosen === k;
                        const isAnswer = current.correct === k;
                        return (
                          <motion.button
                            key={k}
                            type="button"
                            disabled={revealed}
                            onClick={() => void answer(k)}
                            whileTap={!revealed ? { scale: 0.985 } : undefined}
                            className={cn(
                              "pop-in flex items-center gap-3 rounded-[9px] border-2 px-4 py-3 text-left text-[14.5px] font-semibold transition-all",
                              !revealed && "border-[var(--line)] bg-[var(--paper-raised)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] cursor-pointer",
                              revealed && isAnswer && "border-[var(--good)] bg-[color-mix(in_srgb,var(--good)_14%,var(--paper-raised))] text-[var(--ink)]",
                              revealed && isChosen && !isAnswer && "shake-x border-[var(--bad)] bg-[color-mix(in_srgb,var(--bad)_12%,var(--paper-raised))] text-[var(--ink)]",
                              revealed && !isChosen && !isAnswer && "border-[var(--line-soft)] bg-[var(--paper-soft)] opacity-60 text-[var(--ink-faint)]",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-black",
                                revealed && isAnswer ? "bg-[var(--good)] text-white" : revealed && isChosen ? "bg-[var(--bad)] text-white" : "bg-[var(--paper-deep)] text-[var(--ink-soft)]",
                              )}
                            >
                              {revealed && isAnswer ? <Check className="h-4 w-4" /> : revealed && isChosen ? <X className="h-4 w-4" /> : k}
                            </span>
                            {current.answers[k]}
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {revealed && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-5 flex items-center justify-between rounded-[8px] border border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3"
                        >
                          <span className={cn("text-[14px] font-bold", deck[index].correct === chosen ? "text-[var(--good)]" : "text-[var(--bad)]")}>
                            {deck[index].correct === chosen ? "✓ Correct!" : `✗ Correct answer: ${deck[index].correct}`}
                          </span>
                          <button className="btn btn-primary btn-sm" onClick={() => void next()}>
                            {index + 1 >= deck.length ? "Finish quiz" : "Next"} <ArrowRight className="h-4 w-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <GlassCard hover={false} className="p-8 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Quiz complete</p>
                <div className="mt-3 flex items-end justify-center gap-2">
                  <Counter value={score} fontSize={56} className="font-display font-bold text-[var(--ink)]" />
                  <span className="font-display pb-2 text-2xl font-bold text-[var(--ink-faint)]">/ {deck.length}</span>
                </div>
                <p className="mt-1 text-[14px] text-[var(--ink-faint)]">
                  {score === deck.length
                    ? "Flawless — absolute mastery! 🏆"
                    : score / deck.length >= 0.7
                      ? "Strong work — keep grinding. 💪"
                      : "Good reps — review the misses and go again. 📚"}
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <button className="btn btn-primary" onClick={() => setPhase("setup")}>
                    <RotateCcw className="h-4 w-4" /> Try again
                  </button>
                </div>
              </GlassCard>

              <div className="mt-4 space-y-2">
                {results.map((r, i) => (
                  <motion.div
                    key={r.question.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.05, 0.5) } }}
                  >
                    <GlassCard className="flex items-center gap-3 p-4">
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full font-bold text-white",
                          r.isCorrect ? "bg-[var(--good)]" : "bg-[var(--bad)]",
                        )}
                      >
                        {r.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--ink)]">{r.question.question}</span>
                      <span className="shrink-0 font-mono text-[11.5px] text-[var(--ink-faint)]">
                        you: {r.chosen ?? "—"} · key: {r.question.correct}
                      </span>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {bank.length === 0 && phase === "setup" && (
          <GlassCard hover={false} className="p-8 text-center text-[13.5px] text-[var(--ink-faint)]">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Loading the bank…
          </GlassCard>
        )}
      </div>
    </PageTransition>
  );
}

export default function QuizPage() {
  return (
    <RequireAccount feature="quizzes">
      <QuizInner />
    </RequireAccount>
  );
}
