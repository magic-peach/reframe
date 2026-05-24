import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { OverlayPosition } from "@/lib/types";
import { ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Upload, Trash2, FileImage } from "lucide-react";

interface ImageOverlayPanelProps {
  overlayFile: File | null;
  setOverlayFile: (file: File | null) => void;
  overlayPosition: OverlayPosition;
  setOverlayPosition: (p: OverlayPosition) => void;
  overlaySize: number;
  setOverlaySize: (v: number) => void;
  overlayOpacity: number;
  setOverlayOpacity: (v: number) => void;
}

const POSITIONS: { value: OverlayPosition; icon: React.ReactNode; label: string }[] = [
  { value: "top-left",     icon: <ArrowUpLeft size={11} />,  label: "TL" },
  { value: "top-right",    icon: <ArrowUpRight size={11} />, label: "TR" },
  { value: "bottom-left",  icon: <ArrowDownLeft size={11} />, label: "BL" },
  { value: "bottom-right", icon: <ArrowDownRight size={11} />, label: "BR" },
];

export default function ImageOverlayPanel({
  overlayFile,
  setOverlayFile,
  overlayPosition,
  setOverlayPosition,
  overlaySize,
  setOverlaySize,
  overlayOpacity,
  setOverlayOpacity,
}: ImageOverlayPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbUrl, setThumbUrl] = useState<string>("");

  useEffect(() => {
    if (!overlayFile) {
      setThumbUrl("");
      return;
    }
    const url = URL.createObjectURL(overlayFile);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [overlayFile]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOverlayFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isSmallSize = overlaySize <= 150;
  const isMediumSize = overlaySize > 150 && overlaySize <= 300;
  const isLargeSize = overlaySize > 300;

  const isFaintOpacity = overlayOpacity <= 35;
  const isMediumOpacity = overlayOpacity > 35 && overlayOpacity <= 75;
  const isSolidOpacity = overlayOpacity > 75;

  return (
    <div className="w-full text-[11px] text-white space-y-3">
      
      {/* Side-by-Side Area */}
      <div className="flex gap-2.5 items-center w-full">
        
        {/* Left Side: Dynamic Upload / Preview Square */}
        <label className={`w-14 h-11 shrink-0 rounded-lg overflow-hidden flex flex-col items-center justify-center transition border ${
          overlayFile 
            ? "border-[var(--border)] bg-black/40 pointer-events-none" 
            : "border-dashed border-[#2d4266] hover:bg-white/5 text-[#c7d8f7] hover:text-white cursor-pointer"
        }`}>
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt="Overlay preview"
              width={56}
              height={44}
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <Upload size={14} className="opacity-80" />
              <span className="text-[9px] mt-0.5 font-medium tracking-wide">Upload</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={!!overlayFile}
          />
        </label>

        {/* Right Side: Horizontal Details Card */}
        <div className="flex-1 min-w-0 h-11 rounded-lg border border-[var(--border)] bg-[#121d30]/20 flex items-center justify-between px-3 gap-2.5">
          {overlayFile ? (
            <>
              {/* File Info block */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileImage size={14} className="text-[var(--muted)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-[var(--text)] truncate">
                    {overlayFile.name}
                  </p>
                  <p className="text-[9px] text-[var(--muted)] mt-0.5">
                    {(overlayFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOverlayFile(null)}
                aria-label="Remove overlay image"
                className="w-6 h-6 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition shrink-0"
              >
                <Trash2 size={11} aria-hidden="true" />
              </button>
            </>
          ) : (
            <span className="text-[10px] text-[var(--muted)] italic">
              No asset selected
            </span>
          )}
        </div>
      </div>

      {/* Control Presets Configuration Dashboard */}
      {overlayFile && (
        <div className="space-y-1.5 pt-1 animate-fade-in">
          {/* Position Selector Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--muted)] w-8">Pos:</span>
            <div className="grid grid-cols-4 gap-1 flex-1">
              {POSITIONS.map(({ value, icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOverlayPosition(value)}
                  className={`rounded border py-0.5 text-center text-[10px] transition flex items-center justify-center gap-0.5 ${
                    overlayPosition === value
                      ? "border-film-500 text-white bg-film-600/10"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                  }`}
                >
                  <span className={overlayPosition === value ? "text-film-400" : "text-[var(--muted)]"}>
                    {icon}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Preset Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--muted)] w-8">Size:</span>
            <div className="grid grid-cols-3 gap-1 flex-1">
              <button
                type="button"
                onClick={() => setOverlaySize(100)}
                className={`rounded border py-0.5 text-center text-[10px] transition ${
                  isSmallSize
                    ? "border-film-500 text-white bg-film-600/10"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                Small
              </button>
              <button
                type="button"
                onClick={() => setOverlaySize(250)}
                className={`rounded border py-0.5 text-center text-[10px] transition ${
                  isMediumSize
                    ? "border-film-500 text-white bg-film-600/10"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setOverlaySize(450)}
                className={`rounded border py-0.5 text-center text-[10px] transition ${
                  isLargeSize
                    ? "border-film-500 text-white bg-film-600/10"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                Large
              </button>
            </div>
          </div>

          {/* Opacity Preset Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--muted)] w-8">Opa:</span>
            <div className="grid grid-cols-3 gap-1 flex-1">
              <button
                type="button"
                onClick={() => setOverlayOpacity(25)}
                className={`rounded border py-0.5 text-center text-[10px] transition ${
                  isFaintOpacity
                    ? "border-film-500 text-white bg-film-600/10"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setOverlayOpacity(60)}
                className={`rounded border py-0.5 text-center text-[10px] transition ${
                  isMediumOpacity
                    ? "border-film-500 text-white bg-film-600/10"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                60%
              </button>
              <button
                type="button"
                onClick={() => setOverlayOpacity(100)}
                className={`rounded border py-0.5 text-center text-[10px] transition ${
                  isSolidOpacity
                    ? "border-film-500 text-white bg-film-600/10"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                100%
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}