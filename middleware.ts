import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts  (project root — must sit next to package.json, NOT inside src/)
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 * 1. SESSION REFRESH  — calls getUser() on every matched request so Supabase
 *    silently swaps an expired access token for a fresh one via the refresh
 *    token.  Without this, tokens expire after 1 hour and server components
 *    see a null user even though the browser has a valid refresh token.
 *
 * 2. DASHBOARD GUARD  — if getUser() returns null and the path starts with
 *    /dashboard, redirect to /login (preserving ?next= so the login page can
 *    bounce the user back after they authenticate).
 *
 * 3. LOGIN BYPASS  — if the user IS authenticated and hits /login, redirect
 *    straight to /dashboard/clients/new so they never see the login form
 *    while already logged in.
 *
 * ── Why getUser() not getSession() ───────────────────────────────────────────
 * getSession() reads the local cookie value which could be a replayed or
 * tampered token.  getUser() makes a server-side validation call to Supabase
 * so the result is authoritative.  This is the Supabase-recommended pattern.
 *
 * ── Why the try/catch matters ────────────────────────────────────────────────
 * Middleware runs in the Vercel Edge Runtime.  If NEXT_PUBLIC_SUPABASE_URL or
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined (missing env var), createServerClient
 * throws synchronously when constructing the URL object — before any await.
 * Without a try/catch this becomes MIDDLEWARE_INVOCATION_FAILED (HTTP 500),
 * which is exactly the crash being fixed here.  On error we fall through and
 * let Next.js handle the request normally; the page-level auth checks will
 * still catch unauthenticated users.
 *
 * ── Redirect targets ─────────────────────────────────────────────────────────
 * Authenticated /login  →  /dashboard/clients/new   (NOT /dashboard — that
 *   route has no page.tsx and would 404 inside the layout)
 * Unauthenticated /dashboard/*  →  /login?next=<original path>
 */
export async function middleware(request: NextRequest) {
  // Start with a plain pass-through that we'll replace on redirect
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
            // Mirror refreshed cookies onto both the request (for this chain)
            // and the response (so the browser gets updated tokens).
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Validate + refresh the session.  Never use getSession() here.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // ── Guard: unauthenticated request for any /dashboard/* page ─────────────
    if (!user && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", pathname);   // restore after login
      return NextResponse.redirect(url);
    }

    // ── Bypass: authenticated user should never see /login again ─────────────
    if (user && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/clients/new";  // first real page
      url.search = "";
      return NextResponse.redirect(url);
    }

  } catch (err) {
    // Env vars missing or Supabase unreachable — fail open so the site doesn't
    // hard-crash.  Individual pages still run their own auth checks.
    console.error("[middleware] Supabase error — falling through:", err);
  }

  return supabaseResponse;
}

/**
 * Matcher — which paths trigger this middleware.
 *
 * Excluded (never run middleware on these):
 *   _next/static  — compiled JS/CSS assets
 *   _next/image   — Next.js image optimisation endpoint
 *   favicon.ico   — browser auto-request
 *   *.svg/png/…   — public static assets
 *
 * Everything else is included so the session refresh runs on every HTML page
 * and API route, keeping tokens fresh for all server components.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};