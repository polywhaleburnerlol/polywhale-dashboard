import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 font-sans antialiased">

      {/* ── Ambient background grid + radial glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.10) 0%, transparent 70%),
            linear-gradient(to bottom, rgba(251,191,36,0.03) 0%, transparent 40%),
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
        }}
      />

      {/* ── Noise texture overlay ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Top navigation bar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-center gap-2.5">
          {/* Whale icon mark */}
          <svg className="h-7 w-7 text-amber-400" viewBox="0 0 32 32" fill="currentColor">
            <path d="M28 14c0-6.627-5.373-12-12-12C9.791 2 7 4 5 7c-1 1.5-1.5 3-1.5 5 0 1.5.3 2.9.8 4.2C3.1 17.5 2 19.6 2 22c0 4.4 3.6 8 8 8h14c3.3 0 6-2.7 6-6 0-1.9-.9-3.6-2.2-4.7.1-.4.2-.9.2-1.3zm-6 4a2 2 0 100-4 2 2 0 000 4z"/>
          </svg>
          <span className="text-lg font-black tracking-tight text-zinc-100">
            POLY<span className="text-amber-400">WHALE</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300 md:block"
          >
            Polymarket ↗
          </a>
          <Link
            href="/dashboard/clients/new"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-300 transition-all hover:border-amber-400/50 hover:text-amber-300"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-20 pb-32 text-center md:pt-32">

        {/* Live status pill */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Engine Online — Monitoring Polygon
          </span>
        </div>

        {/* Main heading */}
        <h1 className="max-w-4xl text-balance text-5xl font-black leading-[1.05] tracking-tight text-zinc-100 md:text-7xl lg:text-8xl">
          Trade Like the{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-amber-400">Whales.</span>
            {/* Underline glow */}
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-amber-400/30 blur-sm"
            />
          </span>
          <br />
          <span className="text-zinc-400">Automatically.</span>
        </h1>

        {/* Sub-heading */}
        <p className="mt-8 max-w-xl text-balance text-lg leading-relaxed text-zinc-400 md:text-xl">
          Real-time on-chain whale tracking on{" "}
          <span className="font-semibold text-zinc-200">Polymarket</span>.
          Every large trade detected in milliseconds — copied to your portfolio
          before the market moves.
        </p>

        {/* CTA buttons */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard/clients/new"
            className="group relative overflow-hidden rounded-xl bg-amber-400 px-8 py-4 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-amber-400/20 transition-all duration-200 hover:bg-amber-300 hover:shadow-amber-300/30 active:scale-[0.97]"
          >
            {/* Shine sweep */}
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-500 group-hover:translate-x-[150%]"
            />
            <span className="relative">Enter Dashboard →</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200"
          >
            View Overview
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
          <span>AES-256-GCM Encrypted</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden />
          <span>Polygon WebSocket</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden />
          <span>Multi-Tenant</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden />
          <span>Supabase Backed</span>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-32 md:grid-cols-3">
        {[
          {
            icon: (
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            ),
            accent: "text-amber-400",
            border: "border-amber-400/15",
            glow: "bg-amber-400/5",
            title: "Sub-Second Detection",
            body: "Subscribes to Polygon OrderFilled events via WebSocket. The on-chain signal reaches your bot before the REST API even indexes the block.",
          },
          {
            icon: (
              <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>
            ),
            accent: "text-sky-400",
            border: "border-sky-400/15",
            glow: "bg-sky-400/5",
            title: "Multi-Tenant Execution",
            body: "One whale signal, many accounts. Every active client executes concurrently using their own credentials and trade sizing.",
          },
          {
            icon: (
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            ),
            accent: "text-emerald-400",
            border: "border-emerald-400/15",
            glow: "bg-emerald-400/5",
            title: "Vault-Grade Security",
            body: "Private keys are AES-256-GCM encrypted before leaving your browser. Plaintext exists only in-memory at the moment of signing.",
          },
        ].map(({ icon, accent, border, glow, title, body }) => (
          <div
            key={title}
            className={`rounded-2xl border ${border} ${glow} p-6 backdrop-blur`}
          >
            <div className={`mb-4 inline-flex rounded-lg border ${border} p-2.5`}>
              <svg
                className={`h-5 w-5 ${accent}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </div>
            <h3 className="mb-2 text-sm font-bold text-zinc-100">{title}</h3>
            <p className="text-xs leading-relaxed text-zinc-500">{body}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-8 py-8 text-center">
        <p className="text-xs text-zinc-600">
          POLYWHALE · Built on Polygon ·{" "}
          <span className="text-zinc-700">Not financial advice</span>
        </p>
      </footer>

    </main>
  );
}