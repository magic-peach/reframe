"use client";

import { Clock, Trash2, RotateCcw } from "lucide-react";

interface RecoveryPromptProps {
  lastSavedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}

export function RecoveryPrompt({ lastSavedAt, onRestore, onDiscard }: RecoveryPromptProps) {
  const timeString = new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = new Date(lastSavedAt).toLocaleDateString();

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 animate-fade-in shadow-lg mb-6">
      <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
        <div className="w-10 h-10 rounded-full bg-film-100 flex items-center justify-center shrink-0">
          <Clock size={20} className="text-film-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-[var(--text)] text-base">Unsaved Session Found</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            We found an editing session from {dateString} at {timeString}. Would you like to restore it?
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={onDiscard}
            className="flex-1 sm:flex-none px-4 py-2 border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            <span>Discard</span>
          </button>
          <button
            onClick={onRestore}
            className="flex-1 sm:flex-none px-4 py-2 bg-film-600 hover:bg-film-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            <span>Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
}
