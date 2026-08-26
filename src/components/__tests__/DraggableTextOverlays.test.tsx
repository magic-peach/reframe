import React from "react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DraggableTextOverlays from "../DraggableTextOverlays";

vi.mock("@/utils/fontLoader", () => ({
  getFontFamily: (fontName?: string) => fontName ?? "Arial",
  ensureFontLoaded: vi.fn().mockResolvedValue(undefined),
}));

describe("DraggableTextOverlays keyboard support", () => {
  const overlay = {
    id: "text-1",
    text: "Hello",
    x: 50,
    y: 50,
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "normal" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves the overlay with arrow keys", async () => {
    const onUpdateText = vi.fn();

    render(
      React.createElement(DraggableTextOverlays, {
        recipe: { textOverlays: [overlay] } as any,
        containerWidth: 200,
        containerHeight: 100,
        selectedTextId: overlay.id,
        onUpdateText,
        onSelectText: vi.fn(),
      })
    );

    const node = screen.getByRole("button", { name: /text overlay: hello/i });
    node.focus();

    act(() => {
      fireEvent.keyDown(node, { key: "ArrowRight" });
    });

    expect(onUpdateText).toHaveBeenCalledWith(overlay.id, { x: 51, y: 50 });
  });

  it("enters edit mode with Enter", () => {
    render(
      React.createElement(DraggableTextOverlays, {
        recipe: { textOverlays: [overlay] } as any,
        containerWidth: 200,
        containerHeight: 100,
        selectedTextId: overlay.id,
        onUpdateText: vi.fn(),
        onSelectText: vi.fn(),
      })
    );

    const node = screen.getByRole("button", { name: /text overlay: hello/i });
    node.focus();

    fireEvent.keyDown(node, { key: "Enter" });

    expect(screen.getByRole("button", { name: /text overlay: hello/i })).toHaveClass("cursor-text");
  });
});
