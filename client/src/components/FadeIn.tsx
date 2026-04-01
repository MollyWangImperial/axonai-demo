/*
 * FadeIn — Scroll-triggered fade-up animation using Intersection Observer
 * Design: Bioluminescent Dark Science — smooth entrance animations
 */
import { useEffect, useRef, useState } from "react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
}

export default function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: FadeInProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const getTransform = () => {
    if (direction === "up") return "translateY(32px)";
    if (direction === "left") return "translateX(-32px)";
    if (direction === "right") return "translateX(32px)";
    return "none";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : getTransform(),
        transition: `opacity 0.7s ease, transform 0.7s ease`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
