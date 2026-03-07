"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true }
  | { success: false; error: string };

// ── signIn ─────────────────────────────────────────────────────────────────

/**
 * Authenticate with email + password.
 *
 * On success the Supabase SDK automatically writes the session cookies via
 * the server client's cookie handler, so the middleware will find a valid
 * session on the very next request.
 *
 * On failure a typed error is returned so the login page can display it
 * inline without a full page reload.
 *
 * The optional `next` param allows the login form to redirect back to the
 * page the user originally tried to visit (set by middleware as ?next=...).
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const email    = (formData.get("email")    as string | null)?.trim()    ?? "";
  const password = (formData.get("password") as string | null)            ?? "";
  const next     = (formData.get("next")     as string | null)?.trim()    ?? "/dashboard";

  // ── Basic validation ────────────────────────────────────────────────────
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // ── Supabase auth call ──────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Map Supabase error codes to user-friendly messages
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

  // ── Redirect after successful sign-in ───────────────────────────────────
  // `redirect()` throws internally — must be called outside try/catch.
  // Sanitise `next` to only allow relative paths (prevent open-redirect).
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  redirect(safeNext);
}

// ── signOut ────────────────────────────────────────────────────────────────

/**
 * Sign the current user out and redirect to /login.
 * Designed to be called from a Server Action button in any dashboard page.
 */
export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}