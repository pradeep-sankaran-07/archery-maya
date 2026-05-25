const KEY = 'archery-maya.save.v1';

const DEFAULT = {
  lastCharacter: 'maya',
  lastBow: 'classic',
  lastArrow: 'rainbow',
  totalMoney: 0,
  highScores: {},
  muted: false,
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function save(partial) {
  try {
    const current = load();
    const merged = { ...current, ...partial };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return load();
  }
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// ────────────────────────────────────────────────────────────────────────
// Leaderboard — separate localStorage key. Stores top 20 entries sorted by
// score descending. Each entry: { name, score, date (ISO 8601 string) }.
// ────────────────────────────────────────────────────────────────────────
const LB_KEY = 'archery-maya.leaderboard.v1';
const LB_MAX = 20;

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry({ name, score }) {
  const safeName = String(name || 'Player').slice(0, 12).trim() || 'Player';
  const entry = { name: safeName, score: Math.max(0, Math.round(score)), date: new Date().toISOString() };
  const entries = loadLeaderboard();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, LB_MAX);
  try { localStorage.setItem(LB_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  return trimmed;
}

export function resetLeaderboard() {
  try { localStorage.removeItem(LB_KEY); } catch { /* ignore */ }
}
