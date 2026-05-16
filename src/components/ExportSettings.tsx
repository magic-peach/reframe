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
  const label = recipe.quality <= 21 
    ? "High" 
    : recipe.quality <= 25 
    ? "Balanced" 
    : "Small file";

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
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--muted)]">Best quality</span>
        <span className="text-[10px] text-[var(--muted)]">Smallest file</span>
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
