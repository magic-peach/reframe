"use client";

import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/ffmpeg";
import { Download, RotateCcw, CheckCircle } from "lucide-react";

interface Props {
  result: ExportResult;
  onReset: () => void;
}

export default function DownloadResult({ result, onReset }: Props) {
  const filename = `export_${result.width}x${result.height}.${result.format}`;

  return (
    <div className="p-5 bg-green-50 border border-green-200 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle size={20} />
        <span className="font-semibold">Export complete!</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-white rounded-lg p-3 text-center border border-green-100">
          <p className="text-xs text-gray-400 mb-1">Resolution</p>
          <p className="font-semibold text-gray-700">{result.width} × {result.height}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-green-100">
          <p className="text-xs text-gray-400 mb-1">File size</p>
          <p className="font-semibold text-gray-700">{formatBytes(result.size)}</p>
        </div>
      </div>

      {result.format === "webm" && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          ℹ️ Your browser&apos;s ffmpeg build doesn&apos;t support H.264, so the output is WebM (VP9).
          This plays in Chrome and Firefox but may not work in older iOS Safari.
        </p>
      )}

      <div className="flex gap-3">
        <a
          href={result.blobUrl}
          download={filename}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Download size={16} />
          Download {result.format.toUpperCase()}
        </a>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={16} />
          New
        </button>
      </div>
    </div>
  );
}
