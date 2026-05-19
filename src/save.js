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
