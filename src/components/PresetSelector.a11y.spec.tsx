import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, test, expect, vi } from "vitest";

import PresetSelector from "./PresetSelector";

describe("PresetSelector accessibility", () => {
  test("has no accessibility violations", async () => {
    const recipe = {
      preset: "vertical-9-16",
      customWidth: 1080,
      customHeight: 1920,
    };

    const { container } = render(
      <PresetSelector
        recipe={recipe as any}
        onChange={vi.fn()}
      />
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
