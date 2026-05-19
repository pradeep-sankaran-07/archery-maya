import { ITEMS } from '../config.js';

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

function distinctDistractors(correct, n, range = [1, 30]) {
  const set = new Set([correct]);
  const tries = [correct + 1, correct - 1, correct + 2, correct - 2, correct + 10, correct - 10, correct + 3, correct - 3];
  const out = [];
  for (const t of tries) {
    if (out.length >= n) break;
    if (!set.has(t) && t >= range[0] && t <= range[1]) {
      set.add(t); out.push(t);
    }
  }
  while (out.length < n) {
    const r = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    if (!set.has(r)) { set.add(r); out.push(r); }
  }
  return out;
}

const TEMPLATES = [
  // 1. Add 2 items (easy)
  {
    id: 'add2',
    difficulty: 1,
    generate(rng) {
      const [a, b] = pickN(rng, ITEMS, 2);
      const ans = a.price + b.price;
      return {
        prompt: `You buy a ${a.name} ${a.emoji} and a ${b.name} ${b.emoji}.\nHow much do they cost together?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 2. Add 3 items
  {
    id: 'add3',
    difficulty: 2,
    generate(rng) {
      const [a, b, c] = pickN(rng, ITEMS, 3);
      const ans = a.price + b.price + c.price;
      return {
        prompt: `You buy a ${a.name} ${a.emoji}, a ${b.name} ${b.emoji}, and a ${c.name} ${c.emoji}.\nWhat's the total?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 3. Subtract / change
  {
    id: 'change',
    difficulty: 2,
    generate(rng) {
      const item = pick(rng, ITEMS);
      const have = item.price + 2 + Math.floor(rng() * 12);
      const ans = have - item.price;
      return {
        prompt: `You have $${have}.\nYou buy a ${item.name} ${item.emoji} for $${item.price}.\nHow much is left?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 4. Repeated addition (multiplication)
  {
    id: 'repeated',
    difficulty: 3,
    generate(rng) {
      const item = pick(rng, ITEMS.filter((i) => i.price <= 4));
      const k = 2 + Math.floor(rng() * 3); // 2..4
      const ans = item.price * k;
      const sumStr = Array(k).fill(`$${item.price}`).join(' + ');
      return {
        prompt: `A ${item.name} ${item.emoji} costs $${item.price}.\nYou buy ${k} of them.\nThat's ${sumStr}. How much?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 5. Two-step (buy two, pay with $N, find change)
  {
    id: 'twostep',
    difficulty: 3,
    generate(rng) {
      const [a, b] = pickN(rng, ITEMS, 2);
      const total = a.price + b.price;
      const have = total + 1 + Math.floor(rng() * 8);
      const ans = have - total;
      return {
        prompt: `You buy a ${a.name} ${a.emoji} ($${a.price}) and a ${b.name} ${b.emoji} ($${b.price}).\nYou pay with $${have}.\nHow much change do you get?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 6. Can you afford it (uses live money)
  {
    id: 'afford',
    difficulty: 2,
    generate(rng, money) {
      const [a, b] = pickN(rng, ITEMS, 2);
      const total = a.price + b.price;
      const ans = (money ?? 10) >= total ? 'yes' : 'no';
      return {
        prompt: `You have $${money ?? 10}.\nYou want a ${a.name} ${a.emoji} ($${a.price}) and a ${b.name} ${b.emoji} ($${b.price}).\nCan you afford both?`,
        correct: ans,
        choices: ['yes', 'no'],
        type: 'yesno',
      };
    },
  },
  // 7. How many can I buy
  {
    id: 'howmany',
    difficulty: 3,
    generate(rng) {
      const item = pick(rng, ITEMS.filter((i) => i.price <= 4));
      const k = 2 + Math.floor(rng() * 4); // 2..5
      const have = item.price * k + Math.floor(rng() * item.price);
      const ans = Math.floor(have / item.price);
      return {
        prompt: `A ${item.name} ${item.emoji} costs $${item.price}.\nYou have $${have}.\nHow many can you buy?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 10])]),
        type: 'numeric',
      };
    },
  },
  // 8. Total then split
  {
    id: 'split',
    difficulty: 3,
    generate(rng) {
      let a, b, total;
      // ensure even total
      for (let i = 0; i < 20; i++) {
        [a, b] = pickN(rng, ITEMS, 2);
        total = a.price + b.price;
        if (total % 2 === 0) break;
      }
      if (total % 2 !== 0) total += 1; // safety
      const ans = total / 2;
      return {
        prompt: `You and your friend share a ${a.name} ${a.emoji} ($${a.price}) and a ${b.name} ${b.emoji} ($${b.price}).\nYou split the cost. How much does each of you pay?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 9. Compare prices (which costs more?)
  {
    id: 'compare',
    difficulty: 1,
    generate(rng) {
      let a, b;
      for (let i = 0; i < 10; i++) {
        [a, b] = pickN(rng, ITEMS, 2);
        if (a.price !== b.price) break;
      }
      if (a.price === b.price) b = { ...b, price: b.price + 1 };
      const ans = a.price > b.price ? a.name : b.name;
      return {
        prompt: `Which costs more?\n${a.name} ${a.emoji} ($${a.price}) or ${b.name} ${b.emoji} ($${b.price})?`,
        correct: ans,
        choices: shuffle(rng, [a.name, b.name]),
        type: 'choice',
      };
    },
  },
  // 10. Doubles
  {
    id: 'double',
    difficulty: 2,
    generate(rng) {
      const item = pick(rng, ITEMS);
      const ans = item.price * 2;
      return {
        prompt: `One ${item.name} ${item.emoji} costs $${item.price}.\nHow much do 2 ${item.name}s cost?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 11. Three of the same
  {
    id: 'triple',
    difficulty: 3,
    generate(rng) {
      const item = pick(rng, ITEMS.filter((i) => i.price <= 4));
      const ans = item.price * 3;
      return {
        prompt: `Three ${item.name}s ${item.emoji} cost $${item.price} + $${item.price} + $${item.price}.\nHow much in total?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 12. Pair + bonus
  {
    id: 'pairbonus',
    difficulty: 3,
    generate(rng) {
      const item = pick(rng, ITEMS);
      const k = 2 + Math.floor(rng() * 3);
      const bonus = pick(rng, ITEMS.filter((i) => i.id !== item.id));
      const ans = item.price * k + bonus.price;
      return {
        prompt: `${k} ${item.name}s ${item.emoji} at $${item.price} each, plus one ${bonus.name} ${bonus.emoji} ($${bonus.price}).\nWhat's the total?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 13. Missing addend
  {
    id: 'missing',
    difficulty: 3,
    generate(rng) {
      const a = 1 + Math.floor(rng() * 9);
      const ans = 1 + Math.floor(rng() * 9);
      const total = a + ans;
      return {
        prompt: `${a} + ? = ${total}\nWhat number is missing?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 14. Half of
  {
    id: 'half',
    difficulty: 2,
    generate(rng) {
      const v = (1 + Math.floor(rng() * 8)) * 2; // even number 2..16
      const ans = v / 2;
      return {
        prompt: `What is half of ${v}?\n(Half means split into 2 equal parts.)`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 15. Counting by 5s
  {
    id: 'fives',
    difficulty: 2,
    generate(rng) {
      const k = 3 + Math.floor(rng() * 4); // 3..6
      const ans = k * 5;
      return {
        prompt: `Count by 5s: ${Array(k).fill('5').join(' + ')}\nWhat do you get?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 16. 2-digit addition
  {
    id: 'twodigit',
    difficulty: 3,
    generate(rng) {
      const a = 10 + Math.floor(rng() * 30);
      const b = 5 + Math.floor(rng() * 20);
      const ans = a + b;
      return {
        prompt: `${a} + ${b} = ?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 17. 2-digit subtraction
  {
    id: 'twodigitsub',
    difficulty: 3,
    generate(rng) {
      const a = 15 + Math.floor(rng() * 25);
      const b = 3 + Math.floor(rng() * 10);
      const ans = a - b;
      return {
        prompt: `${a} - ${b} = ?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 18. Word: total fruits
  {
    id: 'fruitword',
    difficulty: 2,
    generate(rng) {
      const a = 2 + Math.floor(rng() * 5);
      const b = 2 + Math.floor(rng() * 5);
      const ans = a + b;
      return {
        prompt: `Maya has ${a} apples 🍎.\nLily gives her ${b} more.\nHow many apples does Maya have now?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 19. Word: how many left
  {
    id: 'leftword',
    difficulty: 2,
    generate(rng) {
      const a = 6 + Math.floor(rng() * 6);
      const b = 1 + Math.floor(rng() * (a - 1));
      const ans = a - b;
      return {
        prompt: `Tejas has ${a} cookies 🍪.\nHe eats ${b} of them.\nHow many cookies are left?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 20. Round trip — adds, then subtracts
  {
    id: 'roundtrip',
    difficulty: 3,
    generate(rng) {
      const a = 3 + Math.floor(rng() * 6);
      const b = 2 + Math.floor(rng() * 5);
      const c = 1 + Math.floor(rng() * 4);
      const ans = a + b - c;
      return {
        prompt: `You have $${a}.\nGrandma gives you $${b}.\nThen you spend $${c} on a snack.\nHow much is left?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 21. Equal sharing
  {
    id: 'sharing',
    difficulty: 3,
    generate(rng) {
      const k = pick(rng, [2, 3, 4]);
      const each = 1 + Math.floor(rng() * 4);
      const total = k * each;
      return {
        prompt: `${total} stickers ✨ are shared equally between ${k} friends.\nHow many does each friend get?`,
        correct: each,
        choices: shuffle(rng, [each, ...distinctDistractors(each, 2, [0, 10])]),
        type: 'numeric',
      };
    },
  },
  // 22. Coins — 10s and 1s
  {
    id: 'tensones',
    difficulty: 2,
    generate(rng) {
      const tens = 1 + Math.floor(rng() * 3);
      const ones = 1 + Math.floor(rng() * 9);
      const ans = tens * 10 + ones;
      return {
        prompt: `You have ${tens} ten-dollar bill${tens > 1 ? 's' : ''} and ${ones} one-dollar coin${ones > 1 ? 's' : ''}.\nHow much money do you have?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2, [0, 50])]),
        type: 'numeric',
      };
    },
  },
  // 23. Compare math expressions
  {
    id: 'comparesums',
    difficulty: 3,
    generate(rng) {
      const a1 = 2 + Math.floor(rng() * 6), a2 = 2 + Math.floor(rng() * 6);
      let b1 = 2 + Math.floor(rng() * 6), b2 = 2 + Math.floor(rng() * 6);
      while (a1 + a2 === b1 + b2) b2 = 2 + Math.floor(rng() * 6);
      const sumA = a1 + a2, sumB = b1 + b2;
      const ans = sumA > sumB ? `${a1} + ${a2}` : `${b1} + ${b2}`;
      return {
        prompt: `Which is bigger?\n${a1} + ${a2}    or    ${b1} + ${b2}`,
        correct: ans,
        choices: shuffle(rng, [`${a1} + ${a2}`, `${b1} + ${b2}`]),
        type: 'choice',
      };
    },
  },
  // 24. Skip count by 2
  {
    id: 'skip2',
    difficulty: 2,
    generate(rng) {
      const start = 2 * (1 + Math.floor(rng() * 4));
      const ans = start + 2;
      return {
        prompt: `Counting by 2s: ${start - 2}, ${start}, ?\nWhat number comes next?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 25. Money: enough for 2 of something?
  {
    id: 'enough',
    difficulty: 2,
    generate(rng, money) {
      const item = pick(rng, ITEMS);
      const needed = item.price * 2;
      const have = money ?? 10;
      const ans = have >= needed ? 'yes' : 'no';
      return {
        prompt: `You have $${have}.\nA ${item.name} ${item.emoji} costs $${item.price}.\nDo you have enough for 2 of them?`,
        correct: ans,
        choices: ['yes', 'no'],
        type: 'yesno',
      };
    },
  },
  // 26. Word: birds on tree
  {
    id: 'birds',
    difficulty: 2,
    generate(rng) {
      const a = 5 + Math.floor(rng() * 7);
      const b = 2 + Math.floor(rng() * 4);
      const ans = a - b;
      return {
        prompt: `${a} birds 🐦 are sitting on a tree.\n${b} of them fly away.\nHow many are still on the tree?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
  // 27. Three numbers, find max
  {
    id: 'biggest',
    difficulty: 1,
    generate(rng) {
      const nums = [];
      while (nums.length < 3) {
        const n = 5 + Math.floor(rng() * 30);
        if (!nums.includes(n)) nums.push(n);
      }
      const ans = Math.max(...nums);
      return {
        prompt: `Which number is the biggest?\n${nums.join('   ')}`,
        correct: String(ans),
        choices: shuffle(rng, nums.map((n) => String(n))),
        type: 'choice',
      };
    },
  },
  // 28. Three numbers, find min
  {
    id: 'smallest',
    difficulty: 1,
    generate(rng) {
      const nums = [];
      while (nums.length < 3) {
        const n = 5 + Math.floor(rng() * 30);
        if (!nums.includes(n)) nums.push(n);
      }
      const ans = Math.min(...nums);
      return {
        prompt: `Which number is the smallest?\n${nums.join('   ')}`,
        correct: String(ans),
        choices: shuffle(rng, nums.map((n) => String(n))),
        type: 'choice',
      };
    },
  },
  // 29. Even or odd
  {
    id: 'evenodd',
    difficulty: 2,
    generate(rng) {
      const n = 2 + Math.floor(rng() * 18);
      const ans = n % 2 === 0 ? 'even' : 'odd';
      return {
        prompt: `Is ${n} even or odd?`,
        correct: ans,
        choices: ['even', 'odd'],
        type: 'choice',
      };
    },
  },
  // 30. Big sum (challenge)
  {
    id: 'bigsum',
    difficulty: 4,
    generate(rng) {
      const [a, b, c, d] = [
        2 + Math.floor(rng() * 5),
        2 + Math.floor(rng() * 5),
        2 + Math.floor(rng() * 5),
        2 + Math.floor(rng() * 5),
      ];
      const ans = a + b + c + d;
      return {
        prompt: `${a} + ${b} + ${c} + ${d} = ?`,
        correct: ans,
        choices: shuffle(rng, [ans, ...distinctDistractors(ans, 2)]),
        type: 'numeric',
      };
    },
  },
];

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

export function pickProblems(count, money, seed = Date.now()) {
  const rng = mulberry32(seed);
  // pick `count` distinct templates, weighted toward variety across difficulty
  const buckets = {
    easy: TEMPLATES.filter((t) => t.difficulty === 1),
    med: TEMPLATES.filter((t) => t.difficulty === 2),
    hard: TEMPLATES.filter((t) => t.difficulty >= 3),
  };
  const plan = ['easy', 'med', 'med', 'hard', 'hard', 'med'].slice(0, count);
  while (plan.length < count) plan.push('med');
  const usedIds = new Set();
  const result = [];
  for (const tier of plan) {
    const pool = buckets[tier].filter((t) => !usedIds.has(t.id));
    const fallback = TEMPLATES.filter((t) => !usedIds.has(t.id));
    const arr = pool.length ? pool : fallback;
    const tmpl = arr[Math.floor(rng() * arr.length)];
    usedIds.add(tmpl.id);
    result.push(tmpl.generate(rng, money));
  }
  return result;
}

export const TEMPLATE_COUNT = TEMPLATES.length;
