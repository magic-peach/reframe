# Reframe

a free, open-source video editor that runs entirely in your browser. no login, no uploads, no ads, no server. your video never leaves your device.

## features

- resize to any social media preset (reels, tiktok, youtube, instagram feed, panoramic, etc)
- fit (letterbox) or fill (crop) framing
- trim start and end times with duration validation
- rotate 0 / 90 / 180 / 270 degrees
- mute or keep audio
- playback speed from 0.25x to 4x
- quality control (CRF 18-30)
- lottie animations for upload, processing, and export states

## tech stack

- **next.js 15** with app router and static export
- **tailwind css** with custom film-red theme
- **ffmpeg.wasm** for in-browser video processing (single-threaded, no SharedArrayBuffer needed)
- **lottie-web** for micro animations
- **lucide react** for icons
- **bebas neue + syne + dm sans** typography

## getting started

```bash
bun install
bun dev
```

open [http://localhost:3000](http://localhost:3000)

## build

```bash
bun run build
```

outputs a fully static site to `out/`. deploy it anywhere — vercel, cloudflare pages, github pages, netlify.

## known limitations

- large files (500MB+) or very long videos (30+ min) can be slow or crash the tab
- processing runs on the main thread so the tab freezes during export
- single-threaded ffmpeg core for maximum compatibility
- no preview of the output before exporting

## how it works

when you click export, the app lazily downloads the ffmpeg webassembly engine from cdn on first use. your video file is written to an in-memory filesystem, processed with the selected filters, and the output is read back as a blob url for download. nothing leaves your device.

## license

mit
