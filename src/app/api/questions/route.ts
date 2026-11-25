import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { AnswerKey } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  question: string;
  answers: { A: string; B: string; C: string; D: string };
  correct: string;
  category: string;
  difficulty: string;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
};

function toQuestion(r: Row) {
  return {
    id: r.id,
    question: r.question,
    answers: r.answers,
    correct: r.correct as AnswerKey,
    category: r.category ?? "General",
    difficulty: (r.difficulty ?? "Medium") as "Easy" | "Medium" | "Hard",
    authorId: r.author_id,
    authorName: r.author_name,
    createdAt: r.created_at,
  };
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const sort = url.searchParams.get("sort") === "oldest" ? "oldest" : "newest";
    const category = url.searchParams.get("category") ?? "";
    const difficulty = url.searchParams.get("difficulty") ?? "";

    const db = createSupabaseServiceClient();
    let query = db
      .from("questions")
      .select("*")
      .order("created_at", { ascending: sort === "oldest" })
      .limit(1000);

    if (q) query = query.ilike("question", `%${q}%`);
    if (category && category !== "all") query = query.eq("category", category);
    if (difficulty && difficulty !== "all") query = query.eq("difficulty", difficulty);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ questions: (data as Row[]).map(toQuestion) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Sign in to add questions." }, { status: 401 });

    const body = (await req.json()) as {
      question?: string;
      answers?: Record<string, string>;
      correct?: string;
      category?: string;
      difficulty?: string;
    };

    const question = (body.question ?? "").trim();
    const answers = {
      A: (body.answers?.A ?? "").trim(),
      B: (body.answers?.B ?? "").trim(),
      C: (body.answers?.C ?? "").trim(),
      D: (body.answers?.D ?? "").trim(),
    };
    const correct = ["A", "B", "C", "D"].includes(body.correct ?? "") ? (body.correct as string) : "";
    if (!question) return NextResponse.json({ error: "Question text is required." }, { status: 400 });
    if (!answers.A || !answers.B) return NextResponse.json({ error: "Fill in at least answers A and B." }, { status: 400 });
    if (!correct) return NextResponse.json({ error: "Pick which answer is correct." }, { status: 400 });
    if (!answers[correct as "A" | "B" | "C" | "D"]) {
      return NextResponse.json({ error: "The correct answer box is empty." }, { status: 400 });
    }

    const db = createSupabaseServiceClient();

    // Duplicate guard (same check as the original app).
    const { data: dupes } = await db
      .from("questions")
      .select("id, question")
      .ilike("question", question)
      .limit(20);
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    if ((dupes ?? []).some((d) => norm((d as { question: string }).question) === norm(question))) {
      return NextResponse.json({ error: "That question is already saved." }, { status: 409 });
    }

    const { data: profile } = await db
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const { error } = await db.from("questions").insert({
      question,
      answers,
      correct,
      category: (body.category ?? "General").trim() || "General",
      difficulty: ["Easy", "Medium", "Hard"].includes(body.difficulty ?? "") ? body.difficulty : "Medium",
      author_id: user.id,
      author_name:
        (profile as { display_name: string | null } | null)?.display_name ??
        (user.user_metadata as { display_name?: string })?.display_name ??
        user.email?.split("@")[0] ??
        "Student",
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
