"use client";

import { cn } from "@/lib/utils";
import { SlidersHorizontal, Info as InfoIcon, Cpu } from "lucide-react";
import { EditRecipe, VideoCodec } from "@/lib/types";

const CODEC_OPTIONS: { value: VideoCodec; label: string; note: string }[] = [
  { value: "libx264", label: "H.264", note: "Best compatibility (MP4)" },
  { value: "libx265", label: "H.265", note: "Smaller File (MP4)" },
  { value: "libvpx-vp9", label: "VP9", note: "Best for YouTube (WebM)" },
  { value: "libaom-av1", label: "AV1", note: "Best quality (WebM)" },
]

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  const label = recipe.quality <= 21
    ? "High"
    : recipe.quality <= 25
    ? "Balanced"
    : "Small file";

  return (
  <>
    
    <div>
        <div className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1 mb-2">
          <Cpu size={10} /> Video Codec
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CODEC_OPTIONS.map(({ value, label, note }) => {
            const active = recipe.codec === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ codec: value })}
                className={`text-left rounded-md px-2.5 py-2 border text-xs transition-colors
                  ${active
                    ? "border-film-600 bg-film-600/10 text-film-600"
                    : "border-[var(--border)] text-[var(--fg)] hover:border-film-600/50"
                  }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">{note}</div>
              </button>
            );
          })}
        </div>
        {(recipe.codec === "libx265" || recipe.codec === "libaom-av1") && (
          <p className="mt-1.5 text-[10px] text-amber-400">
            ⚠ H.265 / AV1 may not be available in all browsers. H.264 is always safe.
          </p>
        )}
      </div>
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="quality-control" className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
          <SlidersHorizontal size={10} /> Quality
          <span className="cursor-help" title="CRF (Constant Rate Factor): lower = higher quality, larger file. 18 = best quality, 30 = smallest file.">
            <InfoIcon size={14} />
          </span>
        </label>
        <span className="text-sm font-heading font-bold text-film-600">
          {label}
          <span className="font-normal text-sm text-[var(--muted)] ml-2">CRF {recipe.quality}</span>
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
        aria-describedby="quality-description"
        aria-label="Video export quality (CRF)"
        aria-valuetext={`${label} quality, CRF value ${recipe.quality}`}
        className="w-full accent-film-600 cursor-pointer"
      />
      <div id="quality-description" className="flex justify-between mt-1">
        <span className="text-sm text-[var(--muted)]">Best quality</span>
        <span className="text-sm text-[var(--muted)]">Smallest file</span>
      </div>
      <div className="flex items-center justify-between mt-4">
        <label htmlFor="sound-on-completion" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
          Sound on completion
        </label>

        <input
          id="sound-on-completion"
          type="checkbox"
          checked={recipe.soundOnCompletion}
          onChange={(e) =>
            onChange({
              soundOnCompletion: e.target.checked,
            })
          }
        />
      </div>
    </div>
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="stabilization-toggle" className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
          <SlidersHorizontal size={10} /> Stabilization
        </label>
         <span className="flex text-sm font-heading font-bold text-film-600">
          <input
            id="stabilization-toggle"
            type="checkbox"
            checked={recipe.stabilization}
            onChange={(e) =>onChange({ stabilization: e.target.checked })}
            aria-label="Enable video stabilization"
            aria-checked={recipe.stabilization}
            className="w-full accent-film-600 cursor-pointer"
          />
          {/* <span className="font-normal text-sm text-[var(--muted)] ml-2">deshake</span> */}
        </span>
      </div>

      <div className="flex justify-end">
        <span className={cn("text-sm", recipe.stabilization ? "text-red-700" : "text-[var(--muted)]")}>Note: significantly increases processing time.</span>
      </div>
    </div>
  </>

  );
}