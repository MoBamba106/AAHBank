import { createBrowserClient } from "@supabase/ssr";

/**
 * True when the Supabase environment variables are present.
 * When false, the app runs in offline Demo Mode (localStorage-backed).
 * NEXT_PUBLIC_* vars are inlined at build time, so this works on the
 * server and in the browser.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Singleton Supabase browser client (auth + realtime auth state). */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return browserClient;
}
