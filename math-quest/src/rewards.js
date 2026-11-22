// Stickers (one won after every round) and badges (won for milestones).

export const STICKERS = {
  lionking: [
    ['lk-cub', 'Lion Cub', '🦁'], ['lk-boar', 'Pumbaa', '🐗'], ['lk-bird', 'Zazu', '🐦'],
    ['lk-monkey', 'Rafiki', '🐒'], ['lk-bug', 'Crunchy Bug', '🐛'], ['lk-sun', 'Pride Lands Sunrise', '🌅', true],
  ],
  mufasa: [
    ['mu-lion', 'Young Mufasa', '🦁'], ['mu-river', 'River Rush', '🌊'], ['mu-mtn', 'Snowy Mountain', '🏔️'],
    ['mu-elephant', 'Elephant Herd', '🐘'], ['mu-tree', 'Big Baobab', '🌳'], ['mu-star', 'Lion in the Stars', '🌟', true],
  ],
  showman: [
    ['gs-hat', 'Top Hat', '🎩'], ['gs-tent', 'Big Top', '🎪'], ['gs-elephant', 'Circus Elephant', '🐘'],
    ['gs-trapeze', 'Trapeze Star', '🤸'], ['gs-ticket', 'Golden Ticket', '🎟️'], ['gs-show', 'Showstopper', '✨', true],
  ],
  aladdin: [
    ['al-lamp', 'Magic Lamp', '🪔'], ['al-genie', 'Genie', '🧞'], ['al-monkey', 'Abu', '🐒'],
    ['al-tiger', 'Rajah', '🐅'], ['al-parrot', 'Iago', '🦜'], ['al-ruby', 'Cave Ruby', '💎', true],
  ],
  ducks: [
    ['md-duck', 'Duck Captain', '🦆'], ['md-stick', 'Hockey Stick', '🏒'], ['md-net', 'Goal Net', '🥅'],
    ['md-skate', 'Super Skates', '⛸️'], ['md-glove', 'Goalie Glove', '🧤'], ['md-cup', 'Champion Cup', '🏆', true],
  ],
  rock: [
    ['sr-guitar', 'Electric Guitar', '🎸'], ['sr-drum', 'Drum Kit', '🥁'], ['sr-mic', 'Microphone', '🎤'],
    ['sr-keys', 'Keyboard', '🎹'], ['sr-horns', 'Rock On', '🤘'], ['sr-record', 'Gold Record', '📀', true],
  ],
  friends: [
    ['fr-target', 'Bullseye', '🎯'], ['fr-dog', 'Benji', '🐶'], ['fr-icecream', 'Ice Cream', '🍦'],
    ['fr-rainbow', 'Rainbow', '🌈'], ['fr-unicorn', 'Unicorn', '🦄'], ['fr-bow', 'Golden Bow', '🏹', true],
  ],
};

export const ALL_STICKERS = Object.entries(STICKERS).flatMap(([world, list]) =>
  list.map(([id, name, emoji, legendary]) => ({ id, name, emoji, world, legendary: !!legendary })));

export const stickerById = (id) => ALL_STICKERS.find((s) => s.id === id);

/**
 * Pick the sticker for a finished round. New stickers first; the gold
 * (legendary) one only comes after a perfect round or once the other five
 * are collected. When everything is collected you get a shiny copy.
 */
export function pickSticker(world, owned, perfect) {
  const pool = world === 'mix'
    ? ALL_STICKERS
    : ALL_STICKERS.filter((s) => s.world === world);
  const fresh = pool.filter((s) => !owned[s.id]);
  const normalsLeft = fresh.filter((s) => !s.legendary);
  let choices;
  if (perfect && fresh.some((s) => s.legendary) && Math.random() < 0.6) choices = fresh.filter((s) => s.legendary);
  else if (normalsLeft.length) choices = normalsLeft;
  else if (fresh.length) choices = fresh;
  else choices = pool;
  return choices[Math.floor(Math.random() * choices.length)];
}

// ── badges ─────────────────────────────────────────────────────
// `test(p)` gets the player's saved progress (see save.js).

const worldBadge = (world, id, emoji, name) => ({
  id, emoji, name, desc: `Solve every question in ${worldName(world)}`,
  test: (p, ctx) => ctx.worldDone(world),
});
const worldName = (w) => ({
  lionking: 'the Lion King world', mufasa: 'the Mufasa world', showman: 'the circus',
  aladdin: 'Agrabah', ducks: 'the ice rink', rock: 'School of Rock', friends: 'Maya & Friends',
}[w]);

