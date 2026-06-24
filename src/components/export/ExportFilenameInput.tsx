"use client";

import { sanitizeFilename } from "@/utils/sanitizeFilename";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface Props {
  value: string;
  onChange: (filename: string) => void;
  fileFormat: string;
  maxLength?: number;
  placeholder?: string;
  label?: string;
}

/**
 * ExportFilenameInput — Controlled filename input for export downloads.
 *
 * Features:
 * - Real-time validation of filesystem-safe characters
 * - Character counter with remaining count
 * - Visual feedback for invalid filenames
 * - Accessible labels and ARIA attributes
 * - Shows file extension separately for clarity
 *
 * @param value - Current filename (without extension)
 * @param onChange - Callback when user edits filename
 * @param fileFormat - File extension/format (e.g., "mp4")
 * @param maxLength - Maximum input length (default: 100)
 * @param placeholder - Input placeholder text
 * @param label - Custom label text
 */
export default function ExportFilenameInput({
  value,
  onChange,
  fileFormat,
  maxLength = 100,
  placeholder = "Enter filename",
  label = "Filename",
}: Props) {
  // Validate against forbidden characters: / \ : * ? " < > |
  const forbiddenCharRegex = /[<>:"/\\|?*]/;
  const containsForbiddenChars = forbiddenCharRegex.test(value);
  const isEmpty = value.trim().length === 0;
  const isInvalid = containsForbiddenChars || isEmpty;

  const sanitized = sanitizeFilename(value);
  const displayedFilename = `${sanitized || "untitled"}.${fileFormat}`;

  const handleChange = (newValue: string) => {
    // Allow any input, validation happens on render
    onChange(newValue);
  };

  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex justify-between items-center text-xs px-1">
        <label
          htmlFor="export-filename-input"
          className="text-[var(--muted)] font-heading font-semibold uppercase tracking-wider"
        >
          {label}
        </label>
        <span
          className={cn(
            "transition-colors",
            value.length >= maxLength
              ? "text-[var(--error)] font-medium"
              : "text-[var(--muted)]"
          )}
        >
          {maxLength - value.length} chars remaining
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="export-filename-input"
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label="Export filename"
          aria-describedby={
            isInvalid && value.length > 0
              ? "filename-error"
              : "filename-format"
          }
          className={cn(
            "flex-1 px-3 py-2.5 bg-[var(--bg)] border rounded-lg text-sm transition-colors text-[var(--text)] placeholder:text-[var(--muted)]",
            isInvalid && value.length > 0
              ? "border-[var(--error)] focus:outline-none focus:ring-1 focus:ring-[var(--error)]"
              : "border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          )}
        />
        <span className="text-sm text-[var(--muted)] shrink-0 font-medium bg-[var(--bg)] px-3 py-2.5 border border-[var(--border)] rounded-lg">
          .{fileFormat}
        </span>
      </div>

      <div
        id="filename-format"
        className="text-xs text-[var(--muted)] px-1 mt-1"
      >
        Preview: <span className="font-mono text-[var(--text)]">{displayedFilename}</span>
      </div>

      {isInvalid && value.length > 0 && (
        <p
          id="filename-error"
          className="text-xs text-[var(--error)] px-1 flex items-center gap-1.5 mt-1 animate-fade-in"
        >
          <AlertCircle size={12} aria-hidden="true" />
          Filename contains invalid characters ({forbiddenCharRegex.source})
        </p>
      )}
    </div>
  );
}
