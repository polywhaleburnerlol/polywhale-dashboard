import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts  — project root, next to package.json
 *
 * ── What this does ───────────────────────────────────────────────────────────
 * 1. SESSION REFRESH — calls getUser() on every matched request so Supabase
 *    silently rotates an expired access token using the refresh token stored
 *    in cookies.  Without this, tokens expire after 1 h and server components
 *    see null even though the browser has a valid refresh token.
 *
 * 2. DASHBOARD GUARD — if no authenticated user and path starts with
 *    /dashboard, redirect to /login (with ?next= so we can return afterwards).
 *
 * 3. LOGIN BYPASS — if the user IS authenticated and hits /login, redirect to
 *    /dashboard/clients/new immediately so they never see the login form.
 *
 * ── Why the try/catch is critical ────────────────────────────────────────────
 * Middleware runs in the Vercel Edge Runtime. If either
 *   NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY
 * is undefined (wrong or missing env var), supabase-js throws synchronously
 * with "supabaseUrl is required" before any network call happens.
 * Without a try/catch this becomes MIDDLEWARE_INVOCATION_FAILED (HTTP 500).
 * The catch block falls through so the site stays up; individual pages will
 * still redirect to /login via their own checks.
 *
 * ── Redirect targets ─────────────────────────────────────────────────────────
 * Authenticated /login      →  /dashboard/clients/new
 *   (NOT /dashboard — that route has no page.tsx and triggers a 404 in layout)
 * Unauthed /dashboard/*     →  /login?next=<original-path>
 */
export async function middleware(request: NextRequest) {
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

    // Always use getUser() — never getSession() — for authoritative validation.
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Guard: unauthenticated user trying to reach any /dashboard route
    if (!user && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search   = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Bypass: logged-in user should never see /login
    if (user && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/clients/new";
      url.search   = "";
      return NextResponse.redirect(url);
    }

  } catch (err) {
    // Env vars missing / Supabase unreachable — fail open.
    // The site stays up; page-level guards still protect individual routes.
    console.error("[middleware] Supabase error, falling through:", err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};