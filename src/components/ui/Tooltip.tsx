"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactElement,
  type Ref,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 500;
const GAP = 8;

type Side = "top" | "bottom";

interface TooltipProps {
  content: string;
  children: ReactElement;
  side?: Side;
  /** Use for full-width controls like range inputs */
  block?: boolean;
  /** Classes applied to the tooltip bubble */
  className?: string;
  /** Classes applied to the wrapper around the trigger */
  wrapperClassName?: string;
}

function mergeIds(...ids: (string | undefined | false)[]): string | undefined {
  const merged = ids.filter(Boolean).join(" ");
  return merged || undefined;
}

function mergeHandlers<E>(
  theirs: ((e: E) => void) | undefined,
  ours: (e: E) => void
): (e: E) => void {
  return (e) => {
    theirs?.(e);
    ours(e);
  };
}

function setRef<T extends HTMLElement>(
  node: T | null,
  triggerRef: MutableRefObject<T | null>,
  childRef: Ref<T> | undefined
) {
  triggerRef.current = node;
  if (typeof childRef === "function") {
    childRef(node);
  } else if (childRef && typeof childRef === "object" && "current" in childRef) {
    (childRef as MutableRefObject<T | null>).current = node;
  }
}

export function Tooltip({
  content,
  children,
  side = "top",
  block = false,
  className,
  wrapperClassName,
}: TooltipProps) {
  const tooltipId = useId().replace(/:/g, "");
  const fullTooltipId = `tooltip-${tooltipId}`;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchModeRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: side === "top" ? rect.top - GAP : rect.bottom + GAP,
      left: rect.left + rect.width / 2,
    });
  }, [side]);

  const show = useCallback(() => {
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hide = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setOpen(false);
    touchModeRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    const reposition = () => updatePosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || !touchModeRef.current) return;
    const dismiss = (e: PointerEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      hide();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, hide]);

  if (!isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<{
    className?: string;
    "aria-describedby"?: string;
    onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
    onFocus?: (e: FocusEvent<HTMLElement>) => void;
    onBlur?: (e: FocusEvent<HTMLElement>) => void;
    onTouchStart?: (e: TouchEvent<HTMLElement>) => void;
    onTouchEnd?: (e: TouchEvent<HTMLElement>) => void;
    onTouchCancel?: (e: TouchEvent<HTMLElement>) => void;
    ref?: Ref<HTMLElement>;
  }>;

  const existingDescribedBy = child.props["aria-describedby"];

  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) =>
      setRef(node, triggerRef, child.props.ref),
    "aria-describedby": mergeIds(existingDescribedBy, fullTooltipId),
    onMouseEnter: mergeHandlers(child.props.onMouseEnter, show),
    onMouseLeave: mergeHandlers(child.props.onMouseLeave, hide),
    onFocus: mergeHandlers(child.props.onFocus, show),
    onBlur: mergeHandlers(child.props.onBlur, hide),
    onTouchStart: mergeHandlers(child.props.onTouchStart, () => {
      longPressTimer.current = setTimeout(() => {
        touchModeRef.current = true;
        show();
      }, LONG_PRESS_MS);
    }),
    onTouchEnd: mergeHandlers(child.props.onTouchEnd, () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }),
    onTouchCancel: mergeHandlers(child.props.onTouchCancel, () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }),
    className: cn(block && "block w-full", child.props.className),
  });

  const tooltipNode = (
    <div
      id={fullTooltipId}
      role="tooltip"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform:
          side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        zIndex: 9999,
      }}
      className={cn(
        "pointer-events-none max-w-[260px] px-3 py-2 rounded-lg",
        "text-xs leading-relaxed text-[var(--text)]",
        "bg-[var(--surface)] border border-[var(--border)]",
        "shadow-lg shadow-black/20",
        "transition-opacity duration-150",
        open ? "opacity-100" : "sr-only opacity-0",
        className
      )}
    >
      {content}
    </div>
  );

  const wrapperClass = block ? "block w-full" : "inline-flex";

  return (
    <span className={cn(wrapperClass, wrapperClassName)}>
      {trigger}
      {mounted && typeof document !== "undefined"
        ? createPortal(tooltipNode, document.body)
        : null}
    </span>
  );
}
