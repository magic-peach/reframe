import { describe, expect, it } from "vitest";
import { DEFAULT_RECIPE } from "@/lib/constants";
import { decodeRecipe, encodeRecipe } from "../shareLink";

describe("shareLink", () => {
  it("round-trips non-ASCII recipe data", () => {
    const recipe = {
      ...DEFAULT_RECIPE,
      textOverlays: [
        {
          id: "1",
          text: "नमस्ते 👋 café",
          x: 24,
          y: 48,
          fontSize: 36,
          fontFamily: "Inter",
          fontWeight: "bold" as const,
          color: "#ffffff",
          backgroundColor: "transparent",
        },
      ],
    };

    const encoded = encodeRecipe(recipe);
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(decodeRecipe(encoded)).toEqual(recipe);
  });
});
