import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware.ts — project root, next to package.json
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * ROUTING CONTRACT
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *   Unauthenticated + /dashboard/*          →  /login?next=<path>
 *   Authenticated, no active subscription   →  https://polywhale-plum.vercel.app/pricing
 *   Authenticated, active sub + /login      →  /dashboard
 *   Everything else                         →  pass through
 *
 * ── Two-layer check ──────────────────────────────────────────────────────────
 *   Layer 1 (here):     fast middleware check — reads profiles row
 *   Layer 2 (pages):    getSubscription() in Server Components as fallback
 *
 * ── Why getUser() not getSession() ───────────────────────────────────────────
 *   getSession() reads local cookie and can be spoofed.
 *   getUser() is an authoritative server-side call to Supabase.
 *
 * ── Cookie forwarding on redirects ───────────────────────────────────────────
 *   Any bare NextResponse.redirect() discards refreshed session cookies,
 *   causing ERR_TOO_MANY_REDIRECTS. We always copy cookies from
 *   supabaseResponse onto every redirect before returning it.
 */

const PRICING_URL = "https://polywhale-plum.vercel.app/pricing";

/** Statuses that grant dashboard access */
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

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

    /* ── Helper: copy session cookies onto any redirect ── */
    function withCookies(redirect: NextResponse): NextResponse {
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirect.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirect;
    }

    /* ── LAYER 1: unauthenticated → login ─────────────────────────────── */
    if (!user && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      return withCookies(NextResponse.redirect(url));
    }

    /* ── LAYER 2: authenticated → check subscription ──────────────────── */
    if (user && pathname.startsWith("/dashboard")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, tier")
        .eq("id", user.id)
        .single();

      const hasAccess =
        profile?.subscription_status &&
        ACTIVE_STATUSES.has(profile.subscription_status) &&
        (profile.tier === "whale_hunter" || profile.tier === "market_maker");

      if (!hasAccess) {
        // Paid subscriber lapsed, cancelled, or never subscribed
        // → send to pricing page on the main site
        return withCookies(NextResponse.redirect(PRICING_URL));
      }
    }

    /* ── BYPASS: authenticated + active sub → away from /login ─────────── */
    if (user && pathname === "/login") {
      // Quick subscription check so non-subscribers don't bounce to dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, tier")
        .eq("id", user.id)
        .single();

      const hasAccess =
        profile?.subscription_status &&
        ACTIVE_STATUSES.has(profile.subscription_status) &&
        (profile.tier === "whale_hunter" || profile.tier === "market_maker");

      const url = request.nextUrl.clone();
      url.search = "";
      url.pathname = hasAccess ? "/dashboard" : "/";
      return withCookies(NextResponse.redirect(url));
    }

  } catch (err) {
    // Env vars missing or Supabase unreachable — fail open, page guards take over
    console.error("[middleware] error — falling through:", err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};