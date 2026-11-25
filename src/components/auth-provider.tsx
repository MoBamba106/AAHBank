"use client";

import * as React from "react";
import type { AuthUser } from "@/lib/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { demoStore } from "@/lib/demo-store";
import { mutateKey } from "@/lib/api-client";

type AuthContextValue = {
  user: AuthUser;
  ready: boolean;
  /** True when Supabase env vars are configured (live mode). */
  authEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setGuestName: (name: string) => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function makeGuestUser(): AuthUser {
  return { id: "local-guest", email: null, displayName: null, isGuest: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authEnabled = isSupabaseConfigured();
  const [user, setUser] = React.useState<AuthUser>(makeGuestUser);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!authEnabled) {
      // Demo mode: local guest with a device-local display name.
      demoStore.ensureSeeded();
      setUser({ ...makeGuestUser(), displayName: demoStore.getName() });
      setReady(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const applySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const meta = (session.user.user_metadata ?? {}) as { display_name?: string; full_name?: string };
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
          displayName: meta.display_name ?? meta.full_name ?? null,
          isGuest: false,
        });
      } else {
        setUser(makeGuestUser());
      }
      setReady(true);
    };

    void applySession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void applySession();
    });
    return () => subscription.unsubscribe();
  }, [authEnabled]);

  const refreshCaches = () => {
    mutateKey("leaderboard");
    mutateKey("stats");
    mutateKey("home");
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    refreshCaches();
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new Error(error.message);
    // If email confirmation is required the session is null — the UI explains this.
    refreshCaches();
  };

  const signOut = async () => {
    if (authEnabled) {
      await getSupabaseBrowserClient().auth.signOut();
      refreshCaches();
    }
    setUser(makeGuestUser());
  };

  const setGuestName = (name: string) => {
    demoStore.setName(name);
    setUser((u) => ({ ...u, displayName: name }));
    mutateKey("leaderboard");
  };

  return (
    <AuthContext.Provider value={{ user, ready, authEnabled, signIn, signUp, signOut, setGuestName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
