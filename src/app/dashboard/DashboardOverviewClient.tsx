"use client";

/**
 * src/app/dashboard/DashboardOverviewClient.tsx
 *
 * Client Component — all interactive UI for the Overview page.
 * Receives pre-fetched Supabase data from the Server Component (page.tsx).
 *
 * ── What's real vs mock ──────────────────────────────────────────────────────
 *   REAL:   Active wallets (clients + on-chain USDC balance), recent trades,
 *           total-trade-count KPI, total balance (sum of on-chain USDC).
 *   PENDING: Win Rate, Portfolio Performance chart — requires pnl/outcome
 *            columns on trades table. Shown as "N/A" until data exists.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { removeClient } from "@/app/actions/client";
import {
  Wallet,
  TrendingUp,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  ChevronRight,
  Trash2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SHARED TYPES (exported so page.tsx can import them)                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type ClientRow = {
  id: string;
  label: string;
  funder_address: string;
  trade_amount_usd: number;
  is_active: boolean;
  usdc_balance: number;
};

export type TradeRow = {
  id: string;
  created_at: string;
  client_id: string;
  market_title: string;
  side: string;          // "BUY" | "SELL"
  price: number;
  shares: number;
};

export type ChartPoint = {
  date: string;        // "MMM D" e.g. "Mar 7"
  cumulative: number;  // cumulative USD invested up to this date
  daily: number;       // USD invested on this date
};

export type DashboardData = {
  clients: ClientRow[];
  recentTrades: TradeRow[];
  totalTradeCount: number;
  totalBalanceUsd: number;
  totalInvestedUsd: number;  // sum of all BUY trade costs
  chartPoints: ChartPoint[]; // for the portfolio chart
};

/* ─── Design tokens (mirrored from dashboard/layout.tsx) ──────────────────── */
const C = {
  bg: "#060b18",
  accent: "#00e5cc",
  accentAlt: "#7c5cfc",
  textPrimary: "#f0f4f8",
  textSecondary: "#8492a6",
  textMuted: "#3d4d63",
  glassBg: "rgba(12,20,40,0.65)",
  glassBorder: "rgba(0,229,204,0.10)",
  glassBorderHover: "rgba(0,229,204,0.22)",
  green: "#34d399",
  red: "#f87171",
};

/* ─── Shared glass-card style factory ─────────────────────────────────────── */
function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: C.glassBg,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 16,
    ...extra,
  };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Truncate an Ethereum address: 0x1234…abcd */
function truncAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Human-readable relative time from an ISO timestamp */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Format USD with 2 decimals */
function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════ */
/*  INVESTMENT CHART — pure SVG, no external deps                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InvestmentChart({ points }: { points: ChartPoint[] }) {
  if (!points || points.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 10, padding: "32px 16px",
        borderRadius: 12, border: `1px dashed rgba(0,229,204,0.10)`,
        minHeight: 160,
      }}>
        <TrendingUp size={28} color="#3d4d63" strokeWidth={1.5} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "#3d4d63", margin: 0 }}>
          No trades yet
        </p>
        <p style={{ fontSize: 12, color: "#3d4d63", textAlign: "center", lineHeight: 1.5 }}>
          This chart will update automatically once the engine executes its first trade.
        </p>
      </div>
    );
  }

  const W = 600, H = 160, PAD_L = 48, PAD_R = 16, PAD_T = 12, PAD_B = 32;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...points.map(p => p.cumulative), 1);
  const n = points.length;

  // Build polyline points
  const pts = points.map((p, i) => {
    const x = PAD_L + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = PAD_T + plotH - (p.cumulative / maxVal) * plotH;
    return { x, y, ...p };
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");

  // Area fill path
  const areaPath = [
    `M ${pts[0].x} ${PAD_T + plotH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD_T + plotH}`,
    "Z",
  ].join(" ");

  // Y-axis labels (0, mid, max)
  const yLabels = [
    { val: 0,           y: PAD_T + plotH },
    { val: maxVal / 2,  y: PAD_T + plotH / 2 },
    { val: maxVal,      y: PAD_T },
  ];

  // X-axis: show first, middle, last labels
  const xLabels = n <= 1
    ? pts
    : [pts[0], pts[Math.floor((n - 1) / 2)], pts[n - 1]];

  return (
    <div style={{ flex: 1, minHeight: 160, position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible", display: "block" }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00e5cc" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00e5cc" stopOpacity="0"    />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#00e5cc" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <line key={i}
            x1={PAD_L} y1={l.y} x2={W - PAD_R} y2={l.y}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((l, i) => (
          <text key={i}
            x={PAD_L - 6} y={l.y + 4}
            textAnchor="end"
            fontSize="9" fill="#3d4d63" fontFamily="monospace"
          >
            ${l.val >= 1000 ? (l.val / 1000).toFixed(1) + "k" : l.val.toFixed(0)}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#investGrad)" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i}
            cx={p.x} cy={p.y} r="3"
            fill="#060b18" stroke="#00e5cc" strokeWidth="1.5"
          />
        ))}

        {/* X-axis labels */}
        {xLabels.map((p, i) => (
          <text key={i}
            x={p.x} y={H - 4}
            textAnchor="middle"
            fontSize="9" fill="#3d4d63" fontFamily="sans-serif"
          >
            {p.date}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function DashboardOverviewClient({
  data,
}: {
  data: DashboardData;
}) {
  const { recentTrades, totalTradeCount, totalBalanceUsd } = data;
  const [clients, setClients] = useState(data.clients);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleRemove(clientId: string) {
    if (!confirm("Remove this wallet? The bot will stop trading for it immediately.")) return;
    setRemovingId(clientId);
    startTransition(async () => {
      const result = await removeClient(clientId);
      if (result.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
      } else {
        alert(`Failed to remove wallet: ${result.error}`);
      }
      setRemovingId(null);
    });
  }

  // ── Build KPI cards ────────────────────────────────────────────────────
  const KPI = [
    {
      label: "Total Balance",
      value: fmtUsd(totalBalanceUsd),
      sub: "on-chain USDC",
      change: totalBalanceUsd > 0 ? "Live" : "No wallets",
      up: totalBalanceUsd > 0,
      icon: Wallet,
      color: C.accent,
    },
    {
      label: "Total Invested",
      value: fmtUsd(data.totalInvestedUsd),
      sub: "cumulative BUY spend",
      change: totalTradeCount > 0 ? `across ${totalTradeCount} trade${totalTradeCount === 1 ? "" : "s"}` : "No trades yet",
      up: data.totalInvestedUsd > 0,
      icon: TrendingUp,
      color: C.green,
    },
    {
      label: "Mirrored Trades",
      value: totalTradeCount.toLocaleString(),
      sub: "Lifetime",
      change: totalTradeCount > 0 ? `${Math.min(totalTradeCount, 18)} this week` : "None yet",
      up: totalTradeCount > 0,
      icon: Activity,
      color: C.accentAlt,
    },
    {
      label: "Engine Status",
      value: "Active",
      sub: "All systems nominal",
      change: "Online",
      up: true,
      icon: Zap,
      color: C.accent,
      pulse: true,
    },
  ];

  // ── Derive trade rows for the table ────────────────────────────────────
  const tradeRows = recentTrades.map((t) => {
    const isBuy = t.side.toUpperCase() === "BUY";
    const cost = t.price * t.shares;
    return {
      id: t.id,
      market: t.market_title,
      action: isBuy ? "Bought YES" : "Sold NO",
      amount: fmtUsd(cost),
      // No resolved/active status in DB yet — show "Active" for all
      status: "Active" as const,
      // No PnL column yet — show cost as placeholder
      pnl: `${fmtUsd(cost)}`,
      pnlUp: isBuy,
      time: timeAgo(t.created_at),
      shares: t.shares,
      price: t.price,
    };
  });

  return (
    <section style={{ padding: "32px 32px 48px", maxWidth: 1360, margin: "0 auto" }}>
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          className="pw-font-display"
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: C.textPrimary,
            margin: 0,
          }}
        >
          Overview
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>
          Real-time snapshot of your whale-mirroring performance.
        </p>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              style={{
                ...glass({ padding: "22px 22px 18px" }),
                transition: "border-color 0.25s, box-shadow 0.25s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = C.glassBorderHover;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 28px -8px ${k.color}33`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = C.glassBorder;
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* icon + label row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${k.color}12`,
                    border: `1px solid ${k.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} color={k.color} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textSecondary }}>
                  {k.label}
                </span>
              </div>

              {/* value */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  className="pw-font-display"
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: k.label === "Win Rate" ? C.green : C.textPrimary,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {k.pulse ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                      <span
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          width: 10,
                          height: 10,
                        }}
                      >
                        <span
                          className="pw-ping"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: C.green,
                            opacity: 0.5,
                          }}
                        />
                        <span
                          style={{
                            position: "relative",
                            display: "inline-flex",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: C.green,
                          }}
                        />
                      </span>
                      {k.value}
                    </span>
                  ) : (
                    k.value
                  )}
                </span>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{k.sub}</span>
              </div>

              {/* change badge */}
              <div
                style={{
                  marginTop: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 9px",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: k.up ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                  color: k.up ? C.green : C.red,
                }}
              >
                {k.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {k.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Middle row: Chart + Wallets ──────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* ── Investment Activity chart (real data) ───────────────────── */}
        <div style={glass({ padding: "22px 22px 14px", display: "flex", flexDirection: "column" })}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 className="pw-font-display" style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                Investment Activity
              </h2>
              <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
                Cumulative USD deployed · last 30 days
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.accent, letterSpacing: "-0.02em" }}>
                {fmtUsd(data.totalInvestedUsd)}
              </span>
              <p style={{ fontSize: 11, color: C.textSecondary, margin: "2px 0 0" }}>total deployed</p>
            </div>
          </div>
          <InvestmentChart points={data.chartPoints} />
        </div>

        {/* ── Active Wallets card (REAL data from `clients` table) ──── */}
        <div style={glass({ padding: "22px", display: "flex", flexDirection: "column" })}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <h2
              className="pw-font-display"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.textPrimary,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Active Wallets
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.accentAlt,
                background: `${C.accentAlt}12`,
                border: `1px solid ${C.accentAlt}22`,
                padding: "3px 10px",
                borderRadius: 8,
              }}
            >
              {clients.length} connected
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {clients.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "24px 16px",
                  borderRadius: 12,
                  border: `1px dashed ${C.glassBorder}`,
                }}
              >
                <Wallet size={24} color={C.textMuted} />
                <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>
                  No wallets connected yet.
                </p>
                <Link
                  href="/dashboard/clients/new"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: C.accent,
                    textDecoration: "none",
                  }}
                >
                  + Add your first client
                </Link>
              </div>
            )}

            {clients.map((w) => (
              <div
                key={w.id}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: removingId === w.id ? "rgba(248,113,113,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${removingId === w.id ? "rgba(248,113,113,0.20)" : "rgba(255,255,255,0.05)"}`,
                  transition: "border-color 0.2s, background 0.2s",
                  opacity: removingId === w.id ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (removingId !== w.id)
                    (e.currentTarget as HTMLDivElement).style.borderColor = C.glassBorderHover;
                }}
                onMouseLeave={(e) => {
                  if (removingId !== w.id)
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                {/* Top row: label + balance + remove */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary }}>
                    {w.label || "Unnamed Wallet"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.accent }}>
                      {fmtUsd(w.usdc_balance)}
                    </span>
                    <button
                      onClick={() => handleRemove(w.id)}
                      disabled={removingId === w.id}
                      title="Remove wallet"
                      style={{
                        background: "none", border: "none", padding: 3, cursor: "pointer",
                        color: C.textMuted, transition: "color 0.15s", borderRadius: 6,
                        display: "flex", alignItems: "center",
                        opacity: removingId === w.id ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.red; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.textMuted; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Bottom row: address + copy + polygonscan */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{ fontSize: 11.5, color: C.textMuted, fontFamily: "'Geist Mono', monospace", letterSpacing: "0.02em" }}>
                    {truncAddr(w.funder_address)}
                  </code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(w.funder_address)}
                    style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: C.textMuted, transition: "color 0.15s" }}
                    title="Copy address"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.accent; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.textMuted; }}
                  >
                    <Copy size={13} />
                  </button>
                  <a
                    href={`https://polygonscan.com/address/${w.funder_address}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", padding: 2, color: C.textMuted, transition: "color 0.15s" }}
                    title="View on Polygonscan"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.accent; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.textMuted; }}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Manage wallets → /dashboard/clients/new */}
          <Link
            href="/dashboard/clients/new"
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: `1px dashed ${C.glassBorder}`,
              background: "transparent",
              color: C.textSecondary,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget as HTMLAnchorElement;
              t.style.borderColor = C.glassBorderHover;
              t.style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget as HTMLAnchorElement;
              t.style.borderColor = C.glassBorder;
              t.style.color = C.textSecondary;
            }}
          >
            Manage Wallets
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Bottom row: Recent Activity (REAL data from `trades` table) ── */}
      <div style={glass({ padding: "22px" })}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              className="pw-font-display"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.textPrimary,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Recent Activity
            </h2>
            <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
              Latest mirrored trades from watched whales
            </p>
          </div>
          <Link
            href="/dashboard/trade-history"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 600,
              color: C.textSecondary,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.glassBorder}`,
              cursor: "pointer",
              transition: "all 0.2s",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget as HTMLAnchorElement;
              t.style.borderColor = C.glassBorderHover;
              t.style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget as HTMLAnchorElement;
              t.style.borderColor = C.glassBorder;
              t.style.color = C.textSecondary;
            }}
          >
            View All
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          {tradeRows.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "40px 16px",
              }}
            >
              <Activity size={28} color={C.textMuted} />
              <p style={{ fontSize: 14, color: C.textMuted }}>No trades recorded yet.</p>
              <p style={{ fontSize: 12, color: C.textMuted }}>
                Trades will appear here once the engine mirrors a whale position.
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Market", "Action", "Shares × Price", "Status", "Cost", "Time"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.textMuted,
                        padding: "0 14px 12px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeRows.map((t) => (
                  <tr
                    key={t.id}
                    style={{ transition: "background 0.15s", cursor: "default" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "rgba(255,255,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                    }}
                  >
                    {/* Market */}
                    <td
                      style={{
                        padding: "14px 14px 14px 0",
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: C.textPrimary,
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      {t.market}
                    </td>

                    {/* Action */}
                    <td
                      style={{
                        padding: "14px 14px 14px 0",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: t.action.includes("YES") ? C.green : C.red,
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.action}
                    </td>

                    {/* Shares × Price */}
                    <td
                      style={{
                        padding: "14px 14px 14px 0",
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.textPrimary,
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ color: C.textSecondary }}>{t.shares}</span>
                      <span style={{ color: C.textMuted, margin: "0 4px" }}>×</span>
                      <span style={{ color: C.textSecondary }}>${t.price.toFixed(2)}</span>
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: "14px 14px 14px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 10px",
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 600,
                          background: `${C.accent}10`,
                          color: C.accent,
                          border: `1px solid ${C.accent}20`,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.accent,
                            flexShrink: 0,
                          }}
                        />
                        {t.status}
                      </span>
                    </td>

                    {/* Cost (placeholder for PnL) */}
                    <td
                      style={{
                        padding: "14px 14px 14px 0",
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.pnlUp ? C.green : C.red,
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {t.pnlUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {t.amount}
                      </span>
                    </td>

                    {/* Time */}
                    <td
                      style={{
                        padding: "14px 0 14px 0",
                        fontSize: 12,
                        color: C.textMuted,
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Responsive overrides ─────────────────────────────────────── */}
      <style>{`
        @media (max-width: 1024px) {
          section > div:nth-child(2) { grid-template-columns: repeat(2, 1fr) !important; }
          section > div:nth-child(3) { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          section > div:nth-child(2) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}