export const BADGES = [
  { id: 'first', emoji: '🌟', name: 'First Star', desc: 'Answer your first question', test: (p) => p.stats.correct >= 1 },
  { id: 'streak3', emoji: '🔥', name: 'On Fire', desc: '3 right in a row', test: (p) => p.stats.bestStreak >= 3 },
  { id: 'streak5', emoji: '☄️', name: 'Hot Streak', desc: '5 right in a row', test: (p) => p.stats.bestStreak >= 5 },
  { id: 'streak10', emoji: '🚀', name: 'Rocket Brain', desc: '10 right in a row', test: (p) => p.stats.bestStreak >= 10 },
  { id: 'perfect', emoji: '💯', name: 'Perfect Round', desc: 'Get all 5 right the first time', test: (p) => p.stats.perfectRounds >= 1 },
  { id: 'perfect3', emoji: '🏅', name: 'Triple Perfect', desc: '3 perfect rounds', test: (p) => p.stats.perfectRounds >= 3 },
  { id: 'brave', emoji: '💪', name: 'Never Give Up', desc: 'Get one right after a tricky try', test: (p) => p.stats.comebacks >= 1 },
  { id: 'brave5', emoji: '🦸', name: 'Super Brave', desc: 'Get 5 right after a tricky try', test: (p) => p.stats.comebacks >= 5 },
  { id: 'fast', emoji: '⚡', name: 'Lightning Fast', desc: '5 quick right answers (under 20 seconds)', test: (p) => p.stats.fast >= 5 },
  { id: 'times', emoji: '✖️', name: 'Times Table Champ', desc: 'Solve 25 times questions', test: (p) => p.stats.kinds.times >= 25 },
  { id: 'share', emoji: '🍰', name: 'Fair Sharer', desc: 'Solve 5 sharing questions', test: (p) => p.stats.kinds.share >= 5 },
  { id: 'twostep', emoji: '🧗', name: 'Two-Step Climber', desc: 'Solve 10 two-step questions', test: (p) => p.stats.kinds.twostep >= 10 },
  { id: 'c25', emoji: '🥉', name: '25 Right', desc: '25 right answers', test: (p) => p.stats.correct >= 25 },
  { id: 'c50', emoji: '🥈', name: '50 Right', desc: '50 right answers', test: (p) => p.stats.correct >= 50 },
  { id: 'c100', emoji: '🥇', name: '100 Right', desc: '100 right answers', test: (p) => p.stats.correct >= 100 },
  { id: 'stars100', emoji: '⭐', name: 'Star Collector', desc: 'Collect 100 stars', test: (p) => p.stars >= 100 },
  { id: 'stars250', emoji: '🌠', name: 'Star Shower', desc: 'Collect 250 stars', test: (p) => p.stars >= 250 },
  { id: 'stick10', emoji: '📒', name: 'Sticker Fan', desc: 'Collect 10 different stickers', test: (p) => Object.keys(p.stickers).length >= 10 },
  { id: 'stickall', emoji: '📚', name: 'Sticker Master', desc: 'Collect every sticker', test: (p, ctx) => Object.keys(p.stickers).length >= ctx.stickerCount },
  { id: 'travel', emoji: '🗺️', name: 'World Traveller', desc: 'Play a round in all 7 worlds', test: (p) => Object.keys(p.worldsPlayed || {}).length >= 7 },
  { id: 'days3', emoji: '📅', name: 'Practice Pal', desc: 'Play on 3 different days', test: (p) => (p.days || []).length >= 3 },
  { id: 'days7', emoji: '🗓️', name: 'Math Every Week', desc: 'Play on 7 different days', test: (p) => (p.days || []).length >= 7 },
  worldBadge('lionking', 'w-lionking', '🦁', 'Pride Lands Hero'),
  worldBadge('mufasa', 'w-mufasa', '🌟', 'Milele Explorer'),
  worldBadge('showman', 'w-showman', '🎩', 'Ringmaster'),
  worldBadge('aladdin', 'w-aladdin', '🧞', 'Diamond in the Rough'),
  worldBadge('ducks', 'w-ducks', '🦆', 'Flying V Captain'),
  worldBadge('rock', 'w-rock', '🎸', 'Rock Legend'),
  worldBadge('friends', 'w-friends', '💖', 'Best Friends Forever'),
];

/** Rank shown on the title screen, from total stars (max 300). */
export const RANKS = [
  [0, 'Math Cub', '🐣'],
  [20, 'Number Explorer', '🧭'],
  [60, 'Times Table Hero', '🦸'],
  [120, 'Math Superstar', '⭐'],
  [200, 'Math Legend', '🏆'],
  [280, 'Math Royalty', '👑'],
];
export function rankFor(stars) {
  let r = RANKS[0];
  for (const x of RANKS) if (stars >= x[0]) r = x;
  const next = RANKS[RANKS.indexOf(r) + 1];
  return { min: r[0], name: r[1], emoji: r[2], next: next ? { at: next[0], name: next[1], emoji: next[2] } : null };
}
