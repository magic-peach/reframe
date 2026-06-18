import { useState, useCallback } from "react";
import type { TimelineTrack, TimelineClip, TrackType } from "@/components/MultiTrackTimeline";

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

const TRACK_LABELS: Record<TrackType, string> = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  text:  "Text",
};

export function useMultiTrackTimeline(initialDuration = 30) {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: makeId(),
      type: "video",
      label: "Video 1",
      clips: [],
    },
    {
      id: makeId(),
      type: "audio",
      label: "Audio 1",
      clips: [],
    },
  ]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(initialDuration);

  const addTrack = useCallback((type: TrackType) => {
    setTracks((prev) => {
      const count = prev.filter((t) => t.type === type).length + 1;
      return [
        ...prev,
        {
          id: makeId(),
          type,
          label: `${TRACK_LABELS[type]} ${count}`,
          clips: [],
        },
      ];
    });
  }, []);

  const addClip = useCallback(
    (trackId: string, clip: Omit<TimelineClip, "id">) => {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, { ...clip, id: makeId() }] }
            : t,
        ),
      );
    },
    [],
  );

  const moveClip = useCallback(
    (clipId: string, trackId: string, newStart: number) => {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? { ...c, start: newStart } : c,
                ),
              }
            : t,
        ),
      );
    },
    [],
  );

  const deleteClip = useCallback((clipId: string, trackId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t,
      ),
    );
  }, []);

  return {
    tracks,
    duration,
    currentTime,
    setCurrentTime,
    addTrack,
    addClip,
    moveClip,
    deleteClip,
  };
}