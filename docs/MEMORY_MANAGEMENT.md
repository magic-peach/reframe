# Memory Management: Blob URL Lifecycle

## Overview

This document describes the memory management implementation for blob URLs in Reframe, preventing memory leaks and ensuring proper cleanup of video data.

## The Problem

Blob URLs created with `URL.createObjectURL()` hold references to their underlying data in memory until explicitly revoked with `URL.revokeObjectURL()`. Without proper cleanup, these references accumulate, leading to:

- **Memory Exhaustion**: Each video file (up to 2GB) remains in memory
- **Browser Crashes**: Accumulated memory pressure crashes the browser tab
- **Privacy Violation**: User video data persists in browser memory indefinitely
- **Performance Degradation**: Sluggish performance over time

## The Solution

### 1. Tracked Blob URL Creation

Both the main thread and worker thread now use a tracking system:

```typescript
// Main thread (src/lib/ffmpeg.ts)
const activeBlobUrls = new Set<string>();

export function createTrackedBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  activeBlobUrls.add(url);
  return url;
}

export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
  activeBlobUrls.delete(url);
}

export function revokeAllBlobUrls(): void {
  activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
  activeBlobUrls.clear();
}
```

```typescript
// Worker thread (src/lib/ffmpeg.worker.ts)
const activeBlobUrls = new Set<string>();

function createTrackedBlobUrl(blob: Blob, mimeType: string): string {
  const url = URL.createObjectURL(blob);
  activeBlobUrls.add(url);
  return url;
}

function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
  activeBlobUrls.delete(url);
}

function revokeAllBlobUrls(): void {
  activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
  activeBlobUrls.clear();
}
```

### 2. Automatic Cleanup

#### Main Thread Cleanup
- **Page Unload**: All blob URLs revoked when user navigates away
- **Visibility Change**: Cleanup when tab becomes hidden (user switches tabs)
- **Component Unmount**: Cleanup when components are destroyed

```typescript
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", revokeAllBlobUrls);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      revokeAllBlobUrls();
    }
  });
}
```

#### Worker Thread Cleanup
- **After FFmpeg Load**: Core file blob URLs revoked after FFmpeg loads them
- **After Export**: All blob URLs created during export are revoked in finally block

```typescript
async function loadCore(onProgress?: (percent: number) => void): Promise<void> {
  try {
    await ffmpeg.load({
      coreURL: await fetchWithIntegrity(...),
      wasmURL: await fetchWithIntegrity(...),
      workerURL: await fetchWithIntegrity(...),
    });
    ffmpegLoaded = true;
  } finally {
    ffmpeg.off("progress", handleProgress);
    // Revoke blob URLs after FFmpeg loads them
    revokeAllBlobUrls();
  }
}
```

```typescript
async function runExport(request: ExportRequest): Promise<ResultPayload> {
  try {
    // Export logic...
  } finally {
    ffmpeg.off("progress", handleProgress);
    if (logListener) ffmpeg.off("log", logListener);
    // Revoke any blob URLs created during export
    revokeAllBlobUrls();
    for (const path of cleanupFiles) {
      await removeFile(path);
    }
  }
}
```

### 3. Component-Level Cleanup

#### VideoPreview Component
- Revoke previous URL before creating new one
- Cleanup on component unmount
- Race condition prevention with ID tracking

```typescript
useEffect(() => {
  if (!file) return;

  // Revoke previous URL before creating new one
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }

  const url = URL.createObjectURL(file);
  urlRef.current = url;

  return () => {
    // Only revoke if this is still the current URL
    if (urlRef.current === url) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };
}, [file, videoRef]);

// Cleanup on component unmount
useEffect(() => {
  return () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };
}, []);
```

#### useVideoEditor Hook
- Revoke export blob URL when starting new export
- Revoke on component unmount
- Revoke on reset

