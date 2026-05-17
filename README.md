<div align="center">

# Reframe

### Free, open-source video editor that runs entirely in your browser.

### No login. No uploads. No ads. 100% private.

[![GitHub Stars](https://img.shields.io/github/stars/magic-peach/reframe?style=flat-square&logo=github)](https://github.com/magic-peach/reframe/stargazers)

[![GitHub Forks](https://img.shields.io/github/forks/magic-peach/reframe?style=flat-square&logo=github)](https://github.com/magic-peach/reframe/network/members)

[![GitHub Issues](https://img.shields.io/github/issues/magic-peach/reframe?style=flat-square)](https://github.com/magic-peach/reframe/issues)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-0.12.10-green?style=flat-square)](https://ffmpegwasm.netlify.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GSSoC 2026](https://img.shields.io/badge/GSSoC-2026-FF6B35?style=flat-square)](https://gssoc.girlscript.tech)
[![CI](https://github.com/Sneha079-codes/reframe/actions/workflows/main.yml/badge.svg)](https://github.com/Sneha079-codes/reframe/actions/workflows/main.yml)


**[Try it now →](https://github.com/magic-peach/reframe)** · **[Report a Bug](https://github.com/magic-peach/reframe/issues/new?labels=bug)** · **[Request a Feature](https://github.com/magic-peach/reframe/issues/new?labels=feature)**

</div>

---

## What is Reframe?

Reframe is a **browser-based video editor** — everything happens on your device. Your videos are never sent to any server. No account needed. No fees. Just open and edit.

> Built for everyone — whether you're a creator resizing videos for social media, or just someone who wants to quickly trim and convert without installing bulky software.

## Features

- **Instant Resizing** — 11 preset formats (Reels, TikTok, YouTube, Instagram, etc.) + custom dimensions
- **Flexible Framing** — Fit (letterbox) or Fill (crop) to your target aspect ratio
- **Precise Trimming** — Cut start and end times with real-time duration validation
- **Rotation** — 0°, 90°, 180°, 270° rotation support
- **Audio Control** — Keep or mute audio independently
- **Speed Control** — 0.25x to 4x playback speed with smooth audio adjustment
- **Quality Settings** — CRF slider for quality vs. file size trade-offs
- **Smooth UX** — Lottie animations, live export progress, instant download

Everything stays on your device. No servers. No tracking. No login.

---
## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter / Cmd+Enter | Export video |
| M | Toggle audio mute |
| Escape | Cancel export |

> On macOS, use `Cmd` instead of `Ctrl` for keyboard shortcuts.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+

### Installation

```bash
git clone https://github.com/magic-peach/reframe.git
cd reframe
bun install
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — component changes reflect instantly with [Next.js Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh), so you usually do not need to restart the dev server. For FFmpeg reload notes and debugging tools, see the [Development Tips](CONTRIBUTING.md#development-tips).

### Production Build

```bash
bun run build
```

Outputs a static site to `out/` — deploy to Vercel, Netlify, GitHub Pages, or any static host.

---

## Deploying

Reframe uses static export (`output: 'export'`), so it can be deployed to any static hosting provider.

### Deploying to Vercel

1. Fork this repository
2. Go to https://vercel.com/new
3. Import your forked repository
4. Set the Framework Preset to **Next.js**
5. Click **Deploy**

After deployment, Vercel will automatically build and host the static output.

### Alternative Static Hosts

You can also deploy Reframe on other static hosting providers:

| Platform             | Deployment Method                                           |
| -------------------- | ----------------------------------------------------------- |
| **Netlify**          | Connect your fork at https://app.netlify.com/start          |
| **GitHub Pages**     | Deploy the generated `out/` folder to the `gh-pages` branch |
| **Cloudflare Pages** | Connect your fork in Cloudflare Pages                       |

### Deploying to Vercel

The quickest way to get Reframe live:

**Option 1 — Vercel Dashboard (Recommended)**

1. Fork this repository on GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your fork
3. Vercel auto-detects Next.js settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `bun run build`
   - **Output Directory:** `out`
4. Click **Deploy** — your site will be live in ~2 minutes

**Option 2 — Vercel CLI**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

> **Note:** FFmpeg.wasm requires COOP/COEP headers for SharedArrayBuffer support. On Vercel, add a `vercel.json` in your project root:
>
> ```json
> {
>   "headers": [
>     {
>       "source": "/(.*)",
>       "headers": [
>         { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
>         { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
>       ]
>     }
>   ]
> }
> ```

### Deploying to Netlify

1. Push your fork to GitHub
2. Open Netlify and import the repository
3. Configure:
   - Build command: `bun run build`
   - Publish directory: `out`
4. Deploy the site

> Note: FFmpeg browser features may require proper CORS headers depending on hosting setup.

### Deploying to GitHub Pages

Build the static export:

```bash
bun run build
```

The production files will be generated in the `out/` directory.

You can deploy the `out/` folder using:
- GitHub Pages
- `gh-pages` branch
- GitHub Actions workflow

---

## Architecture

For detailed technical information about Reframe's architecture, design choices, and implementation details, see the [Architecture Documentation](docs/ARCHITECTURE.md).

> Reframe requires WebAssembly (WASM) support to process videos in the browser.
---

## Development Tips

### 1. Next.js Fast Refresh
This project uses Next.js Fast Refresh in development mode. Most changes to React components, hooks, and styles are reflected instantly in the browser without restarting the dev server.

- Component updates appear immediately
- State is often preserved during edits
- Restarting `npm run dev` is usually unnecessary for UI changes

Learn more: https://nextjs.org/docs/architecture/fast-refresh

---

### 2. FFmpeg Module Changes
Changes to `ffmpeg.ts` may not hot-reload correctly because FFmpeg initialization and WebAssembly modules can persist in memory.

If updates are not reflected:

- Perform a full browser page reload
- Clear cached worker instances if necessary
- Restart the development server only when required

FFmpeg WASM reference: https://ffmpegwasm.netlify.app/docs/overview

---

### 3. Monitor FFmpeg Downloads
FFmpeg WebAssembly assets can be large and may take time to download during development.

Use the browser DevTools **Network** tab to:

- Verify FFmpeg assets are loading correctly
- Inspect caching behavior
- Detect failed `.wasm` or worker requests
- Measure initialization performance

Chrome DevTools: https://developer.chrome.com/docs/devtools/network

---

### 4. Use React DevTools
Install React DevTools for easier component inspection and debugging.

Helpful for:

- Inspecting component props and state
- Tracing re-renders
- Debugging hooks
- Monitoring React component trees

React DevTools: https://react.dev/learn/react-developer-tools

---

### 5. Keep Console Open During Development
The browser console provides important runtime diagnostics for:

- FFmpeg initialization issues
- Hydration warnings
- API request failures
- WebAssembly loading errors

Filtering logs by warnings/errors can speed up debugging significantly.

---

### 6. Use Source Maps for Easier Debugging
Development builds include source maps, allowing you to debug original TypeScript/React source files directly from DevTools.

Tips:

- Set breakpoints in source files
- Use async stack traces
- Inspect runtime variables during rendering

JavaScript debugging guide: https://developer.chrome.com/docs/devtools/javascript

---

### 7. Watch for Memory Usage
FFmpeg WebAssembly processing can consume significant browser memory during video operations.

Recommendations:

- Close unused tabs while testing
- Refresh the page after heavy processing tasks
- Monitor memory usage in browser performance tools

Performance tools: https://developer.chrome.com/docs/devtools/performance

---

### 8. Verify Environment Variables
After modifying `.env.local`, restart the Next.js development server because environment variables are loaded only during server startup.

Example:

```bash
npm run dev
```

Environment variables guide: https://nextjs.org/docs/app/guides/environment-variables

---

## Contributing

### ⭐ Star this repo — it helps more people find Reframe!

**Reframe is an open-source project and we welcome contributions of all kinds** — from fixing a typo in the README to implementing a brand new feature. Every contribution matters.

---

### 🌸 GirlScript Summer of Code 2026

Reframe is an **official project in GirlScript Summer of Code (GSSoC) 2026**! We have **300+ open issues** across all difficulty levels — from beginner-friendly tasks to advanced features.

> **If you're a GSSoC participant**, add the `gssoc'26` label to any issue you want to work on, and mention your GitHub username in a comment to claim it.

#### Find issues to work on:

| Level               | Label                                                                                                          | Description                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 🟢 **Beginner**     | [`good first issue`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3A%22good+first+issue%22) | Small, well-defined tasks — perfect if this is your first open source contribution |
| 🟡 **Intermediate** | [`enhancement`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Aenhancement)                 | Feature improvements and UX enhancements                                           |
| 🔴 **Advanced**     | [`feature`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Afeature)                         | New features requiring deeper understanding of FFmpeg/WASM                         |
| 🔵 **Any Level**    | [`documentation`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Adocumentation)             | Docs, guides, and README improvements                                              |
| ♿ **Any Level**    | [`accessibility`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Aaccessibility)             | Making Reframe usable for everyone                                                 |

**[→ Browse all GSSoC'26 issues](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3A%22gssoc%2726%22)**

---

### How to Contribute

1. **Find an issue** — Browse [open issues](https://github.com/magic-peach/reframe/issues) or pick one from the table above
2. **Comment on the issue** — Say you'd like to work on it so we don't duplicate effort
3. **Fork the repo** — Click the Fork button at the top right
4. **Create a branch** — `git checkout -b feat/your-feature-name`
5. **Make your changes** — Code, test, and commit
6. **Open a Pull Request** — Reference the issue number in your PR description
7. **Get reviewed** — We'll review and merge your contribution!

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide including development setup, code style, and PR checklist.

---

## Contributors

Thank you to everyone who has contributed to Reframe! 🎉

[![Contributors](https://contrib.rocks/image?repo=magic-peach/reframe)](https://github.com/magic-peach/reframe/graphs/contributors)

---

## Privacy

Reframe processes all videos **100% client-side**. Your video files are never uploaded to any server. You can even use Reframe offline (after first load). The source code is fully open for inspection.
---

## Contributors

Thanks to all the amazing people who have contributed to Reframe!

[![Contributors](https://contrib.rocks/image?repo=magic-peach/reframe)](https://github.com/magic-peach/reframe/graphs/contributors)

We welcome contributions of all kinds — code, documentation, design, and feedback. Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">

**If Reframe saved you time, please [⭐ star the repo](https://github.com/magic-peach/reframe) — it helps others discover it!**

Made with ❤️ for everyone who just wants to edit a video without the hassle.

</div>

---