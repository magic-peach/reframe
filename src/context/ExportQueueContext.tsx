"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ExportResult, EditRecipe, BackgroundMusicOptions, ImageOverlayOptions } from "@/lib/types";
import { exportVideo } from "@/lib/ffmpeg";

export type ExportJobStatus = "queued" | "exporting" | "done" | "error";

export interface ExportJob {
  id: string;
  name: string;
  status: ExportJobStatus;
  progress: number;
  result?: ExportResult;
  error?: string;
  startedAt?: number;
  file: File;
  recipe: EditRecipe;
  musicOptions?: BackgroundMusicOptions;
  overlayOptions?: ImageOverlayOptions;
  abortController: AbortController;
}

interface ExportQueueContextType {
  jobs: ExportJob[];
  enqueueExport: (
    file: File,
    recipe: EditRecipe,
    musicOptions?: BackgroundMusicOptions,
    overlayOptions?: ImageOverlayOptions
  ) => void;
  cancelJob: (id: string) => void;
  dismissJob: (id: string) => void;
}

const ExportQueueContext = createContext<ExportQueueContextType | null>(null);

export function useExportQueue() {
  const ctx = useContext(ExportQueueContext);
  if (!ctx) throw new Error("useExportQueue must be used within ExportQueueProvider");
  return ctx;
}

export function ExportQueueProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const isProcessingRef = useRef(false);

  const enqueueExport = useCallback((
    file: File,
    recipe: EditRecipe,
    musicOptions?: BackgroundMusicOptions,
    overlayOptions?: ImageOverlayOptions
  ) => {
    const newJob: ExportJob = {
      id: crypto.randomUUID(),
      name: file.name,
      status: "queued",
      progress: 0,
      file,
      recipe,
      musicOptions,
      overlayOptions,
      abortController: new AbortController(),
    };
    setJobs((prev) => [...prev, newJob]);
  }, []);

  const cancelJob = useCallback((id: string) => {
    setJobs((prev) => {
      const job = prev.find(j => j.id === id);
      if (job && (job.status === "queued" || job.status === "exporting")) {
        job.abortController.abort();
        return prev.map(j => j.id === id ? { ...j, status: "error", error: "Cancelled by user" } : j);
      }
      return prev;
    });
  }, []);

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const processNextJob = useCallback(async () => {
    if (isProcessingRef.current) return;

    let nextJob: ExportJob | undefined;
    setJobs((prev) => {
      nextJob = prev.find(j => j.status === "queued");
      if (!nextJob) return prev;
      return prev.map((j) => (j.id === nextJob!.id ? { ...j, status: "exporting", startedAt: Date.now() } : j));
    });

    if (!nextJob) return;

    isProcessingRef.current = true;

    try {
      const result = await exportVideo(
        nextJob.file,
        nextJob.recipe,
        (progress) => {
          setJobs((prev) =>
            prev.map((j) => (j.id === nextJob!.id ? { ...j, progress } : j))
          );
        },
        nextJob.abortController.signal,
        nextJob.musicOptions,
        nextJob.overlayOptions
      );

      setJobs((prev) =>
        prev.map((j) => (j.id === nextJob!.id ? { ...j, status: "done", result, progress: 100 } : j))
      );
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== nextJob!.id) return j;
          if (nextJob!.abortController.signal.aborted) {
            return { ...j, status: "error", error: "Cancelled by user" };
          }
          return { ...j, status: "error", error: err instanceof Error ? err.message : "Export failed" };
        })
      );
    } finally {
      isProcessingRef.current = false;
      setJobs((prev) => [...prev]);
    }
  }, []);

  useEffect(() => {
    const hasQueued = jobs.some(j => j.status === "queued");
    if (hasQueued && !isProcessingRef.current) {
      processNextJob();
    }
  }, [jobs, processNextJob]);

  useEffect(() => {
    const hasExporting = jobs.some(j => j.status === "exporting");
    if (!hasExporting) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [jobs]);

  return (
    <ExportQueueContext.Provider value={{ jobs, enqueueExport, cancelJob, dismissJob }}>
      {children}
    </ExportQueueContext.Provider>
  );
}
