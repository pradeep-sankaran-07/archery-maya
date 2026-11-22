// Tiny arithmetic evaluator that also records each step, so the game can
// build hints ("Step 1: 3 × 4") and worked solutions from a question's
// expression. Supports whole numbers, + - * / and parentheses.

export const SYMBOL = { '*': '×', '/': '÷', '+': '+', '-': '−' };

export function solve(expr) {
  const tokens = String(expr).replace(/\s+/g, '').match(/\d+|[-+*/()]/g) || [];
  let i = 0;
  const steps = [];

  function primary() {
    const t = tokens[i++];
    if (t === '(') {
      const v = sum();
      i++; // ')'
      return v;
    }
    if (!/^\d+$/.test(t || '')) throw new Error(`Bad expression: ${expr}`);
    return { v: Number(t), step: -1 };
  }
  function product() {
    let a = primary();
    while (tokens[i] === '*' || tokens[i] === '/') {
      const op = tokens[i++];
      const b = primary();
      const r = op === '*' ? a.v * b.v : a.v / b.v;
      steps.push({ a: a.v, b: b.v, op, r, aStep: a.step, bStep: b.step });
      a = { v: r, step: steps.length - 1 };
    }
    return a;
  }
  function sum() {
    let a = product();
    while (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i++];
      const b = product();
      const r = op === '+' ? a.v + b.v : a.v - b.v;
      steps.push({ a: a.v, b: b.v, op, r, aStep: a.step, bStep: b.step });
      a = { v: r, step: steps.length - 1 };
    }
    return a;
  }

  const out = sum();
  if (i !== tokens.length) throw new Error(`Bad expression: ${expr}`);
  return { answer: out.v, steps };
}

/** What kind of problem is this? Used for badges and the grown-ups page. */
export function kindOf(steps) {
  if (steps.length >= 2) return 'twostep';
  const op = steps[0]?.op;
  if (op === '*') return 'times';
  if (op === '/') return 'share';
  return 'plusminus';
}

/** 1 = easy facts, 2 = bigger facts / one step, 3 = two steps. */
export function levelOf(steps) {
  if (steps.length >= 2) return 3;
  const s = steps[0];
  if (!s) return 1;
  if (s.op === '*') {
    const small = (n) => n <= 5 || n === 10;
    return small(s.a) && small(s.b) ? 1 : 2;
  }
  return 2;
}
