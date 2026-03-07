"use client";

/**
 * PolygonMeshBackground
 *
 * A fixed, full-screen ambient background: a slowly drifting geometric mesh
 * of vertices, edges, and triangle fills with traveling data-packet pulses.
 *
 * ── Performance architecture ────────────────────────────────────────────────
 * Every frame of animation is driven by a single requestAnimationFrame loop
 * that writes positions DIRECTLY to SVG DOM elements via refs. React's
 * reconciler is never invoked after the initial mount render — zero state
 * updates, zero diffing overhead, compositor-only transforms throughout.
 *
 * ── Visual layers (back → front) ────────────────────────────────────────────
 *  1. Radial gradient background     — pure CSS, static
 *  2. Triangle polygon fills         — very low-opacity cyan/purple tinted polys
 *  3. Edge lines                     — thin, near-transparent mesh lines
 *  4. Pulse trails                   — each pulse paints a fading "tail" segment
 *  5. Pulse heads                    — glowing dots traveling along edges
 *  6. Vertex nodes                   — small glowing circles at mesh intersections
 *  7. Edge accent lines              — a small subset rendered brighter for depth
 */

import { useEffect, useRef, useMemo } from "react";

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const CYAN   = "#00e5cc";
const PURPLE = "#7c5cfc";

/* ── SVG coordinate space ──────────────────────────────────────────────────── */
const W = 1440;   // virtual canvas width
const H = 900;    // virtual canvas height

/* ── Mesh parameters ───────────────────────────────────────────────────────── */
const NODE_COUNT     = 42;
const EDGE_THRESHOLD = 235;   // max px between two nodes to draw an edge
const PULSE_COUNT    = 7;     // simultaneous traveling pulses
const DRIFT_AMP      = 20;    // max px each node drifts from its base position
const DRIFT_SPEED    = 0.00028; // radians per millisecond

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Node {
  baseX: number;
  baseY: number;
  phaseX: number;   // independent phase for X oscillation
  phaseY: number;   // independent phase for Y oscillation
  speedX: number;   // individual speed multiplier
  speedY: number;
}

interface Edge {
  a: number;   // node index
  b: number;
  baseLen: number;
}

interface Triangle {
  a: number;   // node index
  b: number;
  c: number;
  colorIdx: number;   // 0 = cyan tint, 1 = purple tint
}

interface Pulse {
  edgeIdx:    number;
  t:          number;    // 0 → 1 travel progress
  speed:      number;    // units of t per millisecond
  colorIdx:   number;    // 0 = cyan, 1 = purple
  reversed:   boolean;   // travel direction
}

/* ══════════════════════════════════════════════════════════════════════════════
   GEOMETRY GENERATORS  (run once, seeded deterministically for SSR stability)
   ══════════════════════════════════════════════════════════════════════════════ */

/** Deterministic pseudo-random seeded by a simple LCG */
function makePRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateNodes(rand: () => number): Node[] {
  const nodes: Node[] = [];

  // Jittered grid: spread nodes evenly then add random offset
  const cols = 8;
  const rows = 6;
  const cellW = (W * 0.88) / (cols - 1);
  const cellH = (H * 0.88) / (rows - 1);
  const offsetX = W * 0.06;
  const offsetY = H * 0.06;

  for (let r = 0; r < rows && nodes.length < NODE_COUNT; r++) {
    for (let c = 0; c < cols && nodes.length < NODE_COUNT; c++) {
      nodes.push({
        baseX:  offsetX + c * cellW + (rand() - 0.5) * cellW * 0.65,
        baseY:  offsetY + r * cellH + (rand() - 0.5) * cellH * 0.65,
        phaseX: rand() * Math.PI * 2,
        phaseY: rand() * Math.PI * 2,
        speedX: 0.6 + rand() * 0.8,
        speedY: 0.5 + rand() * 0.7,
      });
    }
  }

  // Fill remaining slots with random scatter (ensures NODE_COUNT is always met)
  while (nodes.length < NODE_COUNT) {
    nodes.push({
      baseX:  W * 0.04 + rand() * W * 0.92,
      baseY:  H * 0.04 + rand() * H * 0.92,
      phaseX: rand() * Math.PI * 2,
      phaseY: rand() * Math.PI * 2,
      speedX: 0.6 + rand() * 0.8,
      speedY: 0.5 + rand() * 0.7,
    });
  }

  return nodes;
}

function generateEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const dx = nodes[a].baseX - nodes[b].baseX;
      const dy = nodes[a].baseY - nodes[b].baseY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < EDGE_THRESHOLD) {
        edges.push({ a, b, baseLen: len });
      }
    }
  }
  return edges;
}

/**
 * Find triangles: three nodes where all three pairwise edges exist.
 * Capped at 28 to keep the polygon fill subtle, not cluttered.
 */
function generateTriangles(nodes: Node[], edges: Edge[], rand: () => number): Triangle[] {
  // Build adjacency set for fast lookup
  const edgeSet = new Set<string>();
  edges.forEach(({ a, b }) => edgeSet.add(`${a}-${b}`));

  const hasEdge = (i: number, j: number) =>
    edgeSet.has(i < j ? `${i}-${j}` : `${j}-${i}`);

  const tris: Triangle[] = [];
  for (let a = 0; a < nodes.length && tris.length < 28; a++) {
    for (let b = a + 1; b < nodes.length && tris.length < 28; b++) {
      if (!hasEdge(a, b)) continue;
      for (let c = b + 1; c < nodes.length && tris.length < 28; c++) {
        if (hasEdge(a, c) && hasEdge(b, c)) {
          tris.push({ a, b, c, colorIdx: rand() > 0.5 ? 0 : 1 });
        }
      }
    }
  }
  return tris;
}

function initPulses(edges: Edge[], rand: () => number): Pulse[] {
  return Array.from({ length: PULSE_COUNT }, (_, i) => ({
    edgeIdx:  Math.floor(rand() * edges.length),
    t:        (i / PULSE_COUNT),   // stagger start positions
    speed:    0.00025 + rand() * 0.00020,
    colorIdx: i % 2,
    reversed: rand() > 0.5,
  }));
}

