import { createBrowserClient } from "@supabase/ssr";

/**
 * createSupabaseBrowserClient
 *
 * Use this inside Client Components ("use client") that need to interact
 * with Supabase directly in the browser — e.g. real-time subscriptions,
 * client-side session reads, or sign-out buttons.
 *
 * The browser client reads the session from the cookie that the server
 * client and middleware keep up-to-date, so there is no token mismatch.
 *
 * Call this function at the top of a Client Component (not at module level)
 * to avoid creating multiple GoTrueClient instances:
 *
 *   const supabase = createSupabaseBrowserClient();
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}