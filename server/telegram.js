// Verify a Telegram Mini App initData string and extract the user id.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import crypto from "node:crypto";

export function verifyInitData(botToken, initData) {
  if (!botToken || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  // data_check_string: "key=value" lines, keys sorted, joined by \n (decoded values)
  const dcs = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(dcs).digest("hex");

  // constant-time compare
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  // reject stale payloads (older than 24h)
  const authDate = Number(params.get("auth_date") || 0);
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  try {
    const user = JSON.parse(params.get("user") || "{}");
    return user.id ? String(user.id) : null;
  } catch {
    return null;
  }
}
