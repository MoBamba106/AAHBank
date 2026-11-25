import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/** Records one graded answer. Called once per question checked in a quiz. */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Sign in to save quiz progress." }, { status: 401 });
    const body = (await req.json()) as {
      sessionId?: string;
      questionId?: string;
      chosen?: string | null;
      isCorrect?: boolean;
    };
    if (!body.sessionId || !body.questionId) {
      return NextResponse.json({ error: "sessionId and questionId are required." }, { status: 400 });
    }

    const db = createSupabaseServiceClient();
    const { error } = await db.from("attempts").insert({
      session_id: body.sessionId,
      user_id: user.id,
      question_id: body.questionId,
      chosen: ["A", "B", "C", "D"].includes(body.chosen ?? "") ? body.chosen : null,
      is_correct: Boolean(body.isCorrect),
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
