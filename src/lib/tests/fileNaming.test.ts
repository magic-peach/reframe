import { describe, it, expect } from "vitest";
import { buildDownloadFilename, sanitizeFilenameBase } from "../fileNaming";

describe("fileNaming", () => {
  it("removes invalid filename characters and normalizes spacing", () => {
    expect(sanitizeFilenameBase('  my:video / export  ')).toBe("myvideo export");
  });

  it("falls back to a safe default when the name becomes empty", () => {
    expect(sanitizeFilenameBase("   ")).toBe("reframe-video");
  });

  it("builds a complete filename with the requested extension", () => {
    expect(buildDownloadFilename('final*cut', "mp4")).toBe("finalcut.mp4");
  });
});
