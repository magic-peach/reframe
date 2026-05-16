# Contributing to Reframe

First off, **thank you for considering contributing to Reframe**! 🎉

Whether you're fixing a typo, adding a feature, improving accessibility, or writing a test — every contribution makes Reframe better for everyone.

---

## 👋 Want to contribute to magic-peach/reframe?

If you have a bug or an idea, read this guide before opening an issue.

If you're ready to tackle some open issues, **[we've collected some good first issues for you](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3A%22good+first+issue%22)**.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Finding Issues](#finding-issues)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style](#code-style)
- [Development Tips](#development-tips)
- [GSSoC'26 Participants](#gssoc26-participants)

---

## Getting Started

### Prerequisites

- [Git](https://git-scm.com)
- [Bun](https://bun.sh) (recommended) — or Node.js 18+
- A modern browser (Chrome, Firefox, or Safari)

### Fork and Clone

```bash
# 1. Fork the repo by clicking 'Fork' on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/reframe.git
cd reframe

# 3. Add the upstream remote
git remote add upstream https://github.com/magic-peach/reframe.git
```

---

## Development Setup

```bash
# Install dependencies
bun install

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Changes to components reflect instantly with Next.js Fast Refresh.

### Other Commands

```bash
bun run build      # Build for production (outputs to out/)
bun run lint       # Run ESLint
bunx tsc --noEmit  # Run TypeScript type checking
```

---

## Project Structure

```
reframe/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, metadata, fonts
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── VideoEditor.tsx     # Root editor component
│   │   ├── FileUpload.tsx      # Drag-drop file upload
│   │   ├── VideoPreview.tsx    # HTML5 video player
│   │   ├── PresetSelector.tsx  # 11 preset formats + custom
│   │   ├── FramingControl.tsx  # Fit/Fill framing toggle
│   │   ├── TrimControl.tsx     # Start/end time inputs
│   │   ├── RotateControl.tsx   # Rotation buttons
│   │   ├── AudioSpeedControl.tsx  # Audio + speed
│   │   ├── ExportSettings.tsx  # Quality CRF slider
│   │   ├── ExportOverlay.tsx   # Export progress modal
│   │   ├── DownloadResult.tsx  # Success + download
│   │   └── LottiePlayer.tsx    # Lottie animation wrapper
│   ├── hooks/
│   │   └── useVideoEditor.ts   # Main state management hook
│   └── lib/
│       ├── ffmpeg.ts           # FFmpeg wrapper & filter builders
│       ├── presets.ts          # Preset definitions
│       └── types.ts            # TypeScript types
├── public/                     # Static assets
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```
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

## Finding Issues

We have **300+ open issues** across all skill levels:

| Level | Where to look |
|-------|--------------|
| 🟢 **Beginner** | [`good first issue`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3A%22good+first+issue%22) label — 100+ beginner tasks |
| 🟡 **Intermediate** | [`enhancement`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Aenhancement) label |
| 🔴 **Advanced** | [`feature`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Afeature) label |
| 🐛 **Bug Fixes** | [`bug`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Abug) label |
| ♿ **Accessibility** | [`accessibility`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Aaccessibility) label |
| 📝 **Documentation** | [`documentation`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Adocumentation) label |
| 🔒 **Security** | [`security`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Asecurity) label |
| ⚡ **Performance** | [`performance`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3Aperformance) label |

**Before claiming an issue:**
1. Check if someone is already working on it (look at comments and assignees)
2. Comment on the issue to let maintainers know you're working on it
3. If it's been idle for 7+ days, feel free to take it over

---

## Making Changes

### 1. Create a branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/what-you-documented
```

### 2. Make your changes

- Keep changes focused — one issue per PR
- Test your changes in the browser (test file upload, export, and download)
- Make sure `bun run lint` passes
- Make sure `bunx tsc --noEmit` passes (no TypeScript errors)

### 3. Commit your changes

```bash
git add <files>
git commit -m "feat: add aria-label to export button"
```

**Commit message format:**
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `refactor:` — code refactoring (no behavior change)
- `test:` — adding or fixing tests
- `style:` — formatting, whitespace changes
- `chore:` — build config, dependencies

---

## Submitting a Pull Request

1. Push your branch: `git push origin feat/your-feature-name`
2. Go to your fork on GitHub and click **"Compare & pull request"**
3. Fill in the PR template:
   - Describe what you changed and why
   - Reference the issue: `Closes #<issue-number>`
   - Add screenshots for UI changes
4. Submit the PR — maintainers will review within a few days

### PR Checklist

- [ ] Code works in Chrome, Firefox, and Safari
- [ ] No new TypeScript errors (`bunx tsc --noEmit`)
- [ ] ESLint passes (`bun run lint`)
- [ ] UI changes tested on mobile (use browser DevTools)
- [ ] Accessibility: new interactive elements have ARIA labels
- [ ] Issue number referenced in PR description

---

## Code Style

- **TypeScript**: Strict types, no `any` unless absolutely necessary
- **React**: Functional components only, use hooks
- **Tailwind**: Use utility classes; avoid inline `style={}` for static styles
- **No comments**: Code should be self-documenting via good naming; only add comments for non-obvious behavior
- **No console.log**: Remove debug logs before submitting
- **Imports**: Use relative imports within `src/`

---

## Development Tips

- **Fast Refresh**: Changes to React components update instantly without losing state
- **FFmpeg changes**: Changes to `src/lib/ffmpeg.ts` may require a full page reload
- **Testing exports**: Keep a few small test videos (~5-10 MB) for quick export testing
- **React DevTools**: Install the [React DevTools browser extension](https://react.dev/learn/react-developer-tools) for component inspection
- **Network throttling**: Use Chrome DevTools Network tab → "Slow 3G" to test FFmpeg download behavior
- **Mobile testing**: Chrome DevTools → Device Toolbar to test responsive layouts
- **Accessibility testing**: Use [axe DevTools](https://www.deque.com/axe/devtools/) browser extension

---

## GSSoC'26 Participants

Reframe is an **official GirlScript Summer of Code 2026 project**!

### Getting Started as a GSSoC Contributor

1. Browse issues labeled [`gssoc'26`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3A%22gssoc%2726%22)
2. Start with [`good first issue`](https://github.com/magic-peach/reframe/issues?q=is%3Aopen+label%3A%22good+first+issue%22+label%3A%22gssoc%2726%22) if you're new to open source
3. Comment on the issue with: "I'd like to work on this for GSSoC'26 — @magic-peach"
4. Wait for a maintainer to assign the issue to you
5. Submit your PR within **7 days** of being assigned

### Tips for GSSoC Success

- **Read the issue fully** before starting — ask questions in comments if anything is unclear
- **Small, focused PRs** are merged faster than large ones
- **Quality over quantity** — one well-implemented feature beats five half-done ones
- **Be communicative** — comment on your progress, especially if you're stuck
- **Test thoroughly** — check your changes work before submitting

---

## Questions?

- **Found a bug?** → [Open a bug report](https://github.com/magic-peach/reframe/issues/new?labels=bug)
- **Have a feature idea?** → [Open a feature request](https://github.com/magic-peach/reframe/issues/new?labels=feature)
- **Stuck on an issue?** → Comment on the issue and tag `@magic-peach`

Thank you for making Reframe better! 🎬
