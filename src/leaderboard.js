// ────────────────────────────────────────────────────────────────────────
// Shared leaderboard via dreamlo (https://dreamlo.com) — a zero-setup hosted
// game leaderboard. Plain fetch(), no npm dependency. dreamlo returns
// `access-control-allow-origin: *` over HTTPS, so browser reads/writes from
// GitHub Pages work without CORS issues.
//
// SETUP: go to https://dreamlo.com → "Create a leaderboard". It instantly
// gives you a Public Code (read) and a Private Code (write). Paste them below.
// Until real codes are pasted, the board runs in local-only mode (cache) so
// the game never breaks.
// ────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.dreamlo.com/lb';

// ⬇⬇⬇  PASTE YOUR DREAMLO CODES HERE  ⬇⬇⬇
const PUBLIC_CODE = 'PASTE_PUBLIC_CODE_HERE';
const PRIVATE_CODE = 'PASTE_PRIVATE_CODE_HERE';
// ⬆⬆⬆  PASTE YOUR DREAMLO CODES HERE  ⬆⬆⬆

const CACHE_KEY = 'archery-maya.leaderboard.cache.v1';
const OLD_LB_KEY = 'archery-maya.leaderboard.v1'; // legacy local-only board
const MIGRATED_FLAG = 'archery-maya.leaderboard.migrated.v1';

function isConfigured() {
  return PUBLIC_CODE && !PUBLIC_CODE.startsWith('PASTE') &&
         PRIVATE_CODE && !PRIVATE_CODE.startsWith('PASTE');
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

// ── public API ──────────────────────────────────────────────────────────

/**
 * Fetch the shared leaderboard.
 * @returns {Promise<{ entries: Array<{name,score,date}>, offline: boolean }>}
 */
export async function fetchScores(limit = 100) {
  if (!isConfigured()) {
    return { entries: sortDesc(readCache()).slice(0, limit), offline: true };
  }
  try {
    const res = await fetch(`${BASE}/${PUBLIC_CODE}/json/${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const board = data && data.dreamlo && data.dreamlo.leaderboard;
    // Empty board → leaderboard is "" or null.
    let raw = board && board.entry ? board.entry : [];
    // One entry → object, not array. Coerce.
    if (!Array.isArray(raw)) raw = [raw];
    const entries = raw.map((e) => ({
      name: String(e.name ?? 'Player'),
      score: Number(e.score) || 0,
      date: e.date || '',
    }));
    const sorted = sortDesc(entries);
    writeCache(sorted);
    return { entries: sorted.slice(0, limit), offline: false };
  } catch {
    // Network/parse failure → fall back to last good cache.
    return { entries: sortDesc(readCache()).slice(0, limit), offline: true };
  }
}

/**
 * Submit a score to the shared board. Optimistically updates the local cache
 * so the player sees themselves immediately even if the round-trip is slow.
 * @returns {Promise<boolean>} whether the remote submit succeeded
 */
export async function submitScore(name, score) {
  const safeName = String(name || 'Player').slice(0, 24).trim() || 'Player';
  const safeScore = Math.max(0, Math.round(score || 0));

  // Optimistic local cache update (dedupe by name, keep the higher score).
  const cache = readCache();
  const existing = cache.find((e) => e.name === safeName);
  if (existing) existing.score = Math.max(existing.score, safeScore);
  else cache.push({ name: safeName, score: safeScore, date: new Date().toISOString() });
  writeCache(sortDesc(cache));

  if (!isConfigured()) return false;
  try {
    const url = `${BASE}/${PRIVATE_CODE}/add/${encodeURIComponent(safeName)}/${safeScore}`;
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * One-time migration: push this device's old local-only board up to dreamlo
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
    if (!isConfigured()) return; // try again later once codes are added
    for (const e of arr) {
      // eslint-disable-next-line no-await-in-loop
      await submitScore(e.name, e.score);
    }
    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch { /* ignore */ }
}
