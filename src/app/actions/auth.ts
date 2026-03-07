"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export type AuthResult =
  | { success: true }
  | { success: false; error: string };

/**
 * signIn — authenticate with email + password.
 *
 * On success the Supabase SDK writes the session cookie via the server
 * client's cookie handler, so middleware finds a valid session on the
 * very next request.
 *
 * The `next` param lets the login form bounce back to the page the user
 * originally tried to visit (set as ?next= by the middleware guard).
 *
 * CRITICAL: the default fallback is /dashboard/clients/new — NOT /dashboard.
 * /dashboard has no page.tsx; redirecting there creates a 404-in-layout
 * which is one of the triggers for ERR_TOO_MANY_REDIRECTS.
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const email    = (formData.get("email")    as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null)         ?? "";
  const next     = (formData.get("next")     as string | null)?.trim() ?? "/dashboard/clients/new";

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid login") ||
      error.message.toLowerCase().includes("invalid credentials") ||
      error.message.toLowerCase().includes("email not confirmed")
    ) {
      return { success: false, error: "Incorrect email or password." };
    }
    if (error.message.toLowerCase().includes("rate limit")) {
      return { success: false, error: "Too many attempts. Please wait a moment and try again." };
    }
    return { success: false, error: error.message };
  }

  // Sanitise `next` — only allow relative paths (prevent open-redirect attacks).
  // Default to /dashboard/clients/new, NOT /dashboard (no page.tsx there).
  const safeNext =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard/clients/new";

  redirect(safeNext);
}

export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}