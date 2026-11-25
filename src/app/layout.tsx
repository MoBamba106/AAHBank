import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/components/settings-provider";
import { AuthProvider } from "@/components/auth-provider";
import { NavShell } from "@/components/nav-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AAHBank · StudyBank", template: "%s · AAHBank" },
  description: "Class question bank: scan questions in with OCR, build quizzes, track analytics, and climb the leaderboard.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="soft-paper" data-font-scale="default" suppressHydrationWarning>
      <body>
        <SettingsProvider>
          <AuthProvider>
            <NavShell>{children}</NavShell>
          </AuthProvider>
        </SettingsProvider>
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
