import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, test, expect, vi } from "vitest";

vi.mock("./LottiePlayer", () => ({
  default: () => <div data-testid="lottie-player" />,
}));

import FileUpload from "./FileUpload";

describe("FileUpload accessibility", () => {
  test("has no accessibility violations", async () => {
    const { container } = render(
      <FileUpload
        onFileSelect={vi.fn()}
        currentFile={null}
        fileError=""
        duration={0}
      />
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
