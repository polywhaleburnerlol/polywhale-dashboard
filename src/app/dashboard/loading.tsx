/**
 * src/app/dashboard/loading.tsx
 *
 * Next.js automatically renders this file while the Server Component
 * (page.tsx) is fetching data. It shows instantly on navigation — no
 * waiting for Supabase or Polygon RPC calls before the user sees anything.
 */

const C = {
  glassBg:     "rgba(12,20,40,0.65)",
  glassBorder: "rgba(0,229,204,0.10)",
  textMuted:   "#3d4d63",
  shimmer:     "rgba(255,255,255,0.04)",
};

function Skeleton({ w = "100%", h = 16, r = 8, style = {} }: {
  w?: string | number;
  h?: number;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: r,
      background: C.shimmer,
      animation: "pw-shimmer 1.6s ease-in-out infinite",
      ...style,
    }} />
  );
}

function GlassCard({ children, style = {} }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: C.glassBg,
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${C.glassBorder}`,
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section style={{ padding: "32px 32px 48px", maxWidth: 1360, margin: "0 auto" }}>
      <style>{`
        @keyframes pw-shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <Skeleton w={120} h={28} r={8} />
        <Skeleton w={280} h={14} r={6} style={{ marginTop: 10 }} />
      </div>

      {/* KPI row — 4 cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 20,
      }}>
        {[...Array(4)].map((_, i) => (
          <GlassCard key={i} style={{ padding: "22px 22px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: C.shimmer, animation: "pw-shimmer 1.6s ease-in-out infinite",
              }} />
              <Skeleton w={90} h={12} r={5} />
            </div>
            <Skeleton w={100} h={26} r={6} style={{ marginBottom: 14 }} />
            <Skeleton w={70} h={20} r={8} />
          </GlassCard>
        ))}
      </div>

      {/* Middle row: chart + wallets */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 16,
        marginBottom: 20,
      }}>
        <GlassCard style={{ padding: "22px", minHeight: 240 }}>
          <Skeleton w={160} h={16} r={6} style={{ marginBottom: 8 }} />
          <Skeleton w={100} h={12} r={5} style={{ marginBottom: 28 }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {[60, 80, 50, 90, 70, 100, 65, 85, 75, 95].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0",
                background: C.shimmer, animation: "pw-shimmer 1.6s ease-in-out infinite",
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: "22px" }}>
          <Skeleton w={120} h={16} r={6} style={{ marginBottom: 20 }} />
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}>
              <div>
                <Skeleton w={100} h={13} r={5} style={{ marginBottom: 6 }} />
                <Skeleton w={70} h={11} r={4} />
              </div>
              <Skeleton w={60} h={20} r={6} />
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Recent activity table */}
      <GlassCard style={{ padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <Skeleton w={140} h={16} r={6} style={{ marginBottom: 8 }} />
            <Skeleton w={220} h={12} r={5} />
          </div>
          <Skeleton w={70} h={30} r={9} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.8fr 0.6fr",
            gap: 16,
            alignItems: "center",
            padding: "14px 0",
            borderBottom: `1px solid rgba(255,255,255,0.03)`,
          }}>
            <Skeleton w="85%" h={13} r={5} />
            <Skeleton w="70%" h={13} r={5} />
            <Skeleton w="80%" h={13} r={5} />
            <Skeleton w={60} h={24} r={8} />
            <Skeleton w="60%" h={13} r={5} />
            <Skeleton w="50%" h={12} r={4} />
          </div>
        ))}
      </GlassCard>
    </section>
  );
}