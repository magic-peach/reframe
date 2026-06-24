import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MAX_WAVEFORM_FILE_SIZE_BYTES,
  useAudioWaveform,
} from "../useAudioWaveform";

describe("useAudioWaveform", () => {
  it("skips waveform decoding for files that are too large", async () => {
    const file = new File(["video"], "large-video.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", {
      value: MAX_WAVEFORM_FILE_SIZE_BYTES + 1,
    });
    const arrayBufferSpy = vi.spyOn(file, "arrayBuffer");

    const { result } = renderHook(() => useAudioWaveform(file));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.waveformError).toMatch(/larger than 50 MB/i);
    });

    expect(result.current.waveform).toEqual([]);
    expect(arrayBufferSpy).not.toHaveBeenCalled();
  });
});
