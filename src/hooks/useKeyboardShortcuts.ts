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
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrCmd && e.shiftKey && e.key === "E") {
        e.preventDefault();
        e.stopPropagation();   // ← add this
        if (file && status === "idle") handleExport();
        return;
      }

      if (!file) return;

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
  }, [file, recipe, resetSettings, updateRecipe, handleExport, status, cancelExport, onToggleShortcutsModal]);
}