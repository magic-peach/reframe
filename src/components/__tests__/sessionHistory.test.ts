import { describe, it, expect, beforeEach } from "vitest";
import { EditRecipe } from "../../lib/types";
import { compileAIPrompt, diffRecipes, getStorageKey } from "../../lib/sessionHistory";

const MOCK_DEFAULT_RECIPE: EditRecipe = {
  preset: "landscape-16-9",
  customWidth: 1920,
  customHeight: 1080,
  framing: "fit",
  trimStart: 0,
  trimEnd: null,
  rotate: 0,
  keepAudio: true,
  normalizeAudio: false,
  speed: 1,
  quality: 24,
  format: "mp4",
  stabilization: false,
  denoise: false,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  soundOnCompletion: false,
  textOverlays: [],
  version: 1,
};

describe("sessionHistory and AI compiler", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  describe("compileAIPrompt", () => {
    it("should set vertical preset for tiktok prompt", () => {
      const result = compileAIPrompt("make this vertical for tiktok", MOCK_DEFAULT_RECIPE);
      expect(result.recipe.preset).toBe("vertical-9-16");
      expect(result.logs).toContain("Set aspect ratio to 9:16 (TikTok / Reels / Shorts)");
      expect(result.category).toBe("Layout");
    });

    it("should change contrast, brightness, and saturation", () => {
      const result = compileAIPrompt("increase contrast and brighten it and make it vibrant", MOCK_DEFAULT_RECIPE);
      expect(result.recipe.contrast).toBe(1.4);
      expect(result.recipe.brightness).toBe(0.3);
      expect(result.recipe.saturation).toBe(1.6);
      expect(result.logs.length).toBe(3);
    });

    it("should extract text overlays in quotes", () => {
      const result = compileAIPrompt("add text 'Summer 2026'", MOCK_DEFAULT_RECIPE);
      expect(result.recipe.textOverlays.length).toBe(1);
      expect(result.recipe.textOverlays[0].text).toBe("Summer 2026");
      expect(result.recipe.textOverlays[0].fontWeight).toBe("bold");
    });

    it("should support chained and-then commands", () => {
      const result = compileAIPrompt("crop to square, then double speed, and mute audio", MOCK_DEFAULT_RECIPE);
      expect(result.recipe.preset).toBe("square-1-1");
      expect(result.recipe.speed).toBe(2);
      expect(result.recipe.keepAudio).toBe(false);
      expect(result.logs.length).toBe(3);
    });
  });

  describe("diffRecipes", () => {
    it("should report preset layout modifications", () => {
      const modifiedRecipe = { ...MOCK_DEFAULT_RECIPE, preset: "vertical-9-16" };
      const diffs = diffRecipes(MOCK_DEFAULT_RECIPE, modifiedRecipe);
      expect(diffs.length).toBe(1);
      expect(diffs[0].key).toBe("preset");
      expect(diffs[0].label).toBe("Aspect Ratio");
    });

    it("should report color updates", () => {
      const modifiedRecipe = { ...MOCK_DEFAULT_RECIPE, contrast: 1.5, brightness: -0.2 };
      const diffs = diffRecipes(MOCK_DEFAULT_RECIPE, modifiedRecipe);
      expect(diffs.length).toBe(2);
      expect(diffs.map(d => d.key)).toContain("contrast");
      expect(diffs.map(d => d.key)).toContain("brightness");
    });

    it("should report text overlay changes", () => {
      const modifiedRecipe = {
        ...MOCK_DEFAULT_RECIPE,
        textOverlays: [
          {
            id: "1",
            text: "Hello World",
            x: 50,
            y: 50,
            fontSize: 24,
            color: "#ffffff",
            fontWeight: "bold" as const,
          },
        ],
      };
      const diffs = diffRecipes(MOCK_DEFAULT_RECIPE, modifiedRecipe);
      expect(diffs.length).toBe(1);
      expect(diffs[0].key).toBe("textOverlaysLength");
    });
  });
});
