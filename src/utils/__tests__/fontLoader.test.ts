import { describe, it, expect, beforeEach } from "vitest";
import {
  storeFontFile,
  getFontFileEntry,
  getFFmpegFontArg,
  registerCustomFont,
  clearCustomFonts,
} from "@/utils/fontLoader";

function makeMockFile(name: string): File {
  return new File(["mock content"], name, { type: "font/ttf" });
}

describe("storeFontFile / getFontFileEntry", () => {
  beforeEach(() => {
    clearCustomFonts();
  });

  it("stores and retrieves a font file entry", () => {
    const file = makeMockFile("OpenSans.ttf");
    storeFontFile("OpenSans", file);
    const entry = getFontFileEntry("OpenSans");
    expect(entry).toBeDefined();
    expect(entry!.file).toBe(file);
    expect(entry!.extension).toBe("ttf");
  });

  it("extracts extension from file name", () => {
    const file = makeMockFile("CustomFont.otf");
    storeFontFile("CustomFont", file);
    expect(getFontFileEntry("CustomFont")!.extension).toBe("otf");
  });

  it("lowers extension case", () => {
    const file = makeMockFile("Test.TTF");
    storeFontFile("Test", file);
    expect(getFontFileEntry("Test")!.extension).toBe("ttf");
  });

  it("returns undefined for unknown font", () => {
    expect(getFontFileEntry("NonExistent")).toBeUndefined();
  });

  it("overwrites existing entry with same name", () => {
    const fileA = makeMockFile("A.ttf");
    const fileB = makeMockFile("A.ttf");
    storeFontFile("MyFont", fileA);
    storeFontFile("MyFont", fileB);
    expect(getFontFileEntry("MyFont")!.file).toBe(fileB);
  });
});

describe("getFFmpegFontArg", () => {
  beforeEach(() => {
    clearCustomFonts();
  });

  it("returns empty string when no fontFamily and no fontPath", () => {
    expect(getFFmpegFontArg("", "")).toBe("");
  });

  it("returns empty string when fontName is empty even if fontPath is set", () => {
    expect(getFFmpegFontArg("", "/vfs/font.ttf")).toBe("");
  });

  it("returns empty string for known custom font without fontPath", () => {
    registerCustomFont("TestFont", "blob:http://test/font");
    expect(getFFmpegFontArg("TestFont", "")).toBe("");
  });

  it("returns fontfile arg for custom font with fontPath", () => {
    registerCustomFont("MyCustomFont", "blob:http://test/font");
    const result = getFFmpegFontArg("MyCustomFont", "/vfs/custom_font.ttf");
    expect(result).toBe("fontfile=/vfs/custom_font.ttf");
  });

  it("returns empty string for built-in fonts regardless of fontPath", () => {
    expect(getFFmpegFontArg("Arial", "")).toBe("");
    expect(getFFmpegFontArg("Inter", "/vfs/font.ttf")).toBe("");
  });

  it("escapes colons in fontPath", () => {
    registerCustomFont("PathFont", "blob:http://test/font");
    const result = getFFmpegFontArg("PathFont", "/vfs:with:colons/font.ttf");
    expect(result).toBe("fontfile=/vfs\\:with\\:colons/font.ttf");
  });
});
