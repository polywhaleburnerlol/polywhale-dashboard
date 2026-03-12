/**
 * src/lib/subscription.ts
 *
 * Server-side utility to check a user's subscription status.
 * Use this in Server Components and Server Actions as a second
 * layer of defence (middleware is the first).
 */

import { createClient } from "@supabase/supabase-js";

export type SubscriptionStatus =
  | { active: true;  tier: "whale_hunter" | "market_maker"; status: string }
  | { active: false; tier: null; status: string | null };

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Returns the subscription state for a given Supabase user ID.
 * "active" is true only for status = active | trialing.
 * past_due users lose access — they need to update their payment method.
 */
export async function getSubscription(userId: string): Promise<SubscriptionStatus> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("tier, subscription_status")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { active: false, tier: null, status: null };
  }

  const isActive =
    data.subscription_status === "active" ||
    data.subscription_status === "trialing";

  if (isActive && (data.tier === "whale_hunter" || data.tier === "market_maker")) {
    return { active: true, tier: data.tier, status: data.subscription_status };
  }

  return { active: false, tier: null, status: data.subscription_status ?? null };
}