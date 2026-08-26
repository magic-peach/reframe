import * as React from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/nextjs";
import ExportOverlay from "./ExportOverlay";

/**
 * Full-screen modal shown while an export runs.
 *
 * ── Why this file works the way it does ──────────────────────────────────────
 * Two things inside this overlay move on their own, and a visual regression
 * service screenshots at an arbitrary moment:
 *
 *   1. a Lottie spinner, played by lottie-web via requestAnimationFrame
 *   2. a <TipCarousel/>, which rotates to the next tip every 6000ms
 *
 * An earlier version of this file froze both by stubbing window.setInterval
 * and window.requestAnimationFrame. That was a mistake: Chromatic's capture
 * instrumentation relies on requestAnimationFrame to decide a story has
 * settled, so with rAF stubbed the story never signalled ready and all six
 * snapshots (3 stories x light/dark) failed with "took too long to load".
 *
 * Never stub browser globals to stabilise a snapshot. Instead, tell Chromatic
 * which regions to ignore: it excludes them from the diff but still renders
 * them, and the rest of the overlay — heading, progress bar, percentage,
 * cancel button — is compared normally.
 */
const withMovingPartsIgnored: Decorator = (Story) => (
  <IgnoreMovingParts>
    <Story />
  </IgnoreMovingParts>
);

function IgnoreMovingParts({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // .w-20.h-20        -> the wrapper LottiePlayer fills with its <svg>
    // [class*=min-h-]   -> the TipCarousel root (min-h-[142px])
    const selectors = ['.w-20.h-20', '[class*="min-h-[142px]"]'];
    const marked: Element[] = [];

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((el) => {
        el.setAttribute("data-chromatic", "ignore");
        marked.push(el);
      });
    }

    return () => marked.forEach((el) => el.removeAttribute("data-chromatic"));
  }, []);

  return <>{children}</>;
}

const meta = {
  title: "Editor/Modals/ExportOverlay",
  component: ExportOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [withMovingPartsIgnored],
  args: {
    // With a real timestamp the component starts a 1s interval and renders
    // Date.now() - exportStartedAt as elapsed time, which would differ between
    // builds. null takes its own early-return branch and pins it at zero.
    exportStartedAt: null,
    onCancel: () => {},
  },
} satisfies Meta<typeof ExportOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * FFmpeg.wasm (~30 MB) is being fetched on first export.
 *
 * The overlay only renders for "loading-engine" and "exporting"; the other
 * ExportStatus values return null, so they aren't worth stories.
 */
export const LoadingEngine: Story = {
  args: { status: "loading-engine", progress: 0 },
};

/** Mid-export, just past a third done. */
export const Exporting: Story = {
  args: { status: "exporting", progress: 37 },
};

/** Near completion — checks the progress bar at the far end of its track. */
export const AlmostDone: Story = {
  args: { status: "exporting", progress: 98 },
};
