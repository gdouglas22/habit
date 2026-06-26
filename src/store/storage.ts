// Persistence abstraction. Today it's synchronous localStorage; later this can
// gain a Telegram CloudStorage / backend tier without touching the store.

const KEY = "habit-tracker-state-v1";

export function loadState<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export function saveState<T>(state: T): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — ignore, state stays in-memory */
  }
}

export function resetState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
