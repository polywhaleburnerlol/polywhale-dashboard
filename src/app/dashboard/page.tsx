"use client";

/**
 * src/app/dashboard/page.tsx — Overview (landing) page
 *
 * Renders KPI cards, a 30-day portfolio chart, active wallets, and a
 * recent-activity feed — all using mock data.
 *
 * Client Component because recharts + lucide-react need the browser.
 * The dashboard layout (sidebar, topbar, PolygonMeshBackground) wraps this
 * automatically — we only emit the <main> content here.
 */

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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
} from "lucide-react";

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

/* ─── Mock data ───────────────────────────────────────────────────────────── */

const KPI = [
  {
    label: "Total Balance",
    value: "$4,250.00",
    sub: "USDC",
    change: "+$320",
    up: true,
    icon: Wallet,
    color: C.accent,
  },
  {
    label: "Win Rate",
    value: "68.4%",
    sub: "Last 30 days",
    change: "+2.1%",
    up: true,
    icon: TrendingUp,
    color: C.green,
  },
  {
    label: "Mirrored Trades",
    value: "142",
    sub: "Lifetime",
    change: "+18 this week",
    up: true,
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

function generateChartData() {
  const pts: { day: string; value: number }[] = [];
  let v = 3800;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    v += (Math.random() - 0.38) * 80;
    v = Math.max(3400, Math.min(4500, v));
    pts.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(v * 100) / 100,
    });
  }
  // ensure it ends near 4250
  pts[pts.length - 1].value = 4250;
  return pts;
}

const WALLETS = [
  { nick: "Main Whale", addr: "0x7a3F…e91B", balance: "$3,100.00" },
  { nick: "Test Wallet", addr: "0xd42C…8f0A", balance: "$1,150.00" },
];

const TRADES = [
  {
    market: "Will BTC hit $120k by June?",
    action: "Bought YES",
    amount: "$25.00",
    status: "Active",
    pnl: "+$8.40",
    pnlUp: true,
    time: "12 min ago",
  },
  {
    market: "Fed rate cut in Q2 2026?",
    action: "Bought NO",
    amount: "$15.00",
    status: "Active",
    pnl: "+$3.20",
    pnlUp: true,
    time: "1 hr ago",
  },
  {
    market: "ETH merge V2 by April?",
    action: "Bought YES",
    amount: "$20.00",
    status: "Resolved",
    pnl: "+$14.00",
    pnlUp: true,
    time: "3 hrs ago",
  },
  {
    market: "Trump tariffs on EU by March?",
    action: "Bought YES",
    amount: "$10.00",
    status: "Resolved",
    pnl: "−$10.00",
    pnlUp: false,
    time: "5 hrs ago",
  },
  {
    market: "Solana ETF approved 2026?",
    action: "Bought YES",
    amount: "$30.00",
    status: "Active",
    pnl: "+$6.70",
    pnlUp: true,
    time: "8 hrs ago",
  },
];

/* ─── Custom recharts tooltip ─────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        ...glass({ borderRadius: 10, padding: "10px 14px" }),
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
      }}
    >
      <p style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.accent, fontFamily: "'DM Sans', sans-serif" }}>
        ${payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PAGE COMPONENT                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardOverviewPage() {
  const chartData = useMemo(() => generateChartData(), []);

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
        {/* Chart card */}
        <div style={glass({ padding: "22px 22px 14px" })}>
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
                Portfolio Performance
              </h2>
              <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
                30-day balance curve
              </p>
            </div>
            <div
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                color: C.green,
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.15)",
              }}
            >
              +11.8% this month
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: C.textMuted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: C.textMuted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={["dataMin - 100", "dataMax + 100"]}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              />
              <RechartsTooltip content={<ChartTooltip />} cursor={{ stroke: C.accent, strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={C.accent}
                strokeWidth={2.2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: C.accent,
                  stroke: C.bg,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active Wallets card */}
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
              {WALLETS.length} connected
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {WALLETS.map((w) => (
              <div
                key={w.addr}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid rgba(255,255,255,0.05)`,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = C.glassBorderHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary }}>
                    {w.nick}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.accent }}>
                    {w.balance}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code
                    style={{
                      fontSize: 11.5,
                      color: C.textMuted,
                      fontFamily: "'Geist Mono', monospace",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {w.addr}
                  </code>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      padding: 2,
                      cursor: "pointer",
                      color: C.textMuted,
                      transition: "color 0.15s",
                    }}
                    title="Copy address"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.accent;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
                    }}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      padding: 2,
                      cursor: "pointer",
                      color: C.textMuted,
                      transition: "color 0.15s",
                    }}
                    title="View on Polygonscan"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.accent;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
                    }}
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Manage wallets link */}
          <button
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
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget as HTMLButtonElement;
              t.style.borderColor = C.glassBorderHover;
              t.style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget as HTMLButtonElement;
              t.style.borderColor = C.glassBorder;
              t.style.color = C.textSecondary;
            }}
          >
            Manage Wallets
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Bottom row: Recent Activity ──────────────────────────────── */}
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
          <button
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
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget as HTMLButtonElement;
              t.style.borderColor = C.glassBorderHover;
              t.style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget as HTMLButtonElement;
              t.style.borderColor = C.glassBorder;
              t.style.color = C.textSecondary;
            }}
          >
            View All
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Market", "Action", "Amount", "Status", "PnL", "Time"].map((h) => (
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
                      borderBottom: `1px solid rgba(255,255,255,0.04)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRADES.map((t, i) => (
                <tr
                  key={i}
                  style={{ transition: "background 0.15s", cursor: "default" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
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
                      borderBottom: `1px solid rgba(255,255,255,0.03)`,
                    }}
                  >
                    {t.market}
                  </td>
                  <td
                    style={{
                      padding: "14px 14px 14px 0",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: t.action.includes("YES") ? C.green : C.red,
                      borderBottom: `1px solid rgba(255,255,255,0.03)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.action}
                  </td>
                  <td
                    style={{
                      padding: "14px 14px 14px 0",
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.textPrimary,
                      borderBottom: `1px solid rgba(255,255,255,0.03)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.amount}
                  </td>
                  <td
                    style={{
                      padding: "14px 14px 14px 0",
                      borderBottom: `1px solid rgba(255,255,255,0.03)`,
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
                        ...(t.status === "Active"
                          ? {
                              background: `${C.accent}10`,
                              color: C.accent,
                              border: `1px solid ${C.accent}20`,
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              color: C.textSecondary,
                              border: "1px solid rgba(255,255,255,0.06)",
                            }),
                      }}
                    >
                      {t.status === "Active" && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: C.accent,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {t.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 14px 14px 0",
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.pnlUp ? C.green : C.red,
                      borderBottom: `1px solid rgba(255,255,255,0.03)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      {t.pnlUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {t.pnl}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 0 14px 0",
                      fontSize: 12,
                      color: C.textMuted,
                      borderBottom: `1px solid rgba(255,255,255,0.03)`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Responsive overrides ─────────────────────────────────────── */}
      <style>{`
        @media (max-width: 1024px) {
          /* stack KPI to 2×2 */
          section > div:nth-child(2) { grid-template-columns: repeat(2, 1fr) !important; }
          /* stack chart + wallets */
          section > div:nth-child(3) { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          /* single column KPIs */
          section > div:nth-child(2) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}