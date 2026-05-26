import { useEffect, useState } from "react";
import { useAudioWaveform } from "./useAudioWaveform";

export function useSilenceDetection(
  file: File | null,
  threshold: number = 0.02,
  minSilenceDuration: number = 0.5
) {
  const { waveform, duration } = useAudioWaveform(file);

  const [silentSegments, setSilentSegments] = useState<
    Array<{ start: number; end: number }>
  >([]);

  useEffect(() => {
    if (!waveform.length || !duration) return;

    const segments: Array<{ start: number; end: number }> = [];

    let inSilence = false;
    let silenceStart = 0;

    waveform.forEach((amplitude, index) => {
      // normalized waveform values: 0 → 1
      const isSilent = Math.abs(amplitude) < threshold;

      const time = (index / waveform.length) * duration;

      if (isSilent && !inSilence) {
        silenceStart = time;
        inSilence = true;
      }

      else if (!isSilent && inSilence) {
        const silenceDuration = time - silenceStart;

        if (silenceDuration >= minSilenceDuration) {
          segments.push({
            start: silenceStart,
            end: time,
          });
        }

        inSilence = false;
      }
    });

    // handle silence at end of clip
    if (inSilence) {
      const silenceDuration = duration - silenceStart;

      if (silenceDuration >= minSilenceDuration) {
        segments.push({
          start: silenceStart,
          end: duration,
        });
      }
    }

    console.log("Detected silence segments:", segments);

    setSilentSegments(segments);
  }, [waveform, duration, threshold, minSilenceDuration]);

  return { silentSegments };
}