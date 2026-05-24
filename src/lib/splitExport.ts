import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";
import { EditRecipe } from "./types";
import { getPresetById } from "./presets";

export async function splitExportVideo(
    ffmpeg: FFmpeg,
    file: File,
    recipe: EditRecipe,
    segments: number,
    duration: number,
    onProgress: (segmentIndex: number, percent: number) => void,
    signal?: AbortSignal
): Promise<{ zipUrl: string; totalSize: number }> {
    const id = Date.now();
    const ext = file.name.split(".").pop() ?? "mp4";
    const inputName = `input_${id}.${ext}`;
    const trimStart = recipe.trimStart ?? 0;
    const trimEnd = recipe.trimEnd ?? duration;
    const segDuration = (trimEnd - trimStart) / segments;

    let targetW = recipe.customWidth, targetH = recipe.customHeight;
    if (recipe.preset !== "custom") {
        const p = getPresetById(recipe.preset);
        targetW = p?.width ?? 1920;
        targetH = p?.height ?? 1080;
    }
    targetW = Math.round(targetW / 2) * 2;
    targetH = Math.round(targetH / 2) * 2;

    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal });
    const zip = new JSZip();
    let totalSize = 0;

    for (let i = 0; i < segments; i++) {
        const start = (trimStart + i * segDuration).toFixed(3);
        const end = (trimStart + (i + 1) * segDuration).toFixed(3);
        const outName = `seg_${id}_${i}.mp4`;

        const onProg = ({ progress }: { progress: number }) =>
            onProgress(i, Math.min(100, Math.round(progress * 100)));
        ffmpeg.on("progress", onProg);

        await ffmpeg.exec([
            "-i", inputName,
            "-ss", start, "-to", end,
            "-c:v", "libx264", "-crf", String(recipe.quality),
            "-preset", "medium", "-movflags", "+faststart",
            ...(recipe.keepAudio ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]),
            outName
        ], undefined, { signal });

        ffmpeg.off("progress", onProg);
        const data = await ffmpeg.readFile(outName, undefined, { signal });
        const bytes = new Uint8Array(data as Uint8Array);
        totalSize += bytes.byteLength;
        zip.file(`part${i + 1}_of_${segments}.mp4`, bytes);
        try { await ffmpeg.deleteFile(outName); } catch {}
    }

    try { await ffmpeg.deleteFile(inputName); } catch {}
    const blob = await zip.generateAsync({ type: "blob" });
    return { zipUrl: URL.createObjectURL(blob), totalSize };
}