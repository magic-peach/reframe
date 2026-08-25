import type { Meta, StoryObj } from "@storybook/nextjs";
import VideoEditor from "./VideoEditor";

/**
 * The whole editor shell — the single most valuable snapshot in the project,
 * because it catches layout regressions that individual control stories miss
 * (section spacing, sidebar width, responsive stacking).
 *
 * It renders its pre-upload state here. VideoEditor owns real state via
 * useVideoEditor, but FFmpeg.wasm is lazy-loaded and only touched on export,
 * so mounting it is cheap and side-effect free. Without a file the editor
 * shows the upload screen and its surrounding chrome, which is deterministic.
 *
 * Interacting further (choosing a file, exporting) needs real media and a
 * ~30 MB WASM download, so those paths are covered by the individual control
 * stories instead of here.
 */
const meta = {
  title: "Editor/VideoEditor",
  component: VideoEditor,
  parameters: {
    layout: "fullscreen",
    // The shell is tall; give Chromatic the full page rather than a viewport crop.
    chromatic: { delay: 300 },
  },
} satisfies Meta<typeof VideoEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Initial load: upload prompt plus editor chrome. */
export const Initial: Story = {};
