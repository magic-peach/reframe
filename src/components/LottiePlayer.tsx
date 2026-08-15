"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from 'lottie-web';

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
    let anim: AnimationItem | null = null;

    import("lottie-web").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const lottie = mod.default ?? mod;
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay,
        animationData,
      });
      const mediaQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      const handleMotionChange = () => {
        if (!anim) return;

        if (mediaQuery.matches) {
          anim.goToAndStop(1, true);
        } else {
          anim.play();
        }
      };
      handleMotionChange();
      mediaQuery.addEventListener("change", handleMotionChange);
    

    return () => {
      cancelled = true;
      mediaQuery.removeEventListener("change", handleMotionChange);
      anim?.destroy();
    };
    });
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

