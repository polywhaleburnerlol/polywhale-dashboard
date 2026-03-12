import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts — project root, next to package.json
 *
 * ── Routing contract ─────────────────────────────────────────────────────────
 *   Unauthenticated + /dashboard/*  →  /login?next=<path>
 *   Authenticated   + /login        →  /dashboard
 *   Everything else                 →  pass through
 *
 * Subscription enforcement is handled in layout.tsx, NOT here.
 * Querying the profiles table in middleware with the anon key gets blocked
 * by RLS and causes ERR_TOO_MANY_REDIRECTS.
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

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    function withCookies(redirect: NextResponse): NextResponse {
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirect.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirect;
    }

    // Block unauthenticated access to dashboard
    if (!user && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      return withCookies(NextResponse.redirect(url));
    }

    // Send logged-in users away from /login
    if (user && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return withCookies(NextResponse.redirect(url));
    }

  } catch (err) {
    console.error("[middleware] error — falling through:", err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};