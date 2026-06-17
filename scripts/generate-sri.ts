import { createHash } from "crypto";

const urls = [
  // Single-threaded core (UMD)
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
  // Multi-threaded core (ESM) - used when crossOriginIsolated
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm",
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js",
];

async function generateSRI() {
  console.log("Generating SRI hashes for FFmpeg core files...\n");

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      const hash = createHash("sha384").update(Buffer.from(buf)).digest("base64");
      const filename = url.split("/").pop()!;
      console.log(`"${filename}": "sha384-${hash}",`);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
    }
  }
}

generateSRI();
