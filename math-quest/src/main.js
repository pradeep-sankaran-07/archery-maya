import './style.css';
import { CHARACTERS } from '../../src/config.js';
import { QUESTIONS } from './questions.js';
import { THEMES, themeById, sceneSVG } from './themes.js';
import { solve, kindOf, levelOf, SYMBOL } from './mathsteps.js';
import { ALL_STICKERS, STICKERS, pickSticker, stickerById, BADGES, rankFor } from './rewards.js';
import { SFX, say, unlockAudio, stopTalking } from './audio.js';
import { profile, persist, settings, setSetting, currentPlayerId, setPlayer, markToday, resetPlayer } from './save.js';
import { avatarSVG, charById } from './avatar.js';
import { confetti } from './confetti.js';

// ── the question bank, with answers and steps worked out ──────────
const BANK = [];
for (const [world, list] of Object.entries(QUESTIONS)) {
  for (const q of list) {
    const { answer, steps } = solve(q.x);
    BANK.push({ ...q, world, answer, steps, kind: kindOf(steps), level: levelOf(steps) });
  }
}
const byWorld = (w) => BANK.filter((q) => q.world === w);
const ROUND = 5;
const FAST_SECONDS = 20;

// ── tiny DOM helpers ──────────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const screenEl = $('#screen');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let keyHandler = null;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#modal').classList.contains('open')) { closeModal(); return; }
  if (keyHandler) keyHandler(e);
});
// First tap anywhere wakes up sound and speech (browsers need a tap first).
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockAudio, { passive: true }));

function show(html, { scene = 'friends', theme = null, cls = '' } = {}) {
  stopTalking();
  closeModal(true);
  keyHandler = null;
  setScene(scene);
  const t = theme ? themeById(theme) : null;
  document.body.style.setProperty('--theme', t ? t.color : '#ff6fa8');
  document.body.style.setProperty('--theme-dark', t ? t.dark : '#7a1d4a');
  screenEl.className = `screen ${cls}`;
  screenEl.innerHTML = html;
  screenEl.scrollTop = 0;
}

let currentScene = null;
function setScene(id) {
  if (id === currentScene) return;
  currentScene = id;
  const bg = $('#bg');
  const layer = document.createElement('div');
  layer.className = 'scene';
  layer.innerHTML = sceneSVG(id);
  bg.appendChild(layer);
  requestAnimationFrame(() => layer.classList.add('in'));
  const old = $$('.scene', bg).filter((l) => l !== layer);
  setTimeout(() => old.forEach((l) => l.remove()), 700);
}

function on(sel, ev, fn, root = screenEl) {
  $$(sel, root).forEach((el) => el.addEventListener(ev, fn));
}
function tapSound() { SFX.tap(); }

function topbar({ back = null, title = '' } = {}) {
  const p = profile();
  const s = settings();
  return `<header class="topbar">
    ${back ? `<button class="icon-btn" data-back aria-label="Back">◀</button>` : '<span class="icon-spacer"></span>'}
    <div class="topbar-title">${title}</div>
    <div class="pill star-pill" id="starCount">⭐ ${p.stars}</div>
    <button class="icon-btn" data-sound aria-label="Sound">${s.sound ? '🔊' : '🔈'}</button>
    <button class="icon-btn" data-voice aria-label="Voice">${s.voice ? '🗣️' : '🤐'}</button>
  </header>`;
}
function bindTopbar(back) {
  on('[data-back]', 'click', () => { tapSound(); back(); });
  on('[data-sound]', 'click', (e) => {
    setSetting('sound', !settings().sound);
    e.currentTarget.textContent = settings().sound ? '🔊' : '🔈';
    SFX.tap();
  });
  on('[data-voice]', 'click', (e) => {
    setSetting('voice', !settings().voice);
    e.currentTarget.textContent = settings().voice ? '🗣️' : '🤐';
    if (settings().voice) say('Hello!');
  });
}

// ── badges ────────────────────────────────────────────────────────
function worldDone(p, world) {
  return byWorld(world).every((q) => p.best[q.id] >= 1);
}
function checkBadges() {
  const p = profile();
  const ctx = { worldDone: (w) => worldDone(p, w), stickerCount: ALL_STICKERS.length };
  const won = [];
  for (const b of BADGES) {
    if (!p.badges[b.id] && b.test(p, ctx)) {
      p.badges[b.id] = Date.now();
      won.push(b);
    }
  }
  if (won.length) persist();
  return won;
}

let toastQueue = Promise.resolve();
function badgeToast(b) {
  toastQueue = toastQueue.then(async () => {
    const el = document.createElement('div');
    el.className = 'toast badge-toast';
    el.innerHTML = `<div class="toast-emoji">${b.emoji}</div><div><div class="toast-kicker">New badge!</div><div class="toast-name">${esc(b.name)}</div></div>`;
    $('#toasts').appendChild(el);
    SFX.badge();
    await wait(30);
    el.classList.add('in');
    await wait(2600);
    el.classList.remove('in');
    await wait(400);
    el.remove();
  });
}

// ── modal ─────────────────────────────────────────────────────────
let modalClose = null;
function openModal(html, { onClose = null, cls = '' } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-card ${cls}">${html}</div>`;
  m.classList.add('open');
  modalClose = onClose;
  return m;
}
function closeModal(silent = false) {
  const m = $('#modal');
  if (!m.classList.contains('open')) return;
  m.classList.remove('open');
  m.innerHTML = '';
  const fn = modalClose;
  modalClose = null;
  if (fn && !silent) fn();
}

// ══════════════════════════════════════════════════════════════════
// Title
// ══════════════════════════════════════════════════════════════════
function titleScreen() {
  const p = profile();
  const c = charById(currentPlayerId());
  const r = rankFor(p.stars);
  const pct = r.next ? Math.round(((p.stars - r.min) / (r.next.at - r.min)) * 100) : 100;
  const badges = Object.keys(p.badges).length;
  const stickers = Object.keys(p.stickers).length;
  show(`
    ${topbar()}
    <div class="title-wrap">
      <div class="logo">
        <div class="logo-icons"><span>🦁</span><span>🎪</span><span>🪔</span><span>🎸</span><span>🦆</span></div>
        <h1>Math Quest</h1>
        <div class="logo-sub">Story math with your favourite movies and friends</div>
      </div>
      <button class="player-chip" data-players>
        <span class="chip-avatar">${avatarSVG(c.id)}</span>
        <span class="chip-text"><span class="chip-name">${esc(c.name)}</span><span class="chip-change">Change player</span></span>
      </button>
      <div class="rank-card">
        <div class="rank-row"><span class="rank-emoji">${r.emoji}</span><span class="rank-name">${r.name}</span></div>
        <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="rank-next">${r.next ? `${r.next.at - p.stars} more ⭐ to become <b>${r.next.name} ${r.next.emoji}</b>` : 'The highest rank! 👑'}</div>
      </div>
      <button class="big-btn play-btn" data-play>▶ PLAY</button>
      <div class="menu-row">
        <button class="menu-btn" data-stickers><span>📒</span>Stickers<small>${stickers}/${ALL_STICKERS.length}</small></button>
        <button class="menu-btn" data-badges><span>🏅</span>Badges<small>${badges}/${BADGES.length}</small></button>
        <button class="menu-btn" data-grownups><span>👪</span>Grown-ups<small>progress</small></button>
      </div>
    </div>
  `, { scene: 'friends', cls: 'title' });
  bindTopbar();
  on('[data-play]', 'click', () => { SFX.whoosh(); worldsScreen(); });
  on('[data-players]', 'click', () => { tapSound(); playersScreen(); });
  on('[data-stickers]', 'click', () => { tapSound(); stickersScreen(); });
  on('[data-badges]', 'click', () => { tapSound(); badgesScreen(); });
  on('[data-grownups]', 'click', () => { tapSound(); grownupsScreen(); });
  keyHandler = (e) => { if (e.key === 'Enter') { SFX.whoosh(); worldsScreen(); } };
}

// ══════════════════════════════════════════════════════════════════
// Players
// ══════════════════════════════════════════════════════════════════
function playersScreen() {
  const groups = ['Kids', 'Grown-ups', 'Pets'];
  const cur = currentPlayerId();
  show(`
    ${topbar({ back: true, title: 'Who is playing?' })}
    <div class="scroll">
      ${groups.map((g) => `
        <h2 class="group-h">${g}</h2>
        <div class="player-grid">
          ${CHARACTERS.filter((c) => c.group === g).map((c) => `
            <button class="player-card ${c.id === cur ? 'sel' : ''}" data-id="${c.id}">
              ${avatarSVG(c.id)}<span>${esc(c.name)}</span>
            </button>`).join('')}
        </div>`).join('')}
    </div>
  `, { scene: 'friends', cls: 'players' });
  bindTopbar(titleScreen);
  on('.player-card', 'click', (e) => {
    const id = e.currentTarget.dataset.id;
    setPlayer(id);
    SFX.pop();
    say(`Hi ${charById(id).name}! Let's do some math!`);
    titleScreen();
  });
}

// ══════════════════════════════════════════════════════════════════
// World map
// ══════════════════════════════════════════════════════════════════
function worldsScreen() {
  const p = profile();
  const card = (t) => {
    const qs = byWorld(t.id);
    const solved = qs.filter((q) => p.best[q.id] >= 1).length;
    const stars = qs.reduce((s, q) => s + (p.best[q.id] || 0), 0);
    const done = solved === qs.length;
    return `<button class="world-card" data-world="${t.id}" style="--c:${t.color};--d:${t.dark}">
      <div class="world-scene">${sceneSVG(t.id)}</div>
      <div class="world-info">
        <div class="world-name"><span class="world-icon">${t.icon}</span>${esc(t.name)}</div>
        <div class="bar small"><div class="bar-fill" style="width:${Math.round((solved / qs.length) * 100)}%"></div></div>
        <div class="world-meta"><span>${done ? '✅ All solved!' : `${solved}/${qs.length} solved`}</span><span>⭐ ${stars}/${qs.length * 3}</span></div>
      </div>
    </button>`;
  };
  show(`
    ${topbar({ back: true, title: 'Pick a world!' })}
    <div class="scroll">
      <div class="world-grid">
        ${THEMES.map(card).join('')}
        <button class="world-card mix" data-world="mix" style="--c:#ffb02e;--d:#8a4a00">
          <div class="world-scene mix-scene"><div class="mix-icons">🦁🎪🪔<br>🦆🎸💖</div></div>
          <div class="world-info">
            <div class="world-name"><span class="world-icon">🎲</span>Surprise Mix</div>
            <div class="world-meta"><span>Questions from every world</span></div>
          </div>
        </button>
      </div>
    </div>
  `, { scene: 'friends', cls: 'worlds' });
  bindTopbar(titleScreen);
  on('.world-card', 'click', (e) => startRound(e.currentTarget.dataset.world));
}

// ══════════════════════════════════════════════════════════════════
// A round of 5 questions
// ══════════════════════════════════════════════════════════════════
let round = null;

function pickRound(world) {
  const p = profile();
  const pool = world === 'mix' ? BANK : byWorld(world);
  const score = (q) => {
    const best = p.best[q.id] || 0;
    const base = best === 0 ? 0 : best < 3 ? 1 : 2;
    return base + Math.random() * 0.9;
  };
  const chosen = [...pool].sort((a, b) => score(a) - score(b)).slice(0, ROUND);
  // easy first, so every round warms up and then climbs
  return chosen.sort((a, b) => a.level - b.level || Math.random() - 0.5);
}

function startRound(world) {
  const p = profile();
  markToday(p);
  persist();
  round = { world, qs: pickRound(world), i: 0, results: [], starsWon: 0 };
  if (world !== 'mix') SFX.jingle(world); else SFX.fanfare();
  showQuestion();
}

