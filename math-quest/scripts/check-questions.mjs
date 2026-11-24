// Checks the Math Quest question bank (Level 1 and Level 2):
//  - ids unique, maths parses, answers whole numbers from 0 to 100
//  - every number in the maths appears in the story
//  - friends' names exist in the cast
//  - Level 2 never repeats the maths of any other question, even written
//    the other way round (4×6 and 6×4 count as the same)
//  - Level 2 stories that read too much like another story are flagged
//   npm run check:math
import { QUESTIONS } from '../src/questions.js';
import { QUESTIONS_L2 } from '../src/questions2.js';
import { solve, kindOf, levelOf } from '../src/mathsteps.js';
import { CHARACTERS } from '../../src/config.js';

const ids = new Set();
const problems = [];
const all = [];

// The same maths written any way round gets the same key.
function canonical(steps) {
  const key = [];
  steps.forEach((s, k) => {
    let a = s.aStep >= 0 ? `(${key[s.aStep]})` : String(s.a);
    let b = s.bStep >= 0 ? `(${key[s.bStep]})` : String(s.b);
    if ((s.op === '*' || s.op === '+') && a > b) [a, b] = [b, a];
    key[k] = `${a}${s.op}${b}`;
  });
  return key[key.length - 1];
}

const words = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const STOP = new Set('the a an of in on each and is are how many does do there with to he she they his her it for at that by more what from'.split(' '));
function grams(t) {
  const w = words(t).filter((x) => !STOP.has(x) && !/^\d+$/.test(x));
  const g = new Set();
  for (let i = 0; i < w.length - 1; i++) g.add(`${w[i]} ${w[i + 1]}`);
  return g;
}
function similarity(a, b) {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / Math.max(1, Math.min(a.size, b.size));
}

for (const [lv, bank] of [[1, QUESTIONS], [2, QUESTIONS_L2]]) {
  for (const [world, list] of Object.entries(bank)) {
    for (const q of list) {
      const where = `${q.id} (${world} L${lv})`;
      if (ids.has(q.id)) problems.push(`${where}: duplicate id`);
      ids.add(q.id);
      for (const k of ['id', 't', 'x', 'e', 'u']) if (!q[k]) problems.push(`${where}: missing ${k}`);
      let r;
      try { r = solve(q.x); } catch (e) { problems.push(`${where}: ${e.message}`); continue; }
      const { answer, steps } = r;
      if (!Number.isInteger(answer) || answer < 0 || answer > 100) problems.push(`${where}: answer ${answer} is not a whole number from 0 to 100`);
      for (const s of steps) {
        if (!Number.isInteger(s.r) || s.r < 0) problems.push(`${where}: step ${s.a}${s.op}${s.b}=${s.r} is not a whole number`);
        if (s.op === '*' && Math.min(s.a, s.b) > 10) problems.push(`${where}: ${s.a}×${s.b} is too big`);
      }
      const told = (q.t.match(/\d+/g) || []).map(Number);
      for (const n of q.x.match(/\d+/g).map(Number)) {
        if (!told.includes(n) && n > 2) problems.push(`${where}: ${n} is in the maths but not in the story`);
      }
      if (q.who && !CHARACTERS.some((c) => c.id === q.who)) problems.push(`${where}: unknown friend "${q.who}"`);
      if (q.quot && !steps.some((s) => s.op === '/')) problems.push(`${where}: quot is set but there is no division`);
      all.push({ q, lv, world, where, answer, steps, key: canonical(steps), grams: grams(q.t), kind: kindOf(steps), diff: levelOf(steps) });
    }
  }
}

// Level 2 must not repeat any maths.
const L2 = all.filter((x) => x.lv === 2);
for (const x of L2) {
  for (const y of all) {
    if (y === x || (y.lv === 2 && y.q.id < x.q.id)) continue;
    if (y.key === x.key) problems.push(`${x.where}: same maths as ${y.where} (${x.q.x} / ${y.q.x})`);
  }
}

// Level 2 stories must not read like another story.
const similar = [];
for (const x of L2) {
  for (const y of all) {
    if (y === x || (y.lv === 2 && y.q.id < x.q.id)) continue;
    const s = similarity(x.grams, y.grams);
    if (s >= 0.34) similar.push(`${x.q.id} ~ ${y.q.id} (${Math.round(s * 100)}%)`);
  }
}
if (similar.length) problems.push(`stories too alike: ${similar.join(', ')}`);

// No times-table fact should be leaned on too often inside Level 2.
const facts = {};
for (const x of L2) {
  for (const s of x.steps) {
    if (s.op !== '*' || s.aStep >= 0 || s.bStep >= 0) continue;
    const k = [s.a, s.b].sort((m, n) => m - n).join('×');
    (facts[k] = facts[k] || []).push(x.q.id);
  }
}
for (const [k, list] of Object.entries(facts)) if (list.length > 3) problems.push(`${k} is used ${list.length} times in Level 2: ${list.join(', ')}`);

for (const lv of [1, 2]) {
  const qs = all.filter((x) => x.lv === lv);
  const count = (f) => qs.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
  console.log(`Level ${lv}: ${qs.length} questions`, 'types:', count((x) => x.kind), 'difficulty:', count((x) => x.diff));
  for (const w of Object.keys(QUESTIONS)) {
    const n = qs.filter((x) => x.world === w).length;
    if (lv === 2 && n < 10) problems.push(`Level 2 ${w} has only ${n} questions`);
  }
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('All good ✔');
