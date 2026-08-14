import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_RECIPE } from "../lib/constants";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function KeyboardShortcutHarness({
  file = null,
  onToggleShortcutsModal,
}: {
  file?: File | null;
  onToggleShortcutsModal: () => void;
}) {
  useKeyboardShortcuts({
    file,
    recipe: DEFAULT_RECIPE,
    resetSettings: vi.fn(),
    updateRecipe: vi.fn(),
    handleExport: vi.fn(),
    status: "idle",
    cancelExport: vi.fn(),
    onToggleShortcutsModal,
  });

  return <input aria-label="Shortcut input" />;
}

describe("useKeyboardShortcuts", () => {
  it("toggles the shortcuts panel when ? is pressed before a file is loaded", () => {
    const onToggleShortcutsModal = vi.fn();

    render(
      <KeyboardShortcutHarness
        onToggleShortcutsModal={onToggleShortcutsModal}
      />
    );

    fireEvent.keyDown(window, { key: "?" });

    expect(onToggleShortcutsModal).toHaveBeenCalledTimes(1);
  });

  it("does not toggle shortcuts while typing in an input", () => {
    const onToggleShortcutsModal = vi.fn();

    render(
      <KeyboardShortcutHarness
        onToggleShortcutsModal={onToggleShortcutsModal}
      />
    );

    fireEvent.keyDown(screen.getByLabelText("Shortcut input"), { key: "?" });

    expect(onToggleShortcutsModal).not.toHaveBeenCalled();
  });
});
