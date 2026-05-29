import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, test, expect, vi } from "vitest";

import ExportSettings from "./ExportSettings";

describe("ExportSettings accessibility", () => {
  test("has no accessibility violations", async () => {
    const recipe = {
      quality: 23,
      format: "mp4",
      soundOnCompletion: false,
      stabilization: false,
    };

    const { container } = render(
      <ExportSettings
        recipe={recipe as any}
        duration={60}
        onChange={vi.fn()}
      />
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
