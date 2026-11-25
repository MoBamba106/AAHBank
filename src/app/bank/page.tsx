"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownWideNarrow, Library, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/page-transition";
import { GlassCard, PageSkeleton } from "@/components/ui/glass-card";
import { useAuth } from "@/components/auth-provider";
import { removeQuestion, useQuestions } from "@/lib/data";
import { ANSWER_KEYS, cn, formatTime } from "@/lib/utils";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";

export default function BankPage() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest");
  const [category, setCategory] = React.useState("all");
  const [difficulty, setDifficulty] = React.useState("all");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const { questions, loading, error, reload } = useQuestions({ search: debounced(search, 250), sort, category, difficulty });

  const del = async (id: string, authorId: string | null) => {
    const canDelete = authorId === user.id || (!authorId && user.isGuest);
    if (!canDelete) return toast.error("You can only delete questions you added.");
    setDeleting(id);
    try {
      await removeQuestion(id, user);
      toast.success("Question deleted.");
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Browse</p>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Question bank</h1>
          <p className="mt-1 text-[14px] text-[var(--ink-faint)]">
            {loading && !questions.length ? "Loading the bank…" : `${questions.length} question${questions.length === 1 ? "" : "s"} visible`}
          </p>
        </div>

        {/* Filters */}
        <GlassCard hover={false} className="p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input
                className="input pl-9"
                placeholder="Search by text…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </span>
            <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className="input w-auto" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">All difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              className="btn btn-soft btn-sm"
              onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
              title="Toggle sort order"
            >
              <ArrowDownWideNarrow className="h-4 w-4" />
              {sort === "newest" ? "Newest" : "Oldest"}
            </button>
          </div>
        </GlassCard>

        {error && (
          <div className="rounded-[7px] border border-[#e9c6cc] bg-[#fff7f7] px-4 py-3 text-[13.5px] font-semibold text-[#ae3d51]">{error}</div>
        )}

        {loading && !questions.length ? (
          <PageSkeleton cards={4} />
        ) : questions.length === 0 ? (
          <GlassCard hover={false} className="p-14 text-center">
            <Library className="mx-auto mb-3 h-10 w-10 text-[var(--ink-faint)]" />
            <p className="font-display text-xl font-bold text-[var(--ink-soft)]">Nothing here yet</p>
            <p className="text-[13.5px] text-[var(--ink-faint)]">Add questions from the “Add questions” page — or relax the filters.</p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index * 0.04, 0.4), duration: 0.35, ease: [0.22, 0.8, 0.36, 1] } }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.22 } }}
                >
                  <GlassCard className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge soft-tone soft-tone-teal">{q.category}</span>
                        <span className="badge soft-tone soft-tone-yellow">{q.difficulty}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--ink-faint)]">{formatTime(q.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-[14.5px] font-semibold leading-snug text-[var(--ink)]">{q.question}</p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {ANSWER_KEYS.filter((k) => q.answers[k]).map((k) => (
                        <div
                          key={k}
                          className={cn(
                            "flex items-center gap-2 rounded-[6px] border px-2.5 py-1.5 text-[12.5px]",
                            k === q.correct
                              ? "border-[color-mix(in_srgb,var(--good)_45%,transparent)] bg-[color-mix(in_srgb,var(--good)_12%,transparent)] font-bold text-[var(--ink)]"
                              : "border-[var(--line-soft)] bg-[var(--paper-soft)] text-[var(--ink-soft)]",
                          )}
                        >
                          <span className={cn("text-[10px] font-black", k === q.correct ? "text-[var(--good)]" : "text-[var(--ink-faint)]")}>{k}</span>
                          <span className="truncate">{q.answers[k]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
                      <span className="text-[11.5px] text-[var(--ink-faint)]">by {q.authorName ?? "unknown"}</span>
                      {(q.authorId === user.id || (!q.authorId && user.isGuest)) && (
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => void del(q.id, q.authorId)}
                          disabled={deleting === q.id}
                        >
                          {deleting === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </button>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

/** Tiny debounce hook (kept local — used only here). */
function debounced<T>(value: T, delay: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}
