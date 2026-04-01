/*
 * AxonAILogo — "AXONAI" wordmark only
 * Renders as a styled HTML span to avoid SVG text clipping issues.
 */

interface AxonAILogoProps {
  height?: number;
  iconOnly?: boolean;
}

export default function AxonAILogo({ height = 40 }: AxonAILogoProps) {
  const fontSize = Math.round(height * 0.58);

  return (
    <span
      style={{
        fontFamily: "'Sora', 'Arial Black', sans-serif",
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        letterSpacing: "0.18em",
        color: "#ffffff",
        lineHeight: 1,
        display: "inline-block",
        userSelect: "none",
      }}
    >
      AXONAI
    </span>
  );
}
