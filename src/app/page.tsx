/**
 * src/app/page.tsx — Auth-aware entry router
 *
 * Async Server Component. Zero UI. Routes immediately based on session state.
 *
 * ── Why this is auth-aware (not a dumb redirect) ─────────────────────────────
 * A "dumb" page.tsx that always redirects to /dashboard/clients/new forces
 * every unauthenticated visitor through TWO server-side redirects:
 *
 *   /  →  /dashboard/clients/new  (page.tsx)
 *      →  /login?next=…           (middleware guard)
 *
 * By checking auth state here and routing directly to /login when there is
 * no session, we cut that to ONE redirect and eliminate any chance of this
 * file participating in a loop.
 *
 * ── Why the try/catch is non-negotiable ──────────────────────────────────────
 * If NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined
 * in Vercel, createSupabaseServerClient() throws "supabaseUrl is required"
 * synchronously — before any await.  Without a try/catch this crashes the
 * Server Component with a 500.  The catch sends the visitor to /login so the
 * page always renders something useful.
 *
 * ── Route map ────────────────────────────────────────────────────────────────
 *   Env-var error   →  /login   (safe fallback — middleware will guard from there)
 *   No session      →  /login
 *   Has session     →  /dashboard/clients/new
 */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export default async function RootPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard/clients/new");
    }
  } catch {
    // Env vars missing or Supabase unreachable — send to login.
    // The middleware will guard from there independently.
  }

  redirect("/login");
}