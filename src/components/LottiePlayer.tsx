"use client";

import { useEffect, useRef } from "react";

interface Props {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// mounts lottie-web imperatively to avoid SSR issues and skip the
// react wrapper's type complexity
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
    let anim: { destroy: () => void } | null = null;

    // dynamically import lottie-web (not lottie-react) to avoid SSR issues
    import("lottie-web").then((mod) => {
      const lottie = mod.default ?? mod;
      anim = lottie.loadAnimation({
        container: containerRef.current!,
        renderer: "svg",
        loop,
        autoplay,
        animationData,
      });
    });

    return () => {
      anim?.destroy();
    };
  // we intentionally only run this once per mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} style={style} />;
}
