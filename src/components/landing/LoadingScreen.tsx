"use client";

import { useEffect, useRef, useState } from "react";

interface TextParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  ease: number;
  friction: number;
}

export default function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: TextParticle[] = [];
    let animationFrameId: number;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#ffffff" : "#181412";
    const accentColor = "#e63946"; // film-600

    // Render hidden text to inspect pixel data
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      const fontSize = Math.min(canvas.width * 0.12, 100);
      tempCtx.font = `bold ${fontSize}px sans-serif`;
      tempCtx.fillStyle = "#ffffff";
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.fillText("REFRAME", canvas.width / 2, canvas.height / 2 - 40);

      const pixels = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // Sample pixels
      const gap = 6;
      for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
          const index = (y * canvas.width + x) * 4;
          const alpha = pixels[index + 3];
          if (alpha && alpha > 128) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              originX: x,
              originY: y,
              color: Math.random() > 0.85 ? accentColor : textColor,
              size: Math.random() * 2 + 1,
              vx: 0,
              vy: 0,
              ease: Math.random() * 0.08 + 0.04,
              friction: 0.9,
            });
          }
        }
      }
    }

    const mouse = {
      x: 0,
      y: 0,
      radius: 90,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Calculate interactive reaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          const pushX = Math.cos(angle) * force * 15;
          const pushY = Math.sin(angle) * force * 15;
          p.vx -= pushX;
          p.vy -= pushY;
        }

        // Return to origin
        p.vx += (p.originX - p.x) * p.ease;
        p.vy += (p.originY - p.y) * p.ease;

        p.vx *= p.friction;
        p.vy *= p.friction;

        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Fake loading progress
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 800);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg)] transition-colors duration-300">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-none" />
      
      {/* Loading Progress Text */}
      <div className="absolute bottom-20 flex flex-col items-center gap-3 pointer-events-none select-none">
        <span className="text-xs font-mono font-bold tracking-[0.35em] text-[var(--muted)] uppercase animate-pulse">
          Initializing local workspace
        </span>
        <span className="text-2xl font-black text-[var(--text)]">{percent}%</span>
        {/* Visual Loading bar */}
        <div className="h-[3px] w-56 rounded bg-[var(--border)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
