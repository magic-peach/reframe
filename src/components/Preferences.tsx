"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

const PASTEL_COLORS = [
  { name: "Default Blue", value: "" }, // Default is empty string which clears custom property
  { name: "Pastel Pink", value: "#f472b6" },
  { name: "Pastel Orange", value: "#fb923c" },
  { name: "Pastel Green", value: "#4ade80" },
  { name: "Pastel Purple", value: "#c084fc" },
];

export function Preferences() {
  const { accentColor, setAccentColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Preferences"
        aria-expanded={isOpen}
        className="
          relative flex items-center justify-center
          w-9 h-9 rounded-full
          bg-[var(--surface)]
          text-[var(--text)]
          border border-[var(--border)]
          hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2
          focus:ring-offset-[var(--bg)]
          transition-all duration-200
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] z-50">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Theme Color</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {PASTEL_COLORS.map((c) => {
              const isSelected = accentColor === c.value || (!accentColor && c.value === "");
              return (
                <button
                  key={c.name}
                  onClick={() => setAccentColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-transform hover:scale-110 ${
                    isSelected ? "border-[var(--text)]" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value || "#3b82f6" }}
                  title={c.name}
                />
              );
            })}
          </div>
          
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <span className="text-sm text-[var(--text)] font-medium">Custom Color</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] hover:scale-110 transition-transform focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--surface)]">
              <input
                type="color"
                value={accentColor || "#3b82f6"}
                onChange={(e) => setAccentColor(e.target.value)}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                title="Choose custom color"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
