"use client";

import React, { useState } from "react";
import { useExportQueue, ExportJob } from "@/context/ExportQueueContext";
import { X, Play, AlertCircle, Download, CheckCircle2, Loader2, ChevronUp, ChevronDown } from "lucide-react";

function formatElapsed(startedAt?: number): string {
  if (!startedAt) return "0:00";
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function JobItem({ job, onCancel, onDismiss }: { job: ExportJob; onCancel: (id: string) => void; onDismiss: (id: string) => void }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(job.startedAt));

  React.useEffect(() => {
    if (job.status !== "exporting") return;
    const timer = setInterval(() => setElapsed(formatElapsed(job.startedAt)), 1000);
    return () => clearInterval(timer);
  }, [job.status, job.startedAt]);

  const handleDownload = () => {
    if (job.result) {
      const a = document.createElement("a");
      a.href = job.result.blobUrl;
      a.download = `reframe_export_${job.result.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-sm flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-[var(--text)] truncate flex-1" title={job.name}>
          {job.name}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {job.status === "queued" && (
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Queued
            </span>
          )}
          {job.status === "exporting" && (
            <span className="text-xs text-[var(--accent)] font-medium flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> {job.progress}%
            </span>
          )}
          {job.status === "done" && (
            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          )}
          {job.status === "error" && (
            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          )}
        </div>
      </div>

      {(job.status === "exporting" || job.status === "queued") && (
        <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      )}

      {job.status === "exporting" && (
        <div className="text-[10px] text-[var(--muted)] text-right">
          {elapsed} elapsed
        </div>
      )}

      {job.status === "error" && job.error && (
        <div className="text-xs text-red-400 truncate" title={job.error}>
          {job.error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-1">
        {(job.status === "queued" || job.status === "exporting") && (
          <button
            onClick={() => onCancel(job.id)}
            className="text-xs px-2 py-1 hover:bg-[var(--bg)] rounded text-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
        )}
        {job.status === "done" && (
          <>
            <button
              onClick={handleDownload}
              className="text-xs px-2 py-1 bg-[var(--accent)] text-black font-medium rounded hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => onDismiss(job.id)}
              className="text-xs px-2 py-1 hover:bg-[var(--bg)] rounded text-[var(--muted)] transition-colors"
            >
              Dismiss
            </button>
          </>
        )}
        {job.status === "error" && (
          <button
            onClick={() => onDismiss(job.id)}
            className="text-xs px-2 py-1 hover:bg-[var(--bg)] rounded text-[var(--muted)] transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export function ExportQueuePanel() {
  const { jobs, cancelJob, dismissJob } = useExportQueue();
  const [isExpanded, setIsExpanded] = useState(true);

  if (jobs.length === 0) return null;

  const activeJobs = jobs.filter(j => j.status === "exporting" || j.status === "queued").length;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 max-w-[calc(100vw-32px)] flex flex-col gap-2">
      <div 
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
      >
        <button 
          className="w-full flex items-center justify-between p-3 cursor-pointer bg-[var(--bg)] border-b border-[var(--border)] text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-sm">Export Queue</span>
            {activeJobs > 0 && (
              <span className="bg-[var(--accent)] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeJobs}
              </span>
            )}
          </div>
          <div className="text-[var(--muted)] hover:text-[var(--text)] transition-colors p-1">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {jobs.map(job => (
              <JobItem 
                key={job.id} 
                job={job} 
                onCancel={cancelJob}
                onDismiss={dismissJob}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
