/**
 * src/app/dashboard/settings/loading.tsx
 *
 * Skeleton matching the three-section settings layout:
 * Watched Whales → Active Wallets → Engine & Bot Config
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

function SectionHeaderSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.shimmer, animation: "pw-shimmer 1.6s ease-in-out infinite",
      }} />
      <div>
        <Skeleton w={140} h={16} r={6} />
        <Skeleton w={250} h={12} r={5} style={{ marginTop: 6 }} />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
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
        <Skeleton w={140} h={28} r={8} />
        <Skeleton w={320} h={14} r={6} style={{ marginTop: 10 }} />
      </div>

      {/* Section 1 — Watched Whales */}
      <GlassCard style={{ padding: "22px", marginBottom: 20 }}>
        <SectionHeaderSkeleton />
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton w={110} h={14} r={5} style={{ animationDelay: `${i * 0.06}s` }} />
              <Skeleton w={14} h={14} r={4} style={{ animationDelay: `${i * 0.06}s` }} />
              <Skeleton w={50} h={20} r={6} style={{ animationDelay: `${i * 0.06}s` }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Skeleton w={40} h={11} r={4} />
              <Skeleton w={14} h={14} r={4} />
            </div>
          </div>
        ))}
        {/* Add form skeleton */}
        <div style={{
          marginTop: 16, paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", gap: 8, alignItems: "flex-end",
        }}>
          <div style={{ flex: "1 1 280px" }}>
            <Skeleton w={90} h={10} r={4} style={{ marginBottom: 6 }} />
            <Skeleton w="100%" h={36} r={8} />
          </div>
          <div style={{ flex: "0 1 160px" }}>
            <Skeleton w={60} h={10} r={4} style={{ marginBottom: 6 }} />
            <Skeleton w="100%" h={36} r={8} />
          </div>
          <Skeleton w={100} h={36} r={8} />
        </div>
      </GlassCard>

      {/* Section 2 — Active Wallets */}
      <GlassCard style={{ padding: "22px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <SectionHeaderSkeleton />
          <Skeleton w={90} h={30} r={9} />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.7fr",
            gap: 14, alignItems: "center",
            padding: "13px 0",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
          }}>
            <Skeleton w="80%" h={13} r={5} style={{ animationDelay: `${i * 0.06}s` }} />
            <Skeleton w="70%" h={13} r={5} style={{ animationDelay: `${i * 0.06}s` }} />
            <Skeleton w={70} h={13} r={5} style={{ animationDelay: `${i * 0.06}s` }} />
            <Skeleton w={60} h={24} r={8} style={{ animationDelay: `${i * 0.06}s` }} />
          </div>
        ))}
      </GlassCard>

      {/* Section 3 — Engine & Bot Config */}
      <GlassCard style={{ padding: "22px" }}>
        <SectionHeaderSkeleton />

        {/* Heartbeat status skeleton */}
        <Skeleton w="100%" h={52} r={10} style={{ marginBottom: 18 }} />

        {/* Config rows */}
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "13px 0",
            borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}>
            <div>
              <Skeleton w={100} h={13} r={5} style={{ animationDelay: `${i * 0.06}s` }} />
              <Skeleton w={200} h={11} r={4} style={{ marginTop: 4, animationDelay: `${i * 0.06}s` }} />
            </div>
            <Skeleton w={70} h={26} r={7} style={{ animationDelay: `${i * 0.06}s` }} />
          </div>
        ))}

        {/* Env notice skeleton */}
        <Skeleton w="100%" h={42} r={10} style={{ marginTop: 18 }} />
      </GlassCard>
    </section>
  );
}