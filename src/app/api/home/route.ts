import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/** Dashboard payload for the home page. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    const db = createSupabaseServiceClient();

    const [bankRes, mineRes, sessionRes, attemptRes, topRes] = await Promise.all([
      db.from("questions").select("id", { count: "exact", head: true }),
      user
        ? db.from("questions").select("id", { count: "exact", head: true }).eq("author_id", user.id)
        : Promise.resolve({ count: 0 } as const),
      user
        ? db.from("quiz_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("finished", true)
        : Promise.resolve({ count: 0 } as const),
      user
        ? db.from("attempts").select("is_correct").eq("user_id", user.id).limit(5000)
        : Promise.resolve({ data: [] as { is_correct: boolean }[] } as const),
      db
        .from("profiles")
        .select("id, display_name")
        .eq("hide_leaderboard", false)
        .limit(200),
    ]);

    let accuracy = 0;
    const attempts = ("data" in attemptRes ? (attemptRes.data ?? []) : []) as { is_correct: boolean }[];
    if (attempts.length) {
      accuracy = Math.round((attempts.filter((a) => a.is_correct).length / attempts.length) * 100);
    }

    // Top student = most answers checked among visible profiles (small class-scale join).
    const { data: topAttempts } = await db
      .from("attempts")
      .select("user_id")
      .limit(20000);
    const counts = new Map<string, number>();
    for (const a of (topAttempts ?? []) as { user_id: string }[]) {
      counts.set(a.user_id, (counts.get(a.user_id) ?? 0) + 1);
    }
    const profiles = (topRes.data ?? []) as { id: string; display_name: string | null }[];
    let topStudent: { name: string; detail: string } | null = null;
    let bestId: string | null = null;
    let bestCount = 0;
    for (const [id, count] of counts) {
      if (count > bestCount && profiles.some((p) => p.id === id)) {
        bestCount = count;
        bestId = id;
      }
    }
    if (bestId && bestCount > 0) {
      const p = profiles.find((x) => x.id === bestId);
      topStudent = {
        name: p?.display_name?.trim() || `Student ${bestId.slice(0, 6)}`,
        detail: `${bestCount} answers checked`,
      };
    }

    return NextResponse.json({
      questionsInBank: bankRes.count ?? 0,
      myQuestions: mineRes.count ?? 0,
      quizzesTaken: sessionRes.count ?? 0,
      accuracy,
      topStudent,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
