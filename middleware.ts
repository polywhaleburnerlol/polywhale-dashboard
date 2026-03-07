import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts  (lives at the project root, next to package.json)
 *
 * Responsibilities
 * ────────────────
 * 1. REFRESH the Supabase session on every request.
 *    @supabase/ssr stores the session in cookies.  The access token expires
 *    after one hour, but the SDK will silently swap it for a fresh one using
 *    the refresh token — but only if something actually calls getUser().
 *    The middleware is the right place to do this so every page load gets a
 *    valid session without the user noticing any interruption.
 *
 * 2. PROTECT /dashboard routes.
 *    If getUser() returns null (no session / expired session that couldn't
 *    be refreshed) and the request is for a dashboard route, redirect
 *    immediately to /login.
 *
 * 3. REDIRECT authenticated users away from /login.
 *    If a logged-in user navigates to /login, send them to /dashboard so
 *    they don't see the login form while already authenticated.
 *
 * Why getUser() instead of getSession()?
 * ───────────────────────────────────────
 * getSession() returns the local cookie value, which could be spoofed.
 * getUser() makes a lightweight server-side call to Supabase to validate
 * the token — this is the Supabase-recommended approach for middleware.
 */
export async function middleware(request: NextRequest) {
  // Start with a plain passthrough response that we'll mutate as needed
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request (for this middleware chain)
          // and the response (for the browser).
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

  // ── Validate the session (also refreshes it if expired) ──────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Guard: unauthenticated user hitting /dashboard/* ─────────────────────
  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Preserve the intended destination so the login page can redirect back
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Convenience: authenticated user hitting /login → send to dashboard ───
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  // ── Pass through — return the response with refreshed session cookies ────
  return supabaseResponse;
}

/**
 * Matcher: run middleware on all routes EXCEPT:
 *  - Next.js internals (_next/static, _next/image)
 *  - Favicon and other static files in /public
 *
 * This broad matcher is intentional — the session refresh needs to run on
 * every page so tokens are always fresh when server components call getUser().
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};