"use client";

import { useEffect, useRef, useState } from "react";

export interface ThumbnailStrip {
  thumbnails: string[];
  isGenerating: boolean;
}

const THUMBNAIL_COUNT = 10;
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 68;

export function useThumbnailStrip(file: File | null): ThumbnailStrip {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Each run gets a unique ID — if a new run starts or component
  // unmounts, the stale run checks this ref and bails out early,
  // preventing CPU work and blob URL leaks after cancellation.
  const runIdRef = useRef(0);

  // Track all blob URLs created by the current run so we can
  // revoke them on cleanup even if the run was cancelled mid-way.
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      return;
    }

    // Increment run ID — any in-flight run will see a mismatch and stop.
    const runId = ++runIdRef.current;

    // Revoke any blob URLs from the previous run before starting.
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];

    setThumbnails([]);
    setIsGenerating(true);

    // One shared offscreen canvas — created once per run, destroyed on cleanup.
    const canvas = document.createElement("canvas");
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = THUMBNAIL_HEIGHT;
    const ctx = canvas.getContext("2d");

    // One shared video element — created once per run, destroyed on cleanup.
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let cancelled = false;

    const cleanup = () => {
      cancelled = true;

      // Stop seeking and free the media pipeline.
      video.pause();
      video.removeAttribute("src");
      video.load();

      // Release the object URL for the source file.
      URL.revokeObjectURL(objectUrl);

      // Revoke any blob URLs we emitted — prevents memory leak
      // when the run is cancelled mid-way.
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };

    const generateFrames = async (duration: number) => {
      if (cancelled || runIdRef.current !== runId) return;

      const results: string[] = [];

      for (let i = 0; i < THUMBNAIL_COUNT; i++) {
        // Guard: bail if a new file was selected or component unmounted.
        if (cancelled || runIdRef.current !== runId) {
          // Revoke any blobs we already generated in this partial run.
          results.forEach((u) => URL.revokeObjectURL(u));
          return;
        }

        const seekTime = (i / (THUMBNAIL_COUNT - 1)) * duration;

        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);

            // Double-check cancellation inside the async callback.
            if (cancelled || runIdRef.current !== runId) {
              resolve();
              return;
            }

            try {
              if (ctx) {
                ctx.drawImage(video, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
              }
              canvas.toBlob(
                (blob) => {
                  if (!blob || cancelled || runIdRef.current !== runId) {
                    resolve();
                    return;
                  }
                  const url = URL.createObjectURL(blob);
                  // Track this URL so we can revoke it on cleanup.
                  blobUrlsRef.current.push(url);
                  results.push(url);
                  // Stream thumbnails in as they are ready.
                  setThumbnails([...results]);
                  resolve();
                },
                "image/jpeg",
                0.7,
              );
            } catch {
              resolve();
            }
          };

          video.addEventListener("seeked", onSeeked);
          video.currentTime = seekTime;
        });
      }

      if (!cancelled && runIdRef.current === runId) {
        setIsGenerating(false);
      }
    };

    video.addEventListener(
      "loadedmetadata",
      () => {
        if (cancelled || runIdRef.current !== runId) return;
        const duration = isFinite(video.duration) ? video.duration : 0;
        if (duration <= 0) {
          setIsGenerating(false);
          return;
        }
        generateFrames(duration).catch(() => {
          if (!cancelled) setIsGenerating(false);
        });
      },
      { once: true },
    );

    video.addEventListener(
      "error",
      () => {
        if (cancelled || runIdRef.current !== runId) return;
        setIsGenerating(false);
      },
      { once: true },
    );

    // Return cleanup — runs when file changes or component unmounts.
    return cleanup;
  }, [file]);

  return { thumbnails, isGenerating };
}