import { describe, expect, it } from "vitest";
import { hasBackgroundMusicTrack, shouldKeepAudioTrack } from "../audioMix";

describe("audioMix", () => {
  it("keeps background music independent from original-audio mute state", () => {
    expect(shouldKeepAudioTrack(false, true, true)).toBe(true);
    expect(shouldKeepAudioTrack(false, true, false)).toBe(false);
    expect(shouldKeepAudioTrack(true, true, false)).toBe(true);
  });

  it("detects when a music file is present", () => {
    expect(hasBackgroundMusicTrack({ name: "song.mp3" })).toBe(true);
    expect(hasBackgroundMusicTrack(null)).toBe(false);
  });
});
