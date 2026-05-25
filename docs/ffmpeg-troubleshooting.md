# FFmpeg Troubleshooting

This guide covers the most common reasons FFmpeg.wasm fails to load in Reframe and what to try next.

## Common causes

- Unstable or blocked network access to the FFmpeg CDN
- Browser restrictions around WebAssembly or SharedArrayBuffer support
- Privacy tools, ad blockers, or firewall rules preventing `.js` or `.wasm` downloads
- Corporate or offline environments that cannot reach external package CDNs

## What to try

1. Retry the export after a short delay. Temporary CDN or network issues often recover on their own.
2. Check whether your browser can reach external HTTPS resources.
3. Disable aggressive content blockers for the site, then try again.
4. Use a current version of Chrome, Edge, or Firefox.
5. If you are on a restricted network, try from an unrestricted connection or mirror the app behind a CDN you control.

## Retry behavior

Reframe automatically retries FFmpeg loading up to three times with exponential backoff.

- First retry happens quickly
- Each later retry waits longer
- Permanent failures surface a readable error and a retry action in the UI

If the retry button keeps failing, the issue is usually environmental rather than a problem with the video itself.

## Offline and restricted networks

FFmpeg.wasm assets are large and are fetched at runtime. If the browser cannot reach the CDN, the export flow cannot start.

In offline or locked-down environments, you may need to:

- Allow access to the FFmpeg CDN hosts
- Relax firewall or proxy rules for the app
- Host the FFmpeg core assets on an accessible origin

## Browser compatibility

Most modern browsers can run Reframe, but older builds or hardened privacy settings may block the WebAssembly setup step.

If loading fails immediately even on a healthy network, try another modern browser first.