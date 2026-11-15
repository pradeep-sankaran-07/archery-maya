// Shared leaderboard on the same Supabase project as Archery Maya, but in its
// own table (`football_scores`) so the two games don't mix. If that table isn't
// created yet (or the network is down) the board quietly runs on this device.
//
// One-time setup in the Supabase SQL editor:
//   create table football_scores (
//     id bigint generated always as identity primary key,
//     name text not null check (char_length(name) between 1 and 24),
//     score int not null check (score between 0 and 100000),
//     created_at timestamptz not null default now()
//   );
//   alter table football_scores enable row level security;
//   create policy "read" on football_scores for select to anon using (true);
//   create policy "insert" on football_scores for insert to anon with check (true);

const SUPABASE_URL = 'https://ngkuycthcfxxemjudbhg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_a1OuXPnXmIAfUAPjoSeMxA_sCZL-CJh';
const TABLE = 'football_scores';
const CACHE_KEY = 'football-maya.leaderboard.v1';

function readCache() {
  try {
    const arr = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeCache(entries) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entries.slice(0, 200))); } catch { /* ignore */ }
}
const sortDesc = (a) => [...a].sort((x, y) => y.score - x.score);
function bestPerName(entries) {
  const seen = new Set();
  return entries.filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)));
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

export async function fetchScores(limit = 50) {
  const local = bestPerName(sortDesc(readCache()));
  try {
    const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=name,score,created_at&order=score.desc&limit=300`;
    const res = await withTimeout(fetch(url, { headers: { apikey: SUPABASE_KEY }, cache: 'no-store' }), 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const remote = (Array.isArray(rows) ? rows : []).map((r) => ({ name: String(r.name || 'Player'), score: Number(r.score) || 0, date: r.created_at || '' }));
    // merge so a score saved while offline still shows
    const merged = bestPerName(sortDesc([...remote, ...local]));
    writeCache(merged);
    return { entries: merged.slice(0, limit), offline: false };
  } catch {
    return { entries: local.slice(0, limit), offline: true };
  }
}

export async function submitScore(name, score) {
  const safeName = String(name || 'Player').trim().slice(0, 24) || 'Player';
  const safeScore = Math.max(0, Math.round(score || 0));
  const cache = readCache();
  const ex = cache.find((e) => e.name === safeName);
  if (ex) ex.score = Math.max(ex.score, safeScore);
  else cache.push({ name: safeName, score: safeScore, date: new Date().toISOString() });
  writeCache(sortDesc(cache));
  try {
    const res = await withTimeout(fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: safeName, score: safeScore }),
    }), 6000);
    return res.ok;
  } catch {
    return false;
  }
}
