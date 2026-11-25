"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { authEnabled, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirmNeeded, setConfirmNeeded] = React.useState(false);

  if (!authEnabled) {
    return (
      <PageTransition>
        <GlassCard hover={false} className="mx-auto max-w-[520px] p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Demo mode</h1>
          <p className="mt-2 text-[14.5px] text-[var(--ink-faint)]">
            Supabase isn’t connected yet, so there are no accounts — everything is stored on this
            device. Connect Supabase (see <code className="font-mono text-[12.5px]">docs/HOSTING.md</code>) to enable real accounts.
          </p>
          <Link href="/" className="btn btn-primary mt-6">Back to home</Link>
        </GlassCard>
      </PageTransition>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setConfirmNeeded(false);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast.success("Signed in.");
        router.push("/");
      } else {
        await signUp(email, password, displayName.trim() || email.split("@")[0]);
        setConfirmNeeded(true);
        toast.success("Account created.");
        router.push("/");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[460px]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <GlassCard hover={false} className="p-8">
            <div className="mb-6 flex overflow-hidden rounded-[7px] border border-[var(--line)] bg-[var(--paper-soft)] p-0.5">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-[5px] px-3 py-2 text-[13px] font-bold transition-colors ${
                    mode === m ? "bg-[var(--paper-raised)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-faint)]"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Display name</span>
                  <input
                    className="input"
                    placeholder="e.g. Jordan A."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Email</span>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="you@school.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-bold text-[var(--ink-soft)]">Password</span>
                <span className="relative block">
                  <input
                    className="input pr-11"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)]"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <button className="btn btn-primary w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {confirmNeeded && (
              <p className="mt-4 rounded-[7px] border border-[var(--line)] bg-[var(--accent-soft)] px-3.5 py-3 text-[13px] font-semibold text-[var(--ink)]">
                Check your email — Supabase may ask you to confirm your address before the first
                sign-in. (You can turn that off in Supabase → Auth → Providers → Email.)
              </p>
            )}
          </GlassCard>
        </motion.div>
        <p className="mt-4 text-center text-[12.5px] text-[var(--ink-faint)]">
          You can also keep browsing as a guest — personal features ask again later.
        </p>
      </div>
    </PageTransition>
  );
}
