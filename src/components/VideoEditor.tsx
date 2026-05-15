'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useVideoEditor } from '@/hooks/useVideoEditor'
import FileUpload from './FileUpload'
import VideoPreview from './VideoPreview'
import ThumbnailStrip from './ThumbnailStrip'
import PresetSelector from './PresetSelector'
import FramingControl from './FramingControl'
import TrimControl from './TrimControl'
import RotateControl from './RotateControl'
import AudioSpeedControl from './AudioSpeedControl'
import FormatSelector from './FormatSelector'
import ExportSettings from './ExportSettings'
import ExportOverlay from './ExportOverlay'
import DownloadResult from './DownloadResult'
import { cn } from '@/lib/utils'
import {
  Layers,
  Crop,
  Scissors,
  RotateCw,
  Volume2,
  SlidersHorizontal,
  Zap,
  AlertTriangle,
  Github,
} from 'lucide-react'

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  delay?: number
}

function Section({ icon, title, children, delay = 0 }: SectionProps) {
  return (
    <div className="animate-fade-in space-y-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2">
        <span className="text-film-500 opacity-80">{icon}</span>
        <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>
      {children}
    </div>
  )
}

export default function VideoEditor() {
  const {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    updateRecipe,
    handleFileSelect,
    fileError,
    handleExport,
    cancelExport,
    reset,
    resetSettings,
    videoRef,
    seekTo,
  } = useVideoEditor()
  const [copied, setCopied] = useState(false)
  const downloadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'done' && downloadRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      downloadRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
        block: 'center',
      })
    }
  }, [status])

  const isProcessing = status === 'loading-engine' || status === 'exporting'

  const videoSrc = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc)
    }
  }, [videoSrc])

  return (
    <div className="relative flex min-h-screen flex-col" style={{ background: 'var(--bg)' }}>
      <ExportOverlay status={status} progress={progress} />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-6">
        <header className="animate-fade-in mb-10 flex items-end justify-between">
          <div>
            <h1 className="font-display tracking-widest2 text-6xl leading-none text-[var(--text)]">
              REFRAME
            </h1>
            <p className="font-heading mt-1 text-sm uppercase tracking-widest text-[var(--muted)]">
              Your video, any format
            </p>
          </div>
          <div className="font-heading hidden items-center gap-2 pb-1 text-sm font-semibold uppercase tracking-widest text-[var(--muted)] sm:flex">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            No login. No ads. 100% private - your video never leaves your device.
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <FileUpload
                onFileSelect={handleFileSelect}
                currentFile={file}
                fileError={fileError}
              />

              {!file && (
                <div className="py-6 text-center text-[var(--muted)]">
                  <p>Upload a video to get started</p>
                  <p className="text-sm">Supports MP4, MOV, WebM and more</p>
                </div>
              )}

              {file && (
                <div className="animate-fade-in mt-4">
                  <VideoPreview file={file} videoRef={videoRef} />

                  <div className="mt-3">
                    <ThumbnailStrip
                      videoSrc={videoSrc}
                      duration={duration}
                      currentTime={videoRef.current?.currentTime ?? 0}
                      trimStart={recipe.trimStart ?? 0}
                      trimEnd={recipe.trimEnd ?? duration}
                      onSeek={seekTo}
                    />
                  </div>
                </div>
              )}
            </div>

            {file && file.size > 100 * 1024 * 1024 && (
              <p className="text-sm text-[var(--warning)]">
                ⚠️ Large file - processing may take several minutes
              </p>
            )}
            {file && (
              <div
                className={cn(
                  'grid grid-cols-1 gap-4 sm:grid-cols-2',
                  isProcessing && 'pointer-events-none opacity-50'
                )}
              >
                <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <Section icon={<Scissors size={12} />} title="Trim" delay={50}>
                    <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} />
                  </Section>
                  <Section icon={<RotateCw size={12} />} title="Rotate" delay={100}>
                    <RotateControl recipe={recipe} onChange={updateRecipe} />
                  </Section>
                </div>
                <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <Section icon={<Volume2 size={12} />} title="Audio & Speed" delay={150}>
                    <Section icon={<SlidersHorizontal size={12} />} title="Adjustments" delay={175}>
                      <div className="space-y-5">
                        {/* Brightness */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <label htmlFor="brightness-slider">Brightness</label>

                            <button
                              type="button"
                              onClick={() => updateRecipe({ brightness: 0 })}
                              className="text-film-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>

                          <input
                            id="brightness-slider"
                            type="range"
                            min="-1"
                            max="1"
                            step="0.1"
                            value={recipe.brightness}
                            onChange={(e) =>
                              updateRecipe({
                                brightness: Number(e.target.value),
                              })
                            }
                            aria-label="Adjust brightness"
                            className="w-full"
                          />
                        </div>

                        {/* Contrast */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <label htmlFor="contrast-slider">Contrast</label>

                            <button
                              type="button"
                              onClick={() => updateRecipe({ contrast: 1 })}
                              className="text-film-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>

                          <input
                            id="contrast-slider"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={recipe.contrast}
                            onChange={(e) =>
                              updateRecipe({
                                contrast: Number(e.target.value),
                              })
                            }
                            aria-label="Adjust contrast"
                            className="w-full"
                          />
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <label htmlFor="saturation-slider">Saturation</label>

                            <button
                              type="button"
                              onClick={() => updateRecipe({ saturation: 1 })}
                              className="text-film-500 hover:underline"
                            >
                              Reset
                            </button>
                          </div>

                          <input
                            id="saturation-slider"
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={recipe.saturation}
                            onChange={(e) =>
                              updateRecipe({
                                saturation: Number(e.target.value),
                              })
                            }
                            aria-label="Adjust saturation"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </Section>
                    <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
                  </Section>
                  <Section icon={<SlidersHorizontal size={12} />} title="Adjustments" delay={175}>
                    <div className="space-y-5">
                      {/* Brightness */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="brightness-slider">Brightness</label>
                          <button
                            type="button"
                            onClick={() => updateRecipe({ brightness: 0 })}
                            className="text-film-500 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          id="brightness-slider"
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={recipe.brightness}
                          onChange={(e) => updateRecipe({ brightness: Number(e.target.value) })}
                          aria-label="Adjust brightness"
                          className="w-full"
                        />
                      </div>
                      {/* Contrast */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="contrast-slider">Contrast</label>
                          <button
                            type="button"
                            onClick={() => updateRecipe({ contrast: 1 })}
                            className="text-film-500 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          id="contrast-slider"
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={recipe.contrast}
                          onChange={(e) => updateRecipe({ contrast: Number(e.target.value) })}
                          aria-label="Adjust contrast"
                          className="w-full"
                        />
                      </div>
                      {/* Saturation */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="saturation-slider">Saturation</label>
                          <button
                            type="button"
                            onClick={() => updateRecipe({ saturation: 1 })}
                            className="text-film-500 hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          id="saturation-slider"
                          type="range"
                          min="0"
                          max="3"
                          step="0.1"
                          value={recipe.saturation}
                          onChange={(e) => updateRecipe({ saturation: Number(e.target.value) })}
                          aria-label="Adjust saturation"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Section>
                  <Section icon={<SlidersHorizontal size={12} />} title="Output format" delay={190}>
                    <FormatSelector recipe={recipe} onChange={updateRecipe} />
                  </Section>
                  <Section
                    icon={<SlidersHorizontal size={12} />}
                    title="Export quality"
                    delay={200}
                  >
                    <ExportSettings recipe={recipe} onChange={updateRecipe} />
                  </Section>
                </div>
              </div>
            )}

            {status === 'error' && error && (
              <div
                role="status"
                className="animate-fade-in flex items-start gap-3 rounded-xl border border-film-200 bg-film-50 p-4 text-sm text-film-800"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-film-500" />
                <div className="flex-1">
                  <p className="font-heading text-sm font-bold">Error</p>
                  <p className="mt-1 text-sm text-film-600">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(error).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                  }}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--border)] px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                  aria-label="Copy error message to clipboard"
                >
                  {copied ? 'Copied!' : 'Copy error'}
                </button>
                {!error.includes('Validation Failed') && (
                  <button
                    type="button"
                    onClick={handleExport}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--error)] hover:bg-[var(--error-hover)]"
                  >
                    Retry Export
                  </button>
                )}
              </div>
            )}

            {status === 'done' && result && (
              <div role="status" className="animate-fade-in" ref={downloadRef}>
                <DownloadResult
                  result={result}
                  onReset={reset}
                  soundOnCompletion={recipe.soundOnCompletion}
                />
              </div>
            )}
          </div>

          <div className={cn('space-y-5', isProcessing && 'pointer-events-none opacity-50')}>
            <div
              className="animate-fade-in space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              style={{ animationDelay: '50ms' }}
            >
              <Section icon={<Layers size={12} />} title="Output size">
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<Crop size={12} />} title="Framing" delay={100}>
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="font-heading text-sm font-bold uppercase tracking-widest text-[var(--muted)] opacity-60 transition-all hover:text-film-600 hover:opacity-100"
                >
                  Reset all settings
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={!file || isProcessing}
              aria-label="Export video"
              aria-disabled={!file || isProcessing ? 'true' : undefined}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-xl py-5',
                'font-display text-2xl tracking-widest transition-all duration-200',
                file && !isProcessing
                  ? 'cursor-pointer bg-film-600 text-white shadow-lg shadow-film-200 hover:scale-[1.01] hover:bg-film-700 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-[var(--border)] text-[var(--muted)] opacity-40'
              )}
            >
              <Zap size={20} className={cn(file && !isProcessing && 'animate-pulse')} />
              {isProcessing ? 'PROCESSING' : 'EXPORT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
