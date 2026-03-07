/**
 * src/app/page.tsx — Dumb entry-point redirect
 *
 * This file has ZERO auth logic and ZERO Supabase imports.
 *
 * It just sends every visitor to /dashboard/clients/new.
 * The middleware intercepts that request and redirects unauthenticated
 * visitors to /login before the dashboard ever renders.
 *
 * Why dumb (no Supabase check here)?
 * ────────────────────────────────────
 * The previous version called createSupabaseServerClient() here.
 * When NEXT_PUBLIC_SUPABASE_URL is undefined (wrong env var names),
 * supabase-js throws "supabaseUrl is required" synchronously, crashing
 * the server component with a 500 before any redirect fires.
 * There was no try/catch, so the crash was unrecoverable at this layer.
 *
 * The middleware already handles all auth routing authoritatively.
 * This page just needs to hand off cleanly.
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard/clients/new");
}