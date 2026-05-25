import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DownloadResult from '../DownloadResult'
import { ExportResult } from '@/lib/types'

// Mock NativeShareButton since it relies on navigator.share which might not be in test env
vi.mock('../NativeShareButton', () => ({
  NativeShareButton: () => React.createElement('button', null, 'Share')
}))

// Mock LottiePlayer
vi.mock('../LottiePlayer', () => ({
  default: () => React.createElement('div', null, 'Success Animation')
}))

describe('DownloadResult', () => {
  const mockResult: ExportResult = {
    blobUrl: 'blob:http://localhost:3000/some-uuid',
    blob: new Blob(['test-video'], { type: 'video/mp4' }),
    size: 1024 * 1024 * 5, // 5MB
    width: 1920,
    height: 1080,
    format: 'mp4',
    exportDurationMs: 12000 // 12 seconds
  }

  const mockOnReset = vi.fn()
  const mockOnToggleSound = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Mock window.confirm
    global.window.confirm = vi.fn(() => true)

    // Mock HTMLAudioElement constructor
    global.Audio = function() {
      return {
        play: vi.fn().mockResolvedValue(undefined)
      }
    } as any
  })

  it('renders resolution, file size and export duration correctly', () => {
    render(
      React.createElement(DownloadResult, {
        result: mockResult,
        onReset: mockOnReset,
        soundOnCompletion: false,
        onToggleSound: mockOnToggleSound
      })
    )

    expect(screen.getByText('1920 × 1080')).toBeInTheDocument()
    expect(screen.getByText(/5(\.0)?\s*MB/i)).toBeInTheDocument()
    expect(screen.getByText('Exported in 12 sec')).toBeInTheDocument()
  })

  it('renders input for filename with default value and reacts to invalid chars', async () => {
    render(
      React.createElement(DownloadResult, {
        result: mockResult,
        onReset: mockOnReset,
        soundOnCompletion: false,
        onToggleSound: mockOnToggleSound
      })
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('reframe_1920x1080')

    // Clear and type invalid char
    await userEvent.clear(input)
    await userEvent.type(input, 'my:video')

    expect(screen.getByText(/contains invalid characters/)).toBeInTheDocument()
  })

  it('programmatically triggers download when Download button is clicked', async () => {
    let capturedAnchor: HTMLAnchorElement | null = null;
    const originalAppend = document.body.appendChild.bind(document.body)
    const originalRemove = document.body.removeChild.bind(document.body)

    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      if (el instanceof HTMLAnchorElement) {
        capturedAnchor = el;
        // Mock the click method so it doesn't navigate
        vi.spyOn(capturedAnchor, 'click').mockImplementation(() => {});
      }
      return originalAppend(el);
    })
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => {
      return originalRemove(el);
    })

    render(
      React.createElement(DownloadResult, {
        result: mockResult,
        onReset: mockOnReset,
        soundOnCompletion: false,
        onToggleSound: mockOnToggleSound
      })
    )

    const downloadBtn = screen.getByRole('button', { name: /Download/i })
    await userEvent.click(downloadBtn)

    expect(appendSpy).toHaveBeenCalled()
    expect(capturedAnchor).not.toBeNull()
    expect(capturedAnchor!.href).toContain(mockResult.blobUrl)
    expect(capturedAnchor!.download).toBe('reframe_1920x1080.mp4')
    expect(capturedAnchor!.click).toHaveBeenCalled()
    
    // Wait for the setTimeout cleanup
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(removeSpy).toHaveBeenCalled()

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('triggers onReset when clicking New button and confirming', async () => {
    render(
      React.createElement(DownloadResult, {
        result: mockResult,
        onReset: mockOnReset,
        soundOnCompletion: false,
        onToggleSound: mockOnToggleSound
      })
    )

    const newBtn = screen.getByRole('button', { name: /New/i })
    await userEvent.click(newBtn)

    expect(global.window.confirm).toHaveBeenCalledWith(
      'This will clear the current video and all settings. Continue?'
    )
    expect(mockOnReset).toHaveBeenCalled()
  })

  it('triggers onToggleSound when clicking completion sound button', async () => {
    render(
      React.createElement(DownloadResult, {
        result: mockResult,
        onReset: mockOnReset,
        soundOnCompletion: true,
        onToggleSound: mockOnToggleSound
      })
    )

    const soundBtn = screen.getByRole('button', { name: /Mute completion sound/i })
    await userEvent.click(soundBtn)

    expect(mockOnToggleSound).toHaveBeenCalled()
  })

  it('renders correct fallback filename layout for custom resolutions', () => {
    const customResult = {
      ...mockResult,
      width: 1080,
      height: 1920,
      format: 'gif' as const
    }

    render(
      React.createElement(DownloadResult, {
        result: customResult,
        onReset: mockOnReset,
        soundOnCompletion: false,
        onToggleSound: mockOnToggleSound
      })
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('reframe_1080x1920')
    expect(screen.getByText('.gif')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download GIF/i })).toBeInTheDocument()
  })
})
