# Deployment Guide for Reframe

Reframe is built using Next.js with static HTML export (`output: 'export'`). This means the entire application builds into a set of static files in the `out/` directory, allowing it to be hosted on any static hosting provider.

---

## Prerequisites for FFmpeg.wasm

> [!IMPORTANT]
> **FFmpeg.wasm requires COOP/COEP headers** to be served by your hosting provider. This enables `SharedArrayBuffer` support in modern browsers, which is required for multi-threaded video processing in WebAssembly.

---

## Deploying to Vercel (Recommended)

The easiest and quickest way to host Reframe:

### Option 1 — Vercel Dashboard (Recommended)

1. Fork this repository on GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your fork.
3. Configure the project:
   - **Framework Preset:** Next.js
   - **Build Command:** `bun run build`
   - **Output Directory:** `out`
4. Click **Deploy**. Vercel will automatically build and host the static output.

### Option 2 — Vercel CLI

From the project root directory, run:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy production build
vercel --prod
```

### FFmpeg.wasm Configuration (Vercel)

Vercel requires a `vercel.json` file in the root of the repository to serve the correct headers. Reframe comes pre-configured with this file:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}
```

---

## Deploying to Netlify

1. Fork and push your repository to GitHub.
2. Open Netlify, log in, and click **Import an existing project**.
3. Select your forked repository.
4. Configure the build settings:
   - **Build command:** `bun run build`
   - **Publish directory:** `out`
5. Click **Deploy site**.

---

## Deploying to GitHub Pages

To deploy manually or via a GitHub Actions workflow:

1. Build the static export locally:
   ```bash
   bun run build
   ```
2. The production files will be generated in the `out/` directory.
3. You can deploy the `out/` folder to the `gh-pages` branch using tools like the `gh-pages` package, or use a custom GitHub Actions workflow to publish to GitHub Pages.

---

## Alternative Static Hosts

You can host Reframe on any other static hosting provider, including:

| Platform | Deployment Method |
| :--- | :--- |
| **Cloudflare Pages** | Connect your fork directly in the Cloudflare Pages dashboard. |
| **Render** | Create a Static Site, configure the build command as `bun run build` and output directory as `out`. |
| **AWS S3 / CloudFront** | Upload the contents of the `out/` folder to an S3 bucket configured for static site hosting. |
