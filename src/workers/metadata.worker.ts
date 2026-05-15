/**
 * Video Metadata Extraction Web Worker
 * 
 * Offloads the task of parsing MP4 files to extract duration, width, and height
 * without blocking the main browser thread. Uses `mp4box` to parse the `moov` atom.
 */
import * as MP4Box from "mp4box";

self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data;

  if (!(file instanceof File)) {
    self.postMessage({ error: "Invalid file object provided to worker." });
    return;
  }

  /**
   * MP4Box.js strictly supports MP4/ISOBMFF format. 
   * Instantly fallback to main-thread processing for other formats.
   */
  if (!file.name.toLowerCase().endsWith(".mp4") && !file.type.includes("mp4")) {
    self.postMessage({ error: "Unsupported file format. Delegating to main thread fallback." });
    return;
  }

  const mp4boxfile = MP4Box.createFile();
  let isReady = false;

  /**
   * Triggered when MP4Box has successfully parsed the 'moov' atom.
   * Extracts target metadata and terminates the extraction process.
   * 
   * @param {Object} info - Parsed metadata object provided by MP4Box.
   */
  mp4boxfile.onReady = (info: any) => {
    isReady = true;
    try {
      const duration = (info.duration / info.timescale) || 0;
      let width = 0;
      let height = 0;

      if (info.videoTracks && info.videoTracks.length > 0) {
        const track = info.videoTracks[0];
        width = track.video.width;
        height = track.video.height;
      }

      self.postMessage({ duration, width, height });
    } catch (err) {
      self.postMessage({ error: "Failed to parse metadata from the video info object." });
    }
  };

  /**
   * Global error handler for MP4Box parsing issues.
   */
  mp4boxfile.onError = (e: any) => {
    self.postMessage({ error: e });
  };

  /**
   * Asynchronously reads a specific byte range of the file into an ArrayBuffer.
   * 
   * @param {number} start - Byte offset to start reading from.
   * @param {number} end - Byte offset to stop reading at.
   * @returns {Promise<ArrayBuffer>} The read buffer segment.
   */
  const readChunk = async (start: number, end: number): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const slice = file.slice(start, end);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(slice);
    });
  };

  /**
   * Incrementally processes the file in 5MB chunks until the metadata is found
   * or EOF is reached.
   */
  const processFileChunked = async () => {
    const CHUNK_SIZE = 1024 * 1024 * 5; // 5 Megabytes
    let offset = 0;

    try {
      while (offset < file.size && !isReady) {
        const end = Math.min(offset + CHUNK_SIZE, file.size);
        const buffer = await readChunk(offset, end);
        
        // MP4Box requires the absolute file offset property attached to the buffer.
        (buffer as any).fileStart = offset;
        offset += buffer.byteLength;
        
        mp4boxfile.appendBuffer(buffer as any);
      }
      
      if (!isReady && offset >= file.size) {
        mp4boxfile.flush();
        if (!isReady) {
          self.postMessage({ error: "File traversal completed but 'moov' atom was not found." });
        }
      }
    } catch (e) {
      self.postMessage({ error: e });
    }
  };

  processFileChunked();
};
