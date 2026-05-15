# Architecture

## Overview

Reframe is built with a modern, client-side architecture that processes all videos entirely in the browser using WebAssembly.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Video Processing**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app) (WebAssembly port of FFmpeg)
- **Animations**: [Lottie React](https://github.com/Gamote/lottie-react)
- **Package Manager**: [Bun](https://bun.sh)

## How It Works

### Video Processing Pipeline

1. **File Input** - Videos are loaded via the File API or drag-and-drop. Files never leave the device.
2. **FFmpeg.wasm** - The core video processing engine. Runs FFmpeg compiled to WebAssembly using SharedArrayBuffer for multi-threading.
3. **Preset System** - 11 built-in presets for common formats (Reels, TikTok, YouTube, etc.) plus custom dimensions.
4. **Export** - Processed videos are generated as Blob URLs and downloaded directly via the browser.

### Key Design Decisions

- **100% Client-Side**: No server upload means complete privacy and zero bandwidth costs for hosting.
- **WebAssembly**: Enables near-native performance for video processing directly in the browser.
- **Static Export**: The entire app is statically generated for deployment on any static host (Vercel, Netlify, GitHub Pages).

## Project Structure

```
reframe/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and presets
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
├── docs/             # Documentation
└── .github/          # GitHub templates and workflows
```

## Getting Started with Development

See the [main README](../README.md) for installation and development instructions.
