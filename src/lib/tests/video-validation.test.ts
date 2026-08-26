import { describe, expect, it } from "vitest";
import {
  getDownscaledDimensions,
  validateDimensions,
  validateVideoFile,
} from "../../utils/video-validation";

const makeFile = (name: string, type: string, bytes: number[]) =>
  new File([new Uint8Array(bytes)], name, { type });

describe("validateDimensions", () => {
  it("blocks frames larger than 8K", () => {
    expect(validateDimensions(8000, 8000)).toBe("blocked");
  });

  it("warns for frames above 4K", () => {
    expect(validateDimensions(5000, 3000)).toBe("warning");
  });

  it("marks standard sizes as safe", () => {
    expect(validateDimensions(1920, 1080)).toBe("safe");
  });
});

describe("getDownscaledDimensions", () => {
  it("keeps dimensions even", () => {
    const result = getDownscaledDimensions(5000, 3000);
    expect(result.width % 2).toBe(0);
    expect(result.height % 2).toBe(0);
  });
});

describe("validateVideoFile", () => {
  it("rejects invalid extensions first", async () => {
    const result = await validateVideoFile(
      makeFile("clip.txt", "video/mp4", [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Invalid video extension");
    }
  });

  it("rejects non-video MIME types second", async () => {
    const result = await validateVideoFile(
      makeFile("clip.mp4", "application/octet-stream", [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Invalid Content-Type");
    }
  });

  it("rejects files that do not match a known video signature", async () => {
    const result = await validateVideoFile(
      makeFile("clip.mp4", "video/mp4", [0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77])
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("File contents do not match");
    }
  });

  it("accepts a valid mp4 signature", async () => {
    const result = await validateVideoFile(
      makeFile("clip.mp4", "video/mp4", [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32])
    );

    expect(result).toEqual({ valid: true });
  });
});
