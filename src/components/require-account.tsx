"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * SAT Nexus RequireAccount pattern: when the app runs against Supabase,
 * personal features need a signed-in account. Demo mode always passes.
 */
export function RequireAccount({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { user, ready, authEnabled } = useAuth();
  if (!ready) return null;
  if (!authEnabled || !user.isGuest) return <>{children}</>;

  return (
    <GlassCard hover={false} className="mx-auto max-w-[520px] p-10 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-dark)]">
        <Lock className="h-6 w-6" />
      </span>
      <h2 className="font-display text-2xl font-bold text-[var(--ink)]">Sign in to use {feature}</h2>
      <p className="mx-auto mt-2 max-w-[380px] text-[14px] text-[var(--ink-faint)]">
        Accounts keep your questions, scores, and leaderboard spot safe across devices — and keep
        the class bank friendly for everyone.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/login" className="btn btn-primary">
          <LogIn className="h-4 w-4" /> Sign in or create account
        </Link>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[var(--ink-faint)]">
        <Sparkles className="h-3.5 w-3.5" /> Running without Supabase keys? Demo mode opens everything.
      </p>
    </GlassCard>
  );
}
