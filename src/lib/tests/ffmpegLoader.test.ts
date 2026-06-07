import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Regression coverage for the concurrency-safe FFmpeg loader (issue #1014).
 *
 * The real runtime lives inside a Web Worker, so these tests stub the global
 * `Worker` and assert on the messages the loader posts to it. The key invariant
 * is that concurrent `loadFFmpeg()` calls share a single initialization: the
 * worker is created once and the one-time `{ type: "load" }` command — which is
 * what triggers `ffmpeg.load()` and registers the worker's listeners — is posted
 * at most once per initialization.
 */

type WorkerMessage = { type: string; [key: string]: unknown };

class MockWorker {
  static instances: MockWorker[] = [];

  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message?: string }) => void) | null = null;
  postMessage = vi.fn<(message: WorkerMessage) => void>();
  terminate = vi.fn();

  constructor(public url: unknown, public options: unknown) {
    MockWorker.instances.push(this);
  }

  /** Simulate a message coming back from the worker thread. */
  emit(data: WorkerMessage) {
    this.onmessage?.({ data });
  }

  /** Number of `{ type: "load" }` commands this worker received. */
  loadCount() {
    return this.postMessage.mock.calls.filter(([m]) => m?.type === "load").length;
  }
}

function loadMessages() {
  return MockWorker.instances.reduce((sum, w) => sum + w.loadCount(), 0);
}

async function importLoader() {
  // Fresh module instance per test so the module-level loader state is reset.
  vi.resetModules();
  return import("../ffmpeg");
}

beforeEach(() => {
  MockWorker.instances = [];
  vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadFFmpeg concurrency guard", () => {
  it("shares a single initialization across concurrent callers", async () => {
    const { loadFFmpeg } = await importLoader();

    // Fire several loads without awaiting in between.
    const pending = [loadFFmpeg(), loadFFmpeg(), loadFFmpeg()];

    // Exactly one worker is created and only one load command is posted, even
    // though three callers requested initialization simultaneously.
    expect(MockWorker.instances).toHaveLength(1);
    expect(loadMessages()).toBe(1);

    // Resolve the shared load — every caller settles together.
    MockWorker.instances[0].emit({ type: "ready" });
    await expect(Promise.all(pending)).resolves.toEqual([undefined, undefined, undefined]);
  });

  it("does not re-load once the runtime is ready", async () => {
    const { loadFFmpeg } = await importLoader();

    const first = loadFFmpeg();
    const worker = MockWorker.instances[0];
    worker.emit({ type: "ready" });
    await first;

    const postsBefore = worker.postMessage.mock.calls.length;

    // Subsequent calls take the fast path: no new worker, no new load command.
    await loadFFmpeg();
    await loadFFmpeg();

    expect(MockWorker.instances).toHaveLength(1);
    expect(worker.postMessage.mock.calls.length).toBe(postsBefore);
    expect(loadMessages()).toBe(1);
  });

  it("reports progress to the latest caller exactly once on ready", async () => {
    const { loadFFmpeg } = await importLoader();

    const onProgress = vi.fn();
    const pending = loadFFmpeg(undefined, onProgress);

    MockWorker.instances[0].emit({ type: "ready" });
    await pending;

    // `ready` triggers a single 100% notification (no duplicate listeners firing).
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it("resets state after a failed load so callers can retry cleanly", async () => {
    const { loadFFmpeg } = await importLoader();

    // First attempt fails during load.
    const first = loadFFmpeg();
    MockWorker.instances[0].emit({ type: "error", message: "boom" });
    await expect(first).rejects.toThrow("boom");

    // A retry starts a fresh worker and a fresh single load command...
    const second = loadFFmpeg();
    expect(MockWorker.instances).toHaveLength(2);
    expect(MockWorker.instances[1].loadCount()).toBe(1);

    // ...and succeeds.
    MockWorker.instances[1].emit({ type: "ready" });
    await expect(second).resolves.toBeUndefined();
  });

  it("rejects an aborted caller without tearing down the shared load", async () => {
    const { loadFFmpeg } = await importLoader();

    const controller = new AbortController();
    const aborted = loadFFmpeg(controller.signal);
    const joiner = loadFFmpeg();

    expect(MockWorker.instances).toHaveLength(1);
    expect(loadMessages()).toBe(1);

    controller.abort();
    await expect(aborted).rejects.toThrow(/abort/i);

    // The non-aborted caller still resolves once the shared load completes.
    MockWorker.instances[0].emit({ type: "ready" });
    await expect(joiner).resolves.toBeUndefined();
    expect(loadMessages()).toBe(1);
  });

  it("rejects immediately when called with an already-aborted signal", async () => {
    const { loadFFmpeg } = await importLoader();

    const controller = new AbortController();
    controller.abort();

    await expect(loadFFmpeg(controller.signal)).rejects.toThrow(/abort/i);
    // No worker should have been spun up for an already-aborted request.
    expect(MockWorker.instances).toHaveLength(0);
  });
});
