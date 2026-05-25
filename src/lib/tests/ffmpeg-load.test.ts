import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  loadImpl: vi.fn(),
  simdMock: vi.fn(),
  toBlobURLMock: vi.fn(async (url: string) => url),
  createdInstances: [] as Array<{ loaded: boolean }>,
}));

vi.mock("@ffmpeg/ffmpeg", () => {
  class MockFFmpeg {
    loaded = false;

    load = vi.fn(async (...args: unknown[]) => {
      await testState.loadImpl(...args);
      this.loaded = true;
    });

    terminate = vi.fn(() => {
      this.loaded = false;
    });

    writeFile = vi.fn();
    readFile = vi.fn();
    exec = vi.fn();
    deleteFile = vi.fn();
    on = vi.fn();
    off = vi.fn();

    constructor() {
      testState.createdInstances.push(this);
    }
  }

  return { FFmpeg: MockFFmpeg };
});

vi.mock("@ffmpeg/util", () => ({
  fetchFile: vi.fn(),
  toBlobURL: testState.toBlobURLMock,
}));

vi.mock("wasm-feature-detect", () => ({
  simd: testState.simdMock,
}));

import { FFmpegLoadError, loadFFmpeg, terminateFFmpeg } from "../ffmpeg";

describe("loadFFmpeg", () => {
  beforeEach(() => {
    testState.loadImpl.mockReset();
    testState.simdMock.mockReset();
    testState.toBlobURLMock.mockClear();
    testState.createdInstances.length = 0;
    testState.simdMock.mockResolvedValue(true);
  });

  afterEach(() => {
    terminateFFmpeg();
  });

  it("retries transient load failures and succeeds on the third attempt", async () => {
    testState.loadImpl
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(undefined);

    const ffmpeg = await loadFFmpeg({ retryDelayMs: 0, timeoutMs: 1000 });

    expect(ffmpeg).toBe(testState.createdInstances[0]);
    expect(testState.loadImpl).toHaveBeenCalledTimes(3);
    expect((testState.createdInstances[0] as { loaded: boolean }).loaded).toBe(true);
  });

  it("throws a structured retryable error after exhausting retries", async () => {
    testState.loadImpl.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(loadFFmpeg({ retryDelayMs: 0, timeoutMs: 1000 })).rejects.toMatchObject({
      name: "FFmpegLoadError",
      code: "NETWORK_LOAD_FAILED",
      userMessage: "Failed to load video processing components. Please check your internet connection and try again.",
    });

    expect(testState.loadImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable instantiation failures", async () => {
    testState.loadImpl.mockRejectedValue(new Error("WebAssembly compile error"));

    await expect(loadFFmpeg({ retryDelayMs: 0, timeoutMs: 1000 })).rejects.toMatchObject({
      name: "FFmpegLoadError",
      code: "WASM_INSTANTIATION_FAILED",
    });

    expect(testState.loadImpl).toHaveBeenCalledTimes(1);
  });

  it("includes timeout metadata when loading takes too long", async () => {
    testState.loadImpl.mockImplementation(() => new Promise(() => undefined));

    await expect(loadFFmpeg({ retryDelayMs: 0, timeoutMs: 1 })).rejects.toMatchObject({
      name: "FFmpegLoadError",
      code: "FFMPEG_TIMEOUT",
    });
  });
});