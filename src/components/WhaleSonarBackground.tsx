"use client";

/**
 * WhaleSonarBackground
 *
 * A purely decorative, fixed-position background element that simulates
 * a radar/sonar hunting for on-chain Polymarket whale trades.
 *
 * Technique breakdown:
 *   - Perspective grid : SVG <pattern> rendered inside a CSS-perspective
 *     wrapper to create the illusion of a receding 3D ground plane.
 *   - Sonar sweep      : A <div> with a conic-gradient that rotates via a
 *     CSS keyframe — zero JS, zero repaints on the main thread.
 *   - Ping rings       : Two offset sweep trails layered at lower opacity
 *     to produce a soft echo effect after the main beam passes.
 *   - Data blips       : Random SVG circles managed with useEffect /
 *     useState.  Each blip has a lifecycle: spawn → grow → hold → fade.
 *     Only ~8 nodes alive at once — imperceptible to the GPU.
 *   - Scan lines       : Three horizontal lines that drift upward on an
 *     infinite CSS animation — a classic CRT/terminal aesthetic.
 *
 * Zero WebGL, zero canvas, zero external libraries.
 * All animation is CSS `transform` or `opacity` — compositor-only, smooth.
 */

import { useEffect, useRef, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Blip {
  id:      number;
  cx:      number;   // 0-100  (% of container width)
  cy:      number;   // 0-100  (% of container height)
  r:       number;   // base radius in px
  color:   string;
  phase:   "grow" | "hold" | "fade";
  opacity: number;
  scale:   number;
}

/* ── Constants ─────────────────────────────────────────────────────────── */
const ACCENT   = "#00e5cc";
const PURPLE   = "#7c5cfc";
const BLIP_COLORS = [
  "rgba(0,229,204,0.90)",
  "rgba(124,92,252,0.85)",
  "rgba(0,229,204,0.70)",
  "rgba(244,114,182,0.75)",   // occasional pink for "hot" signal
];
const MAX_BLIPS      = 9;
const SPAWN_INTERVAL = 900;   // ms between spawns
const GROW_DURATION  = 320;
const HOLD_DURATION  = 1100;
const FADE_DURATION  = 600;
let   _id            = 0;

/* ── Component ─────────────────────────────────────────────────────────── */
export function WhaleSonarBackground() {
  const [blips, setBlips] = useState<Blip[]>([]);
  const tidRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Blip lifecycle manager */
  useEffect(() => {
    function spawnBlip() {
      const id    = ++_id;
      const color = BLIP_COLORS[Math.floor(Math.random() * BLIP_COLORS.length)];
      const r     = 3 + Math.random() * 4;

      /* Bias blips toward the upper-center where the sonar "hub" is */
      const cx = 20 + Math.random() * 60;
      const cy = 10 + Math.random() * 65;

      const newBlip: Blip = { id, cx, cy, r, color, phase: "grow", opacity: 0, scale: 0.2 };

      setBlips(prev => {
        const next = [...prev, newBlip];
        /* Cap alive blips so we never accumulate */
        return next.length > MAX_BLIPS ? next.slice(next.length - MAX_BLIPS) : next;
      });

      /* GROW → HOLD */
      setTimeout(() => {
        setBlips(prev => prev.map(b =>
          b.id === id ? { ...b, phase: "hold", opacity: 1, scale: 1 } : b
        ));
      }, 16); // next paint tick — triggers CSS transition

      /* HOLD → FADE */
      setTimeout(() => {
        setBlips(prev => prev.map(b =>
          b.id === id ? { ...b, phase: "fade", opacity: 0, scale: 1.6 } : b
        ));
      }, GROW_DURATION + HOLD_DURATION);

      /* REMOVE */
      setTimeout(() => {
        setBlips(prev => prev.filter(b => b.id !== id));
      }, GROW_DURATION + HOLD_DURATION + FADE_DURATION);
    }

    tidRef.current = setInterval(spawnBlip, SPAWN_INTERVAL);
    spawnBlip(); // immediate first blip

    return () => {
      if (tidRef.current) clearInterval(tidRef.current);
    };
  }, []);

  return (
    <>
      {/* ── Keyframes injected once ── */}
      <style>{`
        /* Main sonar sweep — full 360° rotation */
        @keyframes sonar-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }

        /* Secondary echo ring — slightly slower, offset phase */
        @keyframes sonar-echo {
          from { transform: rotate(-40deg);  }
          to   { transform: rotate(320deg);  }
        }

        /* Horizontal scan lines drifting upward */
        @keyframes scan-drift {
          0%   { transform: translateY(100vh); opacity: 0;    }
          5%   { opacity: 0.35; }
          95%  { opacity: 0.20; }
          100% { transform: translateY(-8px);  opacity: 0;    }
        }

        /* Pulse ring that radiates from sonar center */
        @keyframes sonar-ring-pulse {
          0%   { transform: scale(0.1); opacity: 0.6; }
          100% { transform: scale(3.2); opacity: 0;   }
        }

        /* Corner vignette fade-in */
        @keyframes vignette-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          ROOT — fixed, full-screen, behind everything
          ══════════════════════════════════════════════════════ */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, zIndex: 0,
          overflow: "hidden", pointerEvents: "none",
          /* Deep navy base so the glows pop */
          background: "radial-gradient(ellipse 110% 80% at 50% 0%, #070e20 0%, #060b18 60%)",
        }}
      >

        {/* ── 1. PERSPECTIVE GRID ─────────────────────────────────── */}
        <div style={{
          position: "absolute",
          /* Anchor at bottom-center and tilt toward viewer */
          bottom: "-10%", left: "50%",
          width: "160%", height: "80%",
          transform: "translateX(-50%) perspective(520px) rotateX(62deg)",
          transformOrigin: "50% 100%",
          opacity: 0.45,
        }}>
          <svg
            width="100%" height="100%"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            <defs>
              {/* Grid cell — small squares */}
              <pattern
                id="grid-cell"
                width="48" height="48"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 48 0 L 0 0 0 48"
                  fill="none"
                  stroke="rgba(0,229,204,0.13)"
                  strokeWidth="0.8"
                />
              </pattern>

              {/* Accent grid — every 4th line is slightly brighter */}
              <pattern
                id="grid-accent"
                width="192" height="192"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 192 0 L 0 0 0 192"
                  fill="none"
                  stroke="rgba(0,229,204,0.22)"
                  strokeWidth="1.2"
                />
              </pattern>

              {/* Fade mask: bright at top (near vanishing point), dim at bottom */}
              <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#060b18" stopOpacity="0"   />
                <stop offset="55%"  stopColor="#060b18" stopOpacity="0"   />
                <stop offset="100%" stopColor="#060b18" stopOpacity="1"   />
              </linearGradient>
              <mask id="grid-mask">
                <rect width="100%" height="100%" fill="url(#grid-fade)" />
              </mask>
            </defs>

            {/* Base fine grid */}
            <rect width="100%" height="100%" fill="url(#grid-cell)" />
            {/* Brighter accent grid overlaid */}
            <rect width="100%" height="100%" fill="url(#grid-accent)" />
            {/* Fade mask applied on top */}
            <rect width="100%" height="100%"
              fill="rgba(6,11,24,1)" mask="url(#grid-mask)" />
          </svg>
        </div>

        {/* ── 2. SONAR SWEEP ──────────────────────────────────────── */}
        {/*
            The sweep is a conic-gradient that rotates.  We layer two
            copies (main beam + fainter echo) for a "ping trail" look.
        */}

        {/* Sweep container — centered in upper half of screen */}
        <div style={{
          position: "absolute",
          top: "-30%", left: "50%",
          width: "130vmax", height: "130vmax",
          transform: "translateX(-50%)",
        }}>
          {/* Main beam */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: `conic-gradient(
              from 0deg,
              transparent              0deg,
              transparent              200deg,
              rgba(124,92,252,0.04)    230deg,
              rgba(0,229,204,0.10)     260deg,
              rgba(0,229,204,0.18)     272deg,
              rgba(0,229,204,0.06)     285deg,
              transparent              305deg,
              transparent              360deg
            )`,
            animation: "sonar-spin 6s linear infinite",
          }} />

          {/* Echo trail — slower, dimmer, offset */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: `conic-gradient(
              from 0deg,
              transparent              0deg,
              transparent              210deg,
              rgba(0,229,204,0.04)     245deg,
              rgba(0,229,204,0.08)     262deg,
              transparent              290deg,
              transparent              360deg
            )`,
            animation: "sonar-echo 9s linear infinite",
          }} />
        </div>

        {/* ── 3. PULSE RINGS from sonar center ───────────────────── */}
        {/*
            Three rings staggered by 2s each so one is always mid-expand.
        */}
        {[0, 2, 4].map((delay) => (
          <div
            key={delay}
            style={{
              position: "absolute",
              top: "0%", left: "50%",
              width: 80, height: 80,
              marginLeft: -40, marginTop: -40,
              borderRadius: "50%",
              border: `1px solid ${ACCENT}`,
              opacity: 0,
              animation: `sonar-ring-pulse 6s ${delay}s ease-out infinite`,
              boxShadow: `0 0 12px 2px rgba(0,229,204,0.2)`,
            }}
          />
        ))}

        {/* ── 4. DATA BLIPS ───────────────────────────────────────── */}
        <svg
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            overflow: "visible",
          }}
        >
          {blips.map((blip) => {
            const transitionDuration =
              blip.phase === "grow" ? `${GROW_DURATION}ms` :
              blip.phase === "fade" ? `${FADE_DURATION}ms` : "80ms";

            /* Each blip = a glowing dot + a halo ring */
            return (
              <g key={blip.id}>
                {/* Halo ring */}
                <circle
                  cx={`${blip.cx}%`}
                  cy={`${blip.cy}%`}
                  r={blip.r * 3.5 * blip.scale}
                  fill="none"
                  stroke={blip.color}
                  strokeWidth="0.8"
                  opacity={blip.opacity * 0.35}
                  style={{ transition: `opacity ${transitionDuration} ease, r ${transitionDuration} ease` }}
                />
                {/* Core dot */}
                <circle
                  cx={`${blip.cx}%`}
                  cy={`${blip.cy}%`}
                  r={blip.r * blip.scale}
                  fill={blip.color}
                  opacity={blip.opacity}
                  style={{
                    transition: `opacity ${transitionDuration} ease, r ${transitionDuration} ease`,
                    filter: `drop-shadow(0 0 ${blip.r * 1.8}px ${blip.color})`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* ── 5. SCAN LINES ───────────────────────────────────────── */}
        {[
          { delay: "0s",   duration: "11s",  opacity: 0.30 },
          { delay: "3.5s", duration: "14s",  opacity: 0.18 },
          { delay: "7s",   duration: "9s",   opacity: 0.22 },
        ].map(({ delay, duration, opacity }, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 0, right: 0,
              height: 1,
              background: `linear-gradient(90deg,
                transparent 0%,
                ${ACCENT} 30%,
                rgba(124,92,252,0.6) 55%,
                ${ACCENT} 75%,
                transparent 100%
              )`,
              opacity,
              animation: `scan-drift ${duration} ${delay} linear infinite`,
              boxShadow: `0 0 8px 1px rgba(0,229,204,0.3)`,
            }}
          />
        ))}

        {/* ── 6. AMBIENT CORNER GLOWS ─────────────────────────────── */}
        {/* Cyan — top-left */}
        <div style={{
          position: "absolute", top: -200, left: -200,
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,204,0.055) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        {/* Purple — top-right */}
        <div style={{
          position: "absolute", top: -300, right: -300,
          width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,92,252,0.065) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        {/* Subtle cyan glow at sonar center (top-center) */}
        <div style={{
          position: "absolute", top: -120, left: "50%",
          width: 400, height: 400,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,229,204,0.12) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* ── 7. BOTTOM VIGNETTE — darkens grid near form ──────────── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "50%",
          background: "linear-gradient(to top, #060b18 0%, transparent 100%)",
          pointerEvents: "none",
          animation: "vignette-in 1.2s ease both",
        }} />

      </div>
    </>
  );
}