```typescript
// When starting new export
if (result?.blobUrl) revokeBlobUrl(result.blobUrl);

// Cleanup effect
useEffect(() => {
  return () => {
    if (result?.blobUrl) {
      revokeBlobUrl(result.blobUrl);
    }
  };
}, [result?.blobUrl]);

// Reset function
const reset = useCallback(() => {
  if (result?.blobUrl) revokeBlobUrl(result.blobUrl);
  // ...
}, []);
```

## Blob URL Lifecycle

### FFmpeg Core Files (Worker Thread)
1. **Created**: When `fetchWithIntegrity` downloads core files from CDN
2. **Used**: During `ffmpeg.load()` to initialize FFmpeg
3. **Revoked**: Immediately after FFmpeg loads (data copied to WASM memory)
4. **Lifetime**: < 1 second

### Export Result (Main Thread)
1. **Created**: When export completes and result is received from worker
2. **Used**: For download, preview, or further processing
3. **Revoked**: When user starts new export, component unmounts, or page unloads
4. **Lifetime**: Until user action or cleanup event

### Video Preview (Main Thread)
1. **Created**: When user selects a video file
2. **Used**: For video preview playback
3. **Revoked**: When user selects different file or component unmounts
4. **Lifetime**: Until file change or component unmount

### Metadata Extraction (Main Thread)
1. **Created**: When extracting video metadata
2. **Used**: For loading video metadata
3. **Revoked**: After metadata loaded, on timeout, or on error
4. **Lifetime**: < 5 seconds (timeout) or until metadata loads

## Memory Monitoring

### Current Implementation
The tracking system allows monitoring of active blob URLs:

```typescript
// Get count of active blob URLs
const activeCount = activeBlobUrls.size;

// Log for debugging
console.log(`Active blob URLs: ${activeCount}`);
```

### Future Enhancements
- **Memory Pressure Detection**: Monitor browser memory usage
- **Automatic Cleanup**: Revoke oldest URLs when memory pressure detected
- **Warning System**: Alert user when approaching memory limits
- **Metrics Dashboard**: Display memory usage to users

## Testing

### Manual Testing
1. Upload multiple videos in succession
2. Verify no memory growth in browser DevTools
3. Check blob URL count remains low
4. Test rapid file switching
5. Test page navigation and tab switching

### Automated Testing
```typescript
describe("Blob URL Management", () => {
  it("should revoke blob URLs after FFmpeg load", async () => {
    const initialCount = activeBlobUrls.size;
    await loadCore();
    expect(activeBlobUrls.size).toBe(initialCount);
  });

  it("should revoke blob URLs after export", async () => {
    await exportVideo(file, recipe);
    expect(activeBlobUrls.size).toBe(0);
  });
});
```

## Best Practices

### For Developers
1. **Always use tracked creation**: Use `createTrackedBlobUrl()` instead of `URL.createObjectURL()`
2. **Always use tracked revocation**: Use `revokeBlobUrl()` instead of `URL.revokeObjectURL()`
3. **Cleanup in finally blocks**: Ensure cleanup happens even on errors
4. **Test memory usage**: Monitor memory during development
5. **Document blob URL lifetime**: Comment on expected lifetime

### For Users
1. **Close tabs when done**: Navigate away to trigger cleanup
2. **Use browser restart**: If performance degrades, restart browser
3. **Monitor performance**: Report sluggishness or crashes
4. **Keep browser updated**: Latest browsers have better memory management

## Related Files

- `src/lib/ffmpeg.ts` - Main thread blob URL tracking
- `src/lib/ffmpeg.worker.ts` - Worker thread blob URL tracking
- `src/hooks/useVideoEditor.ts` - Export result blob URL management
- `src/components/VideoPreview.tsx` - Preview blob URL management
- `docs/ARCHITECTURE.md` - Overall architecture documentation

## References

- [MDN: URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)
- [MDN: URL.revokeObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL)
- [Web APIs: Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

---

**Last Updated**: 2026-05-31  
**Severity**: Critical Memory Leak Fix  
**Impact**: Prevents memory exhaustion, browser crashes, and privacy violations
