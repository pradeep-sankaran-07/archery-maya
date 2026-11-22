// Checks the Math Quest question bank: ids unique, maths parses, answers are
// whole numbers in a 3rd-grade range, the numbers in the maths appear in the
// story, and friends' names exist in the cast.
//   npm run check:math
import { QUESTIONS } from '../src/questions.js';
import { solve, kindOf, levelOf } from '../src/mathsteps.js';
import { CHARACTERS } from '../../src/config.js';

const ids = new Set();
const problems = [];
const kinds = {}, levels = {};
let total = 0;

for (const [world, list] of Object.entries(QUESTIONS)) {
  for (const q of list) {
    total++;
    const where = `${q.id} (${world})`;
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
    const nums = q.x.match(/\d+/g).map(Number);
    const told = (q.t.match(/\d+/g) || []).map(Number);
    for (const n of nums) {
      // "each", "both" and "a week" style numbers may be implied (2 people, 1 trunk)
      if (!told.includes(n) && n > 2) problems.push(`${where}: ${n} is in the maths but not in the story`);
    }
    if (q.who && !CHARACTERS.some((c) => c.id === q.who)) problems.push(`${where}: unknown friend "${q.who}"`);
    const k = kindOf(steps); kinds[k] = (kinds[k] || 0) + 1;
    const l = levelOf(steps); levels[l] = (levels[l] || 0) + 1;
  }
}

console.log(`${total} questions in ${Object.keys(QUESTIONS).length} worlds`);
console.log('by type:', kinds);
console.log('by level:', levels);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('All good ✔');
