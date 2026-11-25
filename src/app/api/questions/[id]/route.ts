import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const { id } = await params;
    const db = createSupabaseServiceClient();

    const { data: row } = await db.from("questions").select("author_id").eq("id", id).maybeSingle();
    if (!row) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    if ((row as { author_id: string | null }).author_id !== user.id) {
      return NextResponse.json({ error: "You can only delete questions you added." }, { status: 403 });
    }

    // Remove dependent attempts first, then the question.
    await db.from("attempts").delete().eq("question_id", id);
    const { error } = await db.from("questions").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
