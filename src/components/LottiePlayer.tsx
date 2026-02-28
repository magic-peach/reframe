"use client";

import { useEffect, useRef } from "react";

interface Props {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LottiePlayer({
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let anim: { destroy: () => void } | null = null;

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
    });

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} style={style} />;
}
