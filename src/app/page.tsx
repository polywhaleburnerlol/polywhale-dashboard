/**
 * src/app/page.tsx  — Smart Auth Router
 *
 * This is an async Server Component, not a landing page.
 * It runs on every request to "/" and immediately routes the user based
 * on their auth state, eliminating the redirect loop.
 *
 * Flow
 * ────
 *  No session  →  redirect("/login")
 *  Has session →  redirect("/dashboard/clients/new")
 *
 * Why this stops the loop
 * ───────────────────────
 * The previous page.tsx was a static marketing page with <Link> tags that
 * pointed unauthenticated users straight to /dashboard — which the middleware
 * then redirected back to /login — which (if a stale session cookie existed)
 * redirected back to /dashboard — loop.
 *
 * Now "/" is the single source of truth for entry routing:
 *   - Unauthenticated:  /  →  /login            (no middleware bounce needed)
 *   - Authenticated:    /  →  /dashboard/clients/new  (straight to the app)
 *
 * The middleware still guards /dashboard/* independently, so even if someone
 * navigates directly to a dashboard URL while logged out they are protected.
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