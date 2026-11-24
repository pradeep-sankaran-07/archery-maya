// Progress lives in localStorage, one record per player.
const KEY = 'math-quest.v1';

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && typeof d === 'object') return d;
  } catch { /* ignore */ }
  return {};
}

const data = Object.assign({ player: 'maya', players: {}, settings: {} }, load());
data.settings = Object.assign({ sound: true, voice: true }, data.settings);

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const settings = () => data.settings;
export function setSetting(k, v) { data.settings[k] = v; persist(); }

export const currentPlayerId = () => data.player;
export function setPlayer(id) { data.player = id; profile(id); persist(); }

function fresh() {
  return {
    stars: 0,
    best: {}, // question id -> best stars (1..3)
    stickers: {}, // sticker id -> count
    badges: {}, // badge id -> date won
    worldsPlayed: {},
    days: [],
    history: {}, // question id -> { tries, wrong }
    unlockSeen: {}, // world -> true once the 'Level 2 unlocked' party was shown
    unlockAll: false, // grown-ups can open every Level 2 straight away
    stats: {
      answered: 0, correct: 0, firstTry: 0, streak: 0, bestStreak: 0,
      rounds: 0, perfectRounds: 0, comebacks: 0, hints: 0, l2rounds: 0,
      kinds: { times: 0, share: 0, plusminus: 0, twostep: 0 },
    },
  };
}

/** The saved progress for a player (created on first use). */
export function profile(id = data.player) {
  if (!data.players[id]) data.players[id] = fresh();
  const p = data.players[id];
  // fill in anything added in a later version
  const f = fresh();
  for (const k of Object.keys(f)) if (p[k] === undefined) p[k] = f[k];
  p.stats = Object.assign(f.stats, p.stats);
  p.stats.kinds = Object.assign(fresh().stats.kinds, p.stats.kinds);
  return p;
}

export function markToday(p) {
  const d = new Date();
  const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  if (!p.days.includes(today)) p.days.push(today);
}

export function resetPlayer(id) {
  data.players[id] = fresh();
  persist();
}
