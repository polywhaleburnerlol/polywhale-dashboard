import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * createSupabaseServerClient
 *
 * Use this inside:
 *   - Server Components  (RSC, layout.tsx, page.tsx)
 *   - Server Actions     (files marked "use server")
 *   - Route Handlers     (app/api/*)
 *
 * It reads and writes cookies through Next.js' `cookies()` API so that
 * the Supabase session token is stored in an HttpOnly cookie and never
 * exposed to client-side JavaScript.
 *
 * @param cookieStore   Pass `await cookies()` from your calling context.
 *                      Passing it in (rather than calling `cookies()` here)
 *                      keeps this function usable in both sync and async
 *                      contexts and makes it easier to test.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component — safe to ignore.
            // The middleware will refresh the session instead.
          }
        },
      },
    }
  );
}