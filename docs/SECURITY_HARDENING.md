# Security Hardening: SRI Implementation for FFmpeg.wasm

## Overview

This document describes the security hardening implemented to protect Reframe from supply chain attacks when loading FFmpeg.wasm from CDN.

## The Vulnerability (Fixed)

### Original Issue
Reframe loaded FFmpeg.wasm from jsDelivr CDN without Subresource Integrity (SRI) verification for multi-threaded builds. This created a critical supply chain attack vector where:

1. **CDN Compromise**: Attacker compromises jsDelivr CDN
2. **MITM Attack**: Man-in-the-middle injects malicious code
3. **Impact**: Malicious WebAssembly/JavaScript executes with elevated privileges (SharedArrayBuffer access)

### Why It Was Critical
- Multi-threaded FFmpeg loads `ffmpeg-core.worker.js` without SRI verification
- This file executes with SharedArrayBuffer access (high privilege)
- Could exfiltrate user video data, inject malicious filters, escape sandbox
- Directly compromised Reframe's core value: "100% private" processing

## The Fix

### 1. Complete SRI Coverage

**File**: `src/lib/ffmpeg.worker.ts`

All FFmpeg core files now have SRI hashes:
```typescript
const SRI_HASHES: Record<string, string> = {
  // Single-threaded core (UMD) - @ffmpeg/core@0.12.10
  "ffmpeg-core.js":   "sha384-sKfkiFtvUk+vexk+0EUhEh366190/4WpgUAsUvaxEfyg7+E1Zt5Y5hrsU808g8Q9",
  "ffmpeg-core.wasm": "sha384-U1VDhkPYrM3wTCT4/vjSpSsKqG/UjljYrYCI4hBSJ02svbCkxuCi6U6u/peg5vpW",
  // Multi-threaded core (ESM) - @ffmpeg/core-mt@0.12.6
  "mt-ffmpeg-core.js":   "sha384-W///EnBaTc/koJ2li+z9tlVIZpfvrFSyePilMXKRK5PVInCGTUgCCX/CLz0XOJMK",
  "mt-ffmpeg-core.wasm": "sha384-FycsKH8SDTkBt19cTwetE082xjCaWrSu1JpBG7O1+kZRu1xnfgD4rAiCnpRPQQSX",
  "mt-ffmpeg-core.worker.js": "sha384-32plzPULGD7+hN54cJPtCAjBlATPw/00oahYoyI5MlZ6CP5/IZJ/rkeUJ6PW/Ozy",
};
```

### 2. Fail-Safe Security

**Removed**: Insecure fallback that loaded without SRI when hash was missing

**Added**: Explicit error that prevents loading unverified code:
```typescript
if (!integrity) {
  throw new Error(
    `Security Error: Missing SRI hash for ${filename}. ` +
    `This prevents loading unverified code from CDN. ` +
    `Please add the SRI hash to SRI_HASHES in ffmpeg.worker.ts`
  );
}
```

### 3. Context-Aware Hash Selection

The `fetchWithIntegrity` function now:
- Accepts `isMultiThreaded` parameter
- Selects appropriate SRI hash based on context
- Uses `mt-` prefix for multi-threaded files

### 4. Content-Security-Policy

**File**: `vercel.json`

Added CSP header for defense-in-depth:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self' blob:; base-uri 'self'; form-action 'self';"
}
```

## Maintenance

### Updating FFmpeg Versions

When updating FFmpeg.wasm versions:

1. **Update version numbers** in `src/lib/ffmpeg.worker.ts`:
   ```typescript
   const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@NEW_VERSION/dist/umd";
   const MT_CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@NEW_VERSION/dist/esm";
   ```

2. **Generate new SRI hashes**:
   ```bash
   bun run scripts/generate-sri.ts
   # or
   npx tsx scripts/generate-sri.ts
   ```

3. **Update SRI_HASHES** in `src/lib/ffmpeg.worker.ts` with the new hashes

4. **Test thoroughly** in both single-threaded and multi-threaded modes

### SRI Hash Generation Script

**File**: `scripts/generate-sri.ts`

This script generates SHA-384 SRI hashes for all FFmpeg core files:
- Single-threaded core (UMD)
- Multi-threaded core (ESM)
- Worker file (critical for security)

Run it whenever FFmpeg versions change.

## Security Architecture

### Defense in Depth

1. **SRI Verification**: Ensures CDN files haven't been tampered with
2. **CSP Headers**: Restricts which resources can be loaded
3. **COOP/COEP**: Enables SharedArrayBuffer with isolation
4. **Fail-Safe**: Refuses to load unverified code

### Threat Model Mitigated

| Threat | Mitigation |
|--------|------------|
| CDN Compromise | SRI verification prevents loading tampered files |
| MITM Attack | HTTPS + SRI ensures integrity |
| Supply Chain Attack | Explicit hash verification for all FFmpeg files |
| Code Injection | CSP restricts script sources |
| Data Exfiltration | CSP restricts connect sources |

## Testing

### Verify SRI is Working

1. **Single-threaded mode** (default):
   - Deploy without COOP/COEP headers
   - Should load with SRI verification
   - Check browser DevTools Network tab for integrity attribute

2. **Multi-threaded mode** (production):
   - Deploy with COOP/COEP headers (Vercel config)
   - Should load all files with SRI verification
   - Verify worker.js has integrity attribute

3. **Test failure mode**:
   - Temporarily remove an SRI hash
   - Should throw explicit security error
   - Should NOT load without verification

## Related Files

- `src/lib/ffmpeg.worker.ts` - Main FFmpeg loading logic with SRI
- `src/lib/ffmpeg.ts` - Main thread FFmpeg interface
- `vercel.json` - Security headers including CSP
- `scripts/generate-sri.ts` - SRI hash generation utility
- `docs/ARCHITECTURE.md` - Overall architecture documentation

## Security Best Practices

1. **Never disable SRI** - The fail-safe error is intentional
2. **Keep hashes updated** - Regenerate when updating FFmpeg
3. **Monitor CDN security** - Subscribe to jsDelivr security advisories
4. **Review CSP regularly** - Adjust as third-party dependencies change
5. **Test both modes** - Verify single-threaded and multi-threaded paths

## References

- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [W3C: SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/docs)

---

**Last Updated**: 2026-05-31  
**Severity**: Critical Security Fix  
**Impact**: Prevents supply chain attacks on FFmpeg.wasm loading
