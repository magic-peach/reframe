import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAudioWaveform } from "../useAudioWaveform";
import { MAX_WAVEFORM_FILE_SIZE_BYTES } from "@/lib/constants";

// --- Test doubles -----------------------------------------------------------

type FakeAudioBuffer = { getChannelData: () => Float32Array };

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static decodeImpl: () => Promise<FakeAudioBuffer> = async () => ({
    getChannelData: () => new Float32Array([0, 0.25, 0.5, 0.75, 1]),
  });

  decodeAudioData = vi.fn(() => FakeAudioContext.decodeImpl());
  close = vi.fn(async () => {});

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

/**
 * Builds a minimal File stand-in. The hook only touches `file.size` and
 * `file.slice(...).arrayBuffer()`, so we expose spies for both to assert that
 * the full file is never read for oversized inputs.
 */
function makeFile(size: number, readBytes: () => Promise<ArrayBuffer>) {
  const arrayBuffer = vi.fn(readBytes);
  const slice = vi.fn(() => ({ arrayBuffer }) as unknown as Blob);
  return { size, slice, arrayBuffer } as unknown as File;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeAudioContext.decodeImpl = async () => ({
    getChannelData: () => new Float32Array([0, 0.25, 0.5, 0.75, 1]),
  });
  vi.stubGlobal("AudioContext", FakeAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// --- Tests ------------------------------------------------------------------

describe("useAudioWaveform", () => {
  it("is idle when no file is provided", async () => {
    const { result } = renderHook(() => useAudioWaveform(null));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.waveform).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("extracts a waveform for files within the size threshold", async () => {
    const file = makeFile(1024, () => Promise.resolve(new ArrayBuffer(8)));

    const { result } = renderHook(() => useAudioWaveform(file, 5));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.waveform).toHaveLength(5);
    expect(result.current.isLoading).toBe(false);
    // Reads through a bounded slice, never the raw File in one shot.
    expect(file.slice).toHaveBeenCalledWith(0, MAX_WAVEFORM_FILE_SIZE_BYTES);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it("skips extraction and reports 'disabled' for very large files", async () => {
    const file = makeFile(MAX_WAVEFORM_FILE_SIZE_BYTES + 1, () =>
      Promise.resolve(new ArrayBuffer(8))
    );

    const { result } = renderHook(() => useAudioWaveform(file));

    await waitFor(() => expect(result.current.status).toBe("disabled"));
    expect(result.current.waveform).toEqual([]);
    // The whole point of #1013: the oversized file is never read into memory.
    expect(file.slice).not.toHaveBeenCalled();
    expect(file.arrayBuffer).not.toHaveBeenCalled();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("respects a custom size threshold", async () => {
    const file = makeFile(2048, () => Promise.resolve(new ArrayBuffer(8)));

    const { result } = renderHook(() => useAudioWaveform(file, 96, 1024));

    await waitFor(() => expect(result.current.status).toBe("disabled"));
    expect(file.slice).not.toHaveBeenCalled();
  });

  it("reports 'error' when decoding fails", async () => {
    FakeAudioContext.decodeImpl = () => Promise.reject(new Error("bad audio"));
    const file = makeFile(1024, () => Promise.resolve(new ArrayBuffer(8)));

    const { result } = renderHook(() => useAudioWaveform(file));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.waveform).toEqual([]);
  });

  it("cancels in-flight work and does not update state after unmount", async () => {
    const gate = deferred<ArrayBuffer>();
    const file = makeFile(1024, () => gate.promise);

    const { result, unmount } = renderHook(() => useAudioWaveform(file));

    await waitFor(() => expect(result.current.status).toBe("loading"));

    unmount();

    // Resolve the pending read *after* unmount — the hook must bail out before
    // creating an AudioContext or advancing to "ready".
    await act(async () => {
      gate.resolve(new ArrayBuffer(8));
      await Promise.resolve();
    });

    expect(result.current.status).toBe("loading");
    expect(FakeAudioContext.instances).toHaveLength(0);
  });
});
