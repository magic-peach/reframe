export function hasBackgroundMusicTrack(
  musicFile: { name: string } | null | undefined,
): boolean {
  return Boolean(musicFile);
}

export function shouldKeepAudioTrack(
  keepOriginalAudio: boolean,
  hasOriginalAudio: boolean,
  hasMusicTrack: boolean,
): boolean {
  return hasMusicTrack || (keepOriginalAudio && hasOriginalAudio);
}
