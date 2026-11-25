import type { AnswerKey } from "@/lib/types";

/**
 * Ported from the original StudyBank single-file app: turns raw text
 * (from OCR or pasted text) into a question draft by detecting
 * A./B./C./D. answer labels, True/False questions, or positional lists.
 */
export function parseQuestionText(raw: string): { question: string; answers: Record<AnswerKey, string> } | null {
  let lines = String(raw || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;

  const ignoredPhrases = [
    "select the best answer",
    "choose the best answer",
    "select the correct answer",
    "choose the correct answer",
    "select the best option",
    "select all that apply",
    "circle the best answer",
    "mark the best answer",
  ];
  lines = lines.filter((line) => {
    const lower = line.toLowerCase();
    if (ignoredPhrases.some((p) => lower.includes(p))) return false;
    if (/^(question\s*)?\d+\.?\s*$/i.test(line)) return false;
    return true;
  });
  if (!lines.length) return null;

  const merged: string[] = [];
  for (const line of lines) {
    const isAnswerLabel = /^[A-Da-d][).:\-]\s+\S/.test(line);
    const startsLower = /^[a-z]/.test(line);
    if (startsLower && !isAnswerLabel && merged.length > 0) {
      merged[merged.length - 1] += " " + line;
    } else {
      merged.push(line);
    }
  }

  const tfPattern = /^(true|false)$/i;
  const hasTFLines = merged.some((l) => tfPattern.test(l.trim()));
  const hasTFInQuestion = merged.some((l) => /true\s+or\s+false/i.test(l));
  const answerLabelRe = /^([A-Da-d])[).:\-]\s+(.+)/;
  const labeledAnswers: Partial<Record<AnswerKey, string>> = {};
  const nonLabeledLines: string[] = [];

  for (const line of merged) {
    const m = line.match(answerLabelRe);
    if (m) {
      const letter = m[1].toUpperCase() as AnswerKey;
      if (["A", "B", "C", "D"].includes(letter) && !labeledAnswers[letter]) {
        labeledAnswers[letter] = m[2].trim();
      }
    } else {
      nonLabeledLines.push(line);
    }
  }

  const hasLabeled = Object.keys(labeledAnswers).length > 0;
  let questionParts: string[] = [];
  const answers: Record<AnswerKey, string> = { A: "", B: "", C: "", D: "" };

  if (hasLabeled) {
    questionParts = nonLabeledLines;
    answers.A = labeledAnswers.A ?? "";
    answers.B = labeledAnswers.B ?? "";
    answers.C = labeledAnswers.C ?? "";
    answers.D = labeledAnswers.D ?? "";
  } else if (hasTFLines || hasTFInQuestion) {
    questionParts = merged.filter((l) => !tfPattern.test(l.trim()));
    answers.A = "True";
    answers.B = "False";
  } else if (merged.length === 1) {
    questionParts = merged;
  } else {
    questionParts = [merged[0]];
    merged.slice(1).forEach((l, i) => {
      if (i < 4) answers[(["A", "B", "C", "D"] as AnswerKey[])[i]] = l;
    });
  }

  let question = questionParts.join(" ").trim();
  question = question.replace(/^[\s\W]*q(uestion)?\s*#?\s*\d+[\s\W]*/i, "").trim();
  question = question.replace(/^\d+[).:\-]\s*/, "").trim();

  if (!question && !answers.A && !answers.B) return null;
  return { question, answers };
}
