// ────────────────────────────────────────────────────────────────────────
// Shared leaderboard via Supabase (https://supabase.com) — free, HTTPS-native
// Postgres with an auto-generated REST API (PostgREST). Plain fetch(), no npm
// dependency. The anon key is designed to be public; Row Level Security on the
// `scores` table restricts anonymous users to SELECT + INSERT only (nobody can
// edit or wipe the board).
//
// SETUP (one-time, see the chat for full steps):
//   1. Create a free project at supabase.com.
//   2. In the SQL editor, create the `scores` table + RLS policies (SQL given
//      in chat).
//   3. Settings → API: copy the Project URL and the anon/public key below.
// Until real values are pasted, the board runs local-only (cache) so the game
// never breaks.
// ────────────────────────────────────────────────────────────────────────

// ⬇⬇⬇  PASTE YOUR SUPABASE VALUES HERE  ⬇⬇⬇
const SUPABASE_URL = 'PASTE_SUPABASE_URL_HERE';        // e.g. https://abcd1234.supabase.co
const SUPABASE_ANON_KEY = 'PASTE_SUPABASE_ANON_KEY_HERE';
// ⬆⬆⬆  PASTE YOUR SUPABASE VALUES HERE  ⬆⬆⬆

const TABLE = 'scores';
const CACHE_KEY = 'archery-maya.leaderboard.cache.v1';
const OLD_LB_KEY = 'archery-maya.leaderboard.v1'; // legacy local-only board
const MIGRATED_FLAG = 'archery-maya.leaderboard.migrated.v1';

function isConfigured() {
  return SUPABASE_URL && !SUPABASE_URL.startsWith('PASTE') &&
         SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('PASTE');
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

// ── local cache helpers ─────────────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeCache(entries) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

function sortDesc(entries) {
  return [...entries].sort((a, b) => b.score - a.score);
}

// Keep only the best score per name (input must be sorted score-desc first).
function dedupeByName(entries) {
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    if (seen.has(e.name)) continue;
    seen.add(e.name);
    out.push(e);
  }
  return out;
}

// ── public API ──────────────────────────────────────────────────────────

/**
 * Fetch the shared leaderboard (best score per name).
 * @returns {Promise<{ entries: Array<{name,score,date}>, offline: boolean }>}
 */
export async function fetchScores(limit = 100) {
  if (!isConfigured()) {
    return { entries: dedupeByName(sortDesc(readCache())).slice(0, limit), offline: true };
  }
  try {
    // Pull a generous window, then keep the best row per name client-side.
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}` +
      `?select=name,score,created_at&order=score.desc&limit=500`;
    const res = await fetch(url, { headers: headers(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const entries = (Array.isArray(rows) ? rows : []).map((r) => ({
      name: String(r.name ?? 'Player'),
      score: Number(r.score) || 0,
      date: r.created_at || '',
    }));
    const best = dedupeByName(sortDesc(entries));
    writeCache(best);
    return { entries: best.slice(0, limit), offline: false };
  } catch {
    return { entries: dedupeByName(sortDesc(readCache())).slice(0, limit), offline: true };
  }
}

/**
 * Submit a score to the shared board. Optimistically updates the local cache
 * so the player sees themselves immediately even if the round-trip is slow.
 * @returns {Promise<boolean>} whether the remote insert succeeded
 */
export async function submitScore(name, score) {
  const safeName = String(name || 'Player').slice(0, 24).trim() || 'Player';
  const safeScore = Math.max(0, Math.round(score || 0));

  // Optimistic local cache update (keep the higher score per name).
  const cache = readCache();
  const existing = cache.find((e) => e.name === safeName);
  if (existing) existing.score = Math.max(existing.score, safeScore);
  else cache.push({ name: safeName, score: safeScore, date: new Date().toISOString() });
  writeCache(sortDesc(cache));

  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ name: safeName, score: safeScore }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * One-time migration: push this device's old local-only board up to Supabase
 * so existing history isn't lost. Best-effort; swallows errors. Safe to call
 * on every startup — it no-ops after the first successful run.
 */
export async function migrateLocalEntriesOnce() {
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    const raw = localStorage.getItem(OLD_LB_KEY);
    if (!raw) { localStorage.setItem(MIGRATED_FLAG, '1'); return; }
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }
    if (!isConfigured()) return; // try again later once values are added
    for (const e of arr) {
      // eslint-disable-next-line no-await-in-loop
      await submitScore(e.name, e.score);
    }
    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch { /* ignore */ }
}
