import { describe, expect, it } from "vitest";
import { DEFAULT_RECIPE } from "@/lib/constants";
import { isValidRecipe } from "@/lib/types";

describe("isValidRecipe", () => {
  it("accepts the default recipe", () => {
    expect(isValidRecipe(DEFAULT_RECIPE)).toBe(true);
  });

  it("rejects a non-boolean denoise value", () => {
    expect(
      isValidRecipe({
        ...DEFAULT_RECIPE,
        denoise: "invalid",
      } as never)
    ).toBe(false);
  });
});
