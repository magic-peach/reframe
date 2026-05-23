"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

type Shortcut = {
  action: string;
  keys: string | string[];
};

function getFocusableElements(root: HTMLElement) {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];
  return Array.from(
    root.querySelectorAll<HTMLElement>(selectors.join(",")),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export default function ShortcutsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedEl = useRef<HTMLElement | null>(null);

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { action: "Export video", keys: "Ctrl + Enter" },
      { action: "Reset / new video", keys: ["Ctrl +", "R"] },
      { action: "Play/pause preview", keys: "Space" },
      { action: "Toggle shortcuts panel", keys: "?" },
      { action: "Close overlay", keys: "Esc" },
    ],
    [],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocusedEl.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;

      const focusables = getFocusableElements(root);
      if (focusables.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (!active || active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!active || active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocusedEl.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reframe-shortcuts-title"
        className="w-[440px] max-w-[92vw] rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl shadow-black/20 animate-fade-in"
      >
        <div className="flex items-start justify-between px-7 pt-7">
          <h2
            id="reframe-shortcuts-title"
            className="font-display text-[22px] leading-none tracking-[0.06em] text-[var(--text)]"
          >
            KEYBOARD SHORTCUTS
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts panel"
            className="p-2 -mr-2 -mt-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 pt-6 pb-7">
          <ul className="space-y-3">
            {shortcuts.map((s) => (
              <li
                key={s.action}
                tabIndex={0}
                aria-label={`${s.action}: ${Array.isArray(s.keys) ? s.keys.join(" ") : s.keys}`}
                className="flex items-center justify-between gap-6 px-4 py-4 bg-[var(--surface)] rounded-lg shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-film-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
              >
                <span className="text-[11px] font-heading font-semibold uppercase tracking-widest text-[var(--muted)]">
                  {s.action}
                </span>
                {Array.isArray(s.keys) ? (
                  <span className="flex items-center gap-2 text-[12px] font-heading font-semibold text-film-600 tracking-wide">
                    <span>{s.keys[0]}</span>
                    <span>{s.keys[1]}</span>
                  </span>
                ) : (
                  <span className="text-[12px] font-heading font-semibold text-film-600 tracking-wide">
                    {s.keys}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-2 text-[10px] font-heading font-semibold uppercase tracking-widest text-[var(--muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-film-300/80" />
            Reframe workflow
          </div>
        </div>
      </div>
    </div>
  );
}
