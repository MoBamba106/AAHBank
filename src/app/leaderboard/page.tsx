"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Award, BookOpen, Crown, Flame, Medal, PencilRuler, Target, Trophy } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { GlassCard, PageSkeleton } from "@/components/ui/glass-card";
import { useAuth } from "@/components/auth-provider";
import { useSettings } from "@/components/settings-provider";
import { useLeaderboard } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardPayload } from "@/lib/types";

const BOARDS: {
  key: keyof LeaderboardPayload["boards"];
  title: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  { key: "mostAccurate", title: "Most accurate", unit: "%", icon: Target, tone: "soft-tone-teal" },
  { key: "mostAnswers", title: "Most answers checked", unit: "", icon: Trophy, tone: "soft-tone-yellow" },
  { key: "mostQuestions", title: "Most questions added", unit: "", icon: PencilRuler, tone: "soft-tone-lavender" },
  { key: "bestThisWeek", title: "Best this week", unit: "", icon: Flame, tone: "soft-tone-peach" },
  { key: "hardestMastered", title: "Hard questions mastered", unit: "", icon: BookOpen, tone: "soft-tone-rose" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-[#d7a13c]" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-[#9aa2ad]" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-[#b9793e]" />;
  return <span className="w-5 text-center font-mono text-[12.5px] font-bold text-[var(--ink-faint)]">{rank}</span>;
}

function LeaderboardInner() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = React.useState<"all" | "week">("all");
  const { data, loading, error } = useLeaderboard(timeframe);
  const { settings } = useSettings();

  // The device-local "hide me from the leaderboard" preference (SAT Nexus keeps
  // the server-side toggle too; this covers guests before accounts exist).
  const boards = React.useMemo(() => {
    const src = data?.boards;
    if (!src) return null;
    if (!settings.hideMeLocal) return src;
    const strip = (list: typeof src.mostAnswers) => list.filter((e) => e.userId !== user.id);
    return {
      mostQuestions: strip(src.mostQuestions),
      mostAccurate: strip(src.mostAccurate),
      mostAnswers: strip(src.mostAnswers),
      hardestMastered: strip(src.hardestMastered),
      bestThisWeek: strip(src.bestThisWeek),
    };
  }, [data, settings.hideMeLocal, user.id]);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Class rankings</p>
            <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Leaderboard</h1>
            <p className="mt-1 max-w-2xl text-[14px] text-[var(--ink-faint)]">
              Accuracy needs 10+ answers; hard mastery counts correct Hard items. Hide yourself from
              the board in Settings.
            </p>
          </div>
          <div className="flex overflow-hidden rounded-[7px] border border-[var(--line)] bg-[var(--paper-soft)] p-0.5">
            {(["all", "week"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "rounded-[5px] px-3 py-1.5 text-[12px] font-bold transition-colors",
                  timeframe === tf ? "bg-[var(--paper-raised)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]",
                )}
              >
                {tf === "all" ? "All-Time" : "This Week"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-[7px] border border-[#e9c6cc] bg-[#fff7f7] px-4 py-3 text-[13.5px] font-semibold text-[#ae3d51]">{error}</div>
        )}

        {loading && !data ? (
          <PageSkeleton cards={4} />
        ) : (
          <>
            {/* Podium — top 3 of the "most answers" board */}
            <Podium entries={(boards?.mostAnswers ?? []).slice(0, 3)} hideMe={false} meId={user.id} />

            <div className="grid gap-4 md:grid-cols-2">
              {BOARDS.map(({ key, title, unit, icon: Icon, tone }) => {
                const entries = boards?.[key] ?? [];
                return (
                  <GlassCard key={key} hover={false} className="p-5">
                    <div className={cn("soft-tone mb-4 inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold", tone)}>
                      <Icon className="h-4 w-4" /> {title}
                    </div>
                    {entries.length === 0 ? (
                      <p className="py-8 text-center text-[13px] text-[var(--ink-faint)]">
                        No qualifying students yet — be the first!
                      </p>
                    ) : (
                      <ol className="space-y-1.5">
                        {entries.map((entry, i) => {
                          const isMe = !user.isGuest && entry.userId === user.id;
                          return (
                            <motion.li
                              key={`${key}-${entry.userId}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i * 0.04, 0.35) } }}
                              className={cn(
                                "flex items-center gap-3 rounded-[7px] border px-3.5 py-2.5",
                                isMe
                                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                  : "border-[var(--line-soft)] bg-[var(--paper-soft)]",
                              )}
                            >
                              <RankBadge rank={i + 1} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-bold text-[var(--ink)]">
                                  {entry.name}{isMe && " (you)"}
                                </span>
                                <span className="block truncate text-[11.5px] text-[var(--ink-faint)]">{entry.detail}</span>
                              </span>
                              <span className="font-display shrink-0 text-[16px] font-bold text-[var(--accent-dark)]">
                                {entry.value}{unit}
                              </span>
                            </motion.li>
                          );
                        })}
                      </ol>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

/** Gold/silver/bronze podium, animated rise-in (SAT Nexus podium pattern). */
function Podium({ entries, hideMe, meId }: { entries: LeaderboardEntry[]; hideMe: boolean; meId: string }) {
  if (hideMe) entries = entries.filter((e) => e.userId !== meId);
  const places = [
    { rank: 2, cls: "second", height: "h-[72px]", medal: <Medal className="h-6 w-6 text-[#9aa2ad]" /> },
    { rank: 1, cls: "first", height: "h-[96px]", medal: <Crown className="h-7 w-7 text-[#d7a13c]" /> },
    { rank: 3, cls: "third", height: "h-[56px]", medal: <Medal className="h-5 w-5 text-[#b9793e]" /> },
  ];
  if (!entries.length) return null;
  return (
    <GlassCard hover={false} className="p-6">
      <div className="mb-5 flex items-center gap-2 text-[13px] font-bold text-[var(--ink-soft)]">
        <Award className="h-4 w-4 text-[#d7a13c]" /> Podium · most answers checked
      </div>
      <div className="flex items-end justify-center gap-4 sm:gap-8">
        {places.map((place, i) => {
          const entry = entries[place.rank - 1];
          if (!entry) return <div key={place.rank} className="w-[96px]" />;
          return (
            <div key={place.rank} className="flex w-[96px] flex-col items-center sm:w-[120px]">
              {place.medal}
              <p className="mt-1.5 max-w-full truncate text-[13px] font-bold text-[var(--ink)]">{entry.name}</p>
              <p className="text-[11px] text-[var(--ink-faint)]">{entry.value} answers</p>
              <div
                className={`podium-rise mt-2 w-full ${place.height} rounded-t-[9px] border border-[var(--line)] ${
                  place.cls === "first"
                    ? "bg-[color-mix(in_srgb,var(--accent)_28%,var(--paper-raised))]"
                    : place.cls === "second"
                      ? "bg-[color-mix(in_srgb,var(--accent)_16%,var(--paper-raised))]"
                      : "bg-[color-mix(in_srgb,var(--accent)_9%,var(--paper-raised))]"
                }`}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardInner />;
}
