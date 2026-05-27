"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "reframe-privacy-banner-dismissed";

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);

    if (!dismissedAt) {
      setVisible(true);
      return;
    }

    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expired = Date.now() - Number(dismissedAt) > sevenDays;

    if (expired) {
      localStorage.removeItem(STORAGE_KEY);
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Your videos never leave your device.
          </h3>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Processing is done entirely in your browser using FFmpeg.wasm.
            No server, no upload, no account required.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss privacy banner"
          className="rounded-md p-1 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
