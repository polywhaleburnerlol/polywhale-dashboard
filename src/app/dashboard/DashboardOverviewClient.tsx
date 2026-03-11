"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { removeClient } from "@/app/actions/client";
import {
  Wallet, TrendingUp, Activity, Zap,
  ArrowUpRight, ArrowDownRight, Copy, Check,
  ExternalLink, ChevronRight, Trash2, RefreshCw,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

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
  outcome: string;
  side: string;
  price: number;
  shares: number | null;
  trade_amount_usd: number;
};

export type ChartPoint = {
  date: string;
  cumulative: number;
  daily: number;
};

export type DashboardData = {
  clients: ClientRow[];
  recentTrades: TradeRow[];
  totalTradeCount: number;
  totalBalanceUsd: number;
  totalInvestedUsd: number;
  chartPoints: ChartPoint[];
};

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DESIGN TOKENS                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg:               "#060b18",
  accent:           "#00e5cc",
  accentAlt:        "#7c5cfc",
  textPrimary:      "#f0f4f8",
  textSecondary:    "#8492a6",
  textMuted:        "#3d4d63",
  glassBg:          "rgba(12,20,40,0.65)",
  glassBorder:      "rgba(0,229,204,0.10)",
  glassBorderHover: "rgba(0,229,204,0.22)",
  green:            "#34d399",
  red:              "#f87171",
};

function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background:           C.glassBg,
    backdropFilter:       "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border:               `1px solid ${C.glassBorder}`,
    borderRadius:         16,
    ...extra,
  };
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  HELPERS                                                                  */
/* ══════════════════════════════════════════════════════════════════════════ */

function truncAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  OUTCOME BADGE — replaces raw colored text                                */
/* ══════════════════════════════════════════════════════════════════════════ */

function OutcomeBadge({ action }: { action: string }) {
  const lower     = action.toLowerCase();
  const isYes     = lower.includes("yes");
  const isNo      = lower.includes("no");
  const isUnknown = !isYes && !isNo;
  const isBuy     = lower.startsWith("bought");
  const color     = isYes ? C.green : isNo ? C.red : C.textMuted;

  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          5,
      padding:      "4px 10px",
      borderRadius: 8,
      fontSize:     12,
      fontWeight:   600,
      background:   isUnknown ? "rgba(255,255,255,0.03)" : `${color}12`,
      color:        isUnknown ? C.textMuted : color,
      border:       `1px solid ${isUnknown ? "rgba(255,255,255,0.06)" : `${color}28`}`,
      whiteSpace:   "nowrap",
      opacity:      isUnknown ? 0.65 : 1,
    }}>
      {isBuy
        ? <ArrowUpRight   size={12} strokeWidth={2.5} />
        : <ArrowDownRight size={12} strokeWidth={2.5} />}
      {action}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  COPY BUTTON — visual feedback on click                                   */
/* ══════════════════════════════════════════════════════════════════════════ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      title={copied ? "Copied!" : "Copy address"}
      style={{
        background:   "none", border: "none", padding: 3,
        cursor:       "pointer",
        color:        copied ? C.green : C.textMuted,
        transition:   "color 0.15s",
        display:      "flex", alignItems: "center", borderRadius: 4,
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  INLINE REMOVE CONFIRM — no browser confirm() popup                       */
/* ══════════════════════════════════════════════════════════════════════════ */

function RemoveButton({
  clientId, onConfirm, disabled,
}: {
  clientId: string;
  onConfirm: (id: string) => void;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>Remove?</span>
        <button
          onClick={() => { onConfirm(clientId); setConfirming(false); }}
          style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
            background: `${C.red}18`, border: `1px solid ${C.red}40`,
            color: C.red, cursor: "pointer",
          }}
        >Yes</button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: C.textSecondary, cursor: "pointer",
          }}
        >No</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={disabled}
      title="Remove wallet"
      style={{
        background: "none", border: "none", padding: 3, cursor: "pointer",
        color: C.textMuted, transition: "color 0.15s", borderRadius: 6,
        display: "flex", alignItems: "center", opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.red; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.textMuted; }}
    >
      <Trash2 size={14} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  INVESTMENT CHART — SVG with hover tooltip + daily bars                   */
/* ══════════════════════════════════════════════════════════════════════════ */

