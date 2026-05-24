import { describe, expect, it } from "vitest";
import {
  DEFAULT_WAVEFORM_MAX_FILE_SIZE,
  getWaveformSkipReason,
} from "../waveform";

describe("getWaveformSkipReason", () => {
  it("allows files within the default limit", () => {
    expect(getWaveformSkipReason(DEFAULT_WAVEFORM_MAX_FILE_SIZE)).toBeNull();
  });

  it("skips files above the limit", () => {
    expect(
      getWaveformSkipReason(DEFAULT_WAVEFORM_MAX_FILE_SIZE + 1),
    ).toContain("Waveform preview skipped");
  });

  it("supports a custom limit", () => {
    expect(getWaveformSkipReason(500, 400)).toContain("400 Bytes");
  });
});