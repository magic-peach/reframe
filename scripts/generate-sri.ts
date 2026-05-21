import { createHash } from "crypto";

const urls = [
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd/ffmpeg-core.js",
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd/ffmpeg-core.wasm",
  ];

for (const url of urls) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const hash = createHash("sha384").update(Buffer.from(buf)).digest("base64");
  console.log(`"${url}": "sha384-${hash}"`);
}