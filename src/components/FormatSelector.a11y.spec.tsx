import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, test, expect, vi } from "vitest";

import FormatSelector from "./FormatSelector";

describe("FormatSelector accessibility", () => {
  test("has no accessibility violations", async () => {
    const recipe = {
      format: "mp4",
    };

    const { container } = render(
      <FormatSelector
        recipe={recipe as any}
        onChange={vi.fn()}
      />
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
