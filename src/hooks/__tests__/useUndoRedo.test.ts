import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "../useUndoRedo";

describe("useUndoRedo", () => {
  it("starts with canUndo and canRedo false", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("push enables canUndo and undo returns the previous snapshot", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));

    act(() => {
      result.current.push({ a: 2 });
    });
    expect(result.current.canUndo).toBe(true);

    let undone: { a: number } | null = null;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone).toEqual({ a: 1 });
  });

  it("redo replays the snapshot that was just undone", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));

    act(() => {
      result.current.push({ a: 2 });
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    let redone: { a: number } | null = null;
    act(() => {
      redone = result.current.redo();
    });
    expect(redone).toEqual({ a: 2 });
  });

  it("pushing after an undo clears the redo stack (new branch)", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));

    act(() => result.current.push({ a: 2 }));
    act(() => result.current.undo());
    act(() => result.current.push({ a: 3 }));

    expect(result.current.canRedo).toBe(false);
  });

  it("ignores a push that is identical to the current snapshot", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));

    act(() => result.current.push({ a: 1 })); // same value, no-op
    expect(result.current.canUndo).toBe(false);
  });

  it("caps history depth at maxHistory", () => {
    const { result } = renderHook(() =>
      useUndoRedo({ n: 0 }, { maxHistory: 2 })
    );

    act(() => result.current.push({ n: 1 }));
    act(() => result.current.push({ n: 2 }));
    act(() => result.current.push({ n: 3 }));

    // Only 2 steps back should be possible — the n:0 entry should have been dropped.
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
  });

  it("reset clears both stacks and sets a new current snapshot", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));

    act(() => result.current.push({ a: 2 }));
    act(() => result.current.reset({ a: 99 }));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo on an empty stack returns null", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));
    let undone: unknown = "not-null";
    act(() => {
      undone = result.current.undo();
    });
    expect(undone).toBeNull();
  });

  it("redo on an empty stack returns null", () => {
    const { result } = renderHook(() => useUndoRedo({ a: 1 }));
    let redone: unknown = "not-null";
    act(() => {
      redone = result.current.redo();
    });
    expect(redone).toBeNull();
  });
});