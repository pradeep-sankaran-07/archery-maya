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

// Level 2: a new set of 6 per world, drawn from the new places.
export const STICKERS2 = {
  lionking: [
    ['lk2-hippo', 'Hippo Pool', '🦛'], ['lk2-croc', 'River Croc', '🐊'], ['lk2-flamingo', 'Moonlight Flamingo', '🦩'],
    ['lk2-cheetah', 'Cheetah Dash', '🐆'], ['lk2-moon', 'Savanna Moon', '🌕'], ['lk2-world', 'Circle of Life', '🌍', true],
  ],
  mufasa: [
    ['mu2-fall', 'Hidden Waterfall', '💧'], ['mu2-buffalo', 'Buffalo Herd', '🦬'], ['mu2-butterfly', 'Valley Butterfly', '🦋'],
    ['mu2-paws', 'Paw Trail', '🐾'], ['mu2-leaf', 'Jungle Leaf', '🌿'], ['mu2-valley', 'Hidden Valley', '🏞️', true],
  ],
  showman: [
    ['gs2-carousel', 'Carousel', '🎠'], ['gs2-trumpet', 'Big Band Trumpet', '🎺'], ['gs2-masks', 'Show Masks', '🎭'],
    ['gs2-juggle', 'Juggler', '🤹'], ['gs2-lolly', 'Circus Lollipop', '🍭'], ['gs2-fireworks', 'Fireworks Finale', '🎆', true],
  ],
  aladdin: [
    ['al2-camel', 'Camel Ride', '🐪'], ['al2-vase', 'Golden Vase', '🏺'], ['al2-lantern', 'Market Lantern', '🏮'],
    ['al2-grapes', 'Market Grapes', '🍇'], ['al2-tea', 'Mint Tea', '🍵'], ['al2-crown', 'Sultan\'s Crown', '👑', true],
  ],
  ducks: [
    ['md2-snow', 'Snowy Pond', '🌨️'], ['md2-scarf', 'Team Scarf', '🧣'], ['md2-jersey', 'Ducks Jersey', '🎽'],
    ['md2-cocoa', 'Hot Cocoa', '☕'], ['md2-bus', 'Team Bus', '🚌'], ['md2-medal', 'Gold Medal', '🥇', true],
  ],
  rock: [
    ['sr2-sax', 'Saxophone', '🎷'], ['sr2-violin', 'Violin', '🎻'], ['sr2-headphones', 'Headphones', '🎧'],
    ['sr2-maracas', 'Maracas', '🪇'], ['sr2-speaker', 'Big Speaker', '🔊'], ['sr2-bolt', 'Lightning Riff', '⚡', true],
  ],
  friends: [
    ['fr2-beach', 'Beach Day', '🏖️'], ['fr2-dolphin', 'Dolphin', '🐬'], ['fr2-kite', 'Beach Kite', '🪁'],
    ['fr2-melon', 'Watermelon', '🍉'], ['fr2-shell', 'Seashell', '🐚'], ['fr2-island', 'Treasure Island', '🏝️', true],
  ],
};

export const ALL_STICKERS = [[1, STICKERS], [2, STICKERS2]].flatMap(([lv, set]) =>
  Object.entries(set).flatMap(([world, list]) =>
    list.map(([id, name, emoji, legendary]) => ({ id, name, emoji, world, lv, legendary: !!legendary }))));

export const stickerById = (id) => ALL_STICKERS.find((s) => s.id === id);

/**
 * Pick the sticker for a finished round from `pool`. New stickers first; the
 * gold (legendary) one only comes after a perfect round or once the other
 * five are collected. When everything is collected you get a shiny copy.
 */
