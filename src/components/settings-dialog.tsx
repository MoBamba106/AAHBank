"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Accessibility,
  Check,
  Eye,
  LayoutGrid,
  RotateCcw,
  Save,
  Type,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings, THEMES, type AppTheme, type FontScale } from "@/components/settings-provider";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-[7px] border border-[var(--line)] bg-[var(--paper-raised)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--paper-soft)]"
    >
      <Icon className="h-4.5 w-4.5 shrink-0 text-[var(--accent)]" />
      <span className="min-w-0 grow">
        <span className="block text-[13.5px] font-semibold text-[var(--ink)]">{label}</span>
        <span className="block text-[11.5px] leading-snug text-[var(--ink-faint)]">{description}</span>
      </span>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-[var(--accent)]" : "bg-[var(--paper-deep)]")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-[left]", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { user, authEnabled, setGuestName } = useAuth();
  const [nameDraft, setNameDraft] = React.useState("");
  const [savedName, setSavedName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setNameDraft(user.displayName ?? "");
  }, [open, user.displayName]);

  const saveName = () => {
    const name = nameDraft.trim();
    if (!name) return toast.error("Enter a name first.");
    if (authEnabled && !user.isGuest) {
      // Live accounts update the display name via the profile API.
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      }).then(async (res) => {
        if (!res.ok) throw new Error();
        toast.success("Display name saved.");
        window.location.reload();
      }).catch(() => toast.error("Could not save name."));
    } else {
      setGuestName(name);
      setSavedName(name);
      toast.success("Name saved on this device.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            role="dialog"
            aria-label="Settings"
            className="glass shadow-paper-lg max-h-[86vh] w-full max-w-[560px] overflow-y-auto p-0"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 0.8, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper-raised)] px-5 py-3.5">
              <h2 className="font-display text-lg font-bold">Settings</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => onOpenChange(false)} aria-label="Close settings">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Theme picker */}
              <section>
                <p className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  <LayoutGrid className="h-3.5 w-3.5" /> Theme
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {THEMES.map((theme) => {
                    const active = settings.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => updateSettings({ theme: theme.id as AppTheme })}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-[7px] border px-3 py-2.5 text-left transition-all",
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
                            : "border-[var(--line)] bg-[var(--paper-raised)] hover:border-[var(--accent)] hover:bg-[var(--paper-soft)]",
                        )}
                      >
                        <span className="grid shrink-0 grid-cols-2 gap-[3px]">
                          {theme.swatches.map((s, i) => (
                            <span key={i} className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: s }} />
                          ))}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-bold text-[var(--ink)]">{theme.name}</span>
                          <span className="block truncate text-[10.5px] text-[var(--ink-faint)]">{theme.description}</span>
                        </span>
                        {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-[var(--accent)]" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Accessibility & behavior */}
              <section className="space-y-2">
                <p className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  <Accessibility className="h-3.5 w-3.5" /> Accessibility
                </p>
                <Toggle
                  checked={settings.reducedMotion}
                  onChange={(v) => updateSettings({ reducedMotion: v })}
                  label="Reduce motion"
                  description="Disables page transitions, glows, and stagger animations."
                  icon={Accessibility}
                />
                <Toggle
                  checked={settings.compactMode}
                  onChange={(v) => updateSettings({ compactMode: v })}
                  label="Compact mode"
                  description="Tighter cards and smaller controls to fit more on screen."
                  icon={LayoutGrid}
                />
                <Toggle
                  checked={settings.soundEffects}
                  onChange={(v) => updateSettings({ soundEffects: v })}
                  label="Interface sounds"
                  description="A soft click when you press buttons."
                  icon={Volume2}
                />
                <div className="rounded-[7px] border border-[var(--line)] bg-[var(--paper-raised)] px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <Type className="h-4.5 w-4.5 shrink-0 text-[var(--accent)]" />
                    <span className="min-w-0 grow">
                      <span className="block text-[13.5px] font-semibold text-[var(--ink)]">Text size</span>
                      <span className="block text-[11.5px] text-[var(--ink-faint)]">Scales the entire interface.</span>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["small", "default", "large"] as FontScale[]).map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => updateSettings({ fontScale: scale })}
                        className={cn(
                          "rounded-[6px] border px-3 py-2 text-[12.5px] font-bold capitalize transition-colors",
                          settings.fontScale === scale
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                            : "border-[var(--line)] bg-[var(--paper-soft)] text-[var(--ink-soft)] hover:bg-[var(--paper-deep)]",
                        )}
                      >
                        {scale === "default" ? "Default" : scale}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Identity */}
              <section className="space-y-2">
                <p className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  <UserRound className="h-3.5 w-3.5" /> Display name
                </p>
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder={user.isGuest ? "Your name (saved on this device)" : "Your display name"}
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <button className="btn btn-primary shrink-0" onClick={saveName}>
                    <Save className="h-4 w-4" /> Save
                  </button>
                </div>
                <Toggle
                  checked={settings.hideMeLocal}
                  onChange={(v) => {
                    updateSettings({ hideMeLocal: v });
                    if (authEnabled && !user.isGuest) {
                      // Persist the server-side hide flag for accounts.
                      fetch("/api/profile", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ hideLeaderboard: v }),
                      })
                        .then((res) => (res.ok ? toast.success(v ? "Hidden from the leaderboard." : "Visible on the leaderboard.") : toast.error("Could not save that setting.")))
                        .catch(() => toast.error("Could not save that setting."));
                    }
                  }}
                  label="Hide me from the leaderboard"
                  description={authEnabled ? "Applies to your account once saved server-side." : "Device-local in demo mode."}
                  icon={Eye}
                />
                {savedName && (
                  <p className="text-[11.5px] text-[var(--ink-faint)]">Saved “{savedName}” — the leaderboard updates next refresh.</p>
                )}
              </section>

              <div className="flex items-center justify-between border-t border-[var(--line-soft)] pt-4">
                <p className="text-[11.5px] text-[var(--ink-faint)]">AAHBank v2 · Next.js + Supabase + Vercel</p>
                <button className="btn btn-soft btn-sm" onClick={() => { resetSettings(); toast.success("Settings reset."); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
