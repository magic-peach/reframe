"use client";

import { useState } from "react";
import { EditRecipe } from "@/lib/types";
import { SlidersHorizontal, Link2, Check } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  const [copied, setCopied] = useState(false);
  const label = recipe.quality <= 20 ? "High" : recipe.quality <= 24 ? "Balanced" : "Small file";

  // NEW: Copy link logic
  const handleCopyLink = () => {
    // window.location.href automatically includes the #hash we set in the hook!
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    
    // Reset the button back to normal after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Existing Quality Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="quality-control" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
            <SlidersHorizontal size={10} /> Quality
          </label>
          <span className="text-sm font-heading font-bold text-film-600">
            {label}
            <span className="font-normal text-xs text-[var(--muted)] ml-1">CRF {recipe.quality}</span>
          </span>
        </div>
        <input
          id="quality-control"
          type="range"
          min={18}
          max={30}
          step={1}
          value={recipe.quality}
          onChange={(e) => onChange({ quality: Number(e.target.value) })}
          className="w-full accent-film-600 cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--muted)]">Best quality</span>
          <span className="text-[10px] text-[var(--muted)]">Smallest file</span>
        </div>
      </div>

      {/* NEW: Copy Settings Link Button */}
      <div className="pt-3 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-heading font-bold uppercase tracking-wide rounded-lg transition-all active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Copied to clipboard!</span>
            </>
          ) : (
            <>
              <Link2 size={14} className="text-[var(--muted)]" />
              Copy settings link
            </>
          )}
        </button>
        <p className="text-[9px] text-[var(--muted)] text-center mt-2 leading-tight">
          Share this link to instantly load your exact dimensions, quality, and trim settings.
        </p>
      </div>
    </div>
  );
}