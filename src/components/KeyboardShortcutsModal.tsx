"use client";

import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 rounded-md border border-white/10 bg-white/5 text-xs font-mono text-white shadow-sm">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!open) return null;

  const shortcuts = [
    {
      keys: ["Ctrl", "Shift", "E"],
      label: "Export video",
    },
    {
      keys: ["M"],
      label: "Toggle audio mute",
    },
    {
      keys: ["R"],
      label: "Reset all settings",
    },
    {
      keys: ["Esc"],
      label: "Cancel export / Close modal",
    },
    {
      keys: ["1 - 9"],
      label: "Switch presets",
    },
    {
      keys: ["?"],
      label: "Open keyboard shortcuts",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="relative w-[92%] max-w-xl rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 animate-scale-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white transition"
          aria-label="Close shortcuts modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-white/10 border border-white/10">
            <Keyboard size={20} className="text-white" />
          </div>

          <div>
            <h2
              id="keyboard-shortcuts-title"
              className="text-xl font-semibold text-white"
            >
              Keyboard Shortcuts
            </h2>

            <p className="text-sm text-gray-300">
              Speed up your workflow with shortcuts
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="text-sm text-gray-200">
                {shortcut.label}
              </span>

              <div className="flex items-center gap-2">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}