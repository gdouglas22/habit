// Soft timer sounds via Web Audio. A gentle wood-block "tick" each second and a
// two-note chime on phase transitions.
//
// iOS notes: the AudioContext must be created AND unlocked inside a user gesture
// (a silent buffer is played to unlock), and tones must sit in the mid range —
// tiny phone speakers barely reproduce low frequencies, so a 130 Hz "tick" is
// effectively inaudible. resumeAudio() must be called from the play tap.

let ctx: AudioContext | null = null;
let unlocked = false;
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
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = Ctor ? new Ctor() : null;
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

// Call from a user gesture (the play button) to start + unlock audio on iOS.
export function resumeAudio(): void {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (!unlocked) {
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
      unlocked = true;
    } catch {
      /* ignore */
    }
  }
}

function blip(freqFrom: number, freqTo: number, peak: number, dur: number, at = 0): void {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(freqFrom, t);
  o.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Soft mid-range "tock" — audible on a phone speaker but gentle.
export function playTick(): void {
  if (muted) return;
  blip(1050, 720, 0.16, 0.055);
}

// Pleasant rising two-note chime when a work/break phase ends.
export function playChime(): void {
  if (muted) return;
  blip(660, 660, 0.2, 0.18); // E5
  blip(990, 990, 0.18, 0.26, 0.15); // B5
}
