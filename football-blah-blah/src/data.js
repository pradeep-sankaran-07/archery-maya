// Shared character list: imported straight from Archery Maya so any friend
// added there automatically shows up here too.
import { CHARACTERS as ARCHERY_CHARACTERS } from '../../src/config.js';

export const CHARACTERS = ARCHERY_CHARACTERS;
export const charById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];

export const MATCH_SECONDS = 80;

// Team kits. Index 0 is always the player's team.
export const KITS = [
  { name: 'yellow', jersey: 0xffc94a, trim: 0x3a1f5e, css: '#ffc94a', text: '#3a1f5e' }, // gold
  { name: 'red', jersey: 0xe8453c, trim: 0xffffff, css: '#e8453c', text: '#ffffff' }, // red
  { name: 'blue', jersey: 0x3f7fe0, trim: 0xffffff, css: '#3f7fe0', text: '#ffffff' }, // blue
];

export const COINS = {
  goal: 20,
  headerBonus: 10,
  volleyBonus: 10,
  superBonus: 10,
  teamGoal: 5,
  save: 10,
  win: 30,
  draw: 15,
  trophy: { 1: 50, 2: 30, 3: 15 },
  boot: 25,
  newTrophy: 15,
};

export const SHOP_ITEMS = [
  { id: 'icecream', emoji: '🍦', price: 12 },
  { id: 'lolli', emoji: '🍭', price: 8 },
  { id: 'popcorn', emoji: '🍿', price: 10 },
  { id: 'cupcake', emoji: '🧁', price: 14 },
  { id: 'balloon', emoji: '🎈', price: 5 },
  { id: 'ball', emoji: '⚽', price: 40 },
  { id: 'gloves', emoji: '🧤', price: 45 },
  { id: 'boots', emoji: '👟', price: 60 },
  { id: 'lamp', emoji: '🪔', price: 70 },
  { id: 'rajah', emoji: '🐯', price: 65 },
  { id: 'parrot', emoji: '🦜', price: 35 },
  { id: 'monkey', emoji: '🐒', price: 30 },
  { id: 'tophat', emoji: '🎩', price: 50 },
  { id: 'ticket', emoji: '🎟️', price: 25 },
  { id: 'elephant', emoji: '🐘', price: 65 },
  { id: 'unicorn', emoji: '🦄', price: 75 },
  { id: 'teddy', emoji: '🧸', price: 55 },
  { id: 'kite', emoji: '🪁', price: 35 },
  { id: 'crown', emoji: '👑', price: 120 },
  { id: 'diamond', emoji: '💎', price: 200 },
  { id: 'socks', emoji: '🧦', price: 6 },
  { id: 'chicken', emoji: '🐔', price: 18 },
  { id: 'whoopee', emoji: '💨', price: 9 },
  { id: 'diaper', emoji: '🍼', price: 3 },
];

// What can be hiding inside a trophy. Weight = how likely.
export const TROPHY_SURPRISES = [
  { id: 'icecream', emoji: '🍦', w: 22 },
  { id: 'teddy', emoji: '🧸', w: 14 },
  { id: 'chocolate', emoji: '🍫', w: 14 },
  { id: 'unicorn', emoji: '🦄', w: 10 },
  { id: 'lolli', emoji: '🍭', w: 12 },
  { id: 'monkey', emoji: '🐒', w: 8 },
  { id: 'popcorn', emoji: '🍿', w: 8 },
  { id: 'diamond', emoji: '💎', w: 5 },
];
export const DIAPER = { id: 'diaper', emoji: '🍼' };
export const DIAPER_CHANCE = { 1: 0.15, 2: 0.25, 3: 0.35 };

export function pickSurprise(place, attempt = 0) {
  const chance = DIAPER_CHANCE[place] * Math.pow(0.5, attempt);
  if (Math.random() < chance) return DIAPER;
  const pool = TROPHY_SURPRISES.filter((s) => s.id !== 'diamond' || place === 1 || attempt > 0);
  const total = pool.reduce((a, s) => a + s.w, 0);
  let r = Math.random() * total;
  for (const s of pool) { r -= s.w; if (r <= 0) return s; }
  return pool[0];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
