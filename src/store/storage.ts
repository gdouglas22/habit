// Local persistence (offline cache + source of truth when not in Telegram).
// A single STABLE key — schema changes are handled by migrate(), not by
// bumping the key, so user data is never discarded on an update.

const KEY = "habit-tracker-state";
// Older versioned keys, imported once into the stable key so existing data
// survives the move to migrations.
const LEGACY_KEYS = [
  "habit-tracker-state-v4",
  "habit-tracker-state-v3",
  "habit-tracker-state-v2",
  "habit-tracker-state-v1",
];

// Returns the raw parsed blob (any shape) — migrate() makes it current.
export function loadRaw(): unknown {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        const v = localStorage.getItem(k);
        if (v) {
          raw = v;
          break;
        }
      }
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRaw(state: unknown): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — ignore */
  }
}

export function resetLocal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
