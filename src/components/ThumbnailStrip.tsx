"use client";

import { useThumbnailStrip } from "@/hooks/useThumbnailStrip";

interface Props {
  file: File | null;
  currentTime: number;
  duration: number;
  onSeek: (t: number) => void;
}

export default function ThumbnailStrip({
  file,
  currentTime,
  duration,
  onSeek,
}: Props) {
  const { thumbnails, isGenerating } = useThumbnailStrip(file);

  if (!file) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(ratio * duration, duration)));
  };

  return (
    <div className="w-full space-y-1">
      <div
        className="relative w-full h-14 flex rounded-lg overflow-hidden border border-[var(--border)] cursor-pointer"
        onClick={handleClick}
        role="slider"
        aria-label="Video timeline scrubber"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
      >
        {/* Skeleton placeholders while generating */}
        {isGenerating &&
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full bg-gray-700 animate-pulse border-r border-[var(--border)] last:border-r-0"
            />
          ))}

        {/* Actual thumbnails */}
        {!isGenerating &&
          thumbnails.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Frame ${i + 1}`}
              className="flex-1 h-full object-cover border-r border-[var(--border)] last:border-r-0"
              draggable={false}
            />
          ))}

        {/* Playhead indicator */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-film-500 pointer-events-none z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-film-500 rounded-full -translate-x-1/2 -translate-y-0" />
          </div>
        )}
      </div>

      {isGenerating && (
        <p className="text-[10px] font-heading text-[var(--muted)]">
          Generating thumbnails…
        </p>
      )}
    </div>
  );
}