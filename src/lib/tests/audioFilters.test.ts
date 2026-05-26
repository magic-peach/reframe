import { describe, expect, it } from "vitest";
import { DEFAULT_RECIPE, AUDIO_FADE_MAX_SECONDS } from "../constants";
import { buildAudioFadeFilter, getAudioOutputDuration } from "../audio-filters";

const base = (overrides = {}) => ({ ...DEFAULT_RECIPE, ...overrides });

describe("audio filter helpers", () => {
  it("returns the expected output duration after trim and speed changes", () => {
    const duration = getAudioOutputDuration(base({ trimStart: 2, trimEnd: 12, speed: 2 }), 20);
    expect(duration).toBe(5);
  });

  it("builds fade-in and fade-out filters", () => {
    const filter = buildAudioFadeFilter(base({ audioFadeIn: 0.5, audioFadeOut: 1.25 }), 10);
    expect(filter).toContain("afade=t=in:st=0:d=0.500");
    expect(filter).toContain("afade=t=out:st=8.750:d=1.250");
  });

  it("clamps fades to the configured max duration", () => {
    const filter = buildAudioFadeFilter(base({ audioFadeIn: AUDIO_FADE_MAX_SECONDS + 10, audioFadeOut: AUDIO_FADE_MAX_SECONDS + 3 }), 20);
    expect(filter).toContain(`d=${AUDIO_FADE_MAX_SECONDS.toFixed(3)}`);
  });

  it("returns an empty filter when fades are disabled", () => {
    expect(buildAudioFadeFilter(base(), 10)).toBe("");
  });
});