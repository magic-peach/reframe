"use client";

import { useCallback, useRef, useState } from "react";

const DEFAULT_MAX_HISTORY = 25;

export interface UseUndoRedoOptions<T> {
  maxHistory?: number;
}

export interface UseUndoRedoResult<T> {
  /** Push a new snapshot. No-op if deepEqual to the current top of stack. */
  push: (snapshot: T) => void;
  /** Move back one step. Returns the snapshot to apply, or null if nothing to undo. */
  undo: () => T | null;
  /** Move forward one step. Returns the snapshot to apply, or null if nothing to redo. */
  redo: () => T | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Clear all history and reset to a single base snapshot (e.g. on file reset/load). */
  reset: (snapshot: T) => void;
}

/**
 * Generic undo/redo history stack.
 * Stores snapshots by value (caller should pass plain serializable objects).
 */
export function useUndoRedo<T>(
  initial: T,
  options: UseUndoRedoOptions<T> = {}
): UseUndoRedoResult<T> {
  const maxHistory = options.maxHistory ?? DEFAULT_MAX_HISTORY;

  // past: oldest -> newest, NOT including current
  // current: the present snapshot
  // future: nearest -> furthest redo targets
  const pastRef = useRef<T[]>([]);
  const currentRef = useRef<T>(initial);
  const futureRef = useRef<T[]>([]);

  // Mirror counts into state purely to trigger re-renders for canUndo/canRedo/buttons.
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  const push = useCallback(
    (snapshot: T) => {
      const serializedNew = JSON.stringify(snapshot);
      const serializedCurrent = JSON.stringify(currentRef.current);
      if (serializedNew === serializedCurrent) return; // no-op, avoid duplicate entries

      pastRef.current.push(currentRef.current);
      if (pastRef.current.length > maxHistory) {
        pastRef.current.shift(); // cap history depth
      }
      currentRef.current = snapshot;
      futureRef.current = []; // new branch invalidates redo stack
      bump();
    },
    [maxHistory, bump]
  );

  const undo = useCallback((): T | null => {
    if (pastRef.current.length === 0) return null;
    const previous = pastRef.current.pop()!;
    futureRef.current.unshift(currentRef.current);
    currentRef.current = previous;
    bump();
    return previous;
  }, [bump]);

  const redo = useCallback((): T | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current.shift()!;
    pastRef.current.push(currentRef.current);
    currentRef.current = next;
    bump();
    return next;
  }, [bump]);

  const reset = useCallback(
    (snapshot: T) => {
      pastRef.current = [];
      futureRef.current = [];
      currentRef.current = snapshot;
      bump();
    },
    [bump]
  );

  return {
    push,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  };
}