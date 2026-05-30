import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import VideoEditor from '../VideoEditor'

// Mock sub-hooks and sub-components that are not necessary for testing DOM layout structure
vi.mock('@/hooks/useVideoEditor', () => ({
  useVideoEditor: () => ({
    file: new File([""], "test.mp4", { type: "video/mp4" }),
    duration: 60,
    recipe: {
      preset: 'vertical-9-16',
      customWidth: 1080,
      customHeight: 1920,
      framing: 'fill',
      trimStart: 0,
      trimEnd: null,
      rotate: 0,
      speed: 1,
      quality: 23,
      format: 'mp4',
      brightness: 0,
      contrast: 1,
      saturation: 1,
      soundOnCompletion: true,
    },
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
    exportStartedAt: null,
    updateRecipe: vi.fn(),
    handleFileSelect: vi.fn(),
    fileError: '',
    handleExport: vi.fn(),
    cancelExport: vi.fn(),
    reset: vi.fn(),
    resetSettings: vi.fn(),
    videoRef: { current: null },
    seekTo: vi.fn(),
    overlayFile: null,
    setOverlayFile: vi.fn(),
    overlayPosition: 'bottom-right',
    setOverlayPosition: vi.fn(),
    overlaySize: 150,
    setOverlaySize: vi.fn(),
    overlayOpacity: 100,
    setOverlayOpacity: vi.fn(),
    recommendedPreset: null,
    currentTime: 0,
    toggleSound: vi.fn(),
  })
}))

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn()
}))

vi.mock('../LottiePlayer', () => ({
  default: () => <div data-testid="lottie-player" />
}))

describe('VideoEditor Tab Order & DOM Restructure', () => {
  it('reorders DOM elements in logical reading/tab order: Upload -> Preset -> Framing -> Trim -> Rotate -> Audio -> Quality -> Export', () => {
    const { container } = render(React.createElement(VideoEditor))

    // Query for key elements representing each step
    const fileUpload = container.querySelector('[id="upload-zone"]') || container.querySelector('button.text-film-600');
    const resizeSection = container.querySelector('[aria-controls="resize-panel"]');
    const trimSection = container.querySelector('[aria-controls="trim-panel"]');
    const rotateSection = Array.from(container.querySelectorAll('[aria-controls="rotation-panel"]')).find(el => !el.closest('details'));
    const audioSection = container.querySelector('[aria-controls="audio-panel"]');
    const qualitySection = Array.from(container.querySelectorAll('[aria-controls="export-panel"]')).find(el => !el.closest('details'));
    const exportButton = container.querySelector('#export-button');

    // All controls must exist
    expect(fileUpload).toBeTruthy();
    expect(resizeSection).toBeTruthy();
    expect(trimSection).toBeTruthy();
    expect(rotateSection).toBeTruthy();
    expect(audioSection).toBeTruthy();
    expect(qualitySection).toBeTruthy();
    expect(exportButton).toBeTruthy();

    // Verify sequential DOM positions to guarantee logical focus order
    const elementsInDOMOrder = [
      fileUpload,
      resizeSection,
      trimSection,
      rotateSection,
      audioSection,
      qualitySection,
      exportButton
    ];

    // Find all focusable elements in the rendered container to verify their raw DOM order
    const allRenderedElements = Array.from(container.querySelectorAll('*'));

    const indices = elementsInDOMOrder.map(el => allRenderedElements.indexOf(el!));

    // Check that each index is strictly greater than the previous one
    for (let i = 0; i < indices.length - 1; i++) {
      const current = indices[i];
      const next = indices[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      expect(current!).toBeLessThan(next!);
    }
  })
})
