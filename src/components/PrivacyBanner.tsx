"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "privacy-banner-dismissed";

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(
      STORAGE_KEY,
    );

    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(
      STORAGE_KEY,
      "true",
    );

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">
            Your videos never leave your
            device.
          </p>

          <p className="mt-1 text-[var(--muted)]">
            Reframe processes videos fully
            in-browser using FFmpeg.wasm —
            no uploads, no servers, 100%
            private.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss privacy banner"
          className="text-[var(--muted)] hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}