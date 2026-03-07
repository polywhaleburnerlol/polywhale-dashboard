import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts  — project root, next to package.json
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * ROOT CAUSE ANALYSIS — ERR_TOO_MANY_REDIRECTS
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * There were two structural bugs that combined to create the loop:
 *
 * BUG 1 — Refreshed session cookies were discarded on every redirect.
 * ─────────────────────────────────────────────────────────────────────────────
 * When Supabase refreshes an expiring access token, the SDK calls setAll()
 * to write the new token pair back to the browser.  setAll() writes those
 * cookies to `supabaseResponse`.
 *
 * The previous code returned bare NextResponse.redirect(url) objects for both
 * the dashboard guard and the login bypass.  These are BRAND NEW responses
 * with no cookies — the refreshed tokens sitting on `supabaseResponse` were
 * silently thrown away on every redirect.
 *
 * On the very next request the browser still sent the old, expired token.
 * Supabase couldn't refresh it again (it was already consumed), getUser()
 * returned null, and the guard fired again → infinite loop.
 *
 * FIX: Before returning any redirect, copy every cookie from `supabaseResponse`
 * onto the redirect response so the browser always receives updated tokens.
 *
 * BUG 2 — MIDDLEWARE_INVOCATION_FAILED when env vars are undefined.
 * ─────────────────────────────────────────────────────────────────────────────
 * createServerClient(undefined, undefined) throws "supabaseUrl is required"
 * synchronously in the Edge Runtime, producing a 500 before any await.
 * The try/catch prevents this from crashing the site; it falls through and
 * lets Next.js serve the page normally.  Individual pages still protect routes.
 *
 * ── Routing contract (single source of truth) ────────────────────────────────
 *   Unauthed + /dashboard/*  →  /login?next=<original-path>
 *   Authed   + /login        →  /dashboard/clients/new
 *   Everything else          →  pass through unchanged
 *
 * ── Why getUser() not getSession() ───────────────────────────────────────────
 * getSession() reads the local cookie — it can be spoofed or stale.
 * getUser() makes a server-side call to Supabase and is authoritative.
 */

export async function middleware(request: NextRequest) {
  // Start with a plain pass-through.  setAll() will replace this with a
  // response that carries the refreshed cookie headers.
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // 1. Write the new tokens into the ongoing request so the rest of
            //    this middleware chain sees them.
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // 2. Replace supabaseResponse with a fresh one built from the
            //    updated request, then stamp all the new cookie headers on it.
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Authoritative session check.  Never call getSession() in middleware.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // ── GUARD: block unauthenticated requests to /dashboard/* ────────────────
    if (!user && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search   = "";
      url.searchParams.set("next", pathname);

      const redirectResponse = NextResponse.redirect(url);

      // *** THE CRITICAL FIX ***
      // Copy every cookie from supabaseResponse onto the redirect so that any
      // tokens Supabase just refreshed reach the browser.  Without this, the
      // refreshed tokens are lost, the browser resends the expired token on
      // the next request, getUser() returns null again, and the guard fires
      // forever — ERR_TOO_MANY_REDIRECTS.
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      return redirectResponse;
    }

    // ── BYPASS: send authenticated users away from /login ────────────────────
    if (user && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/clients/new";
      url.search   = "";

      const redirectResponse = NextResponse.redirect(url);

      // Same fix — forward any refreshed cookies onto this redirect too.
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      return redirectResponse;
    }

  } catch (err) {
    // Env vars missing or Supabase unreachable.
    // Fail open: the site stays up.  Page-level guards still protect routes.
    console.error("[middleware] Supabase error — falling through:", err);
  }

  // Pass through with refreshed session cookies intact.
  return supabaseResponse;
}

/**
 * Matcher — run on every path except Next.js internals and static assets.
 * The broad match is intentional: the session refresh must run on every
 * HTML request so server components always see a valid, current token.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};