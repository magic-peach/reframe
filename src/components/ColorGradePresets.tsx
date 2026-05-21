"use client";

interface ColorPreset {
  label: string;
  brightness: number;
  contrast: number;
  saturation: number;
}

const PRESETS: ColorPreset[] = [
  { label: "Natural", brightness: 0, contrast: 1, saturation: 1 },
  { label: "Warm", brightness: 0.05, contrast: 1.05, saturation: 1.15 },
  { label: "Cool", brightness: 0, contrast: 1.05, saturation: 0.9 },
  { label: "Cinematic", brightness: -0.05, contrast: 1.2, saturation: 0.8 },
  { label: "Vivid", brightness: 0, contrast: 1.1, saturation: 1.3 },
  { label: "B&W", brightness: 0.15, contrast: 1.15, saturation: 0 },
];

interface Props {
  brightness: number;
  contrast: number;
  saturation: number;
  onChange: (patch: { brightness: number; contrast: number; saturation: number }) => void;
}

export default function ColorGradePresets({ brightness, contrast, saturation, onChange }: Props) {
  const activePreset = PRESETS.find(
    (p) => p.brightness === brightness && p.contrast === contrast && p.saturation === saturation
  );

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {PRESETS.map((preset) => {
        const isActive = activePreset?.label === preset.label;
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() =>
              onChange({
                brightness: preset.brightness,
                contrast: preset.contrast,
                saturation: preset.saturation,
              })
            }
            className={`px-2.5 py-1 rounded-md text-[11px] font-heading font-semibold transition-all ${
              isActive
                ? "bg-film-600 text-white"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:border-film-400 hover:text-[var(--text)]"
            }`}
            aria-pressed={isActive}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
