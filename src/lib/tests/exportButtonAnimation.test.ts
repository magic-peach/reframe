import { describe, expect, it } from "vitest";

import {
  getExportButtonAnimationClass,
  isReadyToExport,
  READY_EXPORT_BUTTON_ANIMATION_CLASS,
} from "../exportButtonAnimation";

describe("exportButtonAnimation", () => {
  it("marks export as ready only when a file is loaded and status is idle", () => {
    expect(isReadyToExport(true, "idle")).toBe(true);
    expect(isReadyToExport(false, "idle")).toBe(false);
    expect(isReadyToExport(true, "loading-engine")).toBe(false);
    expect(isReadyToExport(true, "exporting")).toBe(false);
    expect(isReadyToExport(true, "done")).toBe(false);
    expect(isReadyToExport(true, "error")).toBe(false);
  });

  it("returns the reduced-motion-safe animation class only in the ready state", () => {
    expect(getExportButtonAnimationClass(true, "idle")).toBe(
      READY_EXPORT_BUTTON_ANIMATION_CLASS
    );
    expect(getExportButtonAnimationClass(false, "idle")).toBe("");
    expect(getExportButtonAnimationClass(true, "exporting")).toBe("");
    expect(getExportButtonAnimationClass(true, "done")).toBe("");
  });
});
