import { describe, it, expect } from "vitest";
import { hasSupportedVideoExtension, isAcceptableVideoCandidate } from "../fileValidation";

describe("fileValidation", () => {
  it("accepts generic MIME files when the extension is supported", () => {
    const file = new File(["video"], "clip.mp4", { type: "application/octet-stream" });
    expect(isAcceptableVideoCandidate(file)).toBe(true);
  });

  it("accepts empty MIME files when the extension is supported", () => {
    const file = new File(["video"], "clip.webm", { type: "" });
    expect(isAcceptableVideoCandidate(file)).toBe(true);
  });

  it("rejects unsupported extensions when the mime type is not video", () => {
    const file = new File(["video"], "clip.txt", { type: "text/plain" });
    expect(isAcceptableVideoCandidate(file)).toBe(false);
  });

  it("detects supported extensions", () => {
    expect(hasSupportedVideoExtension("movie.MKV")).toBe(true);
    expect(hasSupportedVideoExtension("picture.png")).toBe(false);
  });
});
