"use client";
import { useState } from "react";
import { EditRecipe } from "@/lib/types";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { splitExportVideo } from "@/lib/splitExport";
import { cn } from "@/lib/utils";

interface Props { file: File; recipe: EditRecipe; duration: number; }

export default function SplitExport({ file, recipe, duration }: Props) {
    const [segments, setSegments] = useState(2);
    const [status, setStatus] = useState<"idle"|"busy"|"done"|"error">("idle");
    const [progress, setProgress] = useState({ seg: 0, pct: 0 });
    const [zipUrl, setZipUrl] = useState<string|null>(null);
    const [error, setError] = useState<string|null>(null);

    const run = async () => {
        setStatus("busy"); setError(null); setZipUrl(null);
        try {
            const ffmpeg = await loadFFmpeg();
            const result = await splitExportVideo(ffmpeg, file, recipe, segments, duration,
                (seg, pct) => setProgress({ seg: seg + 1, pct }));
            setZipUrl(result.zipUrl);
            setStatus("done");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
            setStatus("error");
        }
    };

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span>Parts</span>
                    <span className="font-bold text-film-500">{segments}</span>
                </div>
                <input type="range" min={2} max={10} value={segments}
                    onChange={e => setSegments(Number(e.target.value))}
                    disabled={status === "busy"}
                    className="w-full accent-film-600" aria-label="Number of parts" />
            </div>

            {status === "busy" && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[var(--muted)]">
                        <span>Segment {progress.seg}/{segments}</span>
                        <span>{progress.pct}%</span>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-1.5">
                        <div className="bg-film-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress.pct}%` }} />
                    </div>
                </div>
            )}

            {status === "error" && <p className="text-xs text-red-500">{error}</p>}

            {status === "done" && zipUrl && (
                <a href={zipUrl}
                    download={`${file.name.replace(/\.[^/.]+$/, "")}_${segments}parts.zip`}
                    className="block w-full text-center py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700">
                    Download ZIP
                </a>
            )}

            <button type="button"
                onClick={status === "done" ? () => setStatus("idle") : run}
                disabled={status === "busy"}
                aria-label="Split video into equal segments"
                className={cn("w-full py-2 rounded-lg text-sm font-bold transition-all",
                    status === "busy" ? "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
                    : status === "done" ? "border border-[var(--border)] text-[var(--muted)]"
                    : "bg-film-600 hover:bg-film-700 text-white")}>
                {status === "busy" ? "Splitting..." : status === "done" ? "Split again" : `Split into ${segments} parts`}
            </button>
        </div>
    );
}