/* ── Easing ─────────────────────────────────────────────────────────────────── */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export function PolygonMeshBackground() {

  /* ── Geometry (computed once, stable across renders) ── */
  const { nodes, edges, triangles, pulses: initialPulses } = useMemo(() => {
    const rand = makePRNG(0xdeadbeef);
    const n = generateNodes(rand);
    const e = generateEdges(n);
    const t = generateTriangles(n, e, rand);
    const p = initPulses(e, rand);
    return { nodes: n, edges: e, triangles: t, pulses: p };
  }, []);

  /* ── SVG element refs — indexed arrays, populated at mount ── */
  const svgRef          = useRef<SVGSVGElement>(null);
  const nodeRefs        = useRef<SVGCircleElement[]>([]);
  const edgeRefs        = useRef<SVGLineElement[]>([]);
  const triRefs         = useRef<SVGPolygonElement[]>([]);
  const pulseHeadRefs   = useRef<SVGCircleElement[]>([]);
  const pulseGlowRefs   = useRef<SVGCircleElement[]>([]);
  const pulseTrailRefs  = useRef<SVGLineElement[]>([]);

  /* ── rAF loop — writes directly to DOM, never touches React state ── */
  useEffect(() => {
    // Mutable pulse state lives inside the effect closure, not React state
    const pulseMut: Pulse[] = initialPulses.map(p => ({ ...p }));

    // Current computed node positions (updated every frame)
    const px = new Float32Array(nodes.length);
    const py = new Float32Array(nodes.length);

    // Seeded random for pulse re-assignment
    const rand = makePRNG(0xcafebabe);

    let rafId: number;
    let lastTs = performance.now();

    function frame(ts: number) {
      const dt = Math.min(ts - lastTs, 40); // cap at 40ms to avoid jumps after tab switch
      lastTs = ts;

      /* ── 1. Update node positions ── */
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        px[i] = n.baseX + Math.sin(ts * DRIFT_SPEED * n.speedX + n.phaseX) * DRIFT_AMP;
        py[i] = n.baseY + Math.cos(ts * DRIFT_SPEED * n.speedY + n.phaseY) * DRIFT_AMP;

        const el = nodeRefs.current[i];
        if (el) {
          el.setAttribute("cx", String(px[i]));
          el.setAttribute("cy", String(py[i]));
        }
      }

      /* ── 2. Update edge line endpoints ── */
      for (let k = 0; k < edges.length; k++) {
        const { a, b } = edges[k];
        const el = edgeRefs.current[k];
        if (el) {
          el.setAttribute("x1", String(px[a]));
          el.setAttribute("y1", String(py[a]));
          el.setAttribute("x2", String(px[b]));
          el.setAttribute("y2", String(py[b]));
        }
      }

      /* ── 3. Update triangle polygon points ── */
      for (let k = 0; k < triangles.length; k++) {
        const { a, b, c } = triangles[k];
        const el = triRefs.current[k];
        if (el) {
          el.setAttribute(
            "points",
            `${px[a]},${py[a]} ${px[b]},${py[b]} ${px[c]},${py[c]}`
          );
        }
      }

      /* ── 4. Advance pulses and update pulse elements ── */
      for (let k = 0; k < pulseMut.length; k++) {
        const pulse = pulseMut[k];
        pulse.t += pulse.speed * dt;

        // When a pulse completes its edge, pick a new random edge
        if (pulse.t >= 1) {
          pulse.t      = 0;
          pulse.edgeIdx  = Math.floor(rand() * edges.length);
          pulse.colorIdx = Math.floor(rand() * 2);
          pulse.reversed = rand() > 0.5;
          pulse.speed    = 0.00022 + rand() * 0.00025;
        }

        const { a, b } = edges[pulse.edgeIdx];
        const et = easeInOutCubic(pulse.t);

        // Head position
        const headX = pulse.reversed
          ? lerp(px[b], px[a], et)
          : lerp(px[a], px[b], et);
        const headY = pulse.reversed
          ? lerp(py[b], py[a], et)
          : lerp(py[a], py[b], et);

        // Trail: 15% behind the head along the same edge
        const trailT  = Math.max(0, easeInOutCubic(Math.max(0, pulse.t - 0.15)));
        const trailX  = pulse.reversed
          ? lerp(px[b], px[a], trailT)
          : lerp(px[a], px[b], trailT);
        const trailY  = pulse.reversed
          ? lerp(py[b], py[a], trailT)
          : lerp(py[a], py[b], trailT);

        // Opacity envelope: fade in over first 10%, fade out over last 10%
        const opacity = pulse.t < 0.1
          ? pulse.t / 0.1
          : pulse.t > 0.9
          ? (1 - pulse.t) / 0.1
          : 1;

        const headEl = pulseHeadRefs.current[k];
        if (headEl) {
          headEl.setAttribute("cx", String(headX));
          headEl.setAttribute("cy", String(headY));
          headEl.setAttribute("opacity", String(opacity));
        }

        const glowEl = pulseGlowRefs.current[k];
        if (glowEl) {
          glowEl.setAttribute("cx", String(headX));
          glowEl.setAttribute("cy", String(headY));
          glowEl.setAttribute("opacity", String(opacity * 0.35));
        }

        const trailEl = pulseTrailRefs.current[k];
        if (trailEl) {
          trailEl.setAttribute("x1", String(trailX));
          trailEl.setAttribute("y1", String(trailY));
          trailEl.setAttribute("x2", String(headX));
          trailEl.setAttribute("y2", String(headY));
          trailEl.setAttribute("opacity", String(opacity * 0.55));
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [nodes, edges, triangles, initialPulses]);

  /* ── Pulse colors ── */
  const PULSE_COLORS = [CYAN, PURPLE];

  /* ── Initial positions for SSR/first-paint (static base coordinates) ── */
  const initPX = nodes.map(n => n.baseX);
  const initPY = nodes.map(n => n.baseY);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        /* Deep navy radial background — identical to WhaleSonarBackground */
        background:
          "radial-gradient(ellipse 110% 80% at 50% 0%, #070e20 0%, #060b18 60%)",
      }}
    >

      {/* ── SVG mesh layer ── */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          {/* Cyan pulse glow filter */}
          <filter id="pmb-glow-cyan" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Purple pulse glow filter */}
          <filter id="pmb-glow-purple" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Node glow filter */}
          <filter id="pmb-node-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>

          {/* Wide ambient glow for large glow blobs */}
          <filter id="pmb-blob-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>

          {/* Gradient for triangle fills */}
          <linearGradient id="pmb-tri-cyan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={CYAN}   stopOpacity="0.07" />
            <stop offset="100%" stopColor={CYAN} stopOpacity="0"    />
          </linearGradient>
          <linearGradient id="pmb-tri-purple" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PURPLE}   stopOpacity="0.06" />
            <stop offset="100%" stopColor={PURPLE} stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* ── Layer 0: Ambient corner glow blobs (static) ── */}
        <circle
          cx={W * 0.12} cy={H * 0.15}
          r={320}
          fill={PURPLE}
          opacity={0.06}
          filter="url(#pmb-blob-glow)"
        />
        <circle
          cx={W * 0.88} cy={H * 0.75}
          r={280}
          fill={CYAN}
          opacity={0.055}
          filter="url(#pmb-blob-glow)"
        />
        <circle
          cx={W * 0.5} cy={H * 0.05}
          r={200}
          fill={CYAN}
          opacity={0.07}
          filter="url(#pmb-blob-glow)"
        />

        {/* ── Layer 1: Triangle polygon fills ── */}
        <g opacity={0.9}>
          {triangles.map((tri, k) => (
            <polygon
              key={`tri-${k}`}
              ref={el => { if (el) triRefs.current[k] = el; }}
              points={`${initPX[tri.a]},${initPY[tri.a]} ${initPX[tri.b]},${initPY[tri.b]} ${initPX[tri.c]},${initPY[tri.c]}`}
              fill={tri.colorIdx === 0 ? "url(#pmb-tri-cyan)" : "url(#pmb-tri-purple)"}
              stroke="none"
            />
          ))}
        </g>

        {/* ── Layer 2: Mesh edges — base (low opacity) ── */}
        <g>
          {edges.map((edge, k) => {
            // Vary opacity slightly by edge length: shorter = more visible
            const opacityBase = 0.055 + (1 - edge.baseLen / EDGE_THRESHOLD) * 0.07;
            // Every 5th edge gets a subtle purple tint for depth variation
            const stroke = k % 7 === 0
              ? `rgba(124,92,252,${(opacityBase * 0.8).toFixed(3)})`
              : `rgba(0,229,204,${opacityBase.toFixed(3)})`;

            return (
              <line
                key={`edge-${k}`}
                ref={el => { if (el) edgeRefs.current[k] = el; }}
                x1={initPX[edge.a]} y1={initPY[edge.a]}
                x2={initPX[edge.b]} y2={initPY[edge.b]}
                stroke={stroke}
                strokeWidth={k % 11 === 0 ? "1.2" : "0.7"}
              />
            );
          })}
        </g>

        {/* ── Layer 3: Pulse trails ── */}
        {initialPulses.map((pulse, k) => (
          <line
            key={`trail-${k}`}
            ref={el => { if (el) pulseTrailRefs.current[k] = el; }}
            x1={initPX[edges[pulse.edgeIdx]?.a ?? 0]}
            y1={initPY[edges[pulse.edgeIdx]?.a ?? 0]}
            x2={initPX[edges[pulse.edgeIdx]?.a ?? 0]}
            y2={initPY[edges[pulse.edgeIdx]?.a ?? 0]}
            stroke={PULSE_COLORS[pulse.colorIdx]}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={0}
          />
        ))}

        {/* ── Layer 4: Pulse glow halos (large, blurred) ── */}
        {initialPulses.map((pulse, k) => (
          <circle
            key={`glow-${k}`}
            ref={el => { if (el) pulseGlowRefs.current[k] = el; }}
            cx={initPX[edges[pulse.edgeIdx]?.a ?? 0]}
            cy={initPY[edges[pulse.edgeIdx]?.a ?? 0]}
            r={14}
            fill={PULSE_COLORS[pulse.colorIdx]}
            opacity={0}
            filter={pulse.colorIdx === 0 ? "url(#pmb-glow-cyan)" : "url(#pmb-glow-purple)"}
          />
        ))}

        {/* ── Layer 5: Pulse heads (crisp core dot) ── */}
        {initialPulses.map((pulse, k) => (
          <circle
            key={`head-${k}`}
            ref={el => { if (el) pulseHeadRefs.current[k] = el; }}
            cx={initPX[edges[pulse.edgeIdx]?.a ?? 0]}
            cy={initPY[edges[pulse.edgeIdx]?.a ?? 0]}
            r={pulse.colorIdx === 0 ? 2.8 : 2.4}
            fill={PULSE_COLORS[pulse.colorIdx]}
            opacity={0}
          />
        ))}

        {/* ── Layer 6: Vertex nodes — glow halo ── */}
        {nodes.map((n, i) => (
          <circle
            key={`node-glow-${i}`}
            cx={initPX[i]}
            cy={initPY[i]}
            r={5}
            fill={i % 3 === 0 ? CYAN : PURPLE}
            opacity={0.12}
            filter="url(#pmb-node-glow)"
          />
        ))}

        {/* ── Layer 7: Vertex nodes — crisp core ── */}
        {nodes.map((n, i) => (
          <circle
            key={`node-${i}`}
            ref={el => { if (el) nodeRefs.current[i] = el; }}
            cx={initPX[i]}
            cy={initPY[i]}
            r={i % 5 === 0 ? 2.2 : 1.4}
            fill={i % 3 === 0 ? CYAN : PURPLE}
            opacity={i % 5 === 0 ? 0.55 : 0.30}
          />
        ))}

      </svg>

      {/* ── Bottom fade vignette — keeps form readable ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "55%",
          background:
            "linear-gradient(to top, #060b18 0%, rgba(6,11,24,0.6) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}