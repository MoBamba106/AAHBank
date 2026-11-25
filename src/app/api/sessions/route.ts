import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Sign in to save quiz progress." }, { status: 401 });
    const body = (await req.json()) as { total?: number };
    const total = Math.max(1, Math.min(200, Number(body.total ?? 10)));

    const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from("quiz_sessions")
      .insert({ user_id: user.id, total })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ sessionId: (data as { id: string }).id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
