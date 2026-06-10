import { useEffect } from "react";
import { EditRecipe, ExportStatus } from "@/lib/types";
import { PRESETS } from "@/lib/presets";

interface UseKeyboardShortcutsProps {
  file: File | null;
  recipe: EditRecipe;
  resetSettings: () => void;
  updateRecipe: (recipe: Partial<EditRecipe>) => void;
  handleExport: () => void;
  status: ExportStatus;
  cancelExport: () => void;
  onToggleShortcutsModal: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDeleteSelected?: () => void;
}

export function useKeyboardShortcuts({
  file,
  recipe,
  resetSettings,
  updateRecipe,
  handleExport,
  status,
  cancelExport,
  onToggleShortcutsModal,
  videoRef,
  undo,
  redo,
  canUndo,
  canRedo,
  onDeleteSelected,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Prevent triggering shortcuts when typing in inputs, textareas, selects, or editable fields
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // 1. Export Shortcut: Ctrl/Cmd + Shift + E OR Ctrl/Cmd + Enter
      if (
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "e") ||
        (isCtrlOrCmd && e.key === "Enter")
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (file && status === "idle") {
          handleExport();
        }
        return;
      }

      // 2. Undo Shortcut: Ctrl/Cmd + Z
      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.stopPropagation();
        if (canUndo) {
          undo();
        }
        return;
      }

      // 3. Redo Shortcut: Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y
      if (
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "z") ||
        (isCtrlOrCmd && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (canRedo) {
          redo();
        }
        return;
      }

      // 4. Delete / Backspace Shortcut
      if (e.key === "Delete" || e.key === "Backspace") {
        if (onDeleteSelected) {
          e.preventDefault();
          e.stopPropagation();
          onDeleteSelected();
        }
        return;
      }

      if (!file) return;

      // 5. Spacebar Shortcut (Play/Pause)
      if (e.key === " " || e.code === "Space") {
        const video = videoRef.current;
        if (video) {
          e.preventDefault();
          e.stopPropagation();
          if (video.paused) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
        return;
      }

      // 6. Frame-by-frame Step Backward: "," (comma)
      if (e.key === ",") {
        const video = videoRef.current;
        if (video) {
          e.preventDefault();
          e.stopPropagation();
          video.pause();
          const FRAME_TIME = 1 / 30; // Assuming 30fps standard
          video.currentTime = Math.max(0, video.currentTime - FRAME_TIME);
        }
        return;
      }

      // 7. Frame-by-frame Step Forward: "." (period)
      if (e.key === ".") {
        const video = videoRef.current;
        if (video) {
          e.preventDefault();
          e.stopPropagation();
          video.pause();
          const FRAME_TIME = 1 / 30; // Assuming 30fps standard
          video.currentTime = Math.min(video.duration || 0, video.currentTime + FRAME_TIME);
        }
        return;
      }



      switch (e.key) {
        case "m":
        case "M":
          updateRecipe({ keepAudio: !recipe.keepAudio });
          break;

        case "r":
        case "R":
          resetSettings();
          break;

        case "Escape":
          if (status === "exporting") cancelExport();
          break;

        case "?":
          onToggleShortcutsModal();
          break;

        default:
          if (e.key >= "1" && e.key <= "9") {
            const index = parseInt(e.key) - 1;
            if (PRESETS[index]) {
              updateRecipe({ preset: PRESETS[index].id });
            }
          }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    file,
    recipe,
    resetSettings,
    updateRecipe,
    handleExport,
    status,
    cancelExport,
    onToggleShortcutsModal,
    videoRef,
    undo,
    redo,
    canUndo,
    canRedo,
    onDeleteSelected,
  ]);
}
