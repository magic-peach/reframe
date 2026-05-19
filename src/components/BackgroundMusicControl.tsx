"use client";

import React, { useRef } from "react";
import { EditRecipe } from "@/lib/types";

interface BackgroundMusicControlProps {
  recipe: EditRecipe;
  onChange: (recipe: EditRecipe) => void;
}

export default function BackgroundMusicControl({
  recipe,
  onChange,
}: BackgroundMusicControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange({ ...recipe, bgMusicFile: file });
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange({ ...recipe, bgMusicFile: null });
  };

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-black/20 space-y-4">
      <h3 className="text-sm font-medium text-gray-200">Background Music</h3>

      {/* File Upload Selector */}
      <div className="space-y-2">
        {!recipe.bgMusicFile ? (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 bg-black/40 hover:bg-black/60 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
              <p className="text-xs text-gray-400 font-semibold">Click to upload audio</p>
              <p className="text-[10px] text-gray-500">MP3, WAV, or M4A</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-900 border border-gray-800 rounded-md">
            <div className="truncate pr-2">
              <p className="text-xs text-gray-300 font-medium truncate">
                🎵 {recipe.bgMusicFile.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {(recipe.bgMusicFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/30 hover:bg-red-950/60 rounded border border-red-900/50 transition"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Controls panel (only visible if an audio file is uploaded) */}
      {recipe.bgMusicFile && (
        <div className="space-y-4 pt-2 border-t border-gray-900">
          {/* Original Video Volume Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <label>Original Video Volume</label>
              <span>{Math.round((recipe.keepAudio ? recipe.videoVolume : 0) * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="keepAudioToggle"
                checked={recipe.keepAudio}
                onChange={(e) => onChange({ ...recipe, keepAudio: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!recipe.keepAudio}
                value={recipe.keepAudio ? recipe.videoVolume : 0}
                onChange={(e) =>
                  onChange({ ...recipe, videoVolume: parseFloat(e.target.value) })
                }
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 accent-blue-500"
              />
            </div>
          </div>

          {/* Background Music Volume Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <label>Music Volume</label>
              <span>{Math.round(recipe.bgMusicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={recipe.bgMusicVolume}
              onChange={(e) =>
                onChange({ ...recipe, bgMusicVolume: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Loop Music Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="loopBgMusic"
              checked={recipe.loopBgMusic}
              onChange={(e) => onChange({ ...recipe, loopBgMusic: e.target.checked })}
              className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="loopBgMusic" className="text-xs text-gray-400 cursor-pointer select-none">
              Loop music if shorter than video
            </label>
          </div>
        </div>
      )}
    </div>
  );
}