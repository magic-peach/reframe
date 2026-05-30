"use client";

import { useRef } from "react";
import { EditRecipe } from "@/lib/types";
import { RotateCw } from "lucide-react";
import BaseButton from "./ui/BaseButton";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const ROTATIONS = [0, 90, 180, 270] as const;

export default function RotateControl({ recipe, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;

    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % ROTATIONS.length;
      e.preventDefault();
    }

    if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + ROTATIONS.length) % ROTATIONS.length;
      e.preventDefault();
    }

    if (nextIndex !== index) {
      onChange({ rotate: ROTATIONS[nextIndex] });

      requestAnimationFrame(() => {
        refs.current[nextIndex]?.focus();
      });
    }
  };

  return (
    <div role="radiogroup" aria-label="Rotation" className="flex gap-2">
      {ROTATIONS.map((deg, index) => {
        const active = recipe.rotate === deg;
        const noneSelected = !ROTATIONS.includes(
          recipe.rotate as 0 | 90 | 180 | 270,
        );

        return (
          <BaseButton
            type="button"
            key={deg}
            ref={(el) => {
              refs.current[index] = el;
            }}
            onClick={() => onChange({ rotate: deg })}
            role="radio"
            aria-checked={active}
            tabIndex={active || (noneSelected && index === 0) ? 0 : -1}
            //  tabIndex={active ? 0 : -1}

            onKeyDown={(e) => handleKeyDown(e, index)}
            aria-label={`Rotate video to ${deg} degrees`}
            active={active}
            className="flex-1 flex flex-col items-center gap-1.5 py-3"
          >
            <RotateCw
              size={15}
              aria-hidden="true"
              style={{
                transform: `rotate(${deg}deg)`,
                transformOrigin: "center",
              }}
              className="transition-transform"
            />
            {deg}
          </BaseButton>
        );
      })}
    </div>
  );
}

// "use client";

// import { useRef } from "react";
// import { EditRecipe } from "@/lib/types";
// import { RotateCw } from "lucide-react";
// import BaseButton from "./ui/BaseButton";
// import { cn } from "@/lib/utils";

// interface Props {
//   recipe: EditRecipe;
//   onChange: (patch: Partial<EditRecipe>) => void;
// }

// const ROTATIONS = [0, 90, 180, 270] as const;

// export default function RotateControl({ recipe, onChange }: Props) {
// const refs = useRef<(HTMLButtonElement | null)[]>([]);
//   const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
//     let nextIndex = index;

//     if (e.key === "ArrowRight") {
//       nextIndex = (index + 1) % ROTATIONS.length;
//       e.preventDefault();
//     }

//     if (e.key === "ArrowLeft") {
//       nextIndex = (index - 1 + ROTATIONS.length) % ROTATIONS.length;
//       e.preventDefault();
//     }

//     if (nextIndex !== index) {
//       onChange({ rotate: ROTATIONS[nextIndex] });
//     }

//   };
//   return (
//     // <div className="flex gap-2">
//     <div role="radiogroup" aria-label="Rotation" className="flex gap-2">
//       {ROTATIONS.map((deg) => {
//         const active = recipe.rotate === deg;
//         return (
//           <BaseButton
//             type="button"
//             key={deg}
//             ref={(el) => (refs.current[index] = el)}
//             onClick={() => onChange({ rotate: deg })}
//             // aria-label={`Rotate video to ${deg} degrees`}
//             // aria-pressed={active}
//             role="radio"
//             aria-checked={active}
//             tabIndex={active ? 0 : -1}
//             onKeyDown={(e) => handleKeyDown(e, ROTATIONS.indexOf(deg))}

//             active={active}
//             aria-label={`Rotate video to ${deg} degrees`}
//             className="flex-1 flex flex-col items-center gap-1.5 py-3"
//           >
//             <RotateCw
//               size={15}
//               aria-hidden="true"
//               style={{
//                 transform: `rotate(${deg}deg)`,
//                 transformOrigin: "center",
//               }}
//               className="transition-transform"
//             />
//             {deg}
//           </BaseButton>
//         );
//       })}
//     </div>
//   );
// }

// "use client";

// import { EditRecipe } from "@/lib/types";
// import { RotateCw } from "lucide-react";
// import BaseButton from "./ui/BaseButton";
// import { cn } from "@/lib/utils";

// interface Props {
//   recipe: EditRecipe;
//   onChange: (patch: Partial<EditRecipe>) => void;
// }

// const ROTATIONS = [0, 90, 180, 270] as const;

// export default function RotateControl({ recipe, onChange }: Props) {
//   return (
//     <div className="flex gap-2">
//       {ROTATIONS.map((deg) => {
//         const active = recipe.rotate === deg;
//         return (
//           <BaseButton
//             type="button"
//             key={deg}
//             onClick={() => onChange({ rotate: deg })}
//             aria-label={`Rotate video to ${deg} degrees`}
//             aria-pressed={active}
//             active={active}
//             className="flex-1 flex flex-col items-center gap-1.5 py-3"
//           >
//             <RotateCw size={15} aria-hidden="true" style={{ transform: `rotate(${deg}deg)`, transformOrigin: 'center' }} className="transition-transform" />
//             {deg}
//           </BaseButton>
//         );
//       })}
//     </div>
//   );
// }
