"use client";

import { EditRecipe } from "@/lib/types";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  duration: number;
}

export default function TrimControl({ recipe, onChange, duration }: Props) {
  const [invalidStart, setStart] = useState(false);
  const [invalidEnd, setEnd] = useState(false);
  const [startErrorMsg, setStartErrorMsg] = useState("");
  const [endErrorMsg, setEndErrorMsg] = useState("");
  const [startInput, setStartInput] = useState(recipe.trimStart.toString());

  useEffect(() => {
    setStartInput(recipe.trimStart.toString());
  }, [recipe.trimStart]);

  const clipLength = (recipe.trimEnd ?? duration) - recipe.trimStart;

  const handleStart = (val: string) => {
    setStartInput(val);

    if (val === "") {
      setStart(false);
      setStartErrorMsg("");
      return;
    }

    const n = parseFloat(val);

    if (isNaN(n)) {
      setStart(true);
      setStartErrorMsg("Enter a valid number.");
      return;
    }

    if (n < 0) {
      setStart(true);
      setStartErrorMsg("Start time must be 0 or greater.");
      return;
    }

    if (duration > 0 && n >= duration) {
      setStart(true);
      setStartErrorMsg(
        `Start time must be less than duration (${duration.toFixed(1)}s).`,
      );
      return;
    }

    if (recipe.trimEnd !== null && n >= recipe.trimEnd) {
      setStart(true);
      setStartErrorMsg("Start time must be less than the end time.");
      return;
    }

    setStart(false);
    setStartErrorMsg("");

    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") {
      onChange({ trimEnd: null });
      setEnd(false);
      return;
    }

    const n = parseFloat(val);

    onChange({ trimEnd: n });

    if (isNaN(n)) {
      setEnd(true);
      setEndErrorMsg("Enter a valid number.");
      return;
    }

    if (n <= 0) {
      setEnd(true);
      setEndErrorMsg("End time must be greater than 0.");
      return;
    }

    if (n <= recipe.trimStart) {
      setEnd(true);
      setEndErrorMsg("End time must be greater than start time.");
      return;
    }

    if (duration > 0 && n > duration + 0.01) {
      setEnd(true);
      setEndErrorMsg(
        `End time cannot exceed duration (${duration.toFixed(1)}s).`,
      );
      return;
    }

    setEnd(false);
    setEndErrorMsg("");
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)] transition-shadow";

  return (
    <div id="trim-control" className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label
            htmlFor="trim-start"
            className="font-heading mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]"
          >
            Start (sec)
          </label>

          <input
            id="trim-start"
            type="number"
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={startInput}
            spellCheck={false}
            onChange={(e) => handleStart(e.target.value)}
            aria-label="Trim start time in seconds"
            aria-invalid={invalidStart}
            aria-describedby={invalidStart ? "trim-start-error" : undefined}
            className={`${inputClass} ${
              invalidStart ? "border-red-500" : "border-[var(--border)]"
            }`}
            placeholder="0"
          />
          {invalidStart && (
            <p
              id="trim-start-error"
              className="font-heading animate-fade-in mt-1.5 flex items-center gap-1 text-[10px] text-red-500"
            >
              <AlertCircle size={10} className="shrink-0" />
              {startErrorMsg}
            </p>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="trim-end"
            className="font-heading mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]"
          >
            End (sec)
          </label>

          <input
            id="trim-end"
            type="number"
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={recipe.trimEnd ?? ""}
            spellCheck={false}
            onChange={(e) => handleEnd(e.target.value)}
            aria-label="Trim end time in seconds"
            aria-invalid={invalidEnd}
            className={`${inputClass} ${invalidEnd ? "border-red-500" : "border-[var(--border)]"}`}
            placeholder={
              duration > 0 ? `${duration.toFixed(1)}` : "full length"
            }
          />
          {invalidEnd && (
            <p
              id="trim-end-error"
              className="font-heading animate-fade-in mt-1.5 flex items-center gap-1 text-[10px] text-red-500"
            >
              <AlertCircle size={10} className="shrink-0" />
              {endErrorMsg}
            </p>
          )}
        </div>
      </div>

      {duration > 0 && (
        <p className="text-sm text-[var(--muted)] font-heading mt-1">
          Clip: {formatDuration(clipLength)} of {formatDuration(duration)}
        </p>
      )}
    </div>
  );
}
