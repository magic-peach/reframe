import { AUDIO_FADE_MAX_SECONDS } from "./constants";
import { EditRecipe } from "./types";

export function getAudioOutputDuration(recipe: EditRecipe, videoDuration: number): number {
  const trimmedDuration = Math.max((recipe.trimEnd ?? videoDuration) - recipe.trimStart, 0);
  if (trimmedDuration <= 0) return 0;
  return recipe.speed > 0 ? trimmedDuration / recipe.speed : trimmedDuration;
}

export function buildAudioTrimFilter(recipe: Pick<EditRecipe, "trimStart" | "trimEnd">): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

export function buildAudioSpeedFilter(speed: number, normalizeAudio: boolean): string {
  if (speed <= 0) return "";
  const filters: string[] = [];

  let remaining = speed;
  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }

  while (remaining > 2.0) {
    filters.push("atempo=2.0");
    remaining /= 2.0;
  }

  if (Math.abs(remaining - 1.0) > 0.001) {
    filters.push(`atempo=${Number(remaining.toFixed(4))}`);
  }

  if (normalizeAudio) filters.push("loudnorm=I=-14:TP=-1.5:LRA=11");

  return filters.join(",");
}

export function buildAudioFadeFilter(
  recipe: Pick<EditRecipe, "audioFadeIn" | "audioFadeOut">,
  outputDuration: number
): string {
  const safeDuration = Math.max(outputDuration, 0);
  const fadeIn = Math.min(Math.max(recipe.audioFadeIn, 0), AUDIO_FADE_MAX_SECONDS, safeDuration);
  const fadeOut = Math.min(Math.max(recipe.audioFadeOut, 0), AUDIO_FADE_MAX_SECONDS, safeDuration);

  const filters: string[] = [];

  if (fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${fadeIn.toFixed(3)}`);
  }

  if (fadeOut > 0) {
    const fadeOutStart = Math.max(safeDuration - fadeOut, 0);
    filters.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}`);
  }

  return filters.join(",");
}