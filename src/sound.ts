// Soft timer sounds via Web Audio. A gentle low "tock" each second and a
// two-note chime on phase transitions. Must be unlocked by a user gesture
// (call resumeAudio() from a click/tap), per browser autoplay rules.

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}
export function isMuted(): boolean {
  return muted;
}

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = Ctor ? new Ctor() : null;
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

// Call from the play button tap to satisfy autoplay policy (esp. iOS).
export function resumeAudio(): void {
  const c = ac();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

function blip(freqFrom: number, freqTo: number, peak: number, dur: number, at = 0): void {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freqFrom, t);
  o.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Soft second tick — low, short, quiet.
export function playTick(): void {
  if (muted) return;
  blip(190, 130, 0.05, 0.07);
}

// Pleasant rising two-note chime when a work/break phase ends.
export function playChime(): void {
  if (muted) return;
  blip(523, 523, 0.08, 0.16); // C5
  blip(784, 784, 0.07, 0.22, 0.14); // G5
}
