// Forward-only state migrations. Instead of bumping the storage key (which
// discarded data), we keep a stable key and upgrade old blobs in place.
// Bump SCHEMA and add a transform when the shape changes.
import type { AppState } from "./store";
import { todayISO } from "../date";

export const SCHEMA = 1;

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function obj<T extends object>(v: unknown): T {
  return v && typeof v === "object" ? (v as T) : ({} as T);
}

// Accepts any persisted blob (localStorage or server) and returns a complete,
// current-shape AppState. selectedDate is always reset to today on load.
export function migrate(raw: unknown): AppState {
  const r = obj<Record<string, unknown>>(raw);
  // Future: branch on r.schemaVersion here to transform fields before defaulting.
  return {
    habits: arr(r.habits),
    activityTypes: arr(r.activityTypes),
    activities: arr(r.activities),
    products: arr(r.products),
    foods: arr(r.foods),
    entries: obj(r.entries),
    breaks: arr<string>(r.breaks).filter((d) => typeof d === "string"),
    profile: obj(r.profile),
    apiKey: typeof r.apiKey === "string" ? r.apiKey : undefined,
    timer: r.timer && typeof r.timer === "object" ? (r.timer as AppState["timer"]) : null,
    selectedDate: todayISO(),
    schemaVersion: SCHEMA,
  } as AppState;
}
