import { describe, it, expect } from "vitest";
import { formatBytes } from "../utils";

describe("formatBytes", () => {
  it("returns '0 Bytes' for zero input", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats values below 1 KB as Bytes", () => {
    expect(formatBytes(512)).toBe("512 Bytes");
    expect(formatBytes(1)).toBe("1 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1572864)).toBe("1.5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("formats terabytes", () => {
    expect(formatBytes(1099511627776)).toBe("1 TB");
  });

  it("respects custom decimal precision", () => {
    expect(formatBytes(1536, 2)).toBe("1.5 KB");
    expect(formatBytes(1048576, 0)).toBe("1 MB");
    expect(formatBytes(123456789, 2)).toBe("117.74 MB");
  });

  it("clamps negative decimals to zero", () => {
    expect(formatBytes(1536, -1)).toBe("2 KB");
  });
});
