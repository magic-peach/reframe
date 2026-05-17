"use client";
import { useEffect } from "react";

import { EditRecipe } from "@/lib/types"
import { SPEED_STEPS } from "@/lib/constants"
import { Volume2, VolumeX, Gauge, AlertTriangle, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function AudioSpeedControl({ recipe, onChange }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        e.key.toLowerCase() === "m" &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        onChange({
          keepAudio: !recipe.keepAudio,
        });
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [recipe.keepAudio, onChange]);

  const speedIndex = SPEED_STEPS.indexOf(recipe.speed as (typeof SPEED_STEPS)[number]);
  
  const getSpeedDescription = (speed: number) => {
    if (speed <= 0.5) return "Very Slow";
    if (speed < 1) return "Slow";
    if (speed === 1) return "Normal";
    if (speed <= 1.5) return "Fast";
    return "Very Fast";
  };

  const isModified = recipe.speed !== 1 || !recipe.keepAudio;

  return (
    <div className="space-y-4">
    <div className="space-y-3 border-b border-[var(--border)] pb-4">

  <div className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
    <Music2 size={10} />
    Background Music
  </div>

  <input
    type="file"
    accept=".mp3,.wav,.m4a,audio/*"
    onChange={(e) =>
      onChange({
        backgroundMusic: e.target.files?.[0] || null,
      })
    }
    className="block w-full text-xs"
  />

  {recipe.backgroundMusic && (
    <p className="text-[10px] text-film-600 break-all">
      {recipe.backgroundMusic.name}
    </p>
  )}

  {/* Music Volume */}
  <div>
    <div className="flex items-center justify-between mb-2">
      <label htmlFor="bg-music-volume" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
        Music Volume
      </label>

      <span className="text-xs text-film-600">
        {Math.round(recipe.backgroundMusicVolume * 100)}%
      </span>
    </div>

    <input
      id="bg-music-volume"
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={recipe.backgroundMusicVolume ?? 0.3}
      onChange={(e) =>
        onChange({
          backgroundMusicVolume: Number(e.target.value),
        })
      }
      className="w-full"
    />
  </div>

  {/* Original Audio Volume */}
  <div>
    <div className="flex items-center justify-between mb-2">
      <label htmlFor="original-audio-volume" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
        Original Audio Volume
      </label>

      <span className="text-xs text-film-600">
        {Math.round(recipe.originalAudioVolume * 100)}%
      </span>
    </div>

    <input
      id="original-audio-volume"
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={recipe.originalAudioVolume ?? 1}
      onChange={(e) =>
        onChange({
          originalAudioVolume: Number(e.target.value),
        })
      }
      className="w-full"
    />
  </div>

  {/* Loop Music */}
  <label className="flex items-center gap-2 text-sm text-film-700">
    <input
      type="checkbox"
      checked={recipe.loopBackgroundMusic ?? false}
      onChange={(e) =>
        onChange({
          loopBackgroundMusic: e.target.checked,
        })
      }
    />

    Loop background music
  </label>

</div>
      {isModified && (
        <div className="flex justify-end animate-fade-in">
          <button
            type="button"
            onClick={() => onChange({ speed: 1, keepAudio: true })}
            className="text-[11px] font-heading font-semibold uppercase tracking-wider text-film-600 hover:text-film-700 hover:underline transition-all duration-150"
          >
            Reset to Default
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange({ keepAudio: !recipe.keepAudio })}
        aria-label={recipe.keepAudio ? "Mute video audio" : "Unmute video audio"}
        aria-pressed={recipe.keepAudio}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150",
          "hover:scale-[1.01] active:scale-[0.99]",
          recipe.keepAudio
            ? "border-film-300 bg-film-50 text-film-700"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
        )}
      >
        {recipe.keepAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span className="sr-only">
          {recipe.keepAudio ? "Turn audio off" : "Turn audio on"}
        </span>
        <span className="text-sm font-heading font-semibold">
          {recipe.keepAudio ? "Audio on" : "Muted"}
        </span>
      </button>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            id="speed-label"
            htmlFor="speed-control"
            className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1"
          >
            <Gauge size={10} /> Speed
          </label>

          <div className="text-right">
            <span className="text-sm font-heading font-bold text-film-600 block">
              {recipe.speed}x
            </span>
            <span id="speed-description" className="text-[10px] text-[var(--muted)]">
              {getSpeedDescription(recipe.speed)}
            </span>
          </div>
        </div>
        <input
          id="speed-control"
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={speedIndex === -1 ? 3 : speedIndex}
          onChange={(e) => onChange({ speed: SPEED_STEPS[Number(e.target.value)] })}
          aria-labelledby="speed-label"
          aria-describedby="speed-description"
          aria-label="Video playback speed"
          aria-valuetext={`${recipe.speed}x speed, ${getSpeedDescription(recipe.speed)}`}
          className="w-full h-11 accent-film-600 cursor-pointer"
        />
        <div className="flex justify-between mt-1 overflow-hidden">
          {SPEED_STEPS.map((s) => (
            <span
              key={s}
              className="text-[9px] text-[var(--muted)] truncate text-center min-w-0 px-[1px]"
            >
              {s}x
            </span>
          ))}
        </div>
      </div>

      {recipe.keepAudio && (recipe.trimStart !== 0 || recipe.trimEnd !== null) && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700 leading-tight flex items-start gap-2 animate-fade-in">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <p>
            Note: If audio doesn&apos;t start within the selected range, the output will be silent.
          </p>
        </div>
      )}
    </div>
  );
}
