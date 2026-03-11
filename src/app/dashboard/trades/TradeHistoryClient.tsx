"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Activity, TrendingUp, BarChart3, Target,
  ArrowUpRight, ArrowDownRight, Copy, Check,
  Download, ChevronLeft, ChevronRight, ChevronDown,
  ArrowUpDown, Search,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

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
  order_id: string;
  whale_address: string;
  asset_id: string;
};

export type ClientInfo = {
  id: string;
  label: string;
  funder_address: string;
};

export type TradeHistoryData = {
  trades: TradeRow[];
  clients: ClientInfo[];
};

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DESIGN TOKENS  — copied verbatim from DashboardOverviewClient           */
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
/*  HELPERS  — same as DashboardOverviewClient                               */
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

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  OUTCOME BADGE  — identical to DashboardOverviewClient                    */
/* ══════════════════════════════════════════════════════════════════════════ */

function OutcomeBadge({ outcome }: { outcome: string }) {
  const lower     = outcome.toLowerCase();
  const isYes     = lower === "yes";
  const isNo      = lower === "no";
  const isUnknown = !isYes && !isNo;
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
      {isYes  && <ArrowUpRight   size={12} strokeWidth={2.5} />}
      {isNo   && <ArrowDownRight size={12} strokeWidth={2.5} />}
      {isUnknown && <span style={{ width: 12, textAlign: "center" }}>?</span>}
      {outcome || "?"}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  COPY BUTTON  — identical to DashboardOverviewClient                      */
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
/*  FILTER PILL  — glass-style toggle button                                 */
/* ══════════════════════════════════════════════════════════════════════════ */

function FilterPill({
  label, active, onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      "5px 13px",
        borderRadius: 8,
        fontSize:     12,
        fontWeight:   600,
        cursor:       "pointer",
        transition:   "all 0.18s",
        border:       `1px solid ${active ? `${C.accent}40` : "rgba(255,255,255,0.06)"}`,
        background:   active ? `${C.accent}12` : "rgba(255,255,255,0.03)",
        color:        active ? C.accent : C.textSecondary,
      }}
    >
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  CSV EXPORT                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

function exportCsv(
  trades: TradeRow[],
  clientMap: Record<string, string>,
) {
  const header = [
    "Date", "Time", "Market", "Outcome", "Side",
    "Shares", "Price", "Cost (USD)", "Wallet", "Whale Address",
    "Order ID", "Asset ID",
  ].join(",");

  const rows = trades.map(t => {
    const isBuy = t.side.toUpperCase() === "BUY";
    const cost  = isBuy ? t.trade_amount_usd : (t.shares ?? 0) * t.price;
    const shares = t.shares != null
      ? t.shares
      : t.price > 0 ? +(t.trade_amount_usd / t.price).toFixed(2) : 0;
    return [
      fmtDate(t.created_at),
      fmtTime(t.created_at),
      `"${t.market_title.replace(/"/g, '""')}"`,
      t.outcome,
      t.side,
      shares,
      t.price.toFixed(4),
      cost.toFixed(2),
      `"${clientMap[t.client_id] || t.client_id}"`,
      t.whale_address,
      t.order_id,
      t.asset_id,
    ].join(",");
  });

  const csv  = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `polywhale-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  SORT HELPERS                                                             */
/* ══════════════════════════════════════════════════════════════════════════ */

type SortKey =
  | "market_title"
  | "outcome"
  | "side"
  | "shares"
  | "cost"
  | "client_id"
  | "whale_address"
  | "created_at";

type SortDir = "asc" | "desc";

const ROWS_PER_PAGE = 25;

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function TradeHistoryClient({ data }: { data: TradeHistoryData }) {
  const { trades, clients } = data;

  /* ── Client label map ───────────────────────────────────────────────── */
  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c.id] = c.label;
    return m;
  }, [clients]);

  /* ── Filter state ───────────────────────────────────────────────────── */
  const [sideFilter, setSideFilter]       = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | "Yes" | "No" | "?">("ALL");
  const [rangeFilter, setRangeFilter]     = useState<"7d" | "30d" | "90d" | "ALL">("ALL");
  const [clientFilter, setClientFilter]   = useState<string>("ALL");
  const [searchQuery, setSearchQuery]     = useState("");

  /* ── Sort state ─────────────────────────────────────────────────────── */
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("desc");
      return key;
    });
  }, []);

  /* ── Pagination state ───────────────────────────────────────────────── */
  const [page, setPage] = useState(0);

  /* ── Filtered + sorted trades ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    let out = trades;

    if (sideFilter !== "ALL") {
      out = out.filter(t => t.side.toUpperCase() === sideFilter);
    }
    if (outcomeFilter !== "ALL") {
      out = out.filter(t => {
        if (outcomeFilter === "?") return !t.outcome || t.outcome === "?";
        return t.outcome.toLowerCase() === outcomeFilter.toLowerCase();
      });
    }
    if (rangeFilter !== "ALL") {
      const days = rangeFilter === "7d" ? 7 : rangeFilter === "30d" ? 30 : 90;
      const since = Date.now() - days * 24 * 60 * 60 * 1000;
      out = out.filter(t => new Date(t.created_at).getTime() >= since);
    }
    if (clientFilter !== "ALL") {
      out = out.filter(t => t.client_id === clientFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      out = out.filter(t => t.market_title.toLowerCase().includes(q));
    }

    // Sort
    const sorted = [...out].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "market_title":
          cmp = a.market_title.localeCompare(b.market_title); break;
        case "outcome":
          cmp = (a.outcome || "").localeCompare(b.outcome || ""); break;
        case "side":
          cmp = a.side.localeCompare(b.side); break;
        case "shares": {
          const sa = a.shares ?? 0;
          const sb = b.shares ?? 0;
          cmp = sa - sb; break;
        }
        case "cost": {
          const ca = a.side.toUpperCase() === "BUY" ? a.trade_amount_usd : (a.shares ?? 0) * a.price;
          const cb = b.side.toUpperCase() === "BUY" ? b.trade_amount_usd : (b.shares ?? 0) * b.price;
          cmp = ca - cb; break;
        }
        case "client_id":
          cmp = (clientMap[a.client_id] || "").localeCompare(clientMap[b.client_id] || ""); break;
        case "whale_address":
          cmp = a.whale_address.localeCompare(b.whale_address); break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [trades, sideFilter, outcomeFilter, rangeFilter, clientFilter, searchQuery, sortKey, sortDir, clientMap]);

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages - 1);
  const pageRows   = filtered.slice(safePage * ROWS_PER_PAGE, (safePage + 1) * ROWS_PER_PAGE);

  /* ── Stats ──────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalTrades = filtered.length;
    let totalInvested = 0;
    const marketCounts: Record<string, number> = {};

    for (const t of filtered) {
      const isBuy = t.side.toUpperCase() === "BUY";
      totalInvested += isBuy ? t.trade_amount_usd : (t.shares ?? 0) * t.price;
      marketCounts[t.market_title] = (marketCounts[t.market_title] ?? 0) + 1;
    }

    const avgSize = totalTrades > 0 ? totalInvested / totalTrades : 0;

    let mostTraded = "—";
    let maxCount   = 0;
    for (const [title, cnt] of Object.entries(marketCounts)) {
      if (cnt > maxCount) { maxCount = cnt; mostTraded = title; }
    }

    return { totalTrades, totalInvested, avgSize, mostTraded, mostTradedCount: maxCount };
  }, [filtered]);

  /* ── KPI cards config ───────────────────────────────────────────────── */
  const KPI = [
    {
      label: "Total Trades",
      value: stats.totalTrades.toLocaleString(),
      sub:   "matching filters",
      icon:  Activity,
      color: C.accentAlt,
    },
    {
      label: "Total Invested",
      value: fmtUsd(stats.totalInvested),
      sub:   "cumulative",
      icon:  TrendingUp,
      color: C.green,
    },
    {
      label: "Avg Trade Size",
      value: fmtUsd(stats.avgSize),
      sub:   "per trade",
      icon:  BarChart3,
      color: C.accent,
    },
    {
      label: "Most Traded",
      value: stats.mostTraded.length > 24
        ? stats.mostTraded.slice(0, 22) + "…"
        : stats.mostTraded,
      sub:   stats.mostTradedCount > 0 ? `${stats.mostTradedCount} trades` : "",
      icon:  Target,
      color: C.accent,
    },
  ];

  /* ── Table columns ──────────────────────────────────────────────────── */
  const columns: { label: string; key: SortKey; flex: string }[] = [
    { label: "Market",  key: "market_title",  flex: "2.5" },
    { label: "Outcome", key: "outcome",       flex: "0.7" },
    { label: "Side",    key: "side",          flex: "0.6" },
    { label: "Shares × Price", key: "shares", flex: "1.1" },
    { label: "Cost",    key: "cost",          flex: "0.8" },
    { label: "Wallet",  key: "client_id",     flex: "0.9" },
    { label: "Whale",   key: "whale_address", flex: "0.9" },
    { label: "Time",    key: "created_at",    flex: "0.8" },
  ];

  /* ════════════════════════════════════════════════════════════════════ */
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
          .kpi-grid-trades { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width:640px) {
          .kpi-grid-trades { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="pw-up" style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", marginBottom: 28,
      }}>
        <div>
          <h1 className="pw-font-display" style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
            color: C.textPrimary, margin: 0,
          }}>
            Trade History
          </h1>
          <p style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>
            Full log of every mirrored whale trade across all wallets.
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered, clientMap)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 9,
            fontSize: 12.5, fontWeight: 600, color: C.textSecondary,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.glassBorder}`,
            cursor: "pointer", transition: "all 0.18s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget;
            el.style.borderColor = C.glassBorderHover;
            el.style.color       = C.accent;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget;
            el.style.borderColor = C.glassBorder;
            el.style.color       = C.textSecondary;
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────── */}
      <div className="kpi-grid-trades" style={{
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
                  fontSize: k.label === "Most Traded" ? 15 : 26,
                  fontWeight: k.label === "Most Traded" ? 700 : 800,
                  color: C.textPrimary,
                  letterSpacing: "-0.02em", lineHeight: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}>
                  {k.value}
                </span>
              </div>

              {k.sub && (
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, marginTop: 6, display: "block" }}>
                  {k.sub}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Filters bar ────────────────────────────────────────────────── */}
      <div className="pw-up" style={{
        ...glass({ padding: "14px 18px" }),
        animationDelay: "0.10s",
        marginBottom: 16,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12,
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 8,
          border: `1px solid rgba(255,255,255,0.06)`,
          background: "rgba(255,255,255,0.03)",
          flex: "0 1 200px", minWidth: 140,
        }}>
          <Search size={13} color={C.textMuted} />
          <input
            type="text"
            placeholder="Search markets…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            style={{
              background: "none", border: "none", outline: "none",
              color: C.textPrimary, fontSize: 12, fontWeight: 500,
              width: "100%", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.06)" }} />

        {/* Side filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["ALL", "BUY", "SELL"] as const).map(v => (
            <FilterPill key={v} label={v === "ALL" ? "All Sides" : v}
              active={sideFilter === v}
              onClick={() => { setSideFilter(v); setPage(0); }} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.06)" }} />

        {/* Outcome filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["ALL", "Yes", "No", "?"] as const).map(v => (
            <FilterPill key={v} label={v === "ALL" ? "All Outcomes" : v}
              active={outcomeFilter === v}
              onClick={() => { setOutcomeFilter(v); setPage(0); }} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.06)" }} />

        {/* Date range */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["7d", "30d", "90d", "ALL"] as const).map(v => (
            <FilterPill key={v} label={v === "ALL" ? "All Time" : v}
              active={rangeFilter === v}
              onClick={() => { setRangeFilter(v); setPage(0); }} />
          ))}
        </div>

        {/* Client dropdown */}
        {clients.length > 0 && (
          <>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "relative" }}>
              <select
                value={clientFilter}
                onChange={e => { setClientFilter(e.target.value); setPage(0); }}
                style={{
                  appearance: "none", WebkitAppearance: "none",
                  padding: "5px 28px 5px 12px", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                  color: clientFilter !== "ALL" ? C.accent : C.textSecondary,
                  background: clientFilter !== "ALL" ? `${C.accent}12` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${clientFilter !== "ALL" ? `${C.accent}40` : "rgba(255,255,255,0.06)"}`,
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="ALL">All Wallets</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <ChevronDown size={12} color={C.textMuted}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </>
        )}
      </div>

      {/* ── Trade table ────────────────────────────────────────────────── */}
      <div className="pw-up" style={{ ...glass({ padding: "22px" }), animationDelay: "0.15s" }}>
        <div style={{ overflowX: "auto" }}>
          {filtered.length === 0 ? (
            /* Empty state */
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 8, padding: "56px 16px",
            }}>
              <Activity size={32} color={C.textMuted} strokeWidth={1.5} />
              <p style={{ fontSize: 15, fontWeight: 600, color: C.textMuted, margin: 0 }}>
                No trades found
              </p>
              <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", maxWidth: 320 }}>
                {trades.length === 0
                  ? "Trades will appear here once the engine mirrors a whale position."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          textAlign: "left", fontSize: 10.5, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          color: sortKey === col.key ? C.accent : C.textMuted,
                          padding: "0 12px 12px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          whiteSpace: "nowrap", cursor: "pointer",
                          userSelect: "none", transition: "color 0.15s",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          <ArrowUpDown size={10} style={{
                            opacity: sortKey === col.key ? 1 : 0.3,
                            transform: sortKey === col.key && sortDir === "asc" ? "scaleY(-1)" : "none",
                            transition: "opacity 0.15s, transform 0.15s",
                          }} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => {
                    const isBuy = t.side.toUpperCase() === "BUY";
                    const cost  = isBuy ? t.trade_amount_usd : (t.shares ?? 0) * t.price;
                    const sharesDisplay = t.shares != null
                      ? t.shares
                      : t.price > 0 ? +(t.trade_amount_usd / t.price).toFixed(2) : 0;
                    const isLegacy = !t.outcome || t.outcome === "?";

                    return (
                      <tr key={t.id}
                        style={{ transition: "background 0.15s", opacity: isLegacy ? 0.45 : 1 }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.025)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                        }}
                      >
                        {/* Market */}
                        <td style={{
                          padding: "13px 12px 13px 0", fontSize: 13.5, fontWeight: 500,
                          color: C.textPrimary, maxWidth: 300,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}>
                          {t.market_title}
                        </td>

                        {/* Outcome */}
                        <td style={{
                          padding: "13px 12px 13px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          <OutcomeBadge outcome={t.outcome} />
                        </td>

                        {/* Side */}
                        <td style={{
                          padding: "13px 12px 13px 0", fontSize: 12.5, fontWeight: 600,
                          color: isBuy ? C.green : C.red,
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            {isBuy ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {t.side}
                          </span>
                        </td>

                        {/* Shares × Price */}
                        <td style={{
                          padding: "13px 12px 13px 0", fontSize: 13, fontWeight: 500,
                          color: C.textPrimary,
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          <span style={{ color: C.textSecondary }}>{sharesDisplay}</span>
                          <span style={{ color: C.textMuted, margin: "0 4px" }}>×</span>
                          <span style={{ color: C.textSecondary }}>${t.price.toFixed(2)}</span>
                        </td>

                        {/* Cost */}
                        <td style={{
                          padding: "13px 12px 13px 0", fontSize: 13, fontWeight: 600,
                          color: isBuy ? C.green : C.red,
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          {fmtUsd(cost)}
                        </td>

                        {/* Wallet */}
                        <td style={{
                          padding: "13px 12px 13px 0", fontSize: 12.5, fontWeight: 500,
                          color: C.textSecondary,
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          {clientMap[t.client_id] || truncAddr(t.client_id)}
                        </td>

                        {/* Whale */}
                        <td style={{
                          padding: "13px 12px 13px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          {t.whale_address ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: "monospace" }}>
                                {truncAddr(t.whale_address)}
                              </span>
                              <CopyButton text={t.whale_address} />
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: C.textMuted }}>—</span>
                          )}
                        </td>

                        {/* Time */}
                        <td style={{
                          padding: "13px 0", fontSize: 12, color: C.textMuted,
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                        }}>
                          <div>{timeAgo(t.created_at)}</div>
                          <div style={{ fontSize: 10.5, marginTop: 1, opacity: 0.7 }}>
                            {fmtDate(t.created_at)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Pagination ───────────────────────────────────────────── */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: 18, paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  Showing {safePage * ROWS_PER_PAGE + 1}–{Math.min((safePage + 1) * ROWS_PER_PAGE, filtered.length)} of {filtered.length} trades
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    disabled={safePage === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid rgba(255,255,255,0.06)`,
                      color: safePage === 0 ? C.textMuted : C.textSecondary,
                      cursor: safePage === 0 ? "not-allowed" : "pointer",
                      opacity: safePage === 0 ? 0.4 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, minWidth: 60, textAlign: "center" }}>
                    {safePage + 1} / {totalPages}
                  </span>

                  <button
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid rgba(255,255,255,0.06)`,
                      color: safePage >= totalPages - 1 ? C.textMuted : C.textSecondary,
                      cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                      opacity: safePage >= totalPages - 1 ? 0.4 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Legacy data footnote */}
        {pageRows.some(t => !t.outcome || t.outcome === "?") && filtered.length > 0 && (
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