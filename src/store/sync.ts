// Remote state sync against /api/state, authenticated by Telegram initData.
// apiKey is intentionally NOT synced (it stays device-local).
import { tg, hasTelegram } from "../telegram";
import type { AppState } from "./store";

const HDR = "x-telegram-init-data";

// Available only inside a real Telegram session with a signed initData.
export function canSync(): boolean {
  return hasTelegram && !!tg?.initData;
}

// undefined = remote unavailable (no DB / not authed); null = authed but empty;
// object = the stored blob.
export async function fetchRemote(): Promise<unknown | null | undefined> {
  if (!canSync()) return undefined;
  try {
    const r = await fetch("/api/state", { headers: { [HDR]: tg!.initData } });
    if (r.status !== 200) return undefined;
    const d = await r.json();
    return d?.data ?? null;
  } catch {
    return undefined;
  }
}

export async function pushRemote(state: AppState): Promise<void> {
  if (!canSync()) return;
  // strip the device-local fields before sending
  const { apiKey, selectedDate, ...rest } = state;
  void apiKey;
  void selectedDate;
  try {
    await fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json", [HDR]: tg!.initData },
      body: JSON.stringify({ data: rest }),
    });
  } catch {
    /* offline — localStorage still holds the latest */
  }
}
