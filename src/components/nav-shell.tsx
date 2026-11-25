"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  CircleHelp,
  Cog,
  Home,
  Library,
  LogOut,
  Menu,
  PenSquare,
  Play,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useSettings } from "@/components/settings-provider";
import { SettingsDialog } from "@/components/settings-dialog";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const NAV_GROUPS = [
  {
    label: "Study",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/add", label: "Add questions", icon: PenSquare },
      { href: "/bank", label: "Question bank", icon: Library },
      { href: "/quiz", label: "Quiz mode", icon: Play },
    ],
  },
  {
    label: "Progress",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
];

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, authEnabled, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const live = isSupabaseConfigured();

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const name = user.displayName || (user.isGuest ? "Guest" : user.email?.split("@")[0] || "Student");

  const links = (compact: boolean) => (
    <nav aria-label="Primary navigation" className="flex flex-col gap-1">
      {NAV_GROUPS.map((group, index) => (
        <React.Fragment key={group.label}>
          {index > 0 && <div className="mx-3 my-1 h-px shrink-0 bg-[var(--line-soft)]" aria-hidden="true" />}
          <div
            className={cn(
              "px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)] transition-all duration-200 overflow-hidden whitespace-nowrap",
              compact ? "h-0 opacity-0 mb-0" : "h-[16px] opacity-100 mb-1",
            )}
            aria-hidden={compact}
          >
            {group.label}
          </div>
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn("nav-link", active && "nav-link-active")}
                title={compact ? label : undefined}
              >
                <Icon className={cn("nav-item-icon h-4.5 w-4.5 shrink-0", active ? "text-[var(--accent)]" : "text-[var(--ink-faint)]")} />
                <span className={cn("transition-opacity duration-150", compact && "hidden")}>{label}</span>
              </Link>
            );
          })}
        </React.Fragment>
      ))}
    </nav>
  );

  const aside = (compact: boolean) => (
    <>
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="brand-mark grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[var(--accent)] text-[15px] font-black text-white shadow-md">
          AA
        </span>
        <span className={cn("min-w-0 transition-opacity duration-150", compact && "hidden")}>
          <span className="font-display block truncate text-[16px] font-bold leading-tight text-[var(--ink)]">AAHBank</span>
          <span className="block truncate text-[11px] font-semibold text-[var(--ink-faint)]">StudyBank</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">{links(compact)}</div>

      {/* Bottom section: identity + palette + settings (SAT Nexus pattern) */}
      <div className="border-t border-[var(--line-soft)] p-3">
        <div className={cn("glass-subtle flex items-center gap-2.5 px-3 py-2.5", compact && "justify-center px-2")}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-dark)]">
            <UserRound className="h-4 w-4" />
          </span>
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-[var(--ink)]">{name}</span>
              <span className="block truncate text-[11px] text-[var(--ink-faint)]">
                {user.isGuest ? (live ? "Browsing as guest" : "Demo mode · local") : user.email}
              </span>
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            className="nav-link w-full"
            onClick={() => setSettingsOpen(true)}
            title={compact ? "Settings" : undefined}
          >
            <Cog className="nav-item-icon h-4.5 w-4.5 shrink-0 text-[var(--ink-faint)]" />
            <span className={cn(compact && "hidden")}>Settings</span>
          </button>
          {(authEnabled || !user.isGuest) && (
            <button
              type="button"
              className="nav-link w-full"
              onClick={() => void signOut()}
              title={compact ? "Sign out" : undefined}
            >
              <LogOut className="nav-item-icon h-4.5 w-4.5 shrink-0 text-[var(--ink-faint)]" />
              <span className={cn(compact && "hidden")}>{user.isGuest ? "Reset guest" : "Sign out"}</span>
            </button>
          )}
          <button
            type="button"
            className="nav-link w-full"
            onClick={() => {
              setCollapsed((c) => !c);
              updateSettings({});
            }}
            title={compact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {compact ? (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 text-[var(--ink-faint)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 7l5 5-5 5M7 7l5 5-5 5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0 text-[var(--ink-faint)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7l-5 5 5 5M17 7l-5 5 5 5" /></svg>
            )}
            <span className={cn(compact && "hidden")}>Collapse</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className="shell-aside hidden md:flex"
        style={{ "--aside-w": collapsed ? "76px" : "240px" } as React.CSSProperties}
        data-collapsed={collapsed}
      >
        {aside(collapsed)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="shell-aside md:hidden"
              data-mobile-open="true"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: [0.22, 0.8, 0.36, 1] }}
            >
              <button className="absolute right-3 top-3 z-10 btn btn-ghost btn-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
              {aside(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="shell-main" style={{ "--aside-w": collapsed ? "76px" : "240px" } as React.CSSProperties}>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--line)] bg-[var(--paper-raised)]/85 px-4 py-3 backdrop-blur md:hidden">
          <button className="btn btn-soft btn-sm" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
          <span className="font-display text-[16px] font-bold">AAHBank</span>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <Cog className="h-4 w-4" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1080px] px-5 py-6 sm:px-8 sm:py-10">{children}</main>

        <footer className="mx-auto w-full max-w-[1080px] px-5 pb-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--line-soft)] pt-5 text-[12px] text-[var(--ink-faint)]">
            <span className="font-semibold text-[var(--ink-soft)]">AAHBank StudyBank</span>
            <span>·</span>
            <span>Next.js + Supabase + Vercel</span>
            <span>·</span>
            {!live && (
              <span className="soft-tone soft-tone-yellow inline-flex items-center gap-1.5 px-2 py-1 text-[11.5px] font-bold">
                <CircleHelp className="h-3.5 w-3.5" /> Demo mode — see docs/HOSTING.md to go live
              </span>
            )}
          </div>
        </footer>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
