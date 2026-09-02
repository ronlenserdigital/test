import { TiltSurface } from "@/components/motion/tilt-surface";

/**
 * Celestino operations graph: eight protected layers from Users to Monitoring,
 * rendered as an isometric stack with live connection flow. Inline SVG so it is
 * part of the server-rendered HTML (no LCP delay), CSS-animated (no JS on the
 * critical path), static under prefers-reduced-motion, and simplified on mobile
 * by the calling section.
 */

const LAYERS = [
  { id: "users", label: "Users", status: "Trained" },
  { id: "identity", label: "Identity", status: "MFA enforced" },
  { id: "endpoints", label: "Endpoints", status: "EDR coverage" },
  { id: "network", label: "Network", status: "Segmented" },
  { id: "cloud", label: "Cloud", status: "Baselined" },
  { id: "applications", label: "Applications", status: "Patched" },
  { id: "data", label: "Data", status: "Backed up" },
  { id: "monitoring", label: "Monitoring", status: "24/7 alerting" },
] as const;

const W = 560;
const H = 600;
const PLANE_W = 250;
const PLANE_H = 46;
const SKEW = 70; // horizontal offset for the isometric plane
const GAP = 66;
const TOP = 46;
const LEFT = 150;

function planePath(y: number) {
  const x0 = LEFT;
  const x1 = LEFT + PLANE_W;
  return `M${x0 + SKEW} ${y} H${x1 + SKEW} L${x1} ${y + PLANE_H} H${x0} Z`;
}

