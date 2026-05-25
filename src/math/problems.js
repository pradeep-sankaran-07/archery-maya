import { ITEMS } from '../config.js';

// Random helpers
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function pickN(rng, arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function ri(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// "Close-but-wrong" distractors so wrong choices look plausible.
function distinctDistractors(correct, n, range = [0, 99]) {
  const set = new Set([correct]);
  const tries = [
    correct + 1, correct - 1, correct + 2, correct - 2,
    correct + 10, correct - 10, correct + 3, correct - 3,
  ];
  const out = [];
  for (const t of tries) {
    if (out.length >= n) break;
    if (!set.has(t) && t >= range[0] && t <= range[1]) {
      set.add(t); out.push(t);
    }
  }
  while (out.length < n) {
    const r = ri(() => Math.random(), range[0], range[1]);
    if (!set.has(r)) { set.add(r); out.push(r); }
  }
  return out;
}

// ============================================================================
// Templates (~100). Add/sub only — no multiplication, no division.
// Each template is { id, difficulty (2..4), generate(rng, money) → problem }.
// ============================================================================
const TEMPLATES = [
  // ─── Two-item kronor addition ──────────────────────────────────────────────
  { id: 'kr_add2', difficulty: 2, generate(rng) {
    const [a, b] = pickN(rng, ITEMS, 2);
    const ans = a.price + b.price;
    return {
      prompt: `You buy a ${a.name} ${a.emoji} and a ${b.name} ${b.emoji}.\nHow much do they cost together?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'kr_add3', difficulty: 3, generate(rng) {
    const [a, b, c] = pickN(rng, ITEMS, 3);
    const ans = a.price + b.price + c.price;
    return {
      prompt: `You buy a ${a.name} ${a.emoji}, a ${b.name} ${b.emoji}, and a ${c.name} ${c.emoji}.\nWhat's the total?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'kr_add4', difficulty: 3, generate(rng) {
    const [a, b, c, d] = pickN(rng, ITEMS, 4);
    const ans = a.price + b.price + c.price + d.price;
    return {
      prompt: `Cart has: ${a.name} ${a.emoji}, ${b.name} ${b.emoji}, ${c.name} ${c.emoji}, ${d.name} ${d.emoji}.\nTotal?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'kr_change', difficulty: 3, generate(rng) {
    const item = pick(rng, ITEMS);
    const have = item.price + ri(rng, 3, 18);
    const ans = have - item.price;
    return {
      prompt: `You have ${have} kr.\nYou buy a ${item.name} ${item.emoji} for ${item.price} kr.\nHow much is left?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'kr_two_step', difficulty: 3, generate(rng) {
    const [a, b] = pickN(rng, ITEMS, 2);
    const total = a.price + b.price;
    const have = total + ri(rng, 2, 12);
    const ans = have - total;
    return {
      prompt: `You buy a ${a.name} ${a.emoji} (${a.price} kr) and a ${b.name} ${b.emoji} (${b.price} kr).\nYou pay with ${have} kr. How much change?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'kr_pay50', difficulty: 3, generate(rng) {
    const item = pick(rng, ITEMS);
    const have = 50;
    const ans = have - item.price;
    return {
      prompt: `A ${item.name} ${item.emoji} costs ${item.price} kr.\nYou pay with a 50 kr note.\nHow much change do you get?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 80])]),
      type: 'numeric',
    };
  } },
  { id: 'kr_afford', difficulty: 2, generate(rng, money) {
    const [a, b] = pickN(rng, ITEMS, 2);
    const total = a.price + b.price;
    const ans = (money ?? 10) >= total ? 'yes' : 'no';
    return {
      prompt: `You have ${money ?? 10} kr.\nYou want a ${a.name} ${a.emoji} (${a.price} kr) and a ${b.name} ${b.emoji} (${b.price} kr).\nCan you afford both?`,
      correct: ans,
      choices: ['yes', 'no'],
      type: 'yesno',
    };
  } },
  { id: 'kr_split_change', difficulty: 4, generate(rng) {
    const [a, b, c] = pickN(rng, ITEMS, 3);
    const total = a.price + b.price + c.price;
    const have = total + ri(rng, 1, 10);
    const ans = have - total;
    return {
      prompt: `Cart: ${a.name}, ${b.name}, ${c.name} (total ${total} kr).\nYou pay ${have} kr. Change?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── 2-digit + 2-digit (carry) ─────────────────────────────────────────────
  { id: '2d_add_simple', difficulty: 2, generate(rng) {
    const a = ri(rng, 12, 25);
    const b = ri(rng, 5, 14);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_add_mid', difficulty: 3, generate(rng) {
    const a = ri(rng, 14, 38);
    const b = ri(rng, 12, 28);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 99])]), type: 'numeric' };
  } },
  { id: '2d_add_carry', difficulty: 3, generate(rng) {
    let a, b;
    do { a = ri(rng, 20, 48); b = ri(rng, 20, 48); } while (((a % 10) + (b % 10)) < 10); // force carry
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?\n(carry the one!)`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_add_big', difficulty: 4, generate(rng) {
    const a = ri(rng, 40, 75);
    const b = ri(rng, 25, 48);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 130])]), type: 'numeric' };
  } },

  // ─── 2-digit subtraction (borrow) ──────────────────────────────────────────
  { id: '2d_sub_simple', difficulty: 2, generate(rng) {
    const a = ri(rng, 14, 25);
    const b = ri(rng, 2, 9);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_mid', difficulty: 3, generate(rng) {
    const a = ri(rng, 25, 50);
    const b = ri(rng, 8, 18);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_borrow', difficulty: 3, generate(rng) {
    let a, b;
    do { a = ri(rng, 40, 70); b = ri(rng, 14, 28); } while ((a % 10) >= (b % 10)); // force borrow
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?\n(you'll need to borrow!)`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_big', difficulty: 4, generate(rng) {
    const a = ri(rng, 60, 95);
    const b = ri(rng, 25, 45);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── 3- and 4-number addition ──────────────────────────────────────────────
  { id: 'add3_small', difficulty: 2, generate(rng) {
    const [a, b, c] = [ri(rng, 2, 9), ri(rng, 2, 9), ri(rng, 2, 9)];
    const ans = a + b + c;
    return { prompt: `${a} + ${b} + ${c} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'add3_mid', difficulty: 3, generate(rng) {
    const [a, b, c] = [ri(rng, 5, 14), ri(rng, 5, 14), ri(rng, 5, 14)];
    const ans = a + b + c;
    return { prompt: `${a} + ${b} + ${c} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'add4', difficulty: 3, generate(rng) {
    const [a, b, c, d] = [ri(rng, 2, 8), ri(rng, 2, 8), ri(rng, 2, 8), ri(rng, 2, 8)];
    const ans = a + b + c + d;
    return { prompt: `${a} + ${b} + ${c} + ${d} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'add4_big', difficulty: 4, generate(rng) {
    const [a, b, c, d] = [ri(rng, 8, 15), ri(rng, 8, 15), ri(rng, 8, 15), ri(rng, 8, 15)];
    const ans = a + b + c + d;
    return { prompt: `${a} + ${b} + ${c} + ${d} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── Skip counting ─────────────────────────────────────────────────────────
  { id: 'skip2', difficulty: 2, generate(rng) {
    const start = ri(rng, 4, 14) * 2;
    const ans = start + 2;
    return {
      prompt: `Counting by 2s: ${start - 4}, ${start - 2}, ${start}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'skip3', difficulty: 3, generate(rng) {
    const start = ri(rng, 2, 8) * 3;
    const ans = start + 3;
    return {
      prompt: `Counting by 3s: ${start - 6}, ${start - 3}, ${start}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'skip5', difficulty: 2, generate(rng) {
    const start = ri(rng, 2, 8) * 5;
    const ans = start + 5;
    return {
      prompt: `Counting by 5s: ${start - 10}, ${start - 5}, ${start}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'skip10', difficulty: 2, generate(rng) {
    const start = ri(rng, 2, 7) * 10;
    const ans = start + 10;
    return {
      prompt: `Counting by 10s: ${start - 20}, ${start - 10}, ${start}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'skip_back2', difficulty: 3, generate(rng) {
    const start = ri(rng, 8, 18) * 2;
    const ans = start - 2;
    return {
      prompt: `Counting back by 2s: ${start + 4}, ${start + 2}, ${start}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Place value ───────────────────────────────────────────────────────────
  { id: 'tens_in', difficulty: 2, generate(rng) {
    const tens = ri(rng, 2, 9);
    const ones = ri(rng, 1, 9);
    const n = tens * 10 + ones;
    return {
      prompt: `How many tens are in ${n}?`,
      correct: tens,
      choices: shuffle(rng, [tens, ...distinctDistractors(tens, 2, [0, 9])]),
      type: 'numeric',
    };
  } },
  { id: 'ones_in', difficulty: 2, generate(rng) {
    const tens = ri(rng, 1, 9);
    const ones = ri(rng, 1, 9);
    const n = tens * 10 + ones;
    return {
      prompt: `How many ones are in ${n}?`,
      correct: ones,
      choices: shuffle(rng, [ones, ...distinctDistractors(ones, 2, [0, 9])]),
      type: 'numeric',
    };
  } },
  { id: 'place_decompose', difficulty: 3, generate(rng) {
    const tens = ri(rng, 2, 7);
    const ones = ri(rng, 1, 9);
    const ans = tens * 10 + ones;
    return {
      prompt: `${tens * 10} + ${ones} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'place_break', difficulty: 3, generate(rng) {
    const tens = ri(rng, 2, 7);
    const ones = ri(rng, 1, 9);
    const n = tens * 10 + ones;
    const right = `${tens * 10} + ${ones}`;
    const wrong1 = `${tens} + ${ones * 10}`;
    const wrong2 = `${(tens - 1) * 10} + ${ones + 10}`;
    return {
      prompt: `Which one shows ${n} broken into tens + ones?`,
      correct: right,
      choices: shuffle(rng, [right, wrong1, wrong2]),
      type: 'choice',
    };
  } },

  // ─── Doubles, halves, near-doubles ─────────────────────────────────────────
  { id: 'double_small', difficulty: 2, generate(rng) {
    const v = ri(rng, 3, 12);
    const ans = v + v;
    return {
      prompt: `Double ${v} is?\n(That means ${v} + ${v}.)`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'half_small', difficulty: 2, generate(rng) {
    const ans = ri(rng, 3, 12);
    const v = ans + ans;
    return {
      prompt: `Half of ${v} is?\n(${v} split into two equal parts.)`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'near_double', difficulty: 3, generate(rng) {
    const v = ri(rng, 4, 11);
    const ans = v + v + 1;
    return {
      prompt: `${v} + ${v + 1} = ?\n(Hint: it's a near double!)`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Missing addend / minuend ──────────────────────────────────────────────
  { id: 'missing_add', difficulty: 3, generate(rng) {
    const a = ri(rng, 2, 9);
    const ans = ri(rng, 2, 9);
    const total = a + ans;
    return {
      prompt: `${a} + ? = ${total}\nWhat number is missing?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'missing_add_first', difficulty: 3, generate(rng) {
    const b = ri(rng, 2, 9);
    const ans = ri(rng, 2, 9);
    const total = b + ans;
    return {
      prompt: `? + ${b} = ${total}\nWhat number is missing?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'missing_sub', difficulty: 3, generate(rng) {
    const a = ri(rng, 10, 20);
    const ans = ri(rng, 3, 8);
    const result = a - ans;
    return {
      prompt: `${a} − ? = ${result}\nWhat number is missing?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'missing_sub_minuend', difficulty: 4, generate(rng) {
    const b = ri(rng, 6, 14);
    const result = ri(rng, 6, 14);
    const ans = b + result;
    return {
      prompt: `? − ${b} = ${result}\nWhat number is missing?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Fact families ─────────────────────────────────────────────────────────
  { id: 'fact_family_sub', difficulty: 3, generate(rng) {
    const a = ri(rng, 3, 8);
    const b = ri(rng, 3, 8);
    const total = a + b;
    return {
      prompt: `If ${a} + ${b} = ${total},\nwhat is ${total} − ${a}?`,
      correct: b,
      choices: shuffle(rng, [b, ...distinctDistractors(b, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'fact_family_add', difficulty: 3, generate(rng) {
    const a = ri(rng, 3, 8);
    const b = ri(rng, 3, 8);
    const total = a + b;
    return {
      prompt: `If ${total} − ${a} = ${b},\nwhat is ${a} + ${b}?`,
      correct: total,
      choices: shuffle(rng, [total, ...distinctDistractors(total, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Comparison of two sums ────────────────────────────────────────────────
  { id: 'compare_sums', difficulty: 3, generate(rng) {
    const a1 = ri(rng, 3, 9), a2 = ri(rng, 3, 9);
    let b1 = ri(rng, 3, 9), b2 = ri(rng, 3, 9);
    while (a1 + a2 === b1 + b2) b2 = ri(rng, 3, 9);
    const sumA = a1 + a2, sumB = b1 + b2;
    const op = sumA > sumB ? '>' : sumA < sumB ? '<' : '=';
    return {
      prompt: `${a1} + ${a2}    ?    ${b1} + ${b2}\nWhich symbol goes in the middle?`,
      correct: op,
      choices: ['>', '<', '='],
      type: 'choice',
    };
  } },
  { id: 'compare_diffs', difficulty: 4, generate(rng) {
    const a1 = ri(rng, 10, 20), a2 = ri(rng, 2, 7);
    let b1 = ri(rng, 10, 20), b2 = ri(rng, 2, 7);
    while (a1 - a2 === b1 - b2) b2 = ri(rng, 2, 7);
    const sumA = a1 - a2, sumB = b1 - b2;
    const op = sumA > sumB ? '>' : sumA < sumB ? '<' : '=';
    return {
      prompt: `${a1} − ${a2}    ?    ${b1} − ${b2}\nWhich symbol goes in the middle?`,
      correct: op,
      choices: ['>', '<', '='],
      type: 'choice',
    };
  } },

  // ─── Counting coins (1 kr, 5 kr, 10 kr) ────────────────────────────────────
  { id: 'coins_5_1', difficulty: 2, generate(rng) {
    const fives = ri(rng, 1, 4);
    const ones = ri(rng, 1, 5);
    const ans = fives * 5 + ones;
    return {
      prompt: `${fives} coin${fives > 1 ? 's' : ''} worth 5 kr and ${ones} coin${ones > 1 ? 's' : ''} worth 1 kr.\nHow much in total?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'coins_10_1', difficulty: 2, generate(rng) {
    const tens = ri(rng, 1, 4);
    const ones = ri(rng, 1, 9);
    const ans = tens * 10 + ones;
    return {
      prompt: `${tens} coin${tens > 1 ? 's' : ''} worth 10 kr and ${ones} coin${ones > 1 ? 's' : ''} worth 1 kr.\nHow much in total?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'coins_10_5_1', difficulty: 3, generate(rng) {
    const tens = ri(rng, 1, 3);
    const fives = ri(rng, 1, 3);
    const ones = ri(rng, 1, 4);
    const ans = tens * 10 + fives * 5 + ones;
    return {
      prompt: `${tens} × 10 kr + ${fives} × 5 kr + ${ones} × 1 kr.\nTotal? (Just add them up.)`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Word problems: simple one-step ────────────────────────────────────────
  { id: 'word_birds', difficulty: 2, generate(rng) {
    const start = ri(rng, 5, 12);
    const more = ri(rng, 2, 6);
    const ans = start + more;
    return {
      prompt: `${start} birds 🐦 sit on a branch.\n${more} more fly in. How many birds now?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_cookies', difficulty: 2, generate(rng) {
    const start = ri(rng, 6, 14);
    const eat = ri(rng, 2, 5);
    const ans = start - eat;
    return {
      prompt: `Tejas has ${start} cookies 🍪.\nHe eats ${eat}. How many cookies are left?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_marbles', difficulty: 2, generate(rng) {
    const start = ri(rng, 8, 18);
    const lost = ri(rng, 2, 6);
    const ans = start - lost;
    return {
      prompt: `Maya had ${start} marbles 🔵.\nShe lost ${lost} under the sofa.\nHow many marbles does she have now?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_stickers', difficulty: 2, generate(rng) {
    const start = ri(rng, 4, 10);
    const gift = ri(rng, 3, 8);
    const ans = start + gift;
    return {
      prompt: `Lily had ${start} stickers ✨.\nGrandma gave her ${gift} more.\nHow many stickers does Lily have now?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_apples', difficulty: 3, generate(rng) {
    const tree = ri(rng, 10, 20);
    const picked = ri(rng, 3, 8);
    const ans = tree - picked;
    return {
      prompt: `An apple tree 🍎 had ${tree} apples.\n${picked} were picked.\nHow many are still on the tree?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_pages', difficulty: 3, generate(rng) {
    const total = ri(rng, 20, 40);
    const read = ri(rng, 8, 16);
    const ans = total - read;
    return {
      prompt: `Your book has ${total} pages.\nYou've read ${read}.\nHow many pages are left?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_fish_tank', difficulty: 3, generate(rng) {
    const a = ri(rng, 5, 12);
    const b = ri(rng, 4, 10);
    const ans = a + b;
    return {
      prompt: `A tank has ${a} goldfish 🐟 and ${b} guppies.\nHow many fish in all?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'word_balloons', difficulty: 3, generate(rng) {
    const start = ri(rng, 12, 22);
    const popped = ri(rng, 3, 7);
    const ans = start - popped;
    return {
      prompt: `${start} balloons 🎈 at the party.\n${popped} popped!\nHow many balloons are left?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Word problems: two-step ───────────────────────────────────────────────
  { id: 'twostep_add_add', difficulty: 4, generate(rng) {
    const a = ri(rng, 3, 8);
    const b = ri(rng, 3, 8);
    const c = ri(rng, 2, 7);
    const ans = a + b + c;
    return {
      prompt: `Maya has ${a} stickers.\nAlya gives her ${b} more.\nThen Lily gives her ${c} more.\nHow many stickers does Maya have now?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'twostep_add_sub', difficulty: 4, generate(rng) {
    const start = ri(rng, 8, 14);
    const more = ri(rng, 3, 6);
    const eat = ri(rng, 4, 9);
    const ans = start + more - eat;
    return {
      prompt: `You have ${start} cookies 🍪.\nMom bakes ${more} more.\nThen the family eats ${eat}.\nHow many cookies are left?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'twostep_kr', difficulty: 4, generate(rng) {
    const start = ri(rng, 20, 40);
    const a = pick(rng, ITEMS);
    const b = pick(rng, ITEMS.filter((it) => it.id !== a.id));
    const ans = start - a.price - b.price;
    return {
      prompt: `You have ${start} kr.\nYou buy a ${a.name} ${a.emoji} (${a.price} kr) and a ${b.name} ${b.emoji} (${b.price} kr).\nHow much money is left?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'twostep_gift_spend', difficulty: 4, generate(rng) {
    const start = ri(rng, 10, 20);
    const gift = ri(rng, 5, 15);
    const item = pick(rng, ITEMS);
    const ans = start + gift - item.price;
    return {
      prompt: `You start with ${start} kr.\nGrandma gives you ${gift} kr.\nYou buy a ${item.name} ${item.emoji} (${item.price} kr).\nHow much do you have now?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Counting on / counting back ───────────────────────────────────────────
  { id: 'count_on', difficulty: 2, generate(rng) {
    const start = ri(rng, 10, 25);
    const step = ri(rng, 3, 6);
    const ans = start + step;
    return {
      prompt: `Start at ${start}. Count up ${step}.\nWhere do you end?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'count_back', difficulty: 2, generate(rng) {
    const start = ri(rng, 14, 28);
    const step = ri(rng, 3, 6);
    const ans = start - step;
    return {
      prompt: `Start at ${start}. Count back ${step}.\nWhere do you end?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'count_on_big', difficulty: 3, generate(rng) {
    const start = ri(rng, 20, 50);
    const step = ri(rng, 6, 12);
    const ans = start + step;
    return {
      prompt: `Start at ${start}. Count up ${step}.\nWhere do you end?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── +n patterns ───────────────────────────────────────────────────────────
  { id: 'pattern_plus3', difficulty: 3, generate(rng) {
    const start = ri(rng, 1, 8);
    const ans = start + 12;
    return {
      prompt: `What comes next?\n${start}, ${start + 3}, ${start + 6}, ${start + 9}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'pattern_plus4', difficulty: 3, generate(rng) {
    const start = ri(rng, 1, 6);
    const ans = start + 16;
    return {
      prompt: `What comes next?\n${start}, ${start + 4}, ${start + 8}, ${start + 12}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'pattern_plus5', difficulty: 2, generate(rng) {
    const start = ri(rng, 0, 5);
    const ans = start + 20;
    return {
      prompt: `What comes next?\n${start}, ${start + 5}, ${start + 10}, ${start + 15}, ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'pattern_minus', difficulty: 3, generate(rng) {
    const end = ri(rng, 1, 6);
    const ans = end + 2;
    return {
      prompt: `Pattern goes down by 2.\nFill in: ${end + 8}, ${end + 6}, ${end + 4}, ?, ${end}`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Even / odd ────────────────────────────────────────────────────────────
  { id: 'pick_even', difficulty: 2, generate(rng) {
    const even = ri(rng, 1, 8) * 2;
    const odd1 = even + 1, odd2 = even - 3;
    return {
      prompt: `Which one is even?`,
      correct: String(even),
      choices: shuffle(rng, [String(even), String(odd1), String(odd2)]),
      type: 'choice',
    };
  } },
  { id: 'pick_odd', difficulty: 2, generate(rng) {
    const odd = ri(rng, 1, 8) * 2 + 1;
    const even1 = odd + 1, even2 = odd - 3;
    return {
      prompt: `Which one is odd?`,
      correct: String(odd),
      choices: shuffle(rng, [String(odd), String(even1), String(even2)]),
      type: 'choice',
    };
  } },

  // ─── Time / units (simple counting framing) ────────────────────────────────
  { id: 'time_min_in_hr', difficulty: 2, generate(rng) {
    return {
      prompt: `How many minutes are in 1 hour?`,
      correct: 60,
      choices: shuffle(rng, [60, 30, 100]),
      type: 'numeric',
    };
  } },
  { id: 'time_min_extra', difficulty: 3, generate(rng) {
    const extra = ri(rng, 5, 30);
    return {
      prompt: `1 hour and ${extra} minutes is how many minutes total?`,
      correct: 60 + extra,
      choices: shuffle(rng, [60 + extra, ...distinctDistractors(60 + extra, 2, [30, 150])]),
      type: 'numeric',
    };
  } },
  { id: 'time_days_week', difficulty: 2, generate(rng) {
    const extra = ri(rng, 1, 6);
    return {
      prompt: `1 week and ${extra} days is how many days total?`,
      correct: 7 + extra,
      choices: shuffle(rng, [7 + extra, ...distinctDistractors(7 + extra, 2, [5, 20])]),
      type: 'numeric',
    };
  } },
  { id: 'time_two_weeks', difficulty: 3, generate(rng) {
    return {
      prompt: `How many days are in 2 weeks?`,
      correct: 14,
      choices: shuffle(rng, [14, 7, 21]),
      type: 'numeric',
    };
  } },
  { id: 'time_hours_day', difficulty: 2, generate(rng) {
    return {
      prompt: `How many hours are in 1 day?`,
      correct: 24,
      choices: shuffle(rng, [24, 12, 36]),
      type: 'numeric',
    };
  } },

  // ─── Number neighbors / "next" ─────────────────────────────────────────────
  { id: 'next_number', difficulty: 2, generate(rng) {
    const n = ri(rng, 18, 88);
    return {
      prompt: `What number comes right after ${n}?`,
      correct: n + 1,
      choices: shuffle(rng, [n + 1, n - 1, n + 10]),
      type: 'numeric',
    };
  } },
  { id: 'prev_number', difficulty: 2, generate(rng) {
    const n = ri(rng, 19, 90);
    return {
      prompt: `What number comes right before ${n}?`,
      correct: n - 1,
      choices: shuffle(rng, [n - 1, n + 1, n - 10]),
      type: 'numeric',
    };
  } },
  { id: 'between', difficulty: 2, generate(rng) {
    const a = ri(rng, 10, 80);
    return {
      prompt: `What number comes between ${a} and ${a + 2}?`,
      correct: a + 1,
      choices: shuffle(rng, [a + 1, a, a + 2]),
      type: 'numeric',
    };
  } },

  // ─── Make-10 strategy ──────────────────────────────────────────────────────
  { id: 'make10', difficulty: 2, generate(rng) {
    const a = ri(rng, 1, 9);
    const ans = 10 - a;
    return {
      prompt: `${a} + ? = 10\nWhat goes in the blank?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 10])]),
      type: 'numeric',
    };
  } },
  { id: 'make20', difficulty: 3, generate(rng) {
    const a = ri(rng, 11, 19);
    const ans = 20 - a;
    return {
      prompt: `${a} + ? = 20\nWhat goes in the blank?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 10])]),
      type: 'numeric',
    };
  } },
  { id: 'make100', difficulty: 4, generate(rng) {
    const a = ri(rng, 5, 9) * 10;
    const ans = 100 - a;
    return {
      prompt: `${a} + ? = 100\nWhat goes in the blank?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 100])]),
      type: 'numeric',
    };
  } },

  // ─── Bridging 10 / 20 ──────────────────────────────────────────────────────
  { id: 'bridge10', difficulty: 3, generate(rng) {
    const a = ri(rng, 6, 9);
    const b = ri(rng, 4, 8);
    const ans = a + b; // crosses 10
    return {
      prompt: `${a} + ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'bridge20', difficulty: 3, generate(rng) {
    const a = ri(rng, 14, 19);
    const b = ri(rng, 3, 8);
    const ans = a + b; // crosses 20
    return {
      prompt: `${a} + ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Add/sub mixed (round numbers) ────────────────────────────────────────
  { id: 'add_tens', difficulty: 2, generate(rng) {
    const a = ri(rng, 2, 6) * 10;
    const b = ri(rng, 2, 4) * 10;
    const ans = a + b;
    return {
      prompt: `${a} + ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'sub_tens', difficulty: 2, generate(rng) {
    const a = ri(rng, 5, 9) * 10;
    const b = ri(rng, 1, 4) * 10;
    const ans = a - b;
    return {
      prompt: `${a} − ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'add_round_then_some', difficulty: 3, generate(rng) {
    const tens = ri(rng, 2, 5) * 10;
    const some = ri(rng, 4, 9);
    const ans = tens + some;
    return {
      prompt: `${tens} + ${some} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── "Which is closest to" ─────────────────────────────────────────────────
  { id: 'closest_to', difficulty: 4, generate(rng) {
    const target = ri(rng, 15, 45);
    const correct = target;
    const off1 = target + ri(rng, 5, 10);
    const off2 = target - ri(rng, 5, 10);
    return {
      prompt: `Which is closest to ${target}?`,
      correct: String(correct),
      choices: shuffle(rng, [String(correct), String(off1), String(off2)]),
      type: 'choice',
    };
  } },

  // ─── Money: how many coins make N ─────────────────────────────────────────
  { id: 'fives_make', difficulty: 3, generate(rng) {
    const ans = ri(rng, 2, 6);
    const target = ans * 5;
    return {
      prompt: `How many 5 kr coins make ${target} kr?`,
      correct: ans,
      choices: shuffle(rng, [ans, ans + 1, ans - 1]),
      type: 'numeric',
    };
  } },
  { id: 'tens_make', difficulty: 3, generate(rng) {
    const ans = ri(rng, 2, 6);
    const target = ans * 10;
    return {
      prompt: `How many 10 kr coins make ${target} kr?`,
      correct: ans,
      choices: shuffle(rng, [ans, ans + 1, ans - 1]),
      type: 'numeric',
    };
  } },

  // ─── Sub from 100 ──────────────────────────────────────────────────────────
  { id: 'sub_from_100', difficulty: 4, generate(rng) {
    const b = ri(rng, 12, 48);
    const ans = 100 - b;
    return {
      prompt: `100 − ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 100])]),
      type: 'numeric',
    };
  } },

  // ─── Comparison with a single number ───────────────────────────────────────
  { id: 'compare_num', difficulty: 2, generate(rng) {
    const a = ri(rng, 15, 70);
    let b = ri(rng, 15, 70);
    while (a === b) b = ri(rng, 15, 70);
    const op = a > b ? '>' : '<';
    return {
      prompt: `${a}    ?    ${b}\nWhich symbol fits?`,
      correct: op,
      choices: ['>', '<', '='],
      type: 'choice',
    };
  } },

  // ─── Three-number subtraction-then-add ─────────────────────────────────────
  { id: 'sub_then_add', difficulty: 4, generate(rng) {
    const a = ri(rng, 12, 22);
    const b = ri(rng, 3, 7);
    const c = ri(rng, 2, 6);
    const ans = a - b + c;
    return {
      prompt: `${a} − ${b} + ${c} = ?\n(Do it left to right.)`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'add_then_sub', difficulty: 4, generate(rng) {
    const a = ri(rng, 8, 18);
    const b = ri(rng, 3, 7);
    const c = ri(rng, 2, 6);
    const ans = a + b - c;
    return {
      prompt: `${a} + ${b} − ${c} = ?\n(Do it left to right.)`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Ordering ──────────────────────────────────────────────────────────────
  { id: 'smallest_of_three_close', difficulty: 3, generate(rng) {
    const base = ri(rng, 15, 60);
    const a = base, b = base + ri(rng, 1, 3), c = base + ri(rng, 4, 7);
    return {
      prompt: `Which is the SMALLEST?\n${b}    ${c}    ${a}`,
      correct: String(a),
      choices: shuffle(rng, [String(a), String(b), String(c)]),
      type: 'choice',
    };
  } },
  { id: 'biggest_of_three_close', difficulty: 3, generate(rng) {
    const base = ri(rng, 15, 60);
    const a = base, b = base + ri(rng, 1, 3), c = base + ri(rng, 4, 7);
    return {
      prompt: `Which is the BIGGEST?\n${a}    ${b}    ${c}`,
      correct: String(c),
      choices: shuffle(rng, [String(a), String(b), String(c)]),
      type: 'choice',
    };
  } },

  // ─── Quick add/sub fluency (1-digit, hard tier) ───────────────────────────
  { id: '1d_sum_pair', difficulty: 2, generate(rng) {
    const a = ri(rng, 4, 9), b = ri(rng, 4, 9);
    const ans = a + b;
    return {
      prompt: `${a} + ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: '1d_diff_pair', difficulty: 2, generate(rng) {
    const a = ri(rng, 8, 18), b = ri(rng, 3, 8);
    const ans = a - b;
    return {
      prompt: `${a} − ${b} = ?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },

  // ─── Two prices, which is more / less by how much ──────────────────────────
  { id: 'kr_diff', difficulty: 3, generate(rng) {
    const a = pick(rng, ITEMS);
    let b = pick(rng, ITEMS);
    while (b.id === a.id || b.price === a.price) b = pick(rng, ITEMS);
    const hi = a.price > b.price ? a : b;
    const lo = a.price > b.price ? b : a;
    const ans = hi.price - lo.price;
    return {
      prompt: `${hi.name} ${hi.emoji} costs ${hi.price} kr.\n${lo.name} ${lo.emoji} costs ${lo.price} kr.\nHow much MORE does the ${hi.name} cost?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 10])]),
      type: 'numeric',
    };
  } },

  // ═════════════════════════════════════════════════════════════════════════
  // v7 additions — push the template pool to ~200 so the question bank stays
  // fresh across many plays. Two-digit ceiling preserved (no number ≥ 100).
  // No multiplication or division operators in any prompt.
  // ═════════════════════════════════════════════════════════════════════════

  // ─── More 2-digit arithmetic (15) ──────────────────────────────────────────
  { id: '2d_add_no_carry', difficulty: 3, generate(rng) {
    let a, b;
    do { a = ri(rng, 22, 50); b = ri(rng, 14, 25); } while (((a % 10) + (b % 10)) >= 10);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_no_borrow', difficulty: 3, generate(rng) {
    let a, b;
    do { a = ri(rng, 35, 78); b = ri(rng, 12, 24); } while ((a % 10) < (b % 10));
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_add_easy', difficulty: 2, generate(rng) {
    const a = ri(rng, 11, 28); const b = ri(rng, 5, 10);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_easy', difficulty: 2, generate(rng) {
    const a = ri(rng, 18, 35); const b = ri(rng, 4, 10);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_add_double_carry', difficulty: 4, generate(rng) {
    let a, b;
    do { a = ri(rng, 35, 58); b = ri(rng, 35, 48); } while (((a % 10) + (b % 10)) < 10);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?\n(carry across!)`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_double_borrow', difficulty: 4, generate(rng) {
    let a, b;
    do { a = ri(rng, 60, 92); b = ri(rng, 24, 47); } while ((a % 10) >= (b % 10));
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?\n(borrow once!)`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'add_to_50', difficulty: 3, generate(rng) {
    const a = ri(rng, 12, 32); const b = ri(rng, 8, 18);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'add_to_60', difficulty: 3, generate(rng) {
    const a = ri(rng, 24, 38); const b = ri(rng, 14, 22);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'sub_to_30', difficulty: 2, generate(rng) {
    const a = ri(rng, 38, 55); const b = ri(rng, 8, 20);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'sub_to_40', difficulty: 3, generate(rng) {
    const a = ri(rng, 52, 72); const b = ri(rng, 14, 24);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'mid_2d_add', difficulty: 3, generate(rng) {
    const a = ri(rng, 24, 46); const b = ri(rng, 18, 32);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'mid_2d_sub', difficulty: 3, generate(rng) {
    const a = ri(rng, 46, 74); const b = ri(rng, 18, 32);
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'add_two_then_one', difficulty: 3, generate(rng) {
    const a = ri(rng, 18, 36); const b = ri(rng, 12, 24); const c = ri(rng, 3, 8);
    const ans = a + b + c;
    return { prompt: `${a} + ${b} + ${c} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'sub_then_one', difficulty: 3, generate(rng) {
    const a = ri(rng, 38, 70); const b = ri(rng, 12, 22); const c = ri(rng, 3, 8);
    const ans = a - b - c;
    return { prompt: `${a} − ${b} − ${c} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'tens_plus_tens', difficulty: 2, generate(rng) {
    const a = ri(rng, 2, 6) * 10; const b = ri(rng, 2, 4) * 10;
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── More kr / shop money (15) ─────────────────────────────────────────────
  { id: 'kr_add_5_items', difficulty: 4, generate(rng) {
    const items = pickN(rng, ITEMS, 5);
    const ans = items.reduce((s, it) => s + it.price, 0);
    const list = items.map((i) => `${i.emoji}`).join(' ');
    return {
      prompt: `Your cart: ${list}\n(${items.map((i) => i.price).join(' + ')})\nTotal?`,
      correct: ans,
      choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
      type: 'numeric',
    };
  } },
  { id: 'kr_change_from_30', difficulty: 3, generate(rng) {
    const a = pick(rng, ITEMS); const b = pick(rng, ITEMS.filter(i => i.id !== a.id));
    const total = a.price + b.price;
    const ans = 30 - total;
    return { prompt: `Cart: ${a.name} ${a.emoji} + ${b.name} ${b.emoji} = ${total} kr.\nYou pay 30 kr. Change?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 30])]), type: 'numeric' };
  } },
  { id: 'kr_change_from_40', difficulty: 3, generate(rng) {
    const [a, b, c] = pickN(rng, ITEMS, 3);
    const total = a.price + b.price + c.price;
    const have = Math.max(40, total + 1);
    const ans = have - total;
    return { prompt: `Cart total: ${total} kr.\nYou pay ${have} kr. Change?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_change_from_100', difficulty: 4, generate(rng) {
    const a = ri(rng, 18, 48); const b = ri(rng, 22, 41);
    const total = a + b;
    const ans = 100 - total;
    return { prompt: `You buy two things: ${a} kr and ${b} kr.\nYou pay with 100 kr. Change?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 100])]), type: 'numeric' };
  } },
  { id: 'kr_can_buy_3_for_n', difficulty: 3, generate(rng, money) {
    const [a, b, c] = pickN(rng, ITEMS, 3);
    const total = a.price + b.price + c.price;
    const have = money ?? 15;
    const ans = have >= total ? 'yes' : 'no';
    return {
      prompt: `You have ${have} kr.\nCan you afford ${a.name} ${a.emoji} + ${b.name} ${b.emoji} + ${c.name} ${c.emoji}?\n(They cost ${total} kr together.)`,
      correct: ans,
      choices: ['yes', 'no'],
      type: 'yesno',
    };
  } },
  { id: 'kr_save_for_target', difficulty: 3, generate(rng) {
    const item = pick(rng, ITEMS);
    const target = item.price * 5; // arbitrary save target
    const have = ri(rng, 5, target - 1);
    const ans = target - have;
    return { prompt: `You want to save ${target} kr for a big toy.\nYou have ${have} kr.\nHow much more do you need?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_split_three_friends', difficulty: 3, generate(rng) {
    const each = ri(rng, 4, 14);
    const total = each * 3;
    return { prompt: `Three friends share a cost of ${total} kr equally.\nHow much does each one pay?`, correct: each, choices: shuffle(rng, [each, ...distinctDistractors(each, 2)]), type: 'numeric' };
  } },
  { id: 'kr_double_price', difficulty: 2, generate(rng) {
    const item = pick(rng, ITEMS);
    const ans = item.price * 2;
    return { prompt: `Today the ${item.name} ${item.emoji} (${item.price} kr) costs DOUBLE.\nWhat's the new price?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_half_price', difficulty: 3, generate(rng) {
    const ans = ri(rng, 3, 14);
    const v = ans * 2;
    return { prompt: `Half-price sale!\nA toy that was ${v} kr is now half price.\nWhat's the new price?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_pay_with_coins', difficulty: 3, generate(rng) {
    const tens = ri(rng, 1, 3); const fives = ri(rng, 1, 4); const ones = ri(rng, 1, 6);
    const ans = tens * 10 + fives * 5 + ones;
    return { prompt: `${tens} × 10 kr + ${fives} × 5 kr + ${ones} × 1 kr.\nWhat's the total?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_swap_change', difficulty: 4, generate(rng) {
    const item = ri(rng, 17, 43);
    const ans = 50 - item;
    return { prompt: `A toy costs ${item} kr.\nYou hand over a 50 kr note.\nWhat change do you get?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 50])]), type: 'numeric' };
  } },
  { id: 'kr_total_with_discount', difficulty: 4, generate(rng) {
    const a = pick(rng, ITEMS); const b = pick(rng, ITEMS.filter(i => i.id !== a.id));
    const total = a.price + b.price;
    const ans = Math.max(0, total - 5);
    return { prompt: `${a.name} ${a.emoji} (${a.price} kr) + ${b.name} ${b.emoji} (${b.price} kr).\n5 kr off the total. How much do you pay?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_compare_two_baskets', difficulty: 3, generate(rng) {
    const a1 = ri(rng, 8, 22); const a2 = ri(rng, 8, 22);
    let b1 = ri(rng, 8, 22); let b2 = ri(rng, 8, 22);
    while (a1 + a2 === b1 + b2) b2 = ri(rng, 8, 22);
    const op = (a1 + a2) > (b1 + b2) ? '>' : '<';
    return { prompt: `Basket A: ${a1} kr + ${a2} kr\nBasket B: ${b1} kr + ${b2} kr\nWhich basket costs more?`, correct: op === '>' ? 'A' : 'B', choices: ['A', 'B'], type: 'choice' };
  } },
  { id: 'kr_extra_after_buying', difficulty: 3, generate(rng, money) {
    const a = pick(rng, ITEMS);
    const have = money != null ? money : ri(rng, a.price + 2, a.price + 12);
    const ans = Math.max(0, have - a.price);
    return { prompt: `You have ${have} kr.\nYou buy a ${a.name} ${a.emoji} (${a.price} kr).\nHow much is left?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'kr_round_change', difficulty: 4, generate(rng) {
    const item = ri(rng, 12, 38);
    const ans = 40 - item;
    return { prompt: `A toy costs ${item} kr.\nYou pay with a 40 kr (two 20s).\nChange?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── More word problems (20) ───────────────────────────────────────────────
  { id: 'word_sheep', difficulty: 3, generate(rng) {
    const start = ri(rng, 18, 42); const lost = ri(rng, 6, 14);
    const ans = start - lost;
    return { prompt: `A farmer had ${start} sheep 🐑.\n${lost} ran away.\nHow many are left?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_pencils', difficulty: 2, generate(rng) {
    const a = ri(rng, 12, 24); const b = ri(rng, 5, 12);
    const ans = a + b;
    return { prompt: `Maya had ${a} pencils ✏️.\nGrandma gave her ${b} more.\nHow many now?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_pages_read', difficulty: 3, generate(rng) {
    const total = ri(rng, 30, 70); const read = ri(rng, 12, 25);
    const ans = total - read;
    return { prompt: `Your book is ${total} pages.\nYou've read ${read}.\nHow many to go?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_fish_in_pond', difficulty: 3, generate(rng) {
    const start = ri(rng, 20, 45); const more = ri(rng, 7, 18);
    const ans = start + more;
    return { prompt: `A pond had ${start} fish 🐟.\n${more} more swam in.\nHow many fish now?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_kids_at_party', difficulty: 3, generate(rng) {
    const start = ri(rng, 14, 28); const left = ri(rng, 5, 12);
    const ans = start - left;
    return { prompt: `${start} kids at the party 🎉.\n${left} went home.\nHow many are still there?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_blocks', difficulty: 2, generate(rng) {
    const a = ri(rng, 16, 30); const b = ri(rng, 8, 14);
    const ans = a + b;
    return { prompt: `Lily has ${a} blocks 🧱.\nShe finds ${b} more under the sofa.\nHow many in all?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_seashells', difficulty: 3, generate(rng) {
    const a = ri(rng, 14, 28); const b = ri(rng, 10, 22);
    const ans = a + b;
    return { prompt: `At the beach 🏖, Amarah collected ${a} seashells in the morning\nand ${b} in the afternoon.\nHow many in total?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_pets', difficulty: 2, generate(rng) {
    const dogs = ri(rng, 6, 14); const cats = ri(rng, 5, 12);
    const ans = dogs + cats;
    return { prompt: `At the shelter there are ${dogs} dogs 🐶 and ${cats} cats 🐱.\nHow many pets total?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_flowers_in_garden', difficulty: 3, generate(rng) {
    const start = ri(rng, 28, 55); const picked = ri(rng, 10, 18);
    const ans = start - picked;
    return { prompt: `${start} flowers 🌷 in the garden.\nYou pick ${picked}.\nHow many flowers are left?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_swimmers', difficulty: 2, generate(rng) {
    const start = ri(rng, 8, 20); const more = ri(rng, 4, 12);
    const ans = start + more;
    return { prompt: `${start} kids 🏊 at the pool.\n${more} more arrive.\nHow many swimmers now?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_steps_walked', difficulty: 3, generate(rng) {
    const a = ri(rng, 22, 45); const b = ri(rng, 18, 35);
    const ans = a + b;
    return { prompt: `Yesterday Tejas walked ${a} steps to school\nand ${b} steps back home.\nHow many steps total?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_drawings', difficulty: 2, generate(rng) {
    const a = ri(rng, 11, 23); const b = ri(rng, 6, 14);
    const ans = a + b;
    return { prompt: `Aisha drew ${a} pictures 🎨 on Monday\nand ${b} on Tuesday.\nHow many drawings?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_buttons', difficulty: 3, generate(rng) {
    const total = ri(rng, 35, 65); const found = ri(rng, 14, 24);
    const ans = total - found;
    return { prompt: `Paati has a jar of ${total} buttons.\nShe gives ${found} to Maya.\nHow many in the jar now?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_legos_left', difficulty: 3, generate(rng) {
    const start = ri(rng, 40, 78); const used = ri(rng, 18, 32);
    const ans = start - used;
    return { prompt: `Isma had ${start} lego pieces 🧱.\nHe used ${used} to build a castle.\nHow many lego pieces are unused?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_treats_for_friends', difficulty: 2, generate(rng) {
    const a = ri(rng, 12, 22); const b = ri(rng, 8, 16);
    const ans = a + b;
    return { prompt: `Karen baked ${a} cookies 🍪 and ${b} cupcakes 🧁.\nHow many treats in total?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_jumps_on_bed', difficulty: 3, generate(rng) {
    const a = ri(rng, 14, 28); const b = ri(rng, 12, 22);
    const ans = a + b;
    return { prompt: `Live did ${a} jumps on the bed.\nThen ${b} more!\nHow many jumps?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_marshmallows', difficulty: 2, generate(rng) {
    const start = ri(rng, 16, 30); const ate = ri(rng, 6, 12);
    const ans = start - ate;
    return { prompt: `A bag has ${start} marshmallows.\nYou eat ${ate}.\nHow many marshmallows are left?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_socks_in_drawer', difficulty: 3, generate(rng) {
    const a = ri(rng, 12, 22); const b = ri(rng, 10, 18);
    const ans = a + b;
    return { prompt: `Pradeep counts ${a} stripey socks 🧦 and ${b} plain socks.\nHow many socks total?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_kites_at_park', difficulty: 3, generate(rng) {
    const start = ri(rng, 18, 32); const blewAway = ri(rng, 5, 13);
    const ans = start - blewAway;
    return { prompt: `There were ${start} kites 🪁 at the park.\n${blewAway} blew away in the wind.\nHow many kites still in the sky?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'word_bouncy_balls', difficulty: 3, generate(rng) {
    const total = ri(rng, 30, 55); const lost = ri(rng, 11, 22);
    const ans = total - lost;
    return { prompt: `Alya had a bucket of ${total} bouncy balls.\n${lost} bounced down the stairs!\nHow many bouncy balls are left?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── More missing-number / fact-family (10) ────────────────────────────────
  { id: 'missing_first_2d', difficulty: 4, generate(rng) {
    const b = ri(rng, 12, 32); const ans = ri(rng, 10, 28);
    const total = b + ans;
    return { prompt: `? + ${b} = ${total}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'missing_second_2d', difficulty: 4, generate(rng) {
    const a = ri(rng, 12, 32); const ans = ri(rng, 10, 28);
    const total = a + ans;
    return { prompt: `${a} + ? = ${total}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'missing_sub_left', difficulty: 4, generate(rng) {
    const b = ri(rng, 12, 24); const result = ri(rng, 10, 28);
    const ans = b + result;
    return { prompt: `? − ${b} = ${result}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'missing_sub_right', difficulty: 4, generate(rng) {
    const a = ri(rng, 28, 60); const ans = ri(rng, 10, 22);
    const result = a - ans;
    return { prompt: `${a} − ? = ${result}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'fact_family_triple', difficulty: 3, generate(rng) {
    const a = ri(rng, 6, 14); const b = ri(rng, 5, 12);
    const total = a + b;
    return { prompt: `If ${a} + ${b} = ${total},\nwhat is ${b} + ${a}?`, correct: total, choices: shuffle(rng, [total, ...distinctDistractors(total, 2)]), type: 'numeric' };
  } },
  { id: 'fact_family_quadruple', difficulty: 4, generate(rng) {
    const a = ri(rng, 8, 16); const b = ri(rng, 6, 14);
    const total = a + b;
    return { prompt: `If ${a} + ${b} = ${total},\nwhat is ${total} − ${b}?`, correct: a, choices: shuffle(rng, [a, ...distinctDistractors(a, 2)]), type: 'numeric' };
  } },
  { id: 'find_diff_given_sum', difficulty: 4, generate(rng) {
    const a = ri(rng, 22, 45); const b = ri(rng, 8, 18);
    return { prompt: `${a} + ${b} = ?\nThen subtract ${b}. What's left?`, correct: a, choices: shuffle(rng, [a, ...distinctDistractors(a, 2)]), type: 'numeric' };
  } },
  { id: 'find_sum_given_diff', difficulty: 4, generate(rng) {
    const a = ri(rng, 28, 50); const b = ri(rng, 8, 18);
    return { prompt: `${a} − ${b} = ?\nThen add ${b}. What do you get?`, correct: a, choices: shuffle(rng, [a, ...distinctDistractors(a, 2)]), type: 'numeric' };
  } },
  { id: 'add_to_target', difficulty: 3, generate(rng) {
    const total = ri(rng, 20, 40); const a = ri(rng, 5, total - 5);
    const ans = total - a;
    return { prompt: `${a} + ? = ${total}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'sub_from_target', difficulty: 3, generate(rng) {
    const a = ri(rng, 30, 65); const result = ri(rng, 8, 22);
    const ans = a - result;
    return { prompt: `${a} − ? = ${result}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── More patterns (10) ────────────────────────────────────────────────────
  { id: 'pattern_plus2', difficulty: 2, generate(rng) {
    const s = ri(rng, 10, 22);
    return { prompt: `${s}, ${s + 2}, ${s + 4}, ?`, correct: s + 6, choices: shuffle(rng, [s + 6, ...distinctDistractors(s + 6, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_plus6', difficulty: 3, generate(rng) {
    const s = ri(rng, 6, 12);
    return { prompt: `${s}, ${s + 6}, ${s + 12}, ?`, correct: s + 18, choices: shuffle(rng, [s + 18, ...distinctDistractors(s + 18, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_plus7', difficulty: 3, generate(rng) {
    const s = ri(rng, 5, 11);
    return { prompt: `${s}, ${s + 7}, ${s + 14}, ?`, correct: s + 21, choices: shuffle(rng, [s + 21, ...distinctDistractors(s + 21, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_plus8', difficulty: 3, generate(rng) {
    const s = ri(rng, 4, 10);
    return { prompt: `${s}, ${s + 8}, ${s + 16}, ?`, correct: s + 24, choices: shuffle(rng, [s + 24, ...distinctDistractors(s + 24, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_plus9', difficulty: 4, generate(rng) {
    const s = ri(rng, 3, 9);
    return { prompt: `${s}, ${s + 9}, ${s + 18}, ?`, correct: s + 27, choices: shuffle(rng, [s + 27, ...distinctDistractors(s + 27, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_minus3', difficulty: 3, generate(rng) {
    const s = ri(rng, 35, 60);
    return { prompt: `${s}, ${s - 3}, ${s - 6}, ?`, correct: s - 9, choices: shuffle(rng, [s - 9, ...distinctDistractors(s - 9, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_minus5', difficulty: 3, generate(rng) {
    const s = ri(rng, 40, 70);
    return { prompt: `${s}, ${s - 5}, ${s - 10}, ?`, correct: s - 15, choices: shuffle(rng, [s - 15, ...distinctDistractors(s - 15, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_minus7', difficulty: 4, generate(rng) {
    const s = ri(rng, 50, 75);
    return { prompt: `${s}, ${s - 7}, ${s - 14}, ?`, correct: s - 21, choices: shuffle(rng, [s - 21, ...distinctDistractors(s - 21, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_alternating', difficulty: 4, generate(rng) {
    const s = ri(rng, 5, 15);
    // pattern: +5, −2, +5, −2 (net +3 every two steps)
    return { prompt: `${s}, ${s + 5}, ${s + 3}, ${s + 8}, ?\n(Add 5, then subtract 2, repeat.)`, correct: s + 6, choices: shuffle(rng, [s + 6, ...distinctDistractors(s + 6, 2)]), type: 'numeric' };
  } },
  { id: 'pattern_doubling', difficulty: 4, generate(rng) {
    // 2,4,8,16,32 — only this safe series within 2-digit ceiling
    return { prompt: `2, 4, 8, 16, ?`, correct: 32, choices: shuffle(rng, [32, 24, 18]), type: 'numeric' };
  } },

  // ─── More comparison (10) ──────────────────────────────────────────────────
  { id: 'compare_2digit_sums', difficulty: 4, generate(rng) {
    const a1 = ri(rng, 12, 32); const a2 = ri(rng, 8, 22);
    let b1 = ri(rng, 12, 32); let b2 = ri(rng, 8, 22);
    while (a1 + a2 === b1 + b2) b2 = ri(rng, 8, 22);
    const op = (a1 + a2) > (b1 + b2) ? '>' : '<';
    return { prompt: `${a1} + ${a2}    ?    ${b1} + ${b2}\nWhich symbol fits?`, correct: op, choices: ['>', '<', '='], type: 'choice' };
  } },
  { id: 'compare_2digit_diffs', difficulty: 4, generate(rng) {
    const a1 = ri(rng, 30, 60); const a2 = ri(rng, 8, 20);
    let b1 = ri(rng, 30, 60); let b2 = ri(rng, 8, 20);
    while (a1 - a2 === b1 - b2) b2 = ri(rng, 8, 20);
    const op = (a1 - a2) > (b1 - b2) ? '>' : '<';
    return { prompt: `${a1} − ${a2}    ?    ${b1} − ${b2}\nWhich symbol fits?`, correct: op, choices: ['>', '<', '='], type: 'choice' };
  } },
  { id: 'compare_three_numbers', difficulty: 3, generate(rng) {
    const a = ri(rng, 20, 50); const b = ri(rng, 20, 50); let c = ri(rng, 20, 50);
    while (c === a || c === b) c = ri(rng, 20, 50);
    const mid = [a, b, c].sort((x, y) => x - y)[1];
    return { prompt: `Which number is in the MIDDLE?\n${a}    ${b}    ${c}`, correct: String(mid), choices: shuffle(rng, [String(a), String(b), String(c)]), type: 'choice' };
  } },
  { id: 'compare_with_operation', difficulty: 4, generate(rng) {
    const x = ri(rng, 15, 30); const target = ri(rng, 35, 55);
    const ans = target - x; // need ? such that x + ? > target — answer is value > target - x
    const choices = [ans + 5, ans - 5, ans + 1];
    const correct = ans + 5; // bigger than required → satisfies >
    return { prompt: `Which number makes this true?\n${x} + ?  >  ${target}`, correct: String(correct), choices: shuffle(rng, choices.map(String)), type: 'choice' };
  } },
  { id: 'order_three_smallest', difficulty: 3, generate(rng) {
    const a = ri(rng, 20, 80); const b = ri(rng, 20, 80); let c = ri(rng, 20, 80);
    while (c === a || c === b) c = ri(rng, 20, 80);
    const min = Math.min(a, b, c);
    return { prompt: `Which is the SMALLEST?\n${a}    ${b}    ${c}`, correct: String(min), choices: shuffle(rng, [String(a), String(b), String(c)]), type: 'choice' };
  } },
  { id: 'order_three_biggest', difficulty: 3, generate(rng) {
    const a = ri(rng, 20, 80); const b = ri(rng, 20, 80); let c = ri(rng, 20, 80);
    while (c === a || c === b) c = ri(rng, 20, 80);
    const max = Math.max(a, b, c);
    return { prompt: `Which is the BIGGEST?\n${a}    ${b}    ${c}`, correct: String(max), choices: shuffle(rng, [String(a), String(b), String(c)]), type: 'choice' };
  } },
  { id: 'equal_sums', difficulty: 4, generate(rng) {
    const target = ri(rng, 18, 35);
    const a = ri(rng, 3, target - 3); const b = target - a;
    // Distractors that don't equal target
    const wrong1 = `${a + 1} + ${b - 2}`;
    const wrong2 = `${a + 3} + ${b - 1}`;
    return {
      prompt: `Which pair adds up to ${target}?`,
      correct: `${a} + ${b}`,
      choices: shuffle(rng, [`${a} + ${b}`, wrong1, wrong2]),
      type: 'choice',
    };
  } },
  { id: 'equal_diffs', difficulty: 4, generate(rng) {
    const target = ri(rng, 5, 22);
    const a = ri(rng, target + 3, target + 18); const b = a - target;
    const wrong1 = `${a + 2} − ${b}`;
    const wrong2 = `${a} − ${b + 2}`;
    return {
      prompt: `Which one equals ${target}?`,
      correct: `${a} − ${b}`,
      choices: shuffle(rng, [`${a} − ${b}`, wrong1, wrong2]),
      type: 'choice',
    };
  } },
  { id: 'compare_to_target_50', difficulty: 3, generate(rng) {
    const a = 45 + ri(rng, 0, 4) * 2; // 45..53
    const b = 60 + ri(rng, 0, 4); // 60..64
    const c = 30 + ri(rng, 0, 4); // 30..34
    // Closest to 50 is `a`
    return { prompt: `Which number is CLOSEST to 50?\n${a}    ${b}    ${c}`, correct: String(a), choices: shuffle(rng, [String(a), String(b), String(c)]), type: 'choice' };
  } },
  { id: 'pick_between', difficulty: 3, generate(rng) {
    const lo = ri(rng, 20, 40); const hi = lo + ri(rng, 8, 20);
    const inside = ri(rng, lo + 1, hi - 1);
    const below = ri(rng, lo - 8, lo - 1);
    const above = ri(rng, hi + 1, hi + 8);
    return { prompt: `Which number is between ${lo} and ${hi}?`, correct: String(inside), choices: shuffle(rng, [String(inside), String(below), String(above)]), type: 'choice' };
  } },

  // ─── More skip counting (8) ────────────────────────────────────────────────
  { id: 'skip4', difficulty: 3, generate(rng) {
    const s = ri(rng, 4, 16);
    return { prompt: `Counting by 4s: ${s}, ${s + 4}, ${s + 8}, ?`, correct: s + 12, choices: shuffle(rng, [s + 12, ...distinctDistractors(s + 12, 2)]), type: 'numeric' };
  } },
  { id: 'skip6', difficulty: 3, generate(rng) {
    const s = ri(rng, 6, 18);
    return { prompt: `Counting by 6s: ${s}, ${s + 6}, ${s + 12}, ?`, correct: s + 18, choices: shuffle(rng, [s + 18, ...distinctDistractors(s + 18, 2)]), type: 'numeric' };
  } },
  { id: 'skip7', difficulty: 4, generate(rng) {
    const s = ri(rng, 7, 14);
    return { prompt: `Counting by 7s: ${s}, ${s + 7}, ${s + 14}, ?`, correct: s + 21, choices: shuffle(rng, [s + 21, ...distinctDistractors(s + 21, 2)]), type: 'numeric' };
  } },
  { id: 'skip8', difficulty: 4, generate(rng) {
    const s = ri(rng, 8, 16);
    return { prompt: `Counting by 8s: ${s}, ${s + 8}, ${s + 16}, ?`, correct: s + 24, choices: shuffle(rng, [s + 24, ...distinctDistractors(s + 24, 2)]), type: 'numeric' };
  } },
  { id: 'skip9', difficulty: 4, generate(rng) {
    const s = ri(rng, 9, 18);
    return { prompt: `Counting by 9s: ${s}, ${s + 9}, ${s + 18}, ?`, correct: s + 27, choices: shuffle(rng, [s + 27, ...distinctDistractors(s + 27, 2)]), type: 'numeric' };
  } },
  { id: 'skip_back3', difficulty: 3, generate(rng) {
    const s = ri(rng, 30, 60);
    return { prompt: `Counting back by 3s: ${s}, ${s - 3}, ${s - 6}, ?`, correct: s - 9, choices: shuffle(rng, [s - 9, ...distinctDistractors(s - 9, 2)]), type: 'numeric' };
  } },
  { id: 'skip_back5', difficulty: 3, generate(rng) {
    const s = ri(rng, 40, 65);
    return { prompt: `Counting back by 5s: ${s}, ${s - 5}, ${s - 10}, ?`, correct: s - 15, choices: shuffle(rng, [s - 15, ...distinctDistractors(s - 15, 2)]), type: 'numeric' };
  } },
  { id: 'skip_back10', difficulty: 2, generate(rng) {
    const s = ri(rng, 6, 9) * 10;
    return { prompt: `Counting back by 10s: ${s}, ${s - 10}, ${s - 20}, ?`, correct: s - 30, choices: shuffle(rng, [s - 30, ...distinctDistractors(s - 30, 2)]), type: 'numeric' };
  } },

  // ─── More make-N (5) ───────────────────────────────────────────────────────
  { id: 'make30', difficulty: 3, generate(rng) {
    const a = ri(rng, 18, 27);
    const ans = 30 - a;
    return { prompt: `${a} + ? = 30`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'make40', difficulty: 3, generate(rng) {
    const a = ri(rng, 24, 37);
    const ans = 40 - a;
    return { prompt: `${a} + ? = 40`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'make50', difficulty: 3, generate(rng) {
    const a = ri(rng, 28, 47);
    const ans = 50 - a;
    return { prompt: `${a} + ? = 50`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'make60', difficulty: 4, generate(rng) {
    const a = ri(rng, 34, 58);
    const ans = 60 - a;
    return { prompt: `${a} + ? = 60`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'make75', difficulty: 4, generate(rng) {
    const a = ri(rng, 45, 70);
    const ans = 75 - a;
    return { prompt: `${a} + ? = 75`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },

  // ─── More time / units (5) ─────────────────────────────────────────────────
  { id: 'time_half_hour', difficulty: 2, generate(rng) {
    return { prompt: `Half an hour is how many minutes?`, correct: 30, choices: shuffle(rng, [30, 60, 15]), type: 'numeric' };
  } },
  { id: 'time_weekend_days', difficulty: 2, generate(rng) {
    return { prompt: `How many days are in a weekend?\n(Saturday and Sunday.)`, correct: 2, choices: shuffle(rng, [2, 5, 7]), type: 'numeric' };
  } },
  { id: 'time_full_year_months', difficulty: 3, generate(rng) {
    return { prompt: `How many months are in a year?`, correct: 12, choices: shuffle(rng, [12, 10, 14]), type: 'numeric' };
  } },
  { id: 'time_quarter_hour', difficulty: 3, generate(rng) {
    return { prompt: `A quarter of an hour is how many minutes?\n(A quarter means one of four equal parts.)`, correct: 15, choices: shuffle(rng, [15, 25, 30]), type: 'numeric' };
  } },
  { id: 'time_seconds_in_minute', difficulty: 2, generate(rng) {
    return { prompt: `How many seconds are in 1 minute?`, correct: 60, choices: shuffle(rng, [60, 30, 100]), type: 'numeric' };
  } },

  // ─── v7 plan extras (6) ────────────────────────────────────────────────────
  { id: 'add_three_2d', difficulty: 4, generate(rng) {
    const a = ri(rng, 15, 28); const b = ri(rng, 12, 22); const c = ri(rng, 8, 18);
    const ans = a + b + c;
    return { prompt: `${a} + ${b} + ${c} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'sub_chain', difficulty: 4, generate(rng) {
    const a = ri(rng, 40, 70); const b = ri(rng, 12, 22); const c = ri(rng, 5, 12);
    const ans = a - b - c;
    return { prompt: `${a} − ${b} − ${c} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'find_addend', difficulty: 4, generate(rng) {
    const b = ri(rng, 18, 38); const ans = ri(rng, 14, 28);
    const total = b + ans;
    return { prompt: `? + ${b} = ${total}`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'before_and_after', difficulty: 4, generate(rng) {
    const start = ri(rng, 30, 60); const gave = ri(rng, 8, 18); const got = ri(rng, 5, 14);
    const ans = start - gave + got;
    return { prompt: `Maya had ${start} stickers ✨.\nShe gave ${gave} to a friend\nthen got ${got} more.\nHow many now?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: 'compare_2digit_sums_v7', difficulty: 4, generate(rng) {
    const a1 = ri(rng, 18, 35); const a2 = ri(rng, 8, 18);
    let b1 = ri(rng, 18, 35); let b2 = ri(rng, 8, 18);
    while (a1 + a2 === b1 + b2) b2 = ri(rng, 8, 18);
    const op = (a1 + a2) > (b1 + b2) ? '>' : '<';
    return { prompt: `${a1} + ${a2}    ?    ${b1} + ${b2}`, correct: op, choices: ['>', '<', '='], type: 'choice' };
  } },
  { id: 'kr_three_items_change', difficulty: 4, generate(rng) {
    const [a, b, c] = pickN(rng, ITEMS, 3);
    const total = a.price + b.price + c.price;
    const ans = 50 - total;
    return { prompt: `Cart: ${a.name} ${a.emoji} + ${b.name} ${b.emoji} + ${c.name} ${c.emoji} (${total} kr).\nYou pay with 50 kr.\nChange?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 50])]), type: 'numeric' };
  } },
];

// ─────────────────────────────────────────────────────────────────────────────
// RNG (deterministic per seed for testing; defaults to Date.now())
// ─────────────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: pick N problems, distributed across difficulty buckets so a play
// always has variety. No two templates repeat in a single play.
// ─────────────────────────────────────────────────────────────────────────────
export function pickProblems(count, money, seed = Date.now()) {
  const rng = mulberry32(seed);
  const buckets = {
    medium: TEMPLATES.filter((t) => t.difficulty === 2),
    hard:   TEMPLATES.filter((t) => t.difficulty === 3),
    chall:  TEMPLATES.filter((t) => t.difficulty >= 4),
  };
  // 8 problems: 1 medium, 4 hard, 3 challenge (v7 — harder bias).
  const plan = ['medium', 'hard', 'hard', 'hard', 'hard', 'chall', 'chall', 'chall'].slice(0, count);
  while (plan.length < count) plan.push('hard');

  const used = new Set();
  const out = [];
  for (const tier of plan) {
    const pool = buckets[tier].filter((t) => !used.has(t.id));
    const fallback = TEMPLATES.filter((t) => !used.has(t.id));
    const arr = pool.length ? pool : fallback;
    const tmpl = arr[Math.floor(rng() * arr.length)];
    used.add(tmpl.id);
    out.push(tmpl.generate(rng, money));
  }
  return out;
}

export const TEMPLATE_COUNT = TEMPLATES.length;
