"use client"; // CRITICAL: Tell Next.js this is a browser component

import { useEffect, useState } from "react";
import { isExportSoundEnabled, setExportSoundEnabled } from "@/lib/exportSound";

export function ExportSoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1. Wait for the browser to be ready
  useEffect(() => {
    setMounted(true);
    setEnabled(isExportSoundEnabled());
  }, []);

  const handleToggle = (checked: boolean) => {
    console.log("Setting sound to:", checked); // Check the console for this!
    setEnabled(checked);
    setExportSoundEnabled(checked);
  };

  // Prevent "hydration" errors (common in Next.js)
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-white/5">
      <input
        id="sound-toggle"
        type="checkbox"
        className="cursor-pointer h-4 w-4"
        checked={enabled}
        onChange={(e) => handleToggle(e.target.checked)}
      />
      <label htmlFor="sound-toggle" className="text-sm cursor-pointer select-none">
        Sound on export completion
      </label>
    </div>
  );
}