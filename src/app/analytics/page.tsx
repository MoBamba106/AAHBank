"use client";

import * as React from "react";
import { BarChart3, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { PageTransition } from "@/components/page-transition";
import { GlassCard, PageSkeleton } from "@/components/ui/glass-card";
import { Counter } from "@/components/react-bits/Counter";
import { RequireAccount } from "@/components/require-account";
import { useStats } from "@/lib/data";
import { cn } from "@/lib/utils";

const TT = {
  contentStyle: { background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 13, color: "var(--ink)" },
  labelStyle: { color: "var(--ink)", fontWeight: 700 },
} as const;

function AnalyticsInner() {
  const { data: s, loading } = useStats();

  if (loading)
    return (
      <PageTransition>
        <PageSkeleton cards={4} />
      </PageTransition>
    );

  const noData = !s || s.totalAttempts === 0;
  const donut = [
    { name: "Correct", value: s?.totalCorrect ?? 0, fill: "#2ca974" },
    { name: "Incorrect", value: (s?.totalAttempts ?? 0) - (s?.totalCorrect ?? 0), fill: "#e56a8a" },
  ].filter((d) => d.value > 0);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Your progress</p>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">
            <span className="hl-blue">Analytics</span>
          </h1>
          <p className="mt-1 text-[15px] text-[var(--ink-faint)]">Results from your graded practice attempts.</p>
        </div>

        {noData ? (
          <GlassCard hover={false} className="p-12 text-center">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-[var(--ink-faint)]" />
            <p className="font-display text-xl font-bold text-[var(--ink-soft)]">No data yet</p>
            <p className="text-[13.5px] text-[var(--ink-faint)]">Take a quiz and your analytics appear here.</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Graded checks", value: s!.totalAttempts, suffix: "" },
                { label: "Unique questions", value: s!.uniqueQuestions, suffix: "" },
                { label: "Correct", value: s!.totalCorrect, suffix: "" },
                { label: "Accuracy", value: s!.accuracy, suffix: "%" },
              ].map((c) => (
                <GlassCard key={c.label} hover={false} className="p-5 text-center">
                  <div className="flex items-end justify-center gap-0.5">
                    <Counter value={c.value} fontSize={30} className="font-display font-bold text-[var(--ink)]" />
                    <span className="font-display pb-1 text-lg font-bold text-[var(--ink-faint)]">{c.suffix}</span>
                  </div>
                  <div className="mt-1 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{c.label}</div>
                </GlassCard>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard hover={false} className="p-6">
                <h2 className="font-display mb-3 text-lg font-bold">Accuracy by category</h2>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={s!.byCategory.map((d) => ({ ...d, pct: d.total ? Math.round((d.correct / d.total) * 100) : 0 }))} margin={{ left: -22, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ink-faint)" }} />
                      <Tooltip {...TT} formatter={(v) => [`${v}%`, "Accuracy"]} />
                      <Bar dataKey="pct" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard hover={false} className="p-6">
                <h2 className="font-display mb-3 text-lg font-bold">Overall split</h2>
                <div className="relative mx-auto h-[220px] max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donut} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={3} strokeWidth={0}>
                        {donut.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Pie>
                      <Tooltip {...TT} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-bold">{s!.accuracy}%</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">accuracy</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover={false} className="p-6">
                <h2 className="font-display mb-3 text-lg font-bold">Accuracy by difficulty</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={s!.byDifficulty.map((d) => ({ ...d, pct: d.total ? Math.round((d.correct / d.total) * 100) : 0 }))} margin={{ left: -22, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                      <XAxis dataKey="difficulty" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ink-faint)" }} />
                      <Tooltip
                        {...TT}
                        formatter={(value, _name, item) => {
                          const row = (item as { payload: { total: number; correct: number } }).payload;
                          return [`${value}% (${row.correct}/${row.total} questions)`, "Accuracy"];
                        }}
                      />
                      <Bar dataKey="pct" fill="#d9922e" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard hover={false} className="p-6">
                <h2 className="font-display mb-3 text-lg font-bold">Attempts over time</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={s!.activity} margin={{ left: -22, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-faint)" }} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} allowDecimals={false} />
                      <Tooltip {...TT} />
                      <Area type="monotone" dataKey="attempts" stroke="var(--accent)" fill="color-mix(in srgb, var(--accent) 14%, transparent)" strokeWidth={2.5} name="Checked" />
                      <Area type="monotone" dataKey="correct" stroke="#2ca974" fill="#2ca97422" strokeWidth={2.5} name="Correct" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <GlassCard hover={false} className="p-6">
              <h2 className="font-display mb-3 text-lg font-bold">Recent attempts</h2>
              <div className="space-y-2">
                {s!.recentAttempts.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-[7px] border px-3.5 py-2.5",
                      r.isCorrect ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_8%,transparent)]" : "border-[color-mix(in_srgb,var(--bad)_35%,transparent)] bg-[color-mix(in_srgb,var(--bad)_8%,transparent)]",
                    )}
                  >
                    <span className={cn("text-[13px] font-black", r.isCorrect ? "text-[var(--good)]" : "text-[var(--bad)]")}>
                      {r.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--ink)]">{r.question}</span>
                    <span className="shrink-0 font-mono text-[11.5px] text-[var(--ink-faint)]">
                      you: {r.chosen ?? "—"} · key: {r.correct}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </PageTransition>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireAccount feature="analytics">
      <AnalyticsInner />
    </RequireAccount>
  );
}
