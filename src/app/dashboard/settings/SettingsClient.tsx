"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Copy, Check, Trash2, Plus, Eye, Server, Shield, Info,
} from "lucide-react";
import { toggleClientActive } from "@/app/actions/client";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

export type ClientSummary = {
  id: string;
  label: string;
  funder_address: string;
  trade_amount_usd: number;
  is_active: boolean;
};

export type WhaleEntry = {
  id: string;
  address: string;
  label: string;
  added_at: string;
};

export type BotConfig = {
  dedupWindowMs: number;
  maxSlippagePct: number;
  polygonWssUrl: string;
  heartbeatPort: number;
};

export type SettingsData = {
  clients: ClientSummary[];
  whaleAddresses: WhaleEntry[];
  envWhaleAddresses: string[];
  lastHeartbeatIso: string | null;
  botConfig: BotConfig;
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
/*  INLINE REMOVE CONFIRM  — same pattern as DashboardOverviewClient         */
/* ══════════════════════════════════════════════════════════════════════════ */

function RemoveButton({
  itemId, onConfirm, disabled, label,
}: {
  itemId: string;
  onConfirm: (id: string) => void;
  disabled: boolean;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
          {label || "Remove?"}
        </span>
        <button
          onClick={() => { onConfirm(itemId); setConfirming(false); }}
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
      title="Remove"
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
/*  SECTION LABEL — consistent heading for each settings card                */
/* ══════════════════════════════════════════════════════════════════════════ */

function SectionLabel({ icon, title, subtitle }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${C.accent}12`, border: `1px solid ${C.accent}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <h2 className="pw-font-display" style={{
          fontSize: 16, fontWeight: 700, color: C.textPrimary,
          margin: 0, letterSpacing: "-0.01em",
        }}>
          {title}
        </h2>
        <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  STATUS DOT — green/red/grey with optional pulse                          */
/* ══════════════════════════════════════════════════════════════════════════ */

function StatusDot({ color, pulse }: { color: string; pulse: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 9, height: 9, flexShrink: 0 }}>
      {pulse && (
        <span className="pw-ping" style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: color, opacity: 0.5,
        }} />
      )}
      <span style={{
        position: "relative", display: "inline-flex",
        width: 9, height: 9, borderRadius: "50%", background: color,
      }} />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function SettingsClient({ data }: { data: SettingsData }) {
  const { clients, botConfig, lastHeartbeatIso, envWhaleAddresses } = data;

  /* ── Client toggle state ───────────────────────────────────────────── */
  const [clientList, setClientList] = useState(clients);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ── Whale state ────────────────────────────────────────────────────── */
  const [whales, setWhales]           = useState(data.whaleAddresses);
  const [removingWhale, setRemovingWhale] = useState<string | null>(null);

  /* ── Engine status — same logic as DashboardOverviewClient ──────────── */
  const engineStatus: "online" | "stale" | "unknown" = (() => {
    if (!lastHeartbeatIso) return "unknown";
    const age = Date.now() - new Date(lastHeartbeatIso).getTime();
    return age < 2 * 60 * 1000 ? "online" : "stale";
  })();
  const engineColor = { online: C.green, stale: C.red, unknown: C.textMuted }[engineStatus];
  const engineLabel = { online: "Online", stale: "Stale", unknown: "Unknown" }[engineStatus];

  /* ── Whale handlers ─────────────────────────────────────────────────── */
  const handleToggleClient = useCallback((id: string, currentActive: boolean) => {
    setTogglingId(id);
    toggleClientActive(id, !currentActive).then(result => {
      if (result.success) {
        setClientList(prev => prev.map(cl => cl.id === id ? { ...cl, is_active: !currentActive } : cl));
      }
      setTogglingId(null);
    });
  }, []);

  /* ── Config rows ────────────────────────────────────────────────────── */
  const configRows = [
    {
      label: "Dedup Window",
      value: `${botConfig.dedupWindowMs.toLocaleString()}ms`,
      desc:  "Minimum gap between duplicate trade signals",
      color: C.accent,
    },
    {
      label: "Max Slippage",
      value: `${(botConfig.maxSlippagePct * 100).toFixed(1)}%`,
      desc:  "Maximum acceptable price slippage per trade",
      color: C.red,
    },
    {
      label: "Polygon WSS",
      value: botConfig.polygonWssUrl
        ? truncAddr(botConfig.polygonWssUrl.replace("wss://", "").split("/")[0] || "")
        : "Not set",
      desc:  "QuickNode WebSocket endpoint for event streaming",
      color: C.accentAlt,
    },
    {
      label: "Heartbeat Port",
      value: botConfig.heartbeatPort.toString(),
      desc:  "Health-check HTTP port exposed by the bot",
      color: C.green,
    },
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
      `}</style>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="pw-up" style={{ marginBottom: 28 }}>
        <h1 className="pw-font-display" style={{
          fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
          color: C.textPrimary, margin: 0,
        }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>
          Whale watchlist, wallet overview, and bot configuration.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — Watched Whales
      ══════════════════════════════════════════════════════════════════ */}
      <div className="pw-up" style={{ ...glass({ padding: "22px" }), marginBottom: 20, animationDelay: "0.05s" }}>
        <SectionLabel
          icon={<Eye size={17} color={C.accent} strokeWidth={2.2} />}
          title="Watched Whales"
          subtitle="These Polygon wallets are actively monitored — when they trade, the bot mirrors it into your account"
        />

        {envWhaleAddresses.length === 0 ? (
          <div style={{
            padding: "16px 18px", borderRadius: 10,
            background: "rgba(124,92,252,0.05)", border: "1px solid rgba(124,92,252,0.15)",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <Info size={15} color={C.accentAlt} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              To display your watched whales here, add <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textPrimary }}>WHALE_ADDRESSES</span> to your{" "}
              <strong style={{ color: C.textPrimary }}>Vercel environment variables</strong> (not just your bot's .env).
              Format: comma-separated Polygon addresses, e.g.{" "}
              <span style={{ fontFamily: "monospace", fontSize: 11.5, color: C.textMuted }}>0xabc…,0xdef…</span>
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {envWhaleAddresses.map((addr, i) => (
              <div key={addr} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: i < envWhaleAddresses.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: C.accent, flexShrink: 0, opacity: 0.7,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, fontFamily: "monospace" }}>
                    {addr}
                  </span>
                </div>
                <CopyButton text={addr} />
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          To add or remove watched whales, update <span style={{ fontFamily: "monospace", color: C.textSecondary }}>WHALE_ADDRESSES</span> in your bot's environment and restart the process.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — Active Wallets
      ══════════════════════════════════════════════════════════════════ */}
      <div className="pw-up" style={{ ...glass({ padding: "22px" }), marginBottom: 20, animationDelay: "0.10s" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <SectionLabel
            icon={<Shield size={17} color={C.accentAlt} strokeWidth={2.2} />}
            title="Active Wallets"
            subtitle="Connected client wallets and their trade configuration"
          />
          <Link href="/dashboard/clients/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 9,
            fontSize: 12.5, fontWeight: 700,
            color: C.bg,
            background: C.accent,
            border: `1px solid ${C.accent}`,
            textDecoration: "none", transition: "all 0.18s",
            flexShrink: 0, letterSpacing: "0.01em",
          }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = "#00ccb5";
              el.style.boxShadow  = `0 0 20px -4px ${C.accent}60`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = C.accent;
              el.style.boxShadow  = "none";
            }}
          >
            <Plus size={13} /> Add Client
          </Link>
        </div>

        {clients.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 8, padding: "36px 16px",
            borderRadius: 12, border: `1px dashed rgba(0,229,204,0.10)`,
          }}>
            <Shield size={28} color={C.textMuted} strokeWidth={1.5} />
            <p style={{ fontSize: 14, fontWeight: 600, color: C.textMuted, margin: 0 }}>
              No wallets connected
            </p>
            <p style={{ fontSize: 12, color: C.textMuted }}>
              Add a wallet to start mirroring whale trades.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr>
                  {["Label", "Funder Address", "Trade Size", "Status"].map(h => (
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
                {clientList.map(c => (
                  <tr key={c.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.025)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                    }}
                  >
                    <td style={{
                      padding: "13px 14px 13px 0", fontSize: 13.5, fontWeight: 600,
                      color: C.textPrimary,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}>
                      {c.label}
                    </td>
                    <td style={{
                      padding: "13px 14px 13px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, color: C.textSecondary, fontFamily: "monospace" }}>
                          {truncAddr(c.funder_address)}
                        </span>
                        <CopyButton text={c.funder_address} />
                      </div>
                    </td>
                    <td style={{
                      padding: "13px 14px 13px 0", fontSize: 13, fontWeight: 500,
                      color: C.textPrimary,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      whiteSpace: "nowrap",
                    }}>
                      {fmtUsd(c.trade_amount_usd)}<span style={{ color: C.textMuted }}>/trade</span>
                    </td>
                    <td style={{
                      padding: "13px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}>
                      <button
                        onClick={() => handleToggleClient(c.id, c.is_active)}
                        disabled={togglingId === c.id}
                        title={c.is_active ? "Click to deactivate" : "Click to activate"}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 11px", borderRadius: 8,
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: c.is_active ? `${C.green}12` : "rgba(255,255,255,0.03)",
                          color: c.is_active ? C.green : C.textMuted,
                          border: `1px solid ${c.is_active ? `${C.green}28` : "rgba(255,255,255,0.08)"}`,
                          transition: "all 0.18s", opacity: togglingId === c.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => {
                          if (togglingId === c.id) return;
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.background  = c.is_active ? `${C.red}12`  : `${C.green}12`;
                          el.style.color       = c.is_active ? C.red         : C.green;
                          el.style.borderColor = c.is_active ? `${C.red}30`  : `${C.green}30`;
                        }}
                        onMouseLeave={e => {
                          if (togglingId === c.id) return;
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.background  = c.is_active ? `${C.green}12`           : "rgba(255,255,255,0.03)";
                          el.style.color       = c.is_active ? C.green                  : C.textMuted;
                          el.style.borderColor = c.is_active ? `${C.green}28`           : "rgba(255,255,255,0.08)";
                        }}
                      >
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: c.is_active ? C.green : C.textMuted,
                          transition: "background 0.18s",
                        }} />
                        {togglingId === c.id ? "…" : c.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — Engine & Bot Config
      ══════════════════════════════════════════════════════════════════ */}
      <div className="pw-up" style={{ ...glass({ padding: "22px" }), animationDelay: "0.15s" }}>
        <SectionLabel
          icon={<Server size={17} color={C.accent} strokeWidth={2.2} />}
          title="Engine &amp; Bot Config"
          subtitle="Runtime configuration and health status"
        />

        {/* ── Heartbeat status ─────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", borderRadius: 10, marginBottom: 18,
          background: engineStatus === "online" ? "rgba(52,211,153,0.05)"
            : engineStatus === "stale" ? "rgba(248,113,113,0.05)"
            : "rgba(255,255,255,0.02)",
          border: `1px solid ${engineStatus === "online" ? "rgba(52,211,153,0.18)"
            : engineStatus === "stale" ? "rgba(248,113,113,0.18)"
            : "rgba(255,255,255,0.06)"}`,
        }}>
          <StatusDot color={engineColor} pulse={engineStatus === "online"} />
          <div>
            <span className="pw-font-display" style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.03em",
              textTransform: "uppercase", color: engineColor,
            }}>
              Engine: {engineLabel}
            </span>
            <p style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 1 }}>
              {lastHeartbeatIso
                ? `Last heartbeat ${timeAgo(lastHeartbeatIso)}`
                : "No heartbeat received yet"}
            </p>
          </div>
        </div>

        {/* ── Config values ────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {configRows.map((row, i) => (
            <div key={row.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 0",
              borderBottom: i < configRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                  {row.label}
                </span>
                <p style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>
                  {row.desc}
                </p>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                color: row.color, flexShrink: 0, marginLeft: 16,
                background: `${row.color}10`,
                border: `1px solid ${row.color}28`,
                padding: "5px 12px", borderRadius: 8,
                letterSpacing: "0.02em",
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>


      </div>

    </section>
  );
}