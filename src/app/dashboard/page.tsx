/**
 * src/app/dashboard/page.tsx — DIAGNOSTIC BUILD
 *
 * This temporary page renders debug information directly on screen
 * so you can see exactly what's failing without needing Vercel logs.
 *
 * REPLACE with the real page once the diagnosis is complete.
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../utils/supabase/server";

export default async function DashboardOverviewPage() {
  const checks: { step: string; status: string; detail: string }[] = [];

  /* ── 1. Environment variables ────────────────────────────────────────────── */
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  checks.push({
    step: "NEXT_PUBLIC_SUPABASE_URL",
    status: hasUrl ? "OK" : "MISSING",
    detail: hasUrl
      ? process.env.NEXT_PUBLIC_SUPABASE_URL!.slice(0, 30) + "…"
      : "Not set in environment",
  });

  checks.push({
    step: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    status: hasAnon ? "OK" : "MISSING",
    detail: hasAnon ? "Present (hidden)" : "Not set in environment",
  });

  /* ── 2. Supabase client creation ─────────────────────────────────────────── */
  let supabase: any = null;
  try {
    supabase = await createSupabaseServerClient();
    checks.push({
      step: "createSupabaseServerClient()",
      status: "OK",
      detail: "Client created successfully",
    });
  } catch (err: any) {
    checks.push({
      step: "createSupabaseServerClient()",
      status: "CRASHED",
      detail: err?.message ?? String(err),
    });
  }

  /* ── 3. Clients query ────────────────────────────────────────────────────── */
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, funder_address, trade_amount_usd, is_active")
        .limit(5);

      if (error) {
        checks.push({
          step: "SELECT clients",
          status: "DB ERROR",
          detail: `${error.message} | ${error.details ?? ""} | ${error.hint ?? ""}`,
        });
      } else {
        checks.push({
          step: "SELECT clients",
          status: "OK",
          detail: `${(data ?? []).length} rows returned`,
        });
      }
    } catch (err: any) {
      checks.push({
        step: "SELECT clients",
        status: "THREW",
        detail: err?.message ?? String(err),
      });
    }
  }

  /* ── 4. Trades query ─────────────────────────────────────────────────────── */
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("id, created_at, client_id, market_title, side, price, shares")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        checks.push({
          step: "SELECT trades",
          status: "DB ERROR",
          detail: `${error.message} | ${error.details ?? ""} | ${error.hint ?? ""}`,
        });
      } else {
        checks.push({
          step: "SELECT trades",
          status: "OK",
          detail: `${(data ?? []).length} rows returned`,
        });
      }
    } catch (err: any) {
      checks.push({
        step: "SELECT trades",
        status: "THREW",
        detail: err?.message ?? String(err),
      });
    }
  }

  /* ── 5. Trades count ─────────────────────────────────────────────────────── */
  if (supabase) {
    try {
      const { count, error } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true });

      if (error) {
        checks.push({
          step: "COUNT trades",
          status: "DB ERROR",
          detail: `${error.message} | ${error.details ?? ""} | ${error.hint ?? ""}`,
        });
      } else {
        checks.push({
          step: "COUNT trades",
          status: "OK",
          detail: `count = ${count}`,
        });
      }
    } catch (err: any) {
      checks.push({
        step: "COUNT trades",
        status: "THREW",
        detail: err?.message ?? String(err),
      });
    }
  }

  /* ── Render results on screen ────────────────────────────────────────────── */
  const allOk = checks.every((c) => c.status === "OK");

  return (
    <div style={{ padding: 40, color: "white", fontFamily: "monospace", maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8, color: allOk ? "#34d399" : "#f87171" }}>
        Dashboard Diagnostic {allOk ? "— ALL CHECKS PASSED" : "— ISSUES FOUND"}
      </h1>
      <p style={{ color: "#8492a6", fontSize: 13, marginBottom: 24 }}>
        Replace this file with the real page.tsx once all checks pass.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Step", "Status", "Detail"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: 11,
                  color: "#3d4d63",
                  borderBottom: "1px solid #1a2035",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {checks.map((c, i) => (
            <tr key={i}>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#f0f4f8", borderBottom: "1px solid #0d1525" }}>
                {c.step}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderBottom: "1px solid #0d1525",
                  color:
                    c.status === "OK"
                      ? "#34d399"
                      : c.status === "MISSING" || c.status === "CRASHED" || c.status === "THREW"
                      ? "#f87171"
                      : "#fbbf24",
                }}
              >
                {c.status}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 12, color: "#8492a6", borderBottom: "1px solid #0d1525", wordBreak: "break-all" }}>
                {c.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}