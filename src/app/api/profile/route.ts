import { NextResponse } from "next/server";
import { createSupabaseServiceClient, getRequestUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/** Ensures a profiles row exists for the user, returns the visible profile. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const db = createSupabaseServiceClient();

    let { data } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!data) {
      // First call after signup (trigger should handle this; belt-and-braces).
      const meta = (user.user_metadata ?? {}) as { display_name?: string };
      await db.from("profiles").insert({ id: user.id, display_name: meta.display_name ?? null });
      ({ data } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle());
    }
    const row = (data ?? {}) as { display_name: string | null; hide_leaderboard: boolean };
    return NextResponse.json({
      displayName: row.display_name ?? null,
      hideLeaderboard: Boolean(row.hide_leaderboard),
      email: user.email ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured (demo mode)" }, { status: 503 });
  }
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const body = (await req.json()) as { displayName?: string; hideLeaderboard?: boolean };
    const db = createSupabaseServiceClient();

    const patch: Record<string, unknown> = {};
    if (typeof body.displayName === "string") {
      const name = body.displayName.trim();
      if (!name) return NextResponse.json({ error: "Display name cannot be empty." }, { status: 400 });
      patch.display_name = name.slice(0, 40);
    }
    if (typeof body.hideLeaderboard === "boolean") patch.hide_leaderboard = body.hideLeaderboard;
    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

    const { error } = await db.from("profiles").upsert({ id: user.id, ...patch });
    if (error) throw new Error(error.message);

    // Keep auth metadata in step so the sidebar shows the new name immediately.
    if (patch.display_name) {
      await db.auth.admin.updateUserById(user.id, {
        user_metadata: { display_name: patch.display_name },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
