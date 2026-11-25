import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as { answered?: number; correct?: number; finished?: boolean };

    const db = createSupabaseServiceClient();
    const { error } = await db
      .from("quiz_sessions")
      .update({
        answered: Math.max(0, Number(body.answered ?? 0)),
        correct: Math.max(0, Number(body.correct ?? 0)),
        finished: Boolean(body.finished),
      })
      .eq("id", id)
      .eq("user_id", user.id); // scoped to the owner — never someone else's session
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
