# Video Editor

a browser-based video editor built with Next.js and ffmpeg.wasm. everything runs locally — no uploads, no server, no tracking.

## features

- resize to any social media preset (reels, tiktok, youtube, instagram feed, etc.)
- fit (letterbox) or fill (crop) framing
- trim start/end times
- rotate 0/90/180/270°
- mute or keep audio
- playback speed from 0.25× to 4×
- quality control (CRF 18–30)
- exports as MP4 (H.264), falls back to WebM if unsupported

## stack

- **Next.js 15** with App Router, static export
- **Tailwind CSS** for styling
- **ffmpeg.wasm** (`@ffmpeg/ffmpeg` + `@ffmpeg/core`) for in-browser video processing
- **Lucide React** for icons

## running locally

```bash
bun install
bun dev
```

open [http://localhost:3000](http://localhost:3000)

## building for deployment

```bash
bun run build
```

this outputs a fully static site to the `out/` folder. deploy it anywhere:

- **Vercel** — drag and drop the `out/` folder, or connect the repo
- **Cloudflare Pages** — connect repo, set build command to `bun run build`, output to `out`
- **GitHub Pages** — push the `out/` folder contents to `gh-pages` branch
- **Netlify** — connect repo, build command `bun run build`, publish dir `out`

## known limitations

- large files (500MB+) or very long videos (30+ min) can be slow or crash the tab
- processing runs on the main thread — the tab will be unresponsive during export
- uses single-threaded ffmpeg core for maximum compatibility (no SharedArrayBuffer needed)
- no preview of the output before exporting

## how it works

when you click "Export video", it lazily downloads the ffmpeg WebAssembly engine (~30 MB) from jsdelivr CDN on first use. your video file is written to an in-memory virtual filesystem, processed with the filters you selected, and the output is read back as a Blob URL for download. nothing leaves your device.
