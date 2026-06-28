// Timer sounds via <audio> elements playing generated WAV clips. HTMLAudio is
// far more reliable than Web Audio oscillators inside the Telegram iOS webview
// (WKWebView), and it respects the media volume. Elements are "unlocked" by a
// muted play() inside the first user gesture (resumeAudio), per iOS rules.

let muted = false;
export function setMuted(m: boolean): void {
  muted = m;
}
export function isMuted(): boolean {
  return muted;
}

const SR = 44100;

function encodeWav(samples: Float32Array): string {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(bin);
}

// Sum sine partials with a quick attack + exponential decay envelope.
function render(notes: { freq: number; start: number; dur: number; gain: number; decay: number }[], total: number): Float32Array {
  const out = new Float32Array(Math.floor(total * SR));
  for (const note of notes) {
    const startI = Math.floor(note.start * SR);
    const len = Math.floor(note.dur * SR);
    for (let i = 0; i < len; i++) {
      const idx = startI + i;
      if (idx >= out.length) break;
      const t = i / SR;
      const env = Math.min(1, t / 0.004) * Math.exp(-t * note.decay);
      out[idx] += Math.sin(2 * Math.PI * note.freq * t) * env * note.gain;
    }
  }
  return out;
}

const TICK_URI = encodeWav(render([{ freq: 1000, start: 0, dur: 0.07, gain: 0.6, decay: 32 }], 0.08));
const CHIME_URI = encodeWav(
  render(
    [
      { freq: 660, start: 0, dur: 0.32, gain: 0.5, decay: 7 },
      { freq: 990, start: 0.13, dur: 0.32, gain: 0.45, decay: 7 },
    ],
    0.46
  )
);

let tickEl: HTMLAudioElement | null = null;
let chimeEl: HTMLAudioElement | null = null;

function ensure(): void {
  if (tickEl) return;
  tickEl = new Audio(TICK_URI);
  tickEl.preload = "auto";
  chimeEl = new Audio(CHIME_URI);
  chimeEl.preload = "auto";
}

function unlock(el: HTMLAudioElement | null): void {
  if (!el) return;
  try {
    el.muted = true;
    const p = el.play();
    const reset = () => {
      el.pause();
      el.currentTime = 0;
      el.muted = false;
    };
    if (p && typeof p.then === "function") p.then(reset).catch(() => (el.muted = false));
    else reset();
  } catch {
    /* ignore */
  }
}

// Must be called from a user gesture (the play tap) to satisfy iOS autoplay.
export function resumeAudio(): void {
  ensure();
  unlock(tickEl);
  unlock(chimeEl);
}

function play(el: HTMLAudioElement | null): void {
  if (muted || !el) return;
  try {
    el.currentTime = 0;
    void el.play();
  } catch {
    /* ignore */
  }
}

export function playTick(): void {
  ensure();
  play(tickEl);
}
export function playChime(): void {
  ensure();
  play(chimeEl);
}
