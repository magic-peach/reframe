import { ExportStatus } from "@/lib/types";

export const READY_EXPORT_BUTTON_ANIMATION_CLASS =
  "motion-safe:animate-export-ready-pulse motion-reduce:animate-none";

export function isReadyToExport(hasFile: boolean, status: ExportStatus): boolean {
  return hasFile && status === "idle";
}

export function getExportButtonAnimationClass(
  hasFile: boolean,
  status: ExportStatus
): string {
  return isReadyToExport(hasFile, status)
    ? READY_EXPORT_BUTTON_ANIMATION_CLASS
    : "";
}
