/**
 * src/app/page.tsx — Auth-aware entry router
 *
 * This is a pure async Server Component with zero UI.  Every request to "/"
 * is immediately routed based on the caller's auth state.
 *
 * ── Why this file exists ─────────────────────────────────────────────────────
 * The old landing page had <Link href="/dashboard/..."> buttons that sent
 * unauthenticated visitors straight to guarded routes.  The middleware then
 * bounced them to /login, the login page bounced back to /dashboard, and the
 * loop began.  Replacing the landing page with a single auth-check + redirect
 * eliminates that entry point entirely.
 *
 * ── Route map ────────────────────────────────────────────────────────────────
 *   No session  →  /login
 *   Has session →  /dashboard/clients/new
 *
 * Note: the middleware independently guards every /dashboard/* request, so
 * even if a user bookmarks a dashboard URL and their session has expired they
 * will be redirected to /login by the middleware, not by this file.
 */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/dashboard/clients/new");
}