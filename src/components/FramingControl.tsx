"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function FramingControl({ recipe, onChange }: Props) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onChange({ framing: "fit" })}
        className={`
          flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
          ${recipe.framing === "fit"
            ? "border-violet-500 bg-violet-50 text-violet-700"
            : "border-gray-200 text-gray-500 hover:border-violet-300"
          }
        `}
      >
        <Maximize2 size={20} />
        <div className="text-center">
          <p className="text-xs font-semibold">Fit</p>
          <p className="text-[10px] text-gray-400">Letterbox / pillarbox</p>
        </div>
      </button>

      <button
        onClick={() => onChange({ framing: "fill" })}
        className={`
          flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
          ${recipe.framing === "fill"
            ? "border-violet-500 bg-violet-50 text-violet-700"
            : "border-gray-200 text-gray-500 hover:border-violet-300"
          }
        `}
      >
        <Crop size={20} />
        <div className="text-center">
          <p className="text-xs font-semibold">Fill</p>
          <p className="text-[10px] text-gray-400">Crop to frame</p>
        </div>
      </button>
    </div>
  );
}