function showQuestion() {
  const q = round.qs[round.i];
  const t = themeById(q.world);
  const p = profile();
  round.tries = 0;
  round.entry = '';
  round.started = performance.now();
  round.locked = false;
  const mascot = q.who
    ? `<div class="mascot avatar-mascot">${avatarSVG(q.who)}<span>${esc(charById(q.who).name)}</span></div>`
    : `<div class="mascot emoji-mascot">${q.m || q.e}</div>`;
  const dots = round.qs.map((_, k) => {
    const r = round.results[k];
    const cls = k === round.i ? 'now' : r ? `done s${r}` : '';
    return `<span class="dot ${cls}">${r ? '⭐' : k + 1}</span>`;
  }).join('');
  show(`
    <header class="topbar play-top">
      <button class="icon-btn" data-quit aria-label="Stop">🏠</button>
      <div class="dots">${dots}</div>
      <div class="pill streak-pill ${p.stats.streak >= 3 ? 'hot' : ''}" id="streak">🔥 ${p.stats.streak}</div>
      <div class="pill star-pill" id="starCount">⭐ ${p.stars}</div>
    </header>
    <div class="play-main">
      <section class="qcard">
        <div class="qhead" style="background:${t.color}"><span>${t.icon} ${esc(t.name)}</span><span class="qplace">${esc(t.place)}</span></div>
        <div class="qbody">
          ${mascot}
          <p class="qtext">${esc(q.t)}</p>
        </div>
        <div class="qtools">
          <button class="tool-btn" data-read>🔊 Read to me</button>
          <button class="tool-btn hint-btn" data-hint>💡 Hint</button>
        </div>
      </section>
      <section class="apanel">
        <div class="answer-row">
          <div class="abox" id="abox"><span class="placeholder">?</span></div>
          <div class="unit">${esc(q.u)}</div>
        </div>
        <div class="feedback" id="feedback"></div>
        <div class="keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-key="${n}">${n}</button>`).join('')}
          <button class="key key-erase" data-erase aria-label="Erase">⌫</button>
          <button class="key" data-key="0">0</button>
          <button class="key key-go" data-go aria-label="Check">✔</button>
        </div>
      </section>
    </div>
  `, { scene: q.world, theme: q.world, cls: 'play' });

  on('[data-quit]', 'click', () => {
    tapSound();
    openModal(`<div class="modal-emoji">🏠</div><h2>Stop this round?</h2><p>Your stars so far are saved.</p>
      <div class="modal-actions"><button class="big-btn alt" data-m-stay>Keep playing</button><button class="big-btn" data-m-quit>Stop</button></div>`);
    on('[data-m-stay]', 'click', () => closeModal(), $('#modal'));
    on('[data-m-quit]', 'click', () => { closeModal(true); worldsScreen(); }, $('#modal'));
  });
  on('[data-read]', 'click', () => say(q.t, { force: true, rate: 0.92, pitch: 1.05 }));
  on('[data-hint]', 'click', () => { tapSound(); profile().stats.hints++; showHint(q); });
  on('[data-key]', 'click', (e) => typeDigit(e.currentTarget.dataset.key));
  on('[data-erase]', 'click', erase);
  on('[data-go]', 'click', checkAnswer);
  keyHandler = (e) => {
    if ($('#modal').classList.contains('open')) {
      if (e.key === 'Enter') { e.preventDefault(); const b = $('#modal [data-m-next], #modal [data-m-ok]'); if (b) b.click(); }
      return;
    }
    if (/^[0-9]$/.test(e.key)) typeDigit(e.key);
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
  };
}

function renderEntry() {
  $('#abox').innerHTML = round.entry ? esc(round.entry) : '<span class="placeholder">?</span>';
}
function typeDigit(d) {
  if (round.locked) return;
  if (round.entry.length >= 3) return;
  if (round.entry === '0') round.entry = '';
  round.entry += d;
  SFX.key();
  $('#feedback').textContent = '';
  renderEntry();
}
function erase() {
  if (round.locked) return;
  round.entry = round.entry.slice(0, -1);
  SFX.erase();
  renderEntry();
}

const GENERIC_PRAISE = ['Great job!', 'Awesome!', 'Fantastic!', 'You did it!', 'Brilliant!', 'Super smart!', 'Wow, well done!', 'Amazing!'];
const COMEBACK_PRAISE = ['You figured it out! Great job!', 'Never give up! You did it!', 'Yes! You worked it out!', 'Brilliant thinking!'];
const OOPS = ['Ooh, so close! Let\'s look at a hint.', 'Hmm, not quite. A hint will help!', 'Good try! Here\'s a little hint.'];

function checkAnswer() {
  if (round.locked) return;
  const box = $('#abox');
  if (!round.entry) {
    box.classList.remove('nudge'); void box.offsetWidth; box.classList.add('nudge');
    $('#feedback').textContent = 'Type your answer with the number buttons 👇';
    return;
  }
  const q = round.qs[round.i];
  const p = profile();
  const val = Number(round.entry);
  const h = (p.history[q.id] = p.history[q.id] || { tries: 0, wrong: 0 });
  if (val === q.answer) {
    round.locked = true;
    const stars = round.tries === 0 ? 3 : round.tries === 1 ? 2 : 1;
    const secs = (performance.now() - round.started) / 1000;
    h.tries++;
    p.stats.answered++;
    p.stats.correct++;
    p.stats.kinds[q.kind]++;
    if (round.tries === 0) { p.stats.firstTry++; if (secs < FAST_SECONDS) p.stats.fast++; } else p.stats.comebacks++;
    p.stats.streak++;
    p.stats.bestStreak = Math.max(p.stats.bestStreak, p.stats.streak);
    const prev = p.best[q.id] || 0;
    if (stars > prev) { p.stars += stars - prev; p.best[q.id] = stars; }
    round.starsWon += stars;
    round.results[round.i] = stars;
    persist();
    celebrate(q, stars, prev);
    checkBadges().forEach(badgeToast);
  } else {
    round.tries++;
    h.wrong++;
    p.stats.streak = 0;
    persist();
    $('#streak').textContent = '🔥 0';
    $('#streak').classList.remove('hot');
    SFX.oops();
    box.classList.remove('wobble'); void box.offsetWidth; box.classList.add('wobble');
    round.entry = '';
    setTimeout(renderEntry, 350);
    if (round.tries === 1) {
      $('#feedback').textContent = 'So close! Here is a hint 💡';
      say(pick(OOPS));
      setTimeout(() => showHint(q), 650);
    } else if (round.tries === 2) {
      $('#feedback').textContent = 'Let\'s solve it together!';
      say('Let\'s solve it together!');
      setTimeout(() => showSolution(q), 650);
    } else {
      $('#feedback').innerHTML = `Type <b>${q.answer}</b> and press ✔`;
      setTimeout(() => showSolution(q), 400);
    }
  }
}

function celebrate(q, stars, prevBest) {
  const p = profile();
  const t = themeById(q.world);
  const name = charById(currentPlayerId()).name;
  const praise = round.tries > 0 ? pick(COMEBACK_PRAISE) : Math.random() < 0.5 ? pick(t.praise) : pick(GENERIC_PRAISE);
  const spoken = Math.random() < 0.3 && round.tries === 0 ? `${praise.replace(/!$/, '')}, ${name}!` : praise;
  SFX.correct();
  setTimeout(() => say(spoken), 250);
  confetti(round.tries === 0 ? 140 : 80);
  const box = $('#abox');
  box.classList.add('right');
  $('#feedback').textContent = '';
  const streak = p.stats.streak;
  if (streak === 3 || streak === 5 || streak === 10 || (streak > 10 && streak % 5 === 0)) setTimeout(() => SFX.streak(), 500);
  $('#streak').textContent = `🔥 ${streak}`;
  $('#streak').classList.toggle('hot', streak >= 3);
  const last = round.i === round.qs.length - 1;
  const gained = Math.max(0, stars - prevBest);
  openModal(`
    <div class="cheer-emoji">${round.tries === 0 ? pick(['🎉', '🌟', '🥳', '🏆', '💥']) : '💪'}</div>
    <h2 class="cheer">${esc(praise)}</h2>
    <div class="cheer-answer">${q.answer} ${esc(q.u)}</div>
    <div class="cheer-stars">${[0, 1, 2].map((k) => `<span class="cstar ${k < stars ? 'on' : ''}" style="animation-delay:${0.15 + k * 0.2}s">⭐</span>`).join('')}</div>
    ${streak >= 3 ? `<div class="cheer-streak">🔥 ${streak} in a row!</div>` : ''}
    <button class="big-btn" data-m-next>${last ? 'Finish round 🎁' : 'Next ▶'}</button>
  `, { cls: 'cheer-card', onClose: nextQuestion });
  for (let k = 0; k < stars; k++) setTimeout(() => SFX.star(k), 200 + k * 200);
  if (gained) setTimeout(() => { const s = $('#starCount'); if (s) { s.textContent = `⭐ ${p.stars}`; s.classList.add('bump'); } }, 800);
  on('[data-m-next]', 'click', () => closeModal(), $('#modal'));
}

function nextQuestion() {
  round.i++;
  if (round.i >= round.qs.length) roundEnd();
  else showQuestion();
}

// ── hints and worked solutions ────────────────────────────────────
function operand(q, s, which, reveal) {
  const v = which === 'a' ? s.a : s.b;
  const ref = which === 'a' ? s.aStep : s.bStep;
  if (ref < 0 || reveal) return `<b>${v}</b>`;
  return `<span class="ref">answer from step ${ref + 1}</span>`;
}
function stepLine(q, s, k, reveal) {
  const A = operand(q, s, 'a', reveal), B = operand(q, s, 'b', reveal);
  const both = s.aStep < 0 && s.bStep < 0;
  const words = s.op === '*' ? `${s.a} groups of ${s.b}` : `share ${s.a} into ${s.b} equal groups`;
  const res = reveal ? `<b class="res">${s.r}</b>` : '<b class="res q">?</b>';
  const extra = !reveal && (s.op === '*' || s.op === '/') && both ? `<span class="say">(${words})</span>` : '';
  return `<div class="step"><span class="step-n">Step ${k + 1}</span><span class="step-math">${A} ${SYMBOL[s.op]} ${B} = ${res}</span>${extra}</div>`;
}

function groupsVisual(groups, size, emoji, { fill = true } = {}) {
  const many = groups * size > 60 || size > 12;
  const one = (k) => many
    ? `<div class="grp big"><span class="grp-e">${emoji}</span><span class="grp-n">${fill ? size : '?'}</span></div>`
    : `<div class="grp">${fill ? Array.from({ length: size }, () => `<span>${emoji}</span>`).join('') : '<span class="grp-q">?</span>'}</div>`;
  return `<div class="groups">${Array.from({ length: groups }, (_, k) => one(k)).join('')}</div>`;
}

function blocksVisual(n) {
  const tens = Math.floor(n / 10), ones = n % 10;
  return `<div class="blocks">${Array.from({ length: tens }, () => '<span class="ten"></span>').join('')}${Array.from({ length: ones }, () => '<span class="one"></span>').join('')}</div>`;
}

function visualFor(q, reveal) {
  const mult = [...q.steps].reverse().find((s) => s.op === '*');
  const div = q.steps.find((s) => s.op === '/');
  if (mult) {
    return `<div class="vis-cap">${mult.a} groups of ${mult.b}</div>${groupsVisual(mult.a, mult.b, q.e)}`;
  }
  if (div) {
    return `<div class="vis-cap">${div.a} ${esc(q.u)} shared into ${div.b} equal groups</div>
      ${groupsVisual(div.b, div.r, q.e, { fill: reveal })}
      ${reveal ? '' : `<div class="vis-tip">Think: ${div.b} × <b>?</b> = ${div.a}</div>`}`;
  }
  const s = q.steps[0];
  const tens = Math.floor(s.b / 10) * 10, ones = s.b % 10;
  const tip = s.op === '-'
    ? (tens && ones ? `Take away ${tens} first, then take away ${ones} more.` : `Count back ${s.b} from ${s.a}.`)
    : (tens && ones ? `Add ${tens} first, then add ${ones} more.` : `Count on ${s.b} from ${s.a}.`);
  return `<div class="vis-cap">Start with ${s.a}</div>${blocksVisual(s.a)}<div class="vis-tip">${tip}</div>`;
}

function showHint(q) {
  const steps = q.steps.length > 1
    ? q.steps.map((s, k) => stepLine(q, s, k, false)).join('')
    : stepLine(q, q.steps[0], 0, false).replace('Step 1', 'Try');
  openModal(`
    <h2>💡 Hint</h2>
    <div class="visual">${visualFor(q, false)}</div>
    <div class="steps">${steps}</div>
    <button class="big-btn" data-m-ok>Got it! 👍</button>
  `, { cls: 'hint-card' });
  on('[data-m-ok]', 'click', () => closeModal(), $('#modal'));
}

function skipCount(s) {
  if (s.op !== '*' || s.a > 12 || s.b > 12 || s.a < 2) return '';
  return `<div class="skip">Count by ${s.b}s: ${Array.from({ length: s.a }, (_, k) => (k + 1) * s.b).join(', ')}</div>`;
}

function showSolution(q) {
  const steps = q.steps.map((s, k) => stepLine(q, s, k, true) + skipCount(s)).join('');
  openModal(`
    <h2>🤝 Let's solve it together!</h2>
    <div class="visual">${visualFor(q, true)}</div>
    <div class="steps solved">${steps}</div>
    <div class="sol-answer">The answer is <b>${q.answer}</b> ${esc(q.u)}.<br><small>Type it in and press ✔ to get your star!</small></div>
    <button class="big-btn" data-m-ok>OK! ✏️</button>
  `, { cls: 'hint-card' });
  on('[data-m-ok]', 'click', () => closeModal(), $('#modal'));
}

// ══════════════════════════════════════════════════════════════════
// Round end: stars, treasure chest, sticker, badges
// ══════════════════════════════════════════════════════════════════
function roundEnd() {
  const p = profile();
  const perfect = round.results.every((s) => s === 3);
  p.stats.rounds++;
  if (perfect) p.stats.perfectRounds++;
  if (round.world !== 'mix') p.worldsPlayed[round.world] = 1;
  const sticker = pickSticker(round.world, p.stickers, perfect);
  const isNew = !p.stickers[sticker.id];
  p.stickers[sticker.id] = (p.stickers[sticker.id] || 0) + 1;
  persist();
  const newBadges = checkBadges();
  const t = round.world === 'mix' ? null : themeById(round.world);
  const title = perfect ? 'PERFECT ROUND!' : 'Round complete!';
  show(`
    ${topbar({ title: '' })}
    <div class="scroll center">
      <div class="end-card">
        <div class="end-emoji">${perfect ? '💯' : '🎉'}</div>
        <h1 class="end-title">${title}</h1>
        <div class="end-stars"><span id="countUp">0</span> ⭐ stars this round</div>
        <div class="end-dots">${round.results.map((s) => `<span>${'⭐'.repeat(s)}${'<i>☆</i>'.repeat(3 - s)}</span>`).join('')}</div>
        <div class="chest-zone" id="chestZone">
          <button class="chest" id="chest" aria-label="Open the treasure chest">
            ${chestSVG()}
          </button>
          <div class="chest-tip">Tap the treasure chest! 👆</div>
        </div>
        <div class="end-actions hidden" id="endActions">
          <button class="big-btn" data-again>▶ Play again</button>
          <button class="big-btn alt" data-worlds>🗺️ Worlds</button>
          <button class="big-btn alt" data-book>📒 Stickers</button>
        </div>
      </div>
    </div>
  `, { scene: t ? t.id : 'friends', theme: t ? t.id : null, cls: 'end' });
  bindTopbar();
  SFX.fanfare();
  say(perfect ? 'Perfect round! Amazing!' : `Round complete! You got ${round.starsWon} stars!`);
  confetti(perfect ? 260 : 150);
  // count the stars up
  let n = 0;
  const tick = setInterval(() => {
    n++;
    const el = $('#countUp');
    if (!el || n > round.starsWon) { clearInterval(tick); return; }
    el.textContent = n;
    SFX.star(n % 3);
  }, 90);

  const world = round.world;
  let opened = false;
  const open = async () => {
    if (opened) return;
    opened = true;
    const chest = $('#chest');
    chest.classList.add('shake');
    SFX.drumroll(0.9);
    await wait(950);
    chest.classList.remove('shake');
    chest.classList.add('open');
    SFX.chest();
    confetti(120);
    await wait(350);
    $('#chestZone').innerHTML = `
      <div class="reveal">
        <div class="rays"></div>
        ${stickerHTML(sticker, true)}
        <div class="reveal-text">${isNew ? (sticker.legendary ? '✨ GOLD sticker! ✨' : 'New sticker!') : `Shiny copy! You have ${p.stickers[sticker.id]} now`}</div>
      </div>`;
    say(isNew ? `You got a new sticker: ${sticker.name}!` : `Another ${sticker.name}! Shiny!`);
    for (const b of newBadges) badgeToast(b);
    $('#endActions').classList.remove('hidden');
  };
  on('#chest', 'click', open);
  on('[data-again]', 'click', () => startRound(world));
  on('[data-worlds]', 'click', () => { tapSound(); worldsScreen(); });
  on('[data-book]', 'click', () => { tapSound(); stickersScreen(); });
  keyHandler = (e) => { if (e.key === 'Enter') { if (!opened) open(); else startRound(world); } };
}

function chestSVG() {
  return `<svg viewBox="0 0 200 170" class="chest-svg">
    <g class="lid"><path d="M20 70 Q20 20 100 20 Q180 20 180 70 Z" fill="#c8762a" stroke="#6b3a12" stroke-width="6"/>
      <rect x="88" y="20" width="24" height="50" fill="#ffc94a" stroke="#8a5a00" stroke-width="4"/></g>
    <rect x="20" y="70" width="160" height="90" rx="8" fill="#a85a1e" stroke="#6b3a12" stroke-width="6"/>
    <rect x="88" y="70" width="24" height="90" fill="#ffc94a" stroke="#8a5a00" stroke-width="4"/>
    <rect x="86" y="80" width="28" height="30" rx="6" fill="#ffe08a" stroke="#8a5a00" stroke-width="4"/>
    <circle cx="100" cy="95" r="5" fill="#6b3a12"/>
  </svg>`;
}

function stickerHTML(s, big = false, count = 1) {
  const t = themeById(s.world);
  return `<div class="sticker ${big ? 'big' : ''} ${s.legendary ? 'gold' : ''}" style="--c:${t.color};--d:${t.dark}">
    <div class="sticker-face">${s.emoji}</div>
    <div class="sticker-name">${esc(s.name)}</div>
    ${count > 1 ? `<div class="sticker-count">×${count}</div>` : ''}
  </div>`;
}

// ══════════════════════════════════════════════════════════════════
// Sticker book and badges
// ══════════════════════════════════════════════════════════════════
function stickersScreen() {
  const p = profile();
  show(`
    ${topbar({ back: true, title: `📒 Sticker book ${Object.keys(p.stickers).length}/${ALL_STICKERS.length}` })}
    <div class="scroll">
      ${THEMES.map((t) => `
        <h2 class="group-h">${t.icon} ${esc(t.name)}</h2>
        <div class="sticker-grid">
          ${STICKERS[t.id].map(([id]) => {
            const s = stickerById(id);
            return p.stickers[id] ? stickerHTML(s, false, p.stickers[id])
              : `<div class="sticker locked"><div class="sticker-face">${s.legendary ? '✨' : '❔'}</div><div class="sticker-name">${s.legendary ? 'Gold sticker' : '???'}</div></div>`;
          }).join('')}
        </div>`).join('')}
      <p class="foot-note">Finish a round to open a treasure chest and win a sticker. A perfect round can win a ✨gold✨ one!</p>
    </div>
  `, { scene: 'friends', cls: 'book' });
  bindTopbar(titleScreen);
}

function badgesScreen() {
  const p = profile();
  show(`
    ${topbar({ back: true, title: `🏅 Badges ${Object.keys(p.badges).length}/${BADGES.length}` })}
    <div class="scroll">
      <div class="badge-grid">
        ${BADGES.map((b) => `
          <div class="badge ${p.badges[b.id] ? 'won' : ''}">
            <div class="badge-emoji">${p.badges[b.id] ? b.emoji : '🔒'}</div>
            <div class="badge-name">${esc(b.name)}</div>
            <div class="badge-desc">${esc(b.desc)}</div>
          </div>`).join('')}
      </div>
    </div>
  `, { scene: 'friends', cls: 'badges' });
  bindTopbar(titleScreen);
}

// ══════════════════════════════════════════════════════════════════
// Grown-ups corner
// ══════════════════════════════════════════════════════════════════
function grownupsScreen() {
  const id = currentPlayerId();
  const p = profile();
  const name = charById(id).name;
  const kinds = [
    ['times', '✖️ Times tables (one step)'],
    ['twostep', '🧗 Two steps (multiply, then add or take away)'],
    ['share', '🍰 Sharing equally (division)'],
    ['plusminus', '➕ Adding and taking away'],
  ];
  const rows = kinds.map(([k, label]) => {
    const qs = BANK.filter((q) => q.kind === k);
    const tried = qs.filter((q) => p.history[q.id]);
    const first = qs.filter((q) => p.best[q.id] === 3).length;
    return `<tr><td>${label}</td><td>${tried.length}/${qs.length}</td><td>${tried.length ? `${first}` : '-'}</td></tr>`;
  }).join('');
  const tricky = BANK.filter((q) => p.history[q.id]?.wrong > 0)
    .sort((a, b) => p.history[b.id].wrong - p.history[a.id].wrong).slice(0, 8);
  const s = p.stats;
  show(`
    ${topbar({ back: true, title: '👪 Grown-ups corner' })}
    <div class="scroll">
      <div class="panel">
        <h2>${esc(name)}'s progress</h2>
        <div class="stat-row">
          <div><b>${s.correct}</b><span>right answers</span></div>
          <div><b>${s.answered ? Math.round((s.firstTry / s.answered) * 100) : 0}%</b><span>right first time</span></div>
          <div><b>${s.rounds}</b><span>rounds</span></div>
          <div><b>${s.bestStreak}</b><span>best streak</span></div>
          <div><b>${(p.days || []).length}</b><span>days played</span></div>
        </div>
        <table class="kinds"><thead><tr><th>Type of question</th><th>Tried</th><th>3 stars</th></tr></thead><tbody>${rows}</tbody></table>
        ${tricky.length ? `<h3>Tricky ones to practise together</h3><ul class="tricky">${tricky.map((q) => `<li><span>${esc(q.t)}</span><b>${q.answer} ${esc(q.u)}</b><i>${p.history[q.id].wrong} wrong ${p.history[q.id].wrong === 1 ? 'try' : 'tries'}</i></li>`).join('')}</ul>` : ''}
      </div>
      <div class="panel">
        <h2>About the questions</h2>
        <p>100 story problems at Norwegian 3rd grade level (3. trinn): times tables up to 10, small two-digit × one-digit (like 12 × 2), sharing equally, and two-step problems (multiply, then add or take away a little). Every round starts easy and climbs. Questions she has not solved yet, or solved with help, come back first.</p>
        <p>Stars: ⭐⭐⭐ right first time, ⭐⭐ after a hint, ⭐ after solving it together. A wrong answer opens a picture hint, a second one walks through the steps. Nothing is ever lost.</p>
        <p>To add questions, edit <code>math-quest/src/questions.js</code> and run <code>npm run check:math</code>.</p>
      </div>
      <div class="panel">
        <button class="big-btn alt danger" data-reset>Reset ${esc(name)}'s progress</button>
      </div>
    </div>
  `, { scene: 'friends', cls: 'grownups' });
  bindTopbar(titleScreen);
  on('[data-reset]', 'click', () => {
    openModal(`<div class="modal-emoji">⚠️</div><h2>Start over?</h2><p>This clears ${esc(name)}'s stars, stickers and badges on this device.</p>
      <div class="modal-actions"><button class="big-btn alt" data-m-no>No, keep them</button><button class="big-btn danger" data-m-yes>Yes, reset</button></div>`);
    on('[data-m-no]', 'click', () => closeModal(), $('#modal'));
    on('[data-m-yes]', 'click', () => { resetPlayer(id); closeModal(true); grownupsScreen(); }, $('#modal'));
  });
}

// ── go! ───────────────────────────────────────────────────────────
// Handy for testing: ?world=lionking jumps straight into a round.
const params = new URLSearchParams(location.search);
titleScreen();
if (params.get('world')) startRound(params.get('world'));
$('#loading').classList.add('hidden');

// expose a little for automated tests
window.__mq = {
  BANK, profile,
  get round() { return round; },
  preview(id) { const q = BANK.find((x) => x.id === id); round = { world: q.world, qs: [q], i: 0, results: [], starsWon: 0 }; showQuestion(); },
};
