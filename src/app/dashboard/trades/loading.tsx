/**
 * src/app/dashboard/trades/loading.tsx
 *
 * Next.js automatically renders this file while the Server Component
 * (page.tsx) is fetching data. Skeleton mirrors the trade history layout:
 * stats row → filter bar → table rows.
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

export default function TradesLoading() {
  return (
    <section style={{ padding: "32px 32px 48px", maxWidth: 1360, margin: "0 auto" }}>
      <style>{`
        @keyframes pw-shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
      `}</style>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <Skeleton w={180} h={28} r={8} />
          <Skeleton w={340} h={14} r={6} style={{ marginTop: 10 }} />
        </div>
        <Skeleton w={110} h={34} r={9} />
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
            <Skeleton w={100} h={26} r={6} style={{ marginBottom: 8 }} />
            <Skeleton w={70} h={12} r={5} />
          </GlassCard>
        ))}
      </div>

      {/* Filter bar */}
      <GlassCard style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Skeleton w={160} h={30} r={8} />
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ display: "flex", gap: 4 }}>
            {[60, 48, 52].map((w, i) => (
              <Skeleton key={i} w={w} h={28} r={8} />
            ))}
          </div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ display: "flex", gap: 4 }}>
            {[80, 44, 42, 30].map((w, i) => (
              <Skeleton key={i} w={w} h={28} r={8} />
            ))}
          </div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ display: "flex", gap: 4 }}>
            {[40, 46, 46, 60].map((w, i) => (
              <Skeleton key={i} w={w} h={28} r={8} />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Trade table */}
      <GlassCard style={{ padding: "22px" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 0.7fr 0.6fr 1.1fr 0.8fr 0.9fr 0.9fr 0.8fr",
          gap: 12, alignItems: "center",
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          {[65, 50, 35, 80, 40, 50, 45, 35].map((w, i) => (
            <Skeleton key={i} w={w} h={10} r={4} />
          ))}
        </div>

        {/* Table rows */}
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "2.5fr 0.7fr 0.6fr 1.1fr 0.8fr 0.9fr 0.9fr 0.8fr",
            gap: 12, alignItems: "center",
            padding: "14px 0",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
          }}>
            <Skeleton w="85%" h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w={52} h={24} r={8} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w={40} h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w="80%" h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w={60} h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w="70%" h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w="65%" h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
            <Skeleton w="55%" h={13} r={5} style={{ animationDelay: `${i * 0.05}s` }} />
          </div>
        ))}

        {/* Pagination skeleton */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 18, paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <Skeleton w={160} h={12} r={5} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Skeleton w={32} h={32} r={8} />
            <Skeleton w={50} h={12} r={5} />
            <Skeleton w={32} h={32} r={8} />
          </div>
        </div>
      </GlassCard>
    </section>
  );
}