import { describe, expect, it } from "vitest";
import {
  getMetadataImportErrorMessage,
  isRecognizedVideoSignature,
  validateVideoFileBasics,
} from "@/utils/videoImportValidation";

describe("validateVideoFileBasics", () => {
  it("accepts supported video files", () => {
    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });

    expect(validateVideoFileBasics(file)).toEqual({ valid: true });
  });

  it("accepts supported extensions when the browser does not provide a MIME type", () => {
    const file = new File(["video"], "clip.mov", { type: "" });

    expect(validateVideoFileBasics(file)).toEqual({ valid: true });
  });

  it("rejects unsupported extensions with supported format guidance", () => {
    const file = new File(["video"], "clip.txt", { type: "video/mp4" });
    const result = validateVideoFileBasics(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("not supported");
    expect(result.error).toContain("MP4, WebM, MOV, AVI, and MKV");
  });

  it("rejects non-video MIME types with a user-friendly message", () => {
    const file = new File(["video"], "clip.mp4", { type: "text/plain" });
    const result = validateVideoFileBasics(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("not a video");
    expect(result.error).toContain("MP4, WebM, MOV, AVI, and MKV");
  });

  it("rejects empty files before metadata extraction", () => {
    const file = new File([], "clip.mp4", { type: "video/mp4" });
    const result = validateVideoFileBasics(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });
});

describe("isRecognizedVideoSignature", () => {
  it("recognizes MP4 and MOV ftyp signatures", () => {
    expect(isRecognizedVideoSignature(new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]))).toBe(true);
  });

  it("recognizes WebM and MKV EBML signatures", () => {
    expect(isRecognizedVideoSignature(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
  });

  it("rejects unknown signatures", () => {
    expect(isRecognizedVideoSignature(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe(false);
  });
});

describe("getMetadataImportErrorMessage", () => {
  it("explains corrupted or unsupported metadata failures", () => {
    const message = getMetadataImportErrorMessage(new Error("Failed to load video metadata"));

    expect(message).toContain("metadata");
    expect(message).toContain("corrupted");
    expect(message).toContain("unsupported codec");
  });
});
