"use client";

import { useRef, useState, useCallback } from "react";
import { Film, Music, Image, Type, Plus, Trash2, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrackType = "video" | "audio" | "image" | "text";

export interface TimelineClip {
  id: string;
  name: string;
  type: TrackType;
  start: number;
  duration: number;
  color: string;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  label: string;
  clips: TimelineClip[];
}

interface Props {
  tracks: TimelineTrack[];
  duration: number;
  currentTime: number;
  onTimeChange: (t: number) => void;
  onClipMove: (clipId: string, trackId: string, newStart: number) => void;
  onClipDelete: (clipId: string, trackId: string) => void;
  onAddTrack: (type: TrackType) => void;
}

const TRACK_COLORS: Record<TrackType, string> = {
  video: "bg-blue-500/70 border-blue-400",
  audio: "bg-green-500/70 border-green-400",
  image: "bg-purple-500/70 border-purple-400",
  text:  "bg-amber-500/70 border-amber-400",
};

const TRACK_ICONS: Record<TrackType, React.ReactNode> = {
  video: <Film size={11} />,
  audio: <Music size={11} />,
  image: <Image size={11} />,
  text:  <Type size={11} />,
};

const PIXELS_PER_SECOND = 60;
const TRACK_HEIGHT = 48;

export default function MultiTrackTimeline({
  tracks,
  duration,
  currentTime,
  onTimeChange,
  onClipMove,
  onClipDelete,
  onAddTrack,
}: Props) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    clipId: string;
    trackId: string;
    offsetX: number;
  } | null>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  const totalWidth = Math.max(duration * PIXELS_PER_SECOND, 400);

  // Click on ruler to scrub
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const t = Math.max(0, Math.min(x / PIXELS_PER_SECOND, duration));
      onTimeChange(t);
    },
    [duration, onTimeChange],
  );

  // Drag start
  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      clipId: string,
      trackId: string,
      clipStartPx: number,
    ) => {
      e.stopPropagation();
      setSelectedClip(clipId);
      setDragging({
        clipId,
        trackId,
        offsetX: e.clientX - clipStartPx,
      });
    },
    [],
  );

  // Drag move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragging || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragging.offsetX;
      const newStart = Math.max(0, x / PIXELS_PER_SECOND);
      onClipMove(dragging.clipId, dragging.trackId, newStart);
    },
    [dragging, onClipMove],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Ruler tick marks
  const ticks = Array.from(
    { length: Math.ceil(duration) + 1 },
    (_, i) => i,
  );

  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
          Timeline
        </span>
        <div className="flex items-center gap-1.5">
          {(["video", "audio", "image", "text"] as TrackType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onAddTrack(t)}
              title={`Add ${t} track`}
              className="flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-film-400 transition-all text-[10px] font-heading font-semibold uppercase"
            >
              <Plus size={9} />
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Track labels */}
        <div className="w-24 shrink-0 border-r border-[var(--border)]">
          {/* Ruler spacer */}
          <div className="h-6 border-b border-[var(--border)]" />
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{ height: TRACK_HEIGHT }}
              className="flex items-center gap-1.5 px-3 border-b border-[var(--border)] text-[var(--muted)]"
            >
              {TRACK_ICONS[track.type]}
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider truncate">
                {track.label}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable timeline area */}
        <div className="flex-1 overflow-x-auto">
          <div
            ref={timelineRef}
            style={{ width: totalWidth, minWidth: "100%" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Ruler */}
            <div
              className="h-6 relative border-b border-[var(--border)] cursor-pointer bg-[var(--bg)]"
              onClick={handleRulerClick}
            >
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: tick * PIXELS_PER_SECOND }}
                >
                  <div className="w-px h-2 bg-[var(--border)]" />
                  <span className="text-[9px] font-heading text-[var(--muted)] mt-0.5">
                    {tick}s
                  </span>
                </div>
              ))}

              {/* Playhead on ruler */}
              <div
                className="absolute top-0 bottom-0 w-px bg-film-500 z-10 pointer-events-none"
                style={{ left: currentTime * PIXELS_PER_SECOND }}
              >
                <div className="w-2.5 h-2.5 bg-film-500 rounded-full -translate-x-1/2 -translate-y-0" />
              </div>
            </div>

            {/* Tracks */}
            {tracks.map((track) => (
              <div
                key={track.id}
                style={{ height: TRACK_HEIGHT }}
                className="relative border-b border-[var(--border)] bg-[var(--bg)]/50"
              >
                {/* Playhead line across tracks */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-film-500/40 z-10 pointer-events-none"
                  style={{ left: currentTime * PIXELS_PER_SECOND }}
                />

                {track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    className={cn(
                      "absolute top-2 bottom-2 rounded border cursor-grab active:cursor-grabbing flex items-center gap-1 px-2 overflow-hidden transition-shadow",
                      TRACK_COLORS[clip.type],
                      selectedClip === clip.id && "ring-2 ring-white/60 shadow-lg",
                    )}
                    style={{
                      left: clip.start * PIXELS_PER_SECOND,
                      width: Math.max(clip.duration * PIXELS_PER_SECOND, 40),
                    }}
                    onMouseDown={(e) =>
                      handleDragStart(
                        e,
                        clip.id,
                        track.id,
                        clip.start * PIXELS_PER_SECOND,
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClip(clip.id);
                    }}
                  >
                    <GripHorizontal size={10} className="shrink-0 opacity-60" />
                    <span className="text-[10px] font-heading font-semibold text-white truncate">
                      {clip.name}
                    </span>
                    <button
                      type="button"
                      className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipDelete(clip.id, track.id);
                      }}
                      title="Delete clip"
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] font-heading text-[var(--muted)]">
          {tracks.length} track{tracks.length !== 1 ? "s" : ""} ·{" "}
          {tracks.reduce((a, t) => a + t.clips.length, 0)} clip
          {tracks.reduce((a, t) => a + t.clips.length, 0) !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] font-heading text-[var(--muted)]">
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}