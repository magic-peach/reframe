import { describe, it, expect } from "vitest";
import { isValidRecipe, isValidHexColor, sanitizeTextOverlay, RECIPE_VERSION } from "../types";
import { DEFAULT_RECIPE } from "../constants";

describe("isValidRecipe", () => {
  it("accepts the default recipe", () => {
    expect(isValidRecipe(DEFAULT_RECIPE)).toBe(true);
  });

  it("rejects null and undefined", () => {
    expect(isValidRecipe(null)).toBe(false);
    expect(isValidRecipe(undefined)).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isValidRecipe("string")).toBe(false);
    expect(isValidRecipe(42)).toBe(false);
  });

  it("rejects recipe with wrong version", () => {
    const bad = { ...DEFAULT_RECIPE, version: 999 };
    expect(isValidRecipe(bad)).toBe(false);
  });

  it("rejects recipe with out-of-range rotate", () => {
    const bad = { ...DEFAULT_RECIPE, rotate: 42 };
    expect(isValidRecipe(bad)).toBe(false);
  });

  it("rejects recipe with invalid format", () => {
    const bad = { ...DEFAULT_RECIPE, format: "avi" };
    expect(isValidRecipe(bad)).toBe(false);
  });

  it("rejects recipe with non-boolean keepAudio", () => {
    const bad = { ...DEFAULT_RECIPE, keepAudio: 1 };
    expect(isValidRecipe(bad)).toBe(false);
  });

  it("rejects recipe with non-array textOverlays", () => {
    const bad = { ...DEFAULT_RECIPE, textOverlays: "not-an-array" };
    expect(isValidRecipe(bad)).toBe(false);
  });

  it("rejects recipe with missing fields", () => {
    const bad = { version: RECIPE_VERSION };
    expect(isValidRecipe(bad)).toBe(false);
  });
});

describe("isValidHexColor", () => {
  it("accepts 6-digit hex colors", () => {
    expect(isValidHexColor("#ffffff")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#FF5733")).toBe(true);
  });

  it("accepts 3-digit hex colors", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#000")).toBe(true);
  });

  it("accepts 8-digit hex colors with alpha", () => {
    expect(isValidHexColor("#ffffffff")).toBe(true);
    expect(isValidHexColor("#00000080")).toBe(true);
  });

  it("rejects named colors", () => {
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("white")).toBe(false);
  });

  it("rejects invalid strings", () => {
    expect(isValidHexColor("")).toBe(false);
    expect(isValidHexColor("not-a-color")).toBe(false);
    expect(isValidHexColor("#gggggg")).toBe(false);
    expect(isValidHexColor("123456")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidHexColor(42)).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
  });
});

describe("sanitizeTextOverlay", () => {
  it("fills missing fields with defaults", () => {
    const result = sanitizeTextOverlay({});
    expect(result.text).toBe("");
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.fontSize).toBe(48);
    expect(result.color).toBe("#ffffff");
    expect(result.fontWeight).toBe("normal");
  });

  it("clamps fontSize to 12-120 range", () => {
    expect(sanitizeTextOverlay({ fontSize: 999999 }).fontSize).toBe(120);
    expect(sanitizeTextOverlay({ fontSize: 0 }).fontSize).toBe(12);
    expect(sanitizeTextOverlay({ fontSize: 1 }).fontSize).toBe(12);
    expect(sanitizeTextOverlay({ fontSize: 48 }).fontSize).toBe(48);
  });

  it("clamps x and y to 0-100 range", () => {
    expect(sanitizeTextOverlay({ x: 500, y: -50 }).x).toBe(100);
    expect(sanitizeTextOverlay({ x: 500, y: -50 }).y).toBe(0);
    expect(sanitizeTextOverlay({ x: 50, y: 50 }).x).toBe(50);
  });

  it("validates hex color, falls back to white", () => {
    expect(sanitizeTextOverlay({ color: "#ff0000" }).color).toBe("#ff0000");
    expect(sanitizeTextOverlay({ color: "invalid" }).color).toBe("#ffffff");
  });

  it("validates fontWeight against allowed values", () => {
    expect(sanitizeTextOverlay({ fontWeight: "bold" }).fontWeight).toBe("bold");
    expect(sanitizeTextOverlay({ fontWeight: "900" }).fontWeight).toBe("900");
    expect(sanitizeTextOverlay({ fontWeight: "normal" }).fontWeight).toBe("normal");
    expect(sanitizeTextOverlay({ fontWeight: "extra-bold" }).fontWeight).toBe("normal");
  });

  it("truncates text to 500 characters", () => {
    const longText = "a".repeat(1000);
    const result = sanitizeTextOverlay({ text: longText });
    expect(result.text.length).toBe(500);
  });

  it("preserves valid fontFamily and fontPath", () => {
    const result = sanitizeTextOverlay({ fontFamily: "Arial", fontPath: "/path/to/font" });
    expect(result.fontFamily).toBe("Arial");
    expect(result.fontPath).toBe("/path/to/font");
  });

  it("ignores non-string fontFamily and fontPath", () => {
    const result = sanitizeTextOverlay({ fontFamily: 42 as any, fontPath: true as any });
    expect(result.fontFamily).toBeUndefined();
    expect(result.fontPath).toBeUndefined();
  });

  it("non-finite numeric values fall back to defaults", () => {
    const result = sanitizeTextOverlay({ x: NaN, y: Infinity, fontSize: -Infinity });
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.fontSize).toBe(48);
  });
});
