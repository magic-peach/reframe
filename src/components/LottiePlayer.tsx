"use client";

import { useEffect, useRef } from "react";

interface Props {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export default function LottiePlayer({
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
  label,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let anim: { pause: () => void; destroy: () => void } | null = null;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    import("lottie-web").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const lottie = mod.default ?? mod;
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: prefersReducedMotion ? false : autoplay, // don't autoplay if reduced motion
        animationData,
      });

      // Pause on first frame if reduced motion (keeps content visible, not removed)
      if (prefersReducedMotion && anim) {
        anim.pause();
      }
    });

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationData, loop, autoplay]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        style={style}
        aria-hidden="true"
      />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}