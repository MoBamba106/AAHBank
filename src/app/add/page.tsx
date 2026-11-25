"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ClipboardPaste,
  ImageUp,
  Loader2,
  ScanLine,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { RequireAccount } from "@/components/require-account";
import { useAuth } from "@/components/auth-provider";
import { createQuestion, isDuplicateQuestion } from "@/lib/data";
import { parseQuestionText } from "@/lib/ocr-parser";
import { ANSWER_KEYS, cn } from "@/lib/utils";
import { CATEGORIES, DIFFICULTIES, type AnswerKey, type QuestionDraft } from "@/lib/types";

// Tesseract ships heavy WASM bundles — loaded lazily in the browser only,
// the first time a scan starts (Next.js code-splits it automatically).
const loadTesseract = () => import("tesseract.js");

const EMPTY: QuestionDraft = {
  question: "",
  answers: { A: "", B: "", C: "", D: "" },
  correct: "A",
  category: "General",
  difficulty: "Medium",
};

function AddInner() {
  const { user } = useAuth();
  const [draft, setDraft] = React.useState<QuestionDraft>(EMPTY);
  const [ocrStatus, setOcrStatus] = React.useState<{ msg: string; kind: "idle" | "loading" | "ok" | "error" }>({ msg: "", kind: "idle" });
  const [dragOver, setDragOver] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const workerRef = React.useRef<Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null>(null);

  React.useEffect(() => {
    return () => {
      void workerRef.current?.terminate();
    };
  }, []);

  const getWorker = async () => {
    if (!workerRef.current) {
      const mod = await loadTesseract();
      workerRef.current = await mod.createWorker("eng", 1, {
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });
    }
    return workerRef.current;
  };

  const applyParsed = (raw: string, source: string) => {
    const parsed = parseQuestionText(raw);
    if (!parsed) {
      setOcrStatus({ msg: `Could not detect question structure — fill the fields by hand.`, kind: "error" });
      return false;
    }
    setDraft((d) => ({
      ...d,
      question: parsed.question || d.question,
      answers: { ...d.answers, ...parsed.answers },
    }));
    setOcrStatus({ msg: `✓ Fields filled from ${source} — review and save.`, kind: "ok" });
    toast.success("Scan complete — review the fields.");
    return true;
  };

  const runOCR = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    setOcrStatus({ msg: "Loading OCR engine… (first scan takes ~5 s)", kind: "loading" });
    try {
      const worker = await getWorker();
      setOcrStatus({ msg: "Scanning image…", kind: "loading" });
      const result = await worker.recognize(file);
      const text = result.data.text || "";
      if (!text.trim()) throw new Error("No text found in image");
      await applyParsed(text, "screenshot");
    } catch (err) {
      setOcrStatus({ msg: "Could not read the image — try the paste option instead.", kind: "error" });
      console.error(err);
      void workerRef.current?.terminate();
      workerRef.current = null;
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast.error("Clipboard is empty.");
      applyParsed(text, "pasted text");
    } catch {
      toast.error("Clipboard access blocked — paste into the question box instead.");
    }
  };

  const save = async () => {
    if (!draft.question.trim()) return toast.error("Add a question first.");
    if (!draft.answers.A.trim() || !draft.answers.B.trim()) return toast.error("Fill in at least answers A and B.");
    if (!draft.answers[draft.correct].trim()) return toast.error("The correct answer box is empty.");
    setSaving(true);
    try {
      if (await isDuplicateQuestion(draft.question, user)) {
        toast.error("That question is already saved.");
        return;
      }
      await createQuestion(
        {
          question: draft.question.trim(),
          answers: {
            A: draft.answers.A.trim(),
            B: draft.answers.B.trim(),
            C: draft.answers.C.trim(),
            D: draft.answers.D.trim(),
          },
          correct: draft.correct,
          category: draft.category,
          difficulty: draft.difficulty,
        },
        user,
      );
      toast.success("✓ Question saved to the bank!");
      setDraft({ ...EMPTY, category: draft.category, difficulty: draft.difficulty });
      setOcrStatus({ msg: "", kind: "idle" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Contribute</p>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Add a question</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-[var(--ink-faint)]">
            Scan a screenshot, paste text, or type it in. Auto-fill detects A/B/C/D labels and
            True/False questions.
          </p>
        </div>

        {/* OCR zone */}
        <GlassCard hover={false} className="p-5">
          <div
            className={cn(
              "rounded-[9px] border-2 border-dashed px-6 py-8 text-center transition-all duration-200",
              dragOver
                ? "scale-[1.01] border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] bg-[var(--paper-soft)]",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer?.files?.[0];
              if (file) void runOCR(file);
            }}
          >
            <ScanLine className="mx-auto mb-3 h-8 w-8 text-[var(--ink-faint)]" />
            <p className="font-display text-lg font-bold text-[var(--ink)]">Scan a screenshot</p>
            <p className="mt-1 text-[13px] text-[var(--ink-faint)]">Drag an image here, or pick one — the OCR engine reads it in your browser.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <label className="btn btn-primary cursor-pointer">
                <ImageUp className="h-4 w-4" /> Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void runOCR(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <button className="btn btn-soft" onClick={() => void pasteFromClipboard()}>
                <ClipboardPaste className="h-4 w-4" /> Paste text
              </button>
            </div>
            <AnimatePresence>
              {ocrStatus.msg && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "mt-4 inline-flex items-center gap-2 text-[13px] font-semibold",
                    ocrStatus.kind === "error" && "text-[var(--bad)]",
                    ocrStatus.kind === "ok" && "text-[var(--good)]",
                    ocrStatus.kind === "loading" && "text-[var(--ink-faint)]",
                  )}
                >
                  {ocrStatus.kind === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {ocrStatus.msg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Form */}
        <GlassCard hover={false} className="p-6">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Question</span>
              <textarea
                className="input min-h-[84px] resize-y"
                placeholder="Type or paste the question here..."
                value={draft.question}
                onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">
                Answers <span className="font-normal text-[var(--ink-faint)]">— click the circle next to the correct one</span>
              </span>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {ANSWER_KEYS.map((key) => {
                  const isCorrect = draft.correct === key;
                  return (
                    <motion.div
                      key={key}
                      layout
                      className={cn(
                        "flex items-center gap-2 rounded-[8px] border px-3 py-2 transition-all",
                        isCorrect
                          ? "border-[var(--good)] bg-[color-mix(in_srgb,var(--good)_10%,var(--paper-raised))]"
                          : "border-[var(--line)] bg-[var(--paper-raised)] hover:border-[var(--accent)]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, correct: key as AnswerKey }))}
                        aria-label={`Mark answer ${key} as correct`}
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                          isCorrect ? "border-[var(--good)] bg-[var(--good)] text-white" : "border-[var(--line)] bg-transparent text-transparent hover:border-[var(--accent)]",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <span className={cn("text-[12px] font-black", isCorrect ? "text-[var(--good)]" : "text-[var(--ink-faint)]")}>{key}</span>
                      <input
                        className="w-full border-0 bg-transparent p-0 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                        placeholder={`Answer ${key}`}
                        value={draft.answers[key]}
                        onChange={(e) => setDraft((d) => ({ ...d, answers: { ...d.answers, [key]: e.target.value } }))}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Category</span>
                <input
                  className="input"
                  list="category-options"
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                />
                <datalist id="category-options">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Difficulty</span>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, difficulty: diff }))}
                      className={cn(
                        "btn btn-sm flex-1",
                        draft.difficulty === diff ? "btn-primary" : "btn-soft",
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="flex gap-2 border-t border-[var(--line-soft)] pt-4">
              <button className="btn btn-primary" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Save question
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setDraft(EMPTY);
                  setOcrStatus({ msg: "", kind: "idle" });
                }}
              >
                <Trash2 className="h-4 w-4" /> Clear form
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

export default function AddPage() {
  return (
    <RequireAccount feature="adding questions">
      <AddInner />
    </RequireAccount>
  );
}
