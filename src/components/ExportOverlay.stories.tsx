import * as React from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/nextjs";
import ExportOverlay from "./ExportOverlay";

/**
 * ExportOverlay renders a <TipCarousel/>, which rotates to the next tip every
 * 6000ms. Chromatic screenshots at an arbitrary moment after the story
 * settles, so on a slow CI run the capture can land on a different tip — or
 * mid fade-transition — and report a diff that reflects nothing but timing.
 *
 * Neutralising setInterval for the lifetime of these stories pins the carousel
 * to its first tip. It is patched during the render phase deliberately: a
 * child's useEffect runs before its parent's, so patching from an effect here
 * would be too late to stop TipCarousel installing its interval.
 */
/**
 * Hooks must live in a real component for react-hooks/rules-of-hooks, and the
 * patch has to land in the render phase: a child's effects run before its
 * parent's, so patching from an effect here would be too late to stop
 * TipCarousel and lottie-web installing their timers.
 */
function FrozenAnimations({ children }: { children: React.ReactNode }) {
  const saved = React.useRef<{
    setInterval: typeof window.setInterval;
    raf: typeof window.requestAnimationFrame;
  } | null>(null);

  if (typeof window !== "undefined" && saved.current === null) {
    saved.current = {
      setInterval: window.setInterval,
      raf: window.requestAnimationFrame,
    };
    // Stops TipCarousel's 6s rotation.
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    // Stops the Lottie spinner. lottie-web drives playback with
    // requestAnimationFrame, so no amount of CSS can freeze it — an
    // uncontrolled spinner is a guaranteed diff on every Chromatic build.
    // It still paints its first frame; it just never advances past it.
    window.requestAnimationFrame = (() =>
      0) as unknown as typeof window.requestAnimationFrame;
  }

  React.useEffect(() => {
    return () => {
      if (saved.current) {
        window.setInterval = saved.current.setInterval;
        window.requestAnimationFrame = saved.current.raf;
        saved.current = null;
      }
    };
  }, []);

  return <>{children}</>;
}

const withoutIntervals: Decorator = (Story) => (
  <FrozenAnimations>
    <Story />
  </FrozenAnimations>
);

/**
 * Full-screen modal shown while an export runs.
 *
 * Determinism note: when `status === "exporting"` and `exportStartedAt` is a
 * real timestamp, the component starts a 1s interval and renders
 * `Date.now() - exportStartedAt` as elapsed time. That text would change
 * between Chromatic builds and flag a diff on every run. Passing
 * `exportStartedAt: null` takes the component's own early-return branch and
 * pins the elapsed readout at zero, so these snapshots are stable.
 *
 * The overlay only renders for "loading-engine" and "exporting" — the other
 * ExportStatus values return null, so they aren't worth stories.
 */
const meta = {
  title: "Editor/Modals/ExportOverlay",
  component: ExportOverlay,
  parameters: { layout: "fullscreen", chromatic: { delay: 500 } },
  decorators: [withoutIntervals],
  // The Lottie spinner is loaded via a dynamic import(), so give it time to
  // mount before capture — otherwise the race is "empty box" vs "first frame".
  args: {
    exportStartedAt: null,
    onCancel: () => {},
  },
} satisfies Meta<typeof ExportOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** FFmpeg.wasm (~30 MB) is being fetched on first export. */
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
