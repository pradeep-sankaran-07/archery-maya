// Progress lives in localStorage, one record per player.
//
// KEEPING PROGRESS SAFE ACROSS UPDATES (please keep these rules):
//  - Never change KEY. A new key means an empty game for everyone.
//  - Only ever ADD fields. profile() fills in missing ones with defaults,
//    so old saves keep working. Never delete or rename saved fields.
//  - Question, sticker and badge ids are what progress is saved against.
//    Never rename or remove a shipped id: `npm run check:math` fails if one
//    listed in scripts/shipped-ids.json goes missing.
//  - A copy of the last good save is kept in BACKUP_KEY. If the main save
//    ever can't be read, the game starts from that copy instead of zero.
const KEY = 'math-quest.v1';
const BACKUP_KEY = 'math-quest.v1.backup';

function read(key) {
  try {
    const d = JSON.parse(localStorage.getItem(key));
    if (d && typeof d === 'object' && d.players) return d;
  } catch { /* ignore */ }
  return null;
}

function load() {
  const main = read(KEY);
  if (main) {
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify(main)); } catch { /* ignore */ }
    return main;
  }
  return read(BACKUP_KEY) || {};
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
