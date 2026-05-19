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
    do { a = ri(rng, 15, 39); b = ri(rng, 15, 39); } while (((a % 10) + (b % 10)) < 10); // force carry
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?\n(carry the one!)`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_add_big', difficulty: 4, generate(rng) {
    const a = ri(rng, 30, 65);
    const b = ri(rng, 18, 35);
    const ans = a + b;
    return { prompt: `${a} + ${b} = ?`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 120])]), type: 'numeric' };
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
    do { a = ri(rng, 30, 60); b = ri(rng, 14, 28); } while ((a % 10) >= (b % 10)); // force borrow
    const ans = a - b;
    return { prompt: `${a} − ${b} = ?\n(you'll need to borrow!)`, correct: ans, choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]), type: 'numeric' };
  } },
  { id: '2d_sub_big', difficulty: 4, generate(rng) {
    const a = ri(rng, 50, 90);
    const b = ri(rng, 18, 38);
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
    const [a, b, c, d] = [ri(rng, 5, 12), ri(rng, 5, 12), ri(rng, 5, 12), ri(rng, 5, 12)];
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
    const b = ri(rng, 3, 9);
    const result = ri(rng, 3, 9);
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
  // 8 problems: 3 medium, 4 hard, 1 challenge (per plan)
  const plan = ['medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'chall'].slice(0, count);
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
