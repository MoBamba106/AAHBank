"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Crown, Library, PenSquare, Play, BarChart3, Trophy, Loader2 } from "lucide-react";
import { PageTransition, StaggerItem, StaggerList } from "@/components/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { Counter } from "@/components/react-bits/Counter";
import { useAuth } from "@/components/auth-provider";
import { useHome } from "@/lib/data";

const QUICK_ACTIONS = [
  { href: "/add", label: "Add questions", description: "Scan a screenshot with OCR or type one in.", icon: PenSquare, tone: "soft-tone-teal" },
  { href: "/quiz", label: "Start a quiz", description: "Test yourself on the bank and record the score.", icon: Play, tone: "soft-tone-blue" },
  { href: "/analytics", label: "View analytics", description: "Accuracy charts and a 14-day activity timeline.", icon: BarChart3, tone: "soft-tone-lavender" },
  { href: "/leaderboard", label: "Leaderboard", description: "See who leads the class across five boards.", icon: Trophy, tone: "soft-tone-yellow" },
];

export default function HomePage() {
  const { user } = useAuth();
  const { data, loading } = useHome();
  const name = user.displayName || (user.isGuest ? "there" : user.email?.split("@")[0] || "there");

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.8, 0.36, 1] }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">AAHBank · StudyBank</p>
            <h1 className="font-display mt-1 text-4xl font-bold text-[var(--ink)] sm:text-5xl">
              Welcome back, <span className="hl-mint">{name}</span>
            </h1>
            <p className="mt-2 max-w-[560px] text-[15px] text-[var(--ink-faint)]">
              Snap a photo of a question, build the class bank, quiz yourself, and watch the
              leaderboard.
            </p>
          </motion.div>
        </section>

        {/* Stats */}
        {loading && !data ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-panel p-5">
                <div className="skeleton-line w-2/3" />
                <div className="mt-3 skeleton-line w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <StaggerList className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Questions in bank", value: data?.questionsInBank ?? 0, icon: Library, tone: "soft-tone-teal" },
              { label: "Added by you", value: data?.myQuestions ?? 0, icon: PenSquare, tone: "soft-tone-blue" },
              { label: "Quizzes finished", value: data?.quizzesTaken ?? 0, icon: Play, tone: "soft-tone-lavender" },
              { label: "Your accuracy", value: data?.accuracy ?? 0, icon: BarChart3, tone: "soft-tone-yellow", suffix: "%" },
            ].map(({ label, value, icon: Icon, tone, suffix }) => (
              <StaggerItem key={label}>
                <GlassCard className="p-5">
                  <div className={`soft-tone mb-3 inline-flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-bold ${tone}`}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </div>
                  <div className="flex items-end gap-1">
                    <Counter value={value} fontSize={34} className="font-display font-bold text-[var(--ink)]" />
                    {suffix && <span className="font-display pb-1 text-xl font-bold text-[var(--ink-faint)]">{suffix}</span>}
                  </div>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerList>
        )}

        {/* Top student banner */}
        {data?.topStudent && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f6e3b4] text-[#8b622f]">
                <Crown className="h-5 w-5" />
              </span>
              <p className="text-[14px] text-[var(--ink-soft)]">
                <strong className="font-bold text-[var(--ink)]">{data.topStudent.name}</strong> leads the class with{" "}
                {data.topStudent.detail}. <Link href="/leaderboard" className="font-semibold text-[var(--accent-dark)] underline underline-offset-2">See the full leaderboard →</Link>
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Quick actions */}
        <section>
          <h2 className="font-display mb-3 text-xl font-bold text-[var(--ink)]">Jump in</h2>
          <StaggerList className="grid gap-4 sm:grid-cols-2">
            {QUICK_ACTIONS.map(({ href, label, description, icon: Icon, tone }) => (
              <StaggerItem key={href}>
                <Link href={href} className="block">
                  <GlassCard className="group h-full p-5">
                    <div className="flex items-start justify-between">
                      <span className={`soft-tone inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold ${tone}`}>
                        <Icon className="h-4 w-4" /> {label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--ink-faint)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
                    </div>
                    <p className="mt-3 text-[13.5px] text-[var(--ink-faint)]">{description}</p>
                  </GlassCard>
                </Link>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      </div>
    </PageTransition>
  );
}
