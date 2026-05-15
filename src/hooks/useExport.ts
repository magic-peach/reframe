"use client";

import { useCallback } from "react";
import { playExportCompleteSound } from "@/lib/exportSound";

/**
 * Returns a stable async handler that runs `exportWork`, then plays the
 * completion chime when the user has enabled export sounds in settings.
 */
export function useExportWithSound(exportWork: () => Promise<void>) {
  return useCallback(async () => {
    try {
      await exportWork();
      playExportCompleteSound();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [exportWork]);
}