export function pickSticker(pool, owned, perfect) {
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

const worldBadge = (world, id, emoji, name, lv = 1) => ({
  id, emoji, name, desc: `Solve every ${lv === 2 ? 'Level 2 ' : ''}question in ${worldName(world)}`,
  test: (p, ctx) => ctx.worldDone(world, lv),
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
  { id: 'times', emoji: '✖️', name: 'Times Table Champ', desc: 'Solve 25 times questions', test: (p) => p.stats.kinds.times >= 25 },
  { id: 'share', emoji: '🍰', name: 'Fair Sharer', desc: 'Solve 5 sharing questions', test: (p) => p.stats.kinds.share >= 5 },
  { id: 'twostep', emoji: '🧗', name: 'Two-Step Climber', desc: 'Solve 10 two-step questions', test: (p) => p.stats.kinds.twostep >= 10 },
  { id: 'twostep40', emoji: '⛰️', name: 'Mountain Climber', desc: 'Solve 40 two-step questions', test: (p) => p.stats.kinds.twostep >= 40 },
  { id: 'share15', emoji: '🥧', name: 'Super Sharer', desc: 'Solve 15 sharing questions', test: (p) => p.stats.kinds.share >= 15 },
  { id: 'c25', emoji: '🥉', name: '25 Right', desc: '25 right answers', test: (p) => p.stats.correct >= 25 },
  { id: 'c50', emoji: '🥈', name: '50 Right', desc: '50 right answers', test: (p) => p.stats.correct >= 50 },
  { id: 'c100', emoji: '🥇', name: '100 Right', desc: '100 right answers', test: (p) => p.stats.correct >= 100 },
  { id: 'c150', emoji: '🎖️', name: '150 Right', desc: '150 right answers', test: (p) => p.stats.correct >= 150 },
  { id: 'c200', emoji: '🏆', name: '200 Right', desc: '200 right answers', test: (p) => p.stats.correct >= 200 },
  { id: 'stars100', emoji: '⭐', name: 'Star Collector', desc: 'Collect 100 stars', test: (p) => p.stars >= 100 },
  { id: 'stars250', emoji: '🌠', name: 'Star Shower', desc: 'Collect 250 stars', test: (p) => p.stars >= 250 },
  { id: 'stars450', emoji: '🌌', name: 'Star Galaxy', desc: 'Collect 450 stars', test: (p) => p.stars >= 450 },
  { id: 'lvl2', emoji: '🚀', name: 'Level Up!', desc: 'Play your first Level 2 round', test: (p) => p.stats.l2rounds >= 1 },
  { id: 'lvl2all', emoji: '🦄', name: 'Level 2 Legend', desc: 'Solve every Level 2 question in all 7 worlds', test: (p, ctx) => ctx.allDone(2) },
  { id: 'stick10', emoji: '📒', name: 'Sticker Fan', desc: 'Collect 10 different stickers', test: (p) => Object.keys(p.stickers).length >= 10 },
  { id: 'stick50', emoji: '🗂️', name: 'Sticker Superfan', desc: 'Collect 50 different stickers', test: (p) => Object.keys(p.stickers).length >= 50 },
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
  worldBadge('lionking', 'w2-lionking', '🌕', 'Night Watch Lion', 2),
  worldBadge('mufasa', 'w2-mufasa', '💧', 'Waterfall Wanderer', 2),
  worldBadge('showman', 'w2-showman', '🎆', 'Star of the Ring', 2),
  worldBadge('aladdin', 'w2-aladdin', '🐪', 'Market Master', 2),
  worldBadge('ducks', 'w2-ducks', '❄️', 'Pond Hockey Pro', 2),
  worldBadge('rock', 'w2-rock', '🎷', 'Rock Class Hero', 2),
  worldBadge('friends', 'w2-friends', '🏖️', 'Beach Day Boss', 2),
];

/** Rank shown on the title screen, from total stars (max 615). */
export const RANKS = [
  [0, 'Math Cub', '🐣'],
  [20, 'Number Explorer', '🧭'],
  [60, 'Times Table Hero', '🦸'],
  [120, 'Math Superstar', '⭐'],
  [200, 'Math Legend', '🏆'],
  [280, 'Math Royalty', '👑'],
  [380, 'Math Wizard', '🧙'],
  [480, 'Math Galaxy Hero', '🌌'],
  [580, 'Math Grand Master', '🦄'],
];
export function rankFor(stars) {
  let r = RANKS[0];
  for (const x of RANKS) if (stars >= x[0]) r = x;
  const next = RANKS[RANKS.indexOf(r) + 1];
  return { min: r[0], name: r[1], emoji: r[2], next: next ? { at: next[0], name: next[1], emoji: next[2] } : null };
}
