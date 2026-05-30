import { describe, it, expect } from "vitest";
import { formatBytes } from "../ffmpeg";

describe("formatBytes", () => {
  it("formats bytes correctly", () => expect(formatBytes(1024)).toBe("1.0 KB"));
  it("formats megabytes", () => expect(formatBytes(1048576)).toBe("1.0 MB"));
  it("handles zero", () => expect(formatBytes(0)).toBe("0.0 KB"));

  it("formats fractional kilobytes with one decimal place", () =>
    expect(formatBytes(1536)).toBe("1.5 KB"));

  it("continues formatting large values in megabytes", () =>
    expect(formatBytes(1073741824)).toBe("1024.0 MB"));

  it("formats larger megabyte values consistently", () =>
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB"));
});
