"use client";

import { EditRecipe } from "@/lib/types";
import { SlidersHorizontal, Monitor, AlertTriangle } from "lucide-react";
import { validateDimensions, getDownscaledDimensions } from "@/utils/video-validation";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  onExport: () => void;
}

export default function ExportSettings({ recipe, onChange, onExport }: Props) {
  const label = recipe.quality <= 20 ? "High" : recipe.quality <= 24 ? "Balanced" : "Small file";

  // Check current safety status based on custom dimensions
  const safetyStatus = validateDimensions(recipe.customWidth, recipe.customHeight);

  const handleExportTrigger = () => {
    // 1. Hard Block: Prevent browser from crashing
    if (safetyStatus === "blocked") {
      alert("❌ Resolution Blocked: Dimensions exceed 8K. Please reduce resolution to prevent a browser crash.");
      return;
    }

    // 2. Warning: Offer auto-scaling for 4K+ resolutions
    if (safetyStatus === "warning") {
      const shouldScale = confirm(
        "⚠️ High Resolution Warning: Exporting at 4K+ in-browser may be extremely slow or crash your tab. " +
        "Would you like to auto-scale to a safe 4K limit?"
      );

      if (shouldScale) {
        const { width, height } = getDownscaledDimensions(recipe.customWidth, recipe.customHeight);
        onChange({ customWidth: width, customHeight: height });
        return; // Stop here so user sees the new dimensions in the UI
      }
    }

    // 3. Safe to proceed
    onExport();
  };

  return (
    <div className="space-y-6">
      {/* Quality Settings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
            <SlidersHorizontal size={10} /> Quality
          </label>
          <span className="text-sm font-heading font-bold text-film-600">
            {label}
            <span className="font-normal text-xs text-[var(--muted)] ml-1">CRF {recipe.quality}</span>
          </span>
        </div>
        <input
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

      {/* Custom Dimensions */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
            <Monitor size={10} /> Custom Resolution
          </label>
          {safetyStatus !== 'safe' && (
            <span className={`text-[10px] flex items-center gap-1 font-bold ${safetyStatus === 'blocked' ? 'text-red-500' : 'text-amber-500'}`}>
              <AlertTriangle size={10} /> {safetyStatus.toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase text-[var(--muted)]">Width</span>
            <input 
              type="number"
              value={recipe.customWidth}
              onChange={(e) => onChange({ customWidth: Math.max(1, Number(e.target.value)) })}
              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm focus:border-film-600 outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase text-[var(--muted)]">Height</span>
            <input 
              type="number"
              value={recipe.customHeight}
              onChange={(e) => onChange({ customHeight: Math.max(1, Number(e.target.value)) })}
              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm focus:border-film-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Final Action */}
      <button
        onClick={handleExportTrigger}
        className={`w-full py-3 rounded font-bold transition-all ${
          safetyStatus === 'blocked' 
          ? 'bg-red-900/50 text-red-200 cursor-not-allowed' 
          : 'bg-film-600 hover:bg-film-500 text-white shadow-lg shadow-film-600/20'
        }`}
      >
        {safetyStatus === 'blocked' ? 'Resolution Too High' : 'Export Video'}
      </button>
    </div>
  );
}