export function HeroVisual({ className }: { className?: string }) {
  return (
    <TiltSurface className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-labelledby="hero-visual-title hero-visual-desc"
        className="h-auto w-full max-w-[640px]"
      >
        <title id="hero-visual-title">Celestino layered operations model</title>
        <desc id="hero-visual-desc">
          Eight stacked infrastructure layers, Users, Identity, Endpoints, Network, Cloud, Applications, Data and Monitoring, connected top to bottom, each with a control status such as MFA enforced, EDR coverage, Segmented and Backed up.
        </desc>
        <defs>
          <linearGradient id="plane-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--surface-03)" />
            <stop offset="1" stopColor="var(--surface-01)" />
          </linearGradient>
          <linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent-primary)" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="var(--accent-primary)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--accent-primary)" stopOpacity="0.15" />
          </linearGradient>
          <style>{`
            .hv-flow { stroke-dasharray: 6 10; animation: dash-flow 2.4s linear infinite; }
            .hv-pulse { animation: pulse-dot 2.6s ease-in-out infinite; }
            .hv-pulse:nth-of-type(2n) { animation-delay: .6s }
            .hv-pulse:nth-of-type(3n) { animation-delay: 1.2s }
            @media (prefers-reduced-motion: reduce) { .hv-flow, .hv-pulse { animation: none; } }
          `}</style>
        </defs>

        {/* Background measurement grid */}
        <g stroke="var(--grid-line)" strokeWidth="1">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} x1={i * 48 + 8} y1="0" x2={i * 48 + 8} y2={H} />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 48 + 12} x2={W} y2={i * 48 + 12} />
          ))}
        </g>

        {/* Spine: the vertical control path through every layer */}
        <line x1={LEFT + PLANE_W / 2 + SKEW / 2} y1={TOP + PLANE_H / 2} x2={LEFT + PLANE_W / 2 + SKEW / 2} y2={TOP + GAP * 7 + PLANE_H / 2} stroke="url(#spine)" strokeWidth="1.5" />
        <line
          className="hv-flow"
          x1={LEFT + PLANE_W / 2 + SKEW / 2}
          y1={TOP + PLANE_H / 2}
          x2={LEFT + PLANE_W / 2 + SKEW / 2}
          y2={TOP + GAP * 7 + PLANE_H / 2}
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {LAYERS.map((layer, i) => {
          const y = TOP + i * GAP;
          const cx = LEFT + PLANE_W / 2 + SKEW / 2;
          const cy = y + PLANE_H / 2;
          const isMonitoring = layer.id === "monitoring";
          return (
            <g key={layer.id}>
              {/* Plane */}
              <path d={planePath(y)} fill="url(#plane-fill)" stroke={isMonitoring ? "var(--accent-secondary)" : "var(--border-strong)"} strokeWidth="1" />
              {/* Plane inner tracks */}
              <path d={`M${LEFT + SKEW * 0.5 + 18} ${y + PLANE_H * 0.5} H${LEFT + PLANE_W + SKEW * 0.5 - 18}`} stroke="var(--border-subtle)" strokeWidth="1" />
              {/* Nodes on plane */}
              {[0.22, 0.5, 0.78].map((t, n) => {
                const nx = LEFT + SKEW * 0.5 + PLANE_W * t;
                const ny = y + PLANE_H * 0.5;
                const active = n === 1;
                return (
                  <g key={n}>
                    <rect x={nx - 5} y={ny - 5} width="10" height="10" rx="2" fill={active ? "var(--accent-primary)" : "var(--surface-02)"} stroke={active ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="1" />
                    {n !== 1 ? <line x1={nx + (n === 0 ? 5 : -5)} y1={ny} x2={cx + (n === 0 ? -5 : 5)} y2={ny} stroke="var(--accent-primary)" strokeOpacity="0.5" strokeWidth="1" /> : null}
                  </g>
                );
              })}
              {/* Spine node */}
              <circle cx={cx} cy={cy} r="3" fill="var(--background-primary)" stroke="var(--accent-primary)" strokeWidth="1.5" />

              {/* Layer label (left) */}
              <text x={LEFT - 16} y={cy + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="0.08em" fill="var(--text-secondary)">
                {String(i + 1).padStart(2, "0")}
              </text>
              <text x={LEFT - 36} y={cy + 4} textAnchor="end" fontFamily="var(--font-display)" fontWeight="600" fontSize="13" fill="var(--text-primary)">
                {layer.label}
              </text>

              {/* Status (right) */}
              <g transform={`translate(${LEFT + PLANE_W + SKEW + 18}, ${cy})`}>
                <circle className="hv-pulse" r="3.5" fill={isMonitoring ? "var(--accent-secondary)" : "var(--accent-primary)"} />
                <text x="12" y="4" fontFamily="var(--font-mono)" fontSize="10.5" letterSpacing="0.06em" fill="var(--text-muted)">
                  {layer.status.toUpperCase()}
                </text>
              </g>
            </g>
          );
        })}

        {/* Monitoring ring encircling the whole stack */}
        <rect
          x={LEFT - 8}
          y={TOP - 14}
          width={PLANE_W + SKEW + 16}
          height={GAP * 7 + PLANE_H + 28}
          rx="10"
          fill="none"
          stroke="var(--accent-secondary)"
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <text x={LEFT - 8} y={TOP - 22} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.14em" fill="var(--accent-secondary)">
          MONITORED · PATCHED · RECOVERABLE
        </text>
      </svg>
    </TiltSurface>
  );
}

/** Compact static stack used on small screens. */
export function HeroVisualCompact({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 120" role="img" aria-label="Eight protected infrastructure layers from Users to Monitoring" className={className}>
      {LAYERS.map((layer, i) => {
        const x = 8 + i * 39;
        return (
          <g key={layer.id}>
            <rect x={x} y={20} width="32" height="56" rx="4" fill="var(--surface-02)" stroke={layer.id === "monitoring" ? "var(--accent-secondary)" : "var(--border-strong)"} strokeWidth="1" />
            <rect x={x + 11} y={43} width="10" height="10" rx="2" fill="var(--accent-primary)" />
            {i < LAYERS.length - 1 ? <line x1={x + 32} y1="48" x2={x + 39} y2="48" stroke="var(--accent-primary)" strokeWidth="1.5" /> : null}
            <text x={x + 16} y={96} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--text-muted)">
              {layer.label.toUpperCase().slice(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
