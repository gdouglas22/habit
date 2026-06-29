// Forward-only state migrations. Instead of bumping the storage key (which
// discarded data), we keep a stable key and upgrade old blobs in place.
// Bump SCHEMA and add a transform when the shape changes.
import type { AppState } from "./store";
import type { Habit, EntryLog, BreakLog } from "../data";
import { todayISO } from "../date";

export const SCHEMA = 1;

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function obj<T extends object>(v: unknown): T {
  return v && typeof v === "object" ? (v as T) : ({} as T);
}

// Earliest ISO date this habit has any logged value (its real history start),
// or today when it has none. Used to anchor a missing startDate so older blobs
// don't lose their past or sprout phantom "missed" days before they existed.
function earliestEntry(entries: EntryLog, habitId: string): string {
  const dates = Object.keys(entries[habitId] ?? {});
  return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : todayISO();
}

// Accepts the legacy string[] of break days or the current map and returns a
// BreakLog. Legacy breaks anchor placedOn to their own day, so they're treated
// as already committed (only a break taken *today* stays cancellable).
function toBreakLog(v: unknown): BreakLog {
  const out: BreakLog = {};
  if (Array.isArray(v)) {
    for (const d of v) if (typeof d === "string") out[d] = d;
  } else if (v && typeof v === "object") {
    for (const [day, placed] of Object.entries(v as Record<string, unknown>)) {
      out[day] = typeof placed === "string" ? placed : day;
    }
  }
  return out;
}

// Accepts any persisted blob (localStorage or server) and returns a complete,
// current-shape AppState. selectedDate is always reset to today on load.
export function migrate(raw: unknown): AppState {
  const r = obj<Record<string, unknown>>(raw);
  // Future: branch on r.schemaVersion here to transform fields before defaulting.
  const entries = obj<EntryLog>(r.entries);
  const habits = arr<Habit>(r.habits).map((h) =>
    typeof h.startDate === "string" ? h : { ...h, startDate: earliestEntry(entries, h.id) }
  );
  return {
    habits,
    activityTypes: arr(r.activityTypes),
    activities: arr(r.activities),
    products: arr(r.products),
    foods: arr(r.foods),
    entries,
    breaks: toBreakLog(r.breaks),
    profile: obj(r.profile),
    apiKey: typeof r.apiKey === "string" ? r.apiKey : undefined,
    timer: r.timer && typeof r.timer === "object" ? (r.timer as AppState["timer"]) : null,
    selectedDate: todayISO(),
    schemaVersion: SCHEMA,
  } as AppState;
}
