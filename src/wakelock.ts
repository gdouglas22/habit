// Keep the screen awake while the timer runs (Screen Wake Lock API).
// The lock auto-releases when the page is hidden, so we re-acquire when the
// Mini App becomes visible again and the timer is still wanted.

type Sentinel = { released: boolean; release: () => Promise<void>; addEventListener: (t: string, cb: () => void) => void };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } };

let sentinel: Sentinel | null = null;
let wanted = false;

async function acquire(): Promise<void> {
  if (sentinel) return;
  const nav = navigator as WakeLockNavigator;
  if (!nav.wakeLock) return;
  try {
    sentinel = await nav.wakeLock.request("screen");
    sentinel.addEventListener("release", () => {
      sentinel = null;
    });
  } catch {
    sentinel = null; // denied / not visible — ignore
  }
}

function release(): void {
  try {
    sentinel?.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
}

export function keepAwake(on: boolean): void {
  wanted = on;
  if (on) void acquire();
  else release();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (wanted && document.visibilityState === "visible" && !sentinel) void acquire();
  });
}
