// src/components/UndoToast.tsx
"use client";

import { useEffect, useState } from "react";

interface UndoToastProps {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number; // ms, default 5000
}

export default function UndoToast({
  visible,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!visible) {
      setProgress(100);
      return;
    }

    const interval = 50; // update every 50ms
    const steps = duration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1
                 bg-zinc-900 text-white rounded-xl shadow-lg px-4 pt-3 pb-2 min-w-[260px]"
    >
      <div className="flex items-center justify-between gap-6">
        <span className="text-sm">Settings reset.</span>
        <button
          onClick={() => {
            onUndo();
            onDismiss();
          }}
          className="text-sm font-semibold text-yellow-400 hover:text-yellow-300
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-yellow-400 rounded"
        >
          Undo
        </button>
      </div>
      {/* shrinking progress bar */}
      <div className="h-0.5 w-full bg-zinc-700 rounded-full overflow-hidden mt-1">
        <div
          className="h-full bg-yellow-400 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}