function InvestmentChart({ points }: { points: ChartPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 10, padding: "32px 16px",
        borderRadius: 12, border: `1px dashed rgba(0,229,204,0.10)`,
        minHeight: 180,
      }}>
        <TrendingUp size={28} color="#3d4d63" strokeWidth={1.5} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "#3d4d63", margin: 0 }}>
          No trades yet
        </p>
        <p style={{ fontSize: 12, color: "#3d4d63", textAlign: "center", lineHeight: 1.5, maxWidth: 240 }}>
          This chart updates automatically once the engine executes its first trade.
        </p>
      </div>
    );
  }

  const W = 580, H = 180, PAD_L = 44, PAD_R = 16, PAD_T = 16, PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = points.length;

  const maxCum   = Math.max(...points.map(p => p.cumulative), 1);
  const maxDaily = Math.max(...points.map(p => p.daily), 1);

  const pts = points.map((p, i) => ({
    x: PAD_L + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW),
    y: PAD_T + plotH - (p.cumulative / maxCum) * plotH,
    ...p,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${pts[0].x} ${PAD_T + plotH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD_T + plotH}`,
    "Z",
  ].join(" ");

  const yLabels = [
    { val: 0,          y: PAD_T + plotH },
    { val: maxCum / 2, y: PAD_T + plotH / 2 },
    { val: maxCum,     y: PAD_T },
  ];

  const xLabels = n <= 2
    ? pts
    : [pts[0], pts[Math.floor((n - 1) / 2)], pts[n - 1]];

  const BAR_W = Math.max(4, Math.min(14, plotW / n - 3));
  const hovered = hoverIdx !== null ? pts[hoverIdx] : null;

  return (
    <div style={{ flex: 1, minHeight: 180, position: "relative", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%" height="100%"
        style={{ overflow: "visible", display: "block" }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00e5cc" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#00e5cc" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#00e5cc" />
          </linearGradient>
          <linearGradient id="barg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7c5cfc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.07" />
          </linearGradient>
          <linearGradient id="barg-h" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7c5cfc" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.20" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <line key={i} x1={PAD_L} y1={l.y} x2={W - PAD_R} y2={l.y}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((l, i) => (
          <text key={i} x={PAD_L - 6} y={l.y + 4}
            textAnchor="end" fontSize="9" fill="#3d4d63" fontFamily="monospace">
            {l.val >= 1000 ? `$${(l.val / 1000).toFixed(1)}k` : `$${l.val.toFixed(0)}`}
          </text>
        ))}

        {/* Daily bars */}
        {pts.map((p, i) => {
          const barH = Math.max(2, (p.daily / maxDaily) * (plotH * 0.38));
          return (
            <rect key={i}
              x={p.x - BAR_W / 2} y={PAD_T + plotH - barH}
              width={BAR_W} height={barH}
              fill={hoverIdx === i ? "url(#barg-h)" : "url(#barg)"}
              rx="2"
              style={{ transition: "fill 0.12s" }}
            />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#ig)" />

        {/* Cumulative line */}
        <polyline points={polyline} fill="none"
          stroke="url(#lg)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover crosshair */}
        {hovered && (
          <line
            x1={hovered.x} y1={PAD_T} x2={hovered.x} y2={PAD_T + plotH}
            stroke="rgba(0,229,204,0.18)" strokeWidth="1" strokeDasharray="3 3"
          />
        )}

        {/* Dots + invisible hit-targets */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3.5}
              fill={C.bg}
              stroke={hoverIdx === i ? C.accent : "rgba(0,229,204,0.55)"}
              strokeWidth={hoverIdx === i ? 2 : 1.5}
              style={{ transition: "r 0.1s, stroke 0.1s" }}
            />
            <rect
              x={p.x - 22} y={PAD_T} width={44} height={plotH}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((p, i) => (
          <text key={i} x={p.x} y={H - 4}
            textAnchor="middle" fontSize="9" fill="#3d4d63" fontFamily="sans-serif">
            {p.date}
          </text>
        ))}

        {/* Tooltip */}
        {hovered && (() => {
          const TW = 116, TH = 48, mg = 8;
          const tx = Math.min(Math.max(hovered.x - TW / 2, PAD_L), W - PAD_R - TW);
          const ty = hovered.y - TH - mg < PAD_T ? hovered.y + mg : hovered.y - TH - mg;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect x={tx} y={ty} width={TW} height={TH} rx="7"
                fill="rgba(6,11,24,0.96)" stroke="rgba(0,229,204,0.28)" strokeWidth="1" />
              <text x={tx + TW / 2} y={ty + 14}
                textAnchor="middle" fontSize="9.5" fill="#8492a6" fontFamily="sans-serif">
                {hovered.date}
              </text>
              <text x={tx + TW / 2} y={ty + 30}
                textAnchor="middle" fontSize="13" fontWeight="700" fill="#00e5cc" fontFamily="monospace">
                {fmtUsd(hovered.cumulative)}
              </text>
              <text x={tx + TW / 2} y={ty + 42}
                textAnchor="middle" fontSize="9" fill="#3d4d63" fontFamily="sans-serif">
                +{fmtUsd(hovered.daily)} this day
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function DashboardOverviewClient({ data }: { data: DashboardData }) {
  const { recentTrades, totalTradeCount, totalBalanceUsd } = data;
  const [clients, setClients]       = useState(data.clients);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition]         = useTransition();
  const [refreshTime]               = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  const avgTrade = totalTradeCount > 0 ? data.totalInvestedUsd / totalTradeCount : 0;

  const handleRemove = useCallback((clientId: string) => {
    setRemovingId(clientId);
    startTransition(async () => {
      const result = await removeClient(clientId);
      if (result.success) setClients(prev => prev.filter(c => c.id !== clientId));
      else alert(`Failed to remove wallet: ${result.error}`);
      setRemovingId(null);
    });
  }, []);

  /* ── KPI cards ─────────────────────────────────────────────────────────── */
  const KPI = [
    {
      label:  "Total Balance",
      value:  fmtUsd(totalBalanceUsd),
      sub:    "on-chain USDC",
      change: totalBalanceUsd > 0 ? "Live" : "No wallets",
      up:     totalBalanceUsd > 0,
      icon:   Wallet,
      color:  C.accent,
    },
    {
      label:  "Total Invested",
      value:  fmtUsd(data.totalInvestedUsd),
      sub:    avgTrade > 0 ? `avg ${fmtUsd(avgTrade)} / trade` : "cumulative BUY spend",
      change: totalTradeCount > 0
        ? `across ${totalTradeCount} trade${totalTradeCount === 1 ? "" : "s"}`
        : "No trades yet",
      up:    data.totalInvestedUsd > 0,
      icon:  TrendingUp,
      color: C.green,
    },
    {
      label:  "Mirrored Trades",
      value:  totalTradeCount.toLocaleString(),
      sub:    "Lifetime",
      change: totalTradeCount > 0 ? `${Math.min(totalTradeCount, 18)} this week` : "None yet",
      up:    totalTradeCount > 0,
      icon:  Activity,
      color: C.accentAlt,
    },
    {
      label:  "Engine Status",
      value:  "Active",
      sub:    "All systems nominal",
      change: "Online",
      up:     true,
      icon:   Zap,
      color:  C.accent,
      pulse:  true,
    },
  ];

  /* ── Trade rows ─────────────────────────────────────────────────────────── */
  const tradeRows = recentTrades.map(t => {
    const isBuy    = t.side.toUpperCase() === "BUY";
    const outcome  = t.outcome || "?";
    const action   = isBuy ? `Bought ${outcome}` : `Sold ${outcome}`;
    const cost     = isBuy ? t.trade_amount_usd : (t.shares ?? 0) * t.price;
    const sharesDisplay = t.shares != null
      ? t.shares
      : t.price > 0 ? +(t.trade_amount_usd / t.price).toFixed(2) : 0;
    return {
      id: t.id, market: t.market_title, action, cost, isBuy,
      isLegacy: outcome === "?",
      time: timeAgo(t.created_at),
      shares: sharesDisplay,
      price: t.price,
    };
  });

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <section style={{ padding: "32px 32px 48px", maxWidth: 1360, margin: "0 auto" }}>

      <style>{`
        @keyframes pw-ping {
          0%   { transform:scale(1);   opacity:0.6; }
          70%  { transform:scale(2.2); opacity:0;   }
          100% { transform:scale(2.2); opacity:0;   }
        }
        .pw-ping { animation: pw-ping 2s cubic-bezier(0,0,0.2,1) infinite; }

        @keyframes pw-up {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .pw-up { animation: pw-up 0.38s cubic-bezier(0.16,1,0.3,1) both; }

        @media (max-width:1024px) {
          .kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .mid-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width:640px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="pw-up" style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", marginBottom: 28,
      }}>
        <div>
          <h1 className="pw-font-display" style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
            color: C.textPrimary, margin: 0,
          }}>
            Overview
          </h1>
          <p style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>
            Real-time snapshot of your whale-mirroring performance.
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 11, color: C.textMuted,
        }}>
          <RefreshCw size={11} />
          Updated {refreshTime}
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="kpi-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        gap: 16, marginBottom: 20,
      }}>
        {KPI.map((k, ki) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="pw-up" style={{
              ...glass({ padding: "22px 22px 18px" }),
              transition: "border-color 0.25s, box-shadow 0.25s",
              cursor: "default",
              animationDelay: `${ki * 0.07}s`,
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = C.glassBorderHover;
                el.style.boxShadow   = `0 0 32px -8px ${k.color}30`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = C.glassBorder;
                el.style.boxShadow   = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${k.color}12`, border: `1px solid ${k.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={17} color={k.color} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textSecondary }}>
                  {k.label}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="pw-font-display" style={{
                  fontSize: 26, fontWeight: 800, color: C.textPrimary,
                  letterSpacing: "-0.02em", lineHeight: 1,
                }}>
                  {k.pulse ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                      <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
                        <span className="pw-ping" style={{
                          position: "absolute", inset: 0, borderRadius: "50%",
                          background: C.green, opacity: 0.5,
                        }} />
                        <span style={{
                          position: "relative", display: "inline-flex",
                          width: 10, height: 10, borderRadius: "50%", background: C.green,
                        }} />
                      </span>
                      {k.value}
                    </span>
                  ) : k.value}
                </span>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{k.sub}</span>
              </div>

              <div style={{
                marginTop: 12, display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 9px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                background: k.up ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
                color: k.up ? C.green : C.red,
              }}>
                {k.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {k.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Middle row: Chart + Wallets ──────────────────────────────────── */}
      <div className="mid-grid pw-up" style={{
        display: "grid", gridTemplateColumns: "2fr 1fr",
        gap: 16, marginBottom: 20, animationDelay: "0.12s",
      }}>

        {/* ── Investment Activity chart ──────────────────────────────────── */}
        <div style={glass({ padding: "22px 22px 16px", display: "flex", flexDirection: "column", minHeight: 290 })}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 className="pw-font-display" style={{
                fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.01em",
              }}>
                Investment Activity
              </h2>
              <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
                Cumulative USD deployed · last 30 days
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.accent, letterSpacing: "-0.02em" }}>
                {fmtUsd(data.totalInvestedUsd)}
              </span>
              <p style={{ fontSize: 11, color: C.textSecondary, margin: "2px 0 0" }}>total deployed</p>
            </div>
          </div>

          <InvestmentChart points={data.chartPoints} />

          {/* Legend */}
          {data.chartPoints.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted }}>
                <span style={{
                  width: 20, height: 2, borderRadius: 2, display: "inline-block",
                  background: "linear-gradient(90deg,#7c5cfc,#00e5cc)",
                }} />
                Cumulative
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 2, display: "inline-block",
                  background: "rgba(124,92,252,0.35)",
                }} />
                Daily
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>
                Hover dots for details
              </span>
            </div>
          )}
        </div>

        {/* ── Active Wallets ─────────────────────────────────────────────── */}
        <div style={glass({ padding: "22px", display: "flex", flexDirection: "column" })}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 className="pw-font-display" style={{
              fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.01em",
            }}>
              Active Wallets
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 600, color: C.accentAlt,
              background: `${C.accentAlt}12`, border: `1px solid ${C.accentAlt}22`,
              padding: "3px 10px", borderRadius: 8,
            }}>
              {clients.length} connected
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {clients.length === 0 && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 8, padding: "24px 16px",
                borderRadius: 12, border: `1px dashed ${C.glassBorder}`,
              }}>
                <Wallet size={24} color={C.textMuted} />
                <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>
                  No wallets connected yet.
                </p>
                <Link href="/dashboard/clients/new" style={{
                  fontSize: 12.5, fontWeight: 600, color: C.accent, textDecoration: "none",
                }}>
                  + Add your first client
                </Link>
              </div>
            )}

            {clients.map(w => (
              <div key={w.id} style={{
                padding: "14px 16px", borderRadius: 12,
                background: removingId === w.id ? "rgba(248,113,113,0.04)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${removingId === w.id ? "rgba(248,113,113,0.22)" : "rgba(255,255,255,0.06)"}`,
                transition: "border-color 0.2s, background 0.2s",
                opacity: removingId === w.id ? 0.5 : 1,
              }}
                onMouseEnter={e => {
                  if (removingId !== w.id)
                    (e.currentTarget as HTMLDivElement).style.borderColor = C.glassBorderHover;
                }}
                onMouseLeave={e => {
                  if (removingId !== w.id)
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {/* Top: label + balance + remove */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: w.is_active ? C.green : C.textMuted, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary }}>
                      {w.label || "Unnamed Wallet"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>
                      {fmtUsd(w.usdc_balance)}
                    </span>
                    <RemoveButton clientId={w.id} onConfirm={handleRemove} disabled={removingId === w.id} />
                  </div>
                </div>

                {/* Bottom: address + trade size */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <code style={{
                      fontSize: 11.5, color: C.textMuted,
                      fontFamily: "'Geist Mono', monospace", letterSpacing: "0.02em",
                    }}>
                      {truncAddr(w.funder_address)}
                    </code>
                    <CopyButton text={w.funder_address} />
                    <a href={`https://polygonscan.com/address/${w.funder_address}`}
                      target="_blank" rel="noreferrer"
                      style={{ color: C.textMuted, display: "flex", alignItems: "center", transition: "color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <span style={{
                    fontSize: 11, color: C.textMuted,
                    background: "rgba(0,229,204,0.05)", border: "1px solid rgba(0,229,204,0.10)",
                    padding: "2px 8px", borderRadius: 6,
                  }}>
                    {fmtUsd(w.trade_amount_usd)}/trade
                  </span>
                </div>
              </div>
            ))}
          </div>

          {clients.length > 0 && (
            <Link href="/dashboard/clients/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginTop: 14, padding: "9px", borderRadius: 10,
              fontSize: 12.5, fontWeight: 600, color: C.textSecondary,
              border: `1px dashed ${C.glassBorder}`, textDecoration: "none",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = C.glassBorderHover;
                el.style.color       = C.accent;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = C.glassBorder;
                el.style.color       = C.textSecondary;
              }}
            >
              + Add another client
            </Link>
          )}
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div className="pw-up" style={{ ...glass({ padding: "22px" }), animationDelay: "0.20s" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 className="pw-font-display" style={{
              fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0, letterSpacing: "-0.01em",
            }}>
              Recent Activity
            </h2>
            <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
              Latest mirrored trades from watched whales
            </p>
          </div>
          <Link href="/dashboard/trades" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 9,
            fontSize: 12, fontWeight: 600, color: C.textSecondary,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.glassBorder}`,
            textDecoration: "none", transition: "all 0.18s",
          }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = C.glassBorderHover;
              el.style.color       = C.accent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = C.glassBorder;
              el.style.color       = C.textSecondary;
            }}
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          {tradeRows.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 8, padding: "40px 16px",
            }}>
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
                  {["Market", "Action", "Shares × Price", "Cost", "Time"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", fontSize: 10.5, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      color: C.textMuted, padding: "0 14px 12px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeRows.map((t, ri) => (
                  <tr key={t.id}
                    style={{ transition: "background 0.15s", opacity: t.isLegacy ? 0.45 : 1 }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.025)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                    }}
                  >
                    {/* Market */}
                    <td style={{
                      padding: "13px 14px 13px 0", fontSize: 13.5, fontWeight: 500,
                      color: C.textPrimary, maxWidth: 320,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}>
                      {ri === 0 && (
                        <span style={{
                          display: "inline-block", marginRight: 8, verticalAlign: "middle",
                          fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em",
                          color: C.accent, background: `${C.accent}15`,
                          border: `1px solid ${C.accent}30`,
                          padding: "1px 7px", borderRadius: 5,
                        }}>
                          LATEST
                        </span>
                      )}
                      {t.market}
                    </td>

                    {/* Action badge */}
                    <td style={{
                      padding: "13px 14px 13px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      whiteSpace: "nowrap",
                    }}>
                      <OutcomeBadge action={t.action} />
                    </td>

                    {/* Shares × Price */}
                    <td style={{
                      padding: "13px 14px 13px 0", fontSize: 13, fontWeight: 500,
                      color: C.textPrimary,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{ color: C.textSecondary }}>{t.shares}</span>
                      <span style={{ color: C.textMuted, margin: "0 4px" }}>×</span>
                      <span style={{ color: C.textSecondary }}>${t.price.toFixed(2)}</span>
                    </td>

                    {/* Cost */}
                    <td style={{
                      padding: "13px 14px 13px 0", fontSize: 13, fontWeight: 600,
                      color: t.isBuy ? C.green : C.red,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {t.isBuy ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {fmtUsd(t.cost)}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={{
                      padding: "13px 0", fontSize: 12, color: C.textMuted,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      whiteSpace: "nowrap",
                    }}>
                      {t.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Legacy data footnote */}
        {tradeRows.some(t => t.isLegacy) && (
          <p style={{
            marginTop: 14, fontSize: 11, color: C.textMuted,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              background: C.textMuted, opacity: 0.45, flexShrink: 0,
            }} />
            Dimmed rows are legacy test trades from before outcome tracking was enabled.
          </p>
        )}
      </div>

    </section>
  );
}