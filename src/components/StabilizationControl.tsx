import { SlidersHorizontal } from "lucide-react";

interface StabilizationControlProps {
  recipe: {
    stabilization?: boolean;
  };

  onChange: (updates: { stabilization: boolean }) => void;
}

export default function StabilizationControl({
  recipe,
  onChange,
}: StabilizationControlProps) {
  return (
    <div className="space-y-2">

      <div className="flex items-center justify-between">
        <label
          htmlFor="stabilization-toggle"
          className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2"
        >
          <SlidersHorizontal size={10} />
          Stabilization
        </label>

        <input
          id="stabilization-toggle"
          type="checkbox"
          checked={recipe.stabilization ?? false}
          onChange={(e) =>
            onChange({
              stabilization: e.target.checked,
            })
          }
          className="accent-film-600 cursor-pointer"
        />
      </div>

      <p className="text-xs text-[var(--muted)] leading-relaxed">
        Note: significantly increases processing time.
      </p>

    </div>
  );
}
