import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import TrimControl from "../TrimControl";
import { DEFAULT_RECIPE } from "@/lib/constants";
import type { UseAudioWaveformResult } from "@/hooks/useAudioWaveform";

vi.mock("@/hooks/useAudioWaveform", () => ({
  useAudioWaveform: vi.fn(),
}));

import { useAudioWaveform } from "@/hooks/useAudioWaveform";

const mockedHook = vi.mocked(useAudioWaveform);

function setWaveform(result: UseAudioWaveformResult) {
  mockedHook.mockReturnValue(result);
}

function renderTrim(file: File | null) {
  return render(
    <TrimControl
      recipe={DEFAULT_RECIPE}
      onChange={() => {}}
      duration={10}
      file={file}
    />
  );
}

const sampleFile = new File(["video-bytes"], "clip.mp4", { type: "video/mp4" });

beforeEach(() => {
  mockedHook.mockReset();
});

describe("TrimControl waveform fallback", () => {
  it("renders the disabled placeholder for very large files", () => {
    setWaveform({ waveform: [], status: "disabled", isLoading: false });

    renderTrim(sampleFile);

    expect(
      screen.getByLabelText("Audio waveform preview disabled for large file")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/disabled for very large files/i)
    ).toBeInTheDocument();
    // The canvas waveform must not render in the disabled state.
    expect(screen.queryByLabelText("Audio waveform")).not.toBeInTheDocument();
  });

  it("renders the waveform canvas for normal files", () => {
    setWaveform({
      waveform: [0.1, 0.5, 0.9],
      status: "ready",
      isLoading: false,
    });

    renderTrim(sampleFile);

    expect(screen.getByLabelText("Audio waveform")).toBeInTheDocument();
    expect(
      screen.queryByText(/disabled for very large files/i)
    ).not.toBeInTheDocument();
  });

  it("does not render any waveform UI when no file is selected", () => {
    setWaveform({ waveform: [], status: "idle", isLoading: false });

    renderTrim(null);

    expect(
      screen.queryByText(/disabled for very large files/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Audio waveform")).not.toBeInTheDocument();
  });
});
