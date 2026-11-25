"use client";

import * as React from "react";

export type AppTheme =
  | "light"
  | "dark"
  | "obsidian"
  | "highlighter"
  | "liquid-glass"
  | "soft-paper"
  | "paper"
  | "cardboard"
  | "maroon";
export type FontScale = "small" | "default" | "large";

export type AppSettings = {
  theme: AppTheme;
  fontScale: FontScale;
  reducedMotion: boolean;
  compactMode: boolean;
  soundEffects: boolean;
  /** Hide yourself from the public leaderboard (device-local). */
  hideMeLocal: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  /** Guests and first-time visitors land on Soft Paper. */
  theme: "soft-paper",
  fontScale: "default",
  reducedMotion: false,
  compactMode: false,
  soundEffects: true,
  hideMeLocal: false,
};

export const THEMES: {
  id: AppTheme;
  name: string;
  description: string;
  swatches: string[];
}[] = [
  { id: "soft-paper", name: "Soft Paper", description: "Warm tactile notebook", swatches: ["#eee6dd", "#69d8cf", "#d19548", "#8a3d18"] },
  { id: "light", name: "Light", description: "Crisp white and navy", swatches: ["#f7f9fc", "#2346a0", "#19a7e0", "#172033"] },
  { id: "dark", name: "Charcoal", description: "Black, white, and quiet grays", swatches: ["#050505", "#161616", "#d0d0d0", "#f5f5f5"] },
  { id: "obsidian", name: "Obsidian", description: "Matte black and amethyst", swatches: ["#08090d", "#171821", "#5a42e8", "#23744a"] },
  { id: "highlighter", name: "Highlighter", description: "Pastel study markers", swatches: ["#fff9df", "#f3b4b8", "#94c8e8", "#b8d2ad"] },
  { id: "liquid-glass", name: "Liquid Glass", description: "Translucent Apple-style depth", swatches: ["#dcecff", "#ffffffaa", "#6699ff", "#9e7bff"] },
  { id: "paper", name: "Paper", description: "Deckled handmade stationery", swatches: ["#f1eadc", "#e8dece", "#67c7be", "#b96d36"] },
  { id: "cardboard", name: "Cardboard", description: "Kraft board, ink and tape", swatches: ["#b88955", "#d1ad7b", "#5b412d", "#e8d3ad"] },
  { id: "maroon", name: "Maroon", description: "Deep crimson and warm dark tones", swatches: ["#3b0a1a", "#4a1522", "#800000", "#f2e0d8"] },
];

const STORAGE_KEY = "aahbank-settings-v1";

type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

function applySettings(settings: AppSettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.fontScale = settings.fontScale;
  root.dataset.density = settings.compactMode ? "compact" : "comfortable";
  root.dataset.reduceMotion = settings.reducedMotion ? "true" : "false";
  root.style.colorScheme = ["dark", "obsidian", "maroon"].includes(settings.theme) ? "dark" : "light";
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
        }
      } catch {
        // Invalid storage falls back to safe defaults.
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    applySettings(settings);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Persistence unavailable — settings stay active for the session.
    }
  }, [settings, ready]);

  // Apply the theme immediately on first paint after hydration.
  React.useEffect(() => {
    if (ready) applySettings(settings);
  }, [settings, ready]);

  // Subtle UI click sounds (WebAudio, no assets) — same approach as SAT Nexus.
  React.useEffect(() => {
    if (!settings.soundEffects) return;
    let audioContext: AudioContext | null = null;
    const playClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("button, a, [role='button'], [role='switch'], [role='option']");
      if (!interactive || interactive.hasAttribute("disabled")) return;
      audioContext ??= new AudioContext();
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(430, now);
      oscillator.frequency.exponentialRampToValueAtTime(560, now + 0.035);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
    };
    window.addEventListener("pointerdown", playClick);
    return () => {
      window.removeEventListener("pointerdown", playClick);
      void audioContext?.close();
      audioContext = null;
    };
  }, [settings.soundEffects]);

  const updateSettings = React.useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = React.useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return (
    <SettingsContext.Provider value={{ settings, ready, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
