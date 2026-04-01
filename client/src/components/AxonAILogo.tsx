/*
 * AxonAILogo — SVG logo matching the uploaded brand identity
 * Design: Concentric blue arc/wave lines (fingerprint-like) + "AXONAI" wordmark
 * Colors: Blue arcs (#1A6FFF to #4DA3FF), white wordmark
 *
 * ViewBox: 0 0 160 48 — wide enough for icon (48px) + "AXONAI" text (no clipping)
 */

interface AxonAILogoProps {
  /** Height of the full logo. Width scales proportionally. */
  height?: number;
  /** Show only the icon mark without the wordmark */
  iconOnly?: boolean;
}

export default function AxonAILogo({ height = 40, iconOnly = false }: AxonAILogoProps) {
  if (iconOnly) {
    // Icon-only: 48×48 viewBox showing just the arcs
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ArcLines cx={24} cy={44} />
      </svg>
    );
  }

  // Full logo: wordmark only — "AXONAI" text
  const aspectRatio = 100 / 32;
  return (
    <svg
      width={height * aspectRatio}
      height={height}
      viewBox="0 0 100 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wordmark — AXONAI only */}
      <text
        x="0"
        y="24"
        fontFamily="'Sora', 'Arial Black', sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="3"
        fill="#ffffff"
      >
        AXONAI
      </text>
    </svg>
  );
}

/** Concentric arc icon — 7 arcs fanning upward like a signal/fingerprint */
function ArcLines({ cx, cy }: { cx: number; cy: number }) {
  const startAngle = 210; // degrees — left foot of arcs
  const endAngle = 330;   // degrees — right foot of arcs

  const arcs = [
    { r: 6,  strokeWidth: 2.0 },
    { r: 10, strokeWidth: 1.9 },
    { r: 14, strokeWidth: 1.8 },
    { r: 18, strokeWidth: 1.7 },
    { r: 22, strokeWidth: 1.6 },
    { r: 26, strokeWidth: 1.5 },
    { r: 30, strokeWidth: 1.4 },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <g>
      {arcs.map((arc, i) => {
        const x1 = cx + arc.r * Math.cos(toRad(startAngle));
        const y1 = cy + arc.r * Math.sin(toRad(startAngle));
        const x2 = cx + arc.r * Math.cos(toRad(endAngle));
        const y2 = cy + arc.r * Math.sin(toRad(endAngle));

        // Arc sweeping upward (minor arc, sweep-flag=1 goes clockwise through top)
        const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${arc.r} ${arc.r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

        // Colour: inner arcs are deeper blue, outer arcs are lighter/brighter blue
        const t = i / (arcs.length - 1);
        const rVal = Math.round(26 + t * 52);          // 26 → 78
        const gVal = Math.round(111 + t * 89);         // 111 → 200
        const bVal = 255;
        const color = `rgb(${rVal}, ${Math.min(gVal, 200)}, ${bVal})`;

        return (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={arc.strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </g>
  );
}
