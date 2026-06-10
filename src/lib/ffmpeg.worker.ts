import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { buildArguments } from "./ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let currentSessionId: string | null = null;

// 👇 FIXED: Strongly type the worker scope
// 👇 FIX: Declare an explicit fallback type inline so TypeScript compiles without modifying tsconfig.json libs
interface WebWorkerContext {
  onmessage: ((this: WebWorkerContext, ev: MessageEvent<any>) => any) | null;
  postMessage(message: any, transfer?: Transferable[]): void;
}

const ctx = self as unknown as WebWorkerContext;

// 👇 FIXED: Changed from self.onmessage to ctx.onmessage
ctx.onmessage = async (event: MessageEvent<any>) => {
  const message = event.data;

  switch (message.type) {
    case "load":
      await handleLoad();
      break;

    case "export":
      currentSessionId = message.id;
      await handleExport(message);
      break;

    case "cancel":
    case "terminate":
      handleTerminate();
      break;
  }
};

async function handleLoad() {
  try {
    if (ffmpegInstance?.loaded) {
      ctx.postMessage({ type: "ready" });
      return;
    }

    ffmpegInstance = new FFmpeg();

    // Route native log dumps back to main console context
    ffmpegInstance.on("log", ({ message }) => {
      console.log("[FFmpeg WASM Core]", message);
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ctx.postMessage({ type: "ready" });
  } catch (error: any) {
    ctx.postMessage({ type: "error", message: `WASM Initialization Error: ${error.message}` });
  }
}

async function handleExport(request: any) {
  if (!ffmpegInstance || !ffmpegInstance.loaded) {
    ctx.postMessage({ type: "error", id: request.id, message: "FFmpeg core engine not loaded." });
    return;
  }

  const { file, recipe, videoDuration, musicFile, musicOptions, overlayFile, overlayOptions } = request;
  
  // File extensions map directly to input formats
  const inputExt = file.name.substring(file.name.lastIndexOf("."));
  const inputName = `input_source${inputExt}`;
  const outputName = `compiled_output.${recipe.format}`;

  const musicInputName = musicFile ? `bg_audio${musicFile.name.substring(musicFile.name.lastIndexOf("."))}` : "";
  const overlayInputName = overlayFile ? `watermark${overlayFile.name.substring(overlayFile.name.lastIndexOf("."))}` : "";

  try {
    // 1. Write files directly to the WASM isolated sandbox filesystem
    await ffmpegInstance.writeFile(inputName, new Uint8Array(file.data));
    
    if (musicFile) {
      await ffmpegInstance.writeFile(musicInputName, new Uint8Array(musicFile.data));
    }
    if (overlayFile) {
      await ffmpegInstance.writeFile(overlayInputName, new Uint8Array(overlayFile.data));
    }

    // 2. Bind progress hooks
    ffmpegInstance.on("progress", ({ progress }) => {
      ctx.postMessage({
        type: "progress",
        id: currentSessionId,
        percent: Math.min(Math.round(progress * 100), 99),
      });
    });

    // 3. Resolve target size matrix limits
    let targetW = recipe.customWidth || 1920;
    let targetH = recipe.customHeight || 1080;

    // 4. Generate argument pipeline array maps
    const args = buildArguments(
      recipe,
      recipe.format,
      outputName,
      inputName,
      targetW,
      targetH,
      !!musicFile,
      musicInputName,
      musicOptions,
      !!overlayFile,
      overlayInputName,
      overlayOptions,
      true, // assume hasOriginalAudio for processing channel flags
      videoDuration
    );

    // 5. Execute processing job stream inside browser
    await ffmpegInstance.exec(args);

    // 6. Read binary array buffer from runtime file system out back to UI thread
    const outputData = await ffmpegInstance.readFile(outputName);
    const arrayBuffer = (outputData as Uint8Array).buffer;

    const mimeTypes = {
      mp4: "video/mp4",
      webm: "video/webm",
      mkv: "video/x-matroska",
      gif: "image/gif",
    };

    // 👇 FIXED: Changed from self.postMessage to ctx.postMessage to correctly leverage the type override layout
    ctx.postMessage(
      {
        type: "result",
        id: request.id,
        data: arrayBuffer,
        mimeType: mimeTypes[recipe.format as keyof typeof mimeTypes] || "video/mp4",
        size: outputData.length,
        width: targetW,
        height: targetH,
        format: recipe.format,
      },
      [arrayBuffer] // Ownership transfer
    );

    // Cleanup filesystem references inside the sandboxed runner
    await ffmpegInstance.deleteFile(inputName);
    await ffmpegInstance.deleteFile(outputName);
    if (musicFile) await ffmpegInstance.deleteFile(musicInputName);
    if (overlayFile) await ffmpegInstance.deleteFile(overlayInputName);

  } catch (error: any) {
    ctx.postMessage({ type: "error", id: request.id, message: `Processing Error: ${error.message}` });
  } finally {
    currentSessionId = null;
  }
}

function handleTerminate() {
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate();
    } catch (e) {
      // already unmounted
    }
    ffmpegInstance = null;
  }
  ctx.postMessage({ type: "cancelled", id: currentSessionId || undefined });
  currentSessionId = null;
}