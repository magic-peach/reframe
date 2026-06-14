const fs = require('fs');
const path = require('path');
const https = require('https');
const urlModule = require('url');

const targetDir = path.resolve(__dirname, '../public/ffmpeg');
const coreDir = path.join(targetDir, 'core');
const coreMtDir = path.join(targetDir, 'core-mt');

// Ensure directories exist
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
if (!fs.existsSync(coreDir)) fs.mkdirSync(coreDir, { recursive: true });
if (!fs.existsSync(coreMtDir)) fs.mkdirSync(coreMtDir, { recursive: true });

const filesToDownload = [
  // Single-threaded core
  {
    url: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
    dest: path.join(coreDir, 'ffmpeg-core.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
    dest: path.join(coreDir, 'ffmpeg-core.wasm')
  },
  // Multi-threaded core
  {
    url: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js',
    dest: path.join(coreMtDir, 'ffmpeg-core.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js',
    dest: path.join(coreMtDir, 'ffmpeg-core.worker.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm',
    dest: path.join(coreMtDir, 'ffmpeg-core.wasm')
  }
];

function fetchWithRedirects(urlStr, destStream, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) {
      reject(new Error("Too many redirects"));
      return;
    }

    https.get(urlStr, (response) => {
      const { statusCode } = response;

      // Handle redirects
      if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
        const nextUrl = urlModule.resolve(urlStr, response.headers.location);
        resolve(fetchWithRedirects(nextUrl, destStream, redirectCount + 1));
        return;
      }

      if (statusCode === 200) {
        response.pipe(destStream);
        response.on('end', () => resolve());
      } else {
        reject(new Error(`Failed with status code: ${statusCode} for URL: ${urlStr}`));
      }
    }).on('error', (err) => reject(err));
  });
}

async function downloadFile(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`Skipping ${dest} - already downloaded.`);
    return;
  }

  console.log(`Downloading ${url} -> ${dest} ...`);
  const fileStream = fs.createWriteStream(dest);
  try {
    await fetchWithRedirects(url, fileStream);
    fileStream.close();
    console.log(`Successfully downloaded to ${dest}`);
  } catch (error) {
    fileStream.close();
    fs.unlink(dest, () => {}); // Delete partial file
    throw error;
  }
}

(async () => {
  try {
    for (const item of filesToDownload) {
      await downloadFile(item.url, item.dest);
    }
    console.log("All FFmpeg WASM files downloaded successfully!");
  } catch (error) {
    console.error("Failed to download local FFmpeg files:", error);
    process.exit(1);
  }
})();
