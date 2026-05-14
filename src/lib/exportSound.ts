const KEY = "export_sound_enabled";

export function isExportSoundEnabled(): boolean {
  return localStorage.getItem(KEY) === "true";
}

export function setExportSoundEnabled(value: boolean) {
  localStorage.setItem(KEY, String(value));
}

export function playExportCompleteSound(): void {
  if (typeof window === "undefined" || !isExportSoundEnabled()) return;

  try {
    const Ctx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    void ctx.close();
  } catch {
    // Ignore missing Web Audio or autoplay restrictions.
  }
}