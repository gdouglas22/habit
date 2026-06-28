// Per-user state storage in Postgres (Railway). Disabled gracefully when
// DATABASE_URL is absent (dev / static deploy) so the app falls back to
// localStorage only.
import pg from "pg";

const { Pool } = pg;

export const dbEnabled = !!process.env.DATABASE_URL;

let pool = null;
let ready = null;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    const local = /localhost|127\.0\.0\.1/.test(url || "") || /sslmode=disable/.test(url || "");
    pool = new Pool({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

function ensureTable() {
  if (!ready) {
    ready = getPool().query(
      `CREATE TABLE IF NOT EXISTS user_state (
         user_id    text PRIMARY KEY,
         data       jsonb NOT NULL DEFAULT '{}'::jsonb,
         updated_at timestamptz NOT NULL DEFAULT now()
       )`
    );
  }
  return ready;
}

export async function getState(userId) {
  await ensureTable();
  const r = await getPool().query("SELECT data FROM user_state WHERE user_id = $1", [userId]);
  return r.rows[0]?.data ?? null;
}

export async function putState(userId, data) {
  await ensureTable();
  await getPool().query(
    `INSERT INTO user_state (user_id, data, updated_at)
       VALUES ($1, $2, now())
     ON CONFLICT (user_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [userId, data]
  );
}
