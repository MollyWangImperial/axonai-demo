/*
 * AxonAILogo — SVG logo matching the uploaded brand identity
 * Design: Concentric blue arc/wave lines (fingerprint-like) above "AXONAI" wordmark
 * Colors: Blue arcs (#1A6FFF to #4DA3FF gradient), white wordmark
 */

interface AxonAILogoProps {
  /** Height of the full logo (icon + wordmark). Width scales proportionally. */
  height?: number;
  /** Show only the icon mark without the wordmark */
  iconOnly?: boolean;
  /** Color variant */
  variant?: "default" | "light";
}

export default function AxonAILogo({
  height = 40,
  iconOnly = false,
  variant = "default",
}: AxonAILogoProps) {
  const textColor = variant === "light" ? "#ffffff" : "#ffffff";

  if (iconOnly) {
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 60 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ArcLines />
      </svg>
    );
  }

  // Full logo: icon on top, wordmark below — or side by side for navbar
  return (
    <svg
      width={(height / 50) * 130}
      height={height}
      viewBox="0 0 130 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon mark — concentric arcs, centered at x=28 */}
      <g transform="translate(2, 0)">
        <ArcLines />
      </g>
      {/* Wordmark — AXONAI */}
      <text
        x="62"
        y="35"
        fontFamily="'Sora', 'Arial', sans-serif"
        fontWeight="700"
        fontSize="18"
        letterSpacing="3"
        fill={textColor}
      >
        AXONAI
      </text>
    </svg>
  );
}

/** The concentric arc icon — 7 arcs fanning upward like a fingerprint/signal */
function ArcLines() {
  // Center point at bottom of the arc group
  const cx = 28;
  const cy = 44;

  // Each arc: radius, start angle, end angle (in degrees, measured from positive x-axis)
  // The arcs fan upward — from about 210° to 330° (opening upward)
  const startAngle = 210; // degrees
  const endAngle = 330;   // degrees

  const arcs = [
    { r: 8,  strokeWidth: 2.2 },
    { r: 13, strokeWidth: 2.0 },
    { r: 18, strokeWidth: 1.9 },
    { r: 23, strokeWidth: 1.8 },
    { r: 28, strokeWidth: 1.7 },
    { r: 33, strokeWidth: 1.6 },
    { r: 38, strokeWidth: 1.5 },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <g>
      {arcs.map((arc, i) => {
        const x1 = cx + arc.r * Math.cos(toRad(startAngle));
        const y1 = cy + arc.r * Math.sin(toRad(startAngle));
        const x2 = cx + arc.r * Math.cos(toRad(endAngle));
        const y2 = cy + arc.r * Math.sin(toRad(endAngle));

        // large-arc-flag = 0 (minor arc, going upward through top)
        const d = `M ${x1} ${y1} A ${arc.r} ${arc.r} 0 0 1 ${x2} ${y2}`;

        // Gradient from bright blue to lighter blue as arcs get larger
        const t = i / (arcs.length - 1);
        const r = Math.round(26 + t * 51);   // 26 → 77
        const g = Math.round(111 + t * 92);  // 111 → 203 (but capped)
        const b = Math.round(255);
        const color = `rgb(${r}, ${Math.min(g, 200)}, ${b})`;

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
