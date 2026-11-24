import './style.css';
import { CHARACTERS } from '../../src/config.js';
import { QUESTIONS } from './questions.js';
import { QUESTIONS_L2 } from './questions2.js';
import { THEMES, themeById, sceneSVG, sceneId, placeFor, praiseFor } from './themes.js';
import { solve, kindOf, levelOf, SYMBOL } from './mathsteps.js';
import { ALL_STICKERS, STICKERS, STICKERS2, pickSticker, stickerById, BADGES, rankFor } from './rewards.js';
import { SFX, say, unlockAudio, stopTalking } from './audio.js';
import { profile, persist, settings, setSetting, currentPlayerId, setPlayer, markToday, resetPlayer } from './save.js';
import { avatarSVG, charById } from './avatar.js';
import { confetti } from './confetti.js';

// ── the question bank, with answers and steps worked out ──────────
// lv = which level of the world (1 or 2); diff = how hard the question is.
const BANK = [];
for (const [lv, set] of [[1, QUESTIONS], [2, QUESTIONS_L2]]) {
  for (const [world, list] of Object.entries(set)) {
    for (const q of list) {
      const { answer, steps } = solve(q.x);
      BANK.push({ ...q, world, lv, answer, steps, kind: kindOf(steps), diff: levelOf(steps) });
    }
  }
}
const byWorld = (w, lv = 1) => BANK.filter((q) => q.world === w && q.lv === lv);
const ROUND = 5;
const LEVELS = [1, 2];

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
function worldDone(p, world, lv = 1) {
  return byWorld(world, lv).every((q) => p.best[q.id] >= 1);
}
/** Level 2 opens once every Level 1 question in that world is solved. */
function unlocked(p, world, lv) {
  return lv === 1 || p.unlockAll || worldDone(p, world, lv - 1);
}
function unlockedLevels(p, world) { return LEVELS.filter((lv) => unlocked(p, world, lv)); }
/** Worlds whose Level 2 is open but the party has not been shown yet. */
function freshUnlocks(p) { return THEMES.filter((t) => unlocked(p, t.id, 2) && !p.unlockSeen[t.id]); }
const badgeCount = (p) => BADGES.filter((b) => p.badges[b.id]).length;
function checkBadges() {
  const p = profile();
  const ctx = {
    worldDone: (w, lv) => worldDone(p, w, lv),
    allDone: (lv) => THEMES.every((t) => worldDone(p, t.id, lv)),
    stickerCount: ALL_STICKERS.length,
  };
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
  const badges = badgeCount(p);
  const stickers = Object.keys(p.stickers).length;
  const news = freshUnlocks(p).length;
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
      <button class="big-btn play-btn" data-play>▶ PLAY${news ? '<span class="new-flag">NEW LEVELS!</span>' : ''}</button>
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
  const levelBtn = (t, lv) => {
    const qs = byWorld(t.id, lv);
    const solved = qs.filter((q) => p.best[q.id] >= 1).length;
    const stars = qs.reduce((s, q) => s + (p.best[q.id] || 0), 0);
    if (!unlocked(p, t.id, lv)) {
      const need = byWorld(t.id, lv - 1).filter((q) => !(p.best[q.id] >= 1)).length;
      return `<div class="lvl-btn locked"><span class="lvl-name">🔒 Level ${lv}</span><span class="lvl-meta">Solve ${need} more in Level ${lv - 1} to open</span></div>`;
    }
    const done = solved === qs.length;
    const isNew = lv === 2 && solved === 0;
    return `<button class="lvl-btn lv${lv} ${done ? 'done' : ''}" data-world="${t.id}" data-lv="${lv}">
      <span class="lvl-name">${lv === 1 ? '⭐' : '🚀'} Level ${lv}${isNew ? ' <span class="new-pill">NEW</span>' : ''}</span>
      <span class="bar small"><span class="bar-fill" style="width:${Math.round((solved / qs.length) * 100)}%"></span></span>
      <span class="lvl-meta"><span>${done ? '✅ All solved!' : `${solved}/${qs.length} solved`}</span><span>⭐ ${stars}/${qs.length * 3}</span></span>
    </button>`;
  };
  const card = (t) => {
    const top = Math.max(...unlockedLevels(p, t.id));
    return `<div class="world-card" style="--c:${t.color};--d:${t.dark}">
      <div class="world-scene">${sceneSVG(sceneId(t.id, top))}</div>
      <div class="world-info">
        <div class="world-name"><span class="world-icon">${t.icon}</span>${esc(t.name)}</div>
        <div class="lvl-row">${LEVELS.map((lv) => levelBtn(t, lv)).join('')}</div>
      </div>
    </div>`;
  };
  show(`
    ${topbar({ back: true, title: 'Pick a world!' })}
    <div class="scroll">
      <div class="world-grid">
        ${THEMES.map(card).join('')}
        <div class="world-card mix" style="--c:#ffb02e;--d:#8a4a00">
          <div class="world-scene mix-scene"><div class="mix-icons">🦁🎪🪔<br>🦆🎸💖</div></div>
          <div class="world-info">
            <div class="world-name"><span class="world-icon">🎲</span>Surprise Mix</div>
            <div class="lvl-row"><button class="lvl-btn" data-world="mix" data-lv="0"><span class="lvl-name">🎲 Play the mix</span><span class="lvl-meta"><span>Questions from every open level</span></span></button></div>
          </div>
        </div>
      </div>
    </div>
  `, { scene: 'friends', cls: 'worlds' });
  bindTopbar(titleScreen);
  on('.lvl-btn[data-world]', 'click', (e) => startRound(e.currentTarget.dataset.world, Number(e.currentTarget.dataset.lv)));
  const news = freshUnlocks(p);
  if (news.length) setTimeout(() => unlockParty(news), 350);
}

/** "New levels unlocked!" with confetti, shown once per world. */
function unlockParty(worlds) {
  const p = profile();
  worlds.forEach((t) => { p.unlockSeen[t.id] = true; });
  persist();
  SFX.fanfare();
  confetti(220);
  const name = charById(currentPlayerId()).name;
  say(worlds.length > 1 ? `Wow ${name}! ${worlds.length} new levels are open! Let's go!` : `Level 2 is open in ${worlds[0].name}! Let's go!`);
  openModal(`
    <div class="cheer-emoji">🔓</div>
    <h2 class="cheer">New level${worlds.length > 1 ? 's' : ''} unlocked!</h2>
    <p>You finished Level 1, so <b>Level 2</b> is open in:</p>
    <div class="unlock-list">${worlds.map((t) => `<div class="unlock-item"><div class="unlock-scene">${sceneSVG(sceneId(t.id, 2))}</div><span>${t.icon} ${esc(t.name)}</span></div>`).join('')}</div>
    <p class="unlock-note">New places, new questions, new stickers and new badges!</p>
    <button class="big-btn" data-m-ok>Let's go! 🚀</button>
  `, { cls: 'cheer-card unlock-card' });
  on('[data-m-ok]', 'click', () => closeModal(), $('#modal'));
}

// ══════════════════════════════════════════════════════════════════
// A round of 5 questions
// ══════════════════════════════════════════════════════════════════
let round = null;

function poolFor(world, lv) {
  const p = profile();
  if (world === 'mix') return BANK.filter((q) => unlocked(p, q.world, q.lv));
  return byWorld(world, lv);
}

function pickRound(world, lv) {
  const p = profile();
  const pool = poolFor(world, lv);
  const score = (q) => {
    const best = p.best[q.id] || 0;
    const base = best === 0 ? 0 : best < 3 ? 1 : 2;
    return base + Math.random() * 0.9;
  };
  const chosen = [...pool].sort((a, b) => score(a) - score(b)).slice(0, ROUND);
  // easy first, so every round warms up and then climbs
  return chosen.sort((a, b) => a.diff - b.diff || Math.random() - 0.5);
}

function startRound(world, lv = 1) {
  const p = profile();
  if (world !== 'mix' && !unlocked(p, world, lv)) lv = 1;
  markToday(p);
  persist();
  round = { world, lv, qs: pickRound(world, lv), i: 0, results: [], starsWon: 0 };
  if (world !== 'mix') SFX.jingle(world); else SFX.fanfare();
  showQuestion();
}

function showQuestion() {
  const q = round.qs[round.i];
  const t = themeById(q.world);
  const p = profile();
  round.tries = 0;
  round.entry = '';
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
        <div class="qhead" style="background:${t.color}"><span>${t.icon} ${esc(t.name)}${q.lv === 2 ? ' <span class="lv-tag">Level 2</span>' : ''}</span><span class="qplace">${esc(placeFor(q.world, q.lv))}</span></div>
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
  `, { scene: sceneId(q.world, q.lv), theme: q.world, cls: 'play' });

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
    h.tries++;
    p.stats.answered++;
    p.stats.correct++;
    p.stats.kinds[q.kind]++;
    if (round.tries === 0) p.stats.firstTry++; else p.stats.comebacks++;
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
  const name = charById(currentPlayerId()).name;
  const praise = round.tries > 0 ? pick(COMEBACK_PRAISE) : Math.random() < 0.5 ? pick(praiseFor(q.world, q.lv)) : pick(GENERIC_PRAISE);
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
  const words = s.op === '*' ? `${s.a} groups of ${s.b}` : q.quot ? `how many groups of ${s.b} make ${s.a}?` : `share ${s.a} into ${s.b} equal groups`;
  const res = reveal ? `<b class="res">${s.r}</b>` : '<b class="res q">?</b>';
  const extra = !reveal && (s.op === '*' || s.op === '/') && both ? `<span class="say">(${words})</span>` : '';
  return `<div class="step"><span class="step-n">Step ${k + 1}</span><span class="step-math">${A} ${SYMBOL[s.op]} ${B} = ${res}</span>${extra}</div>`;
}

function groupsVisual(groups, size, emoji, { fill = true } = {}) {
  const many = groups * size > 60 || size > 12;
  const one = () => many
    ? `<div class="grp big"><span class="grp-e">${emoji}</span><span class="grp-n">${fill ? size : '?'}</span></div>`
    : `<div class="grp">${fill ? Array.from({ length: size }, () => `<span>${emoji}</span>`).join('') : '<span class="grp-q">?</span>'}</div>`;
  return `<div class="groups">${Array.from({ length: groups }, one).join('')}</div>`;
}

function blocksVisual(n) {
  const tens = Math.floor(n / 10), ones = n % 10;
  return `<div class="blocks">${Array.from({ length: tens }, () => '<span class="ten"></span>').join('')}${Array.from({ length: ones }, () => '<span class="one"></span>').join('')}</div>`;
}

/** 23 × 3 is easier as 20 × 3 and 3 × 3. */
function splitTip(s, reveal) {
  const big = Math.max(s.a, s.b), small = Math.min(s.a, s.b);
  if (big <= 10 || big % 10 === 0) return '';
  const tens = big - (big % 10), ones = big % 10;
  return reveal
    ? `<div class="vis-tip">Split ${big} into ${tens} and ${ones}: ${tens} × ${small} = ${tens * small}, ${ones} × ${small} = ${ones * small}, then ${tens * small} + ${ones * small} = ${big * small}</div>`
    : `<div class="vis-tip">Tip: split ${big} into ${tens} and ${ones}. Do ${tens} × ${small} and ${ones} × ${small}, then add them.</div>`;
}

const literal = (s) => s.aStep < 0 && s.bStep < 0;

function visualFor(q, reveal) {
  const mults = q.steps.filter((s) => s.op === '*' && literal(s));
  const div = q.steps.find((s) => s.op === '/');
  // two kinds ("4 rows of 5 gazelles and 3 rows of 6 buffalo"): draw both
  if (mults.length === 2) {
    return mults.map((m, k) => `<div class="vis-cap">${m.a} groups of ${m.b}</div>${groupsVisual(m.a, m.b, k ? q.e2 || q.e : q.e)}`).join('<div class="vis-and">and</div>');
  }
  const mult = mults[0] || [...q.steps].reverse().find((s) => s.op === '*');
  let html = '';
  if (mult) {
    html += `<div class="vis-cap">${mult.a} groups of ${mult.b}</div>${groupsVisual(mult.a, mult.b, q.e)}${splitTip(mult, reveal)}`;
  }
  if (div && q.quot) {
    html += `<div class="vis-cap">${div.a} in groups of ${div.b}. How many groups?</div>
      ${reveal ? groupsVisual(div.r, div.b, q.e) : blocksVisual(div.a)}
      <div class="vis-tip">${reveal ? `${div.r} groups of ${div.b} make ${div.a}` : `Count by ${div.b}s until you get to ${div.a}. How many jumps?`}</div>`;
  } else if (div) {
    const after = mult && div.aStep >= 0;
    html += `<div class="vis-cap">${after ? 'Then share' : 'Share'} ${div.a} into ${div.b} equal groups</div>
      ${groupsVisual(div.b, div.r, q.e, { fill: reveal })}
      ${reveal ? '' : `<div class="vis-tip">Think: ${div.b} × <b>?</b> = ${div.a}</div>`}`;
  }
  if (html) return html;
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
  if (round.lv === 2) p.stats.l2rounds++;
  const pool = round.world === 'mix'
    ? ALL_STICKERS.filter((st) => unlocked(p, st.world, st.lv))
    : ALL_STICKERS.filter((st) => st.world === round.world && st.lv === round.lv);
  const sticker = pickSticker(pool, p.stickers, perfect);
  // Did this round just finish Level 1 of the world?
  const opened = round.world !== 'mix' && round.lv === 1 && unlocked(p, round.world, 2) && !p.unlockSeen[round.world];
  if (opened) p.unlockSeen[round.world] = true;
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
        ${opened ? `<div class="unlock-banner">🔓 You finished Level 1! <b>Level 2</b> is now open in ${esc(themeById(round.world).name)}!</div>` : ''}
        <div class="chest-zone" id="chestZone">
          <button class="chest" id="chest" aria-label="Open the treasure chest">
            ${chestSVG()}
          </button>
          <div class="chest-tip">Tap the treasure chest! 👆</div>
        </div>
        <div class="end-actions hidden" id="endActions">
          ${opened ? '<button class="big-btn" data-level2>🚀 Try Level 2</button>' : ''}
          <button class="big-btn ${opened ? 'alt' : ''}" data-again>▶ Play again</button>
          <button class="big-btn alt" data-worlds>🗺️ Worlds</button>
          <button class="big-btn alt" data-book>📒 Stickers</button>
        </div>
      </div>
    </div>
  `, { scene: t ? sceneId(t.id, round.lv) : 'friends', theme: t ? t.id : null, cls: 'end' });
  bindTopbar();
  SFX.fanfare();
  say(opened ? 'You finished Level 1! Level 2 is open!' : perfect ? 'Perfect round! Amazing!' : `Round complete! You got ${round.starsWon} stars!`);
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

  const world = round.world, lv = round.lv;
  let chestOpen = false;
  const open = async () => {
    if (chestOpen) return;
    chestOpen = true;
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
  on('[data-again]', 'click', () => startRound(world, lv));
  on('[data-level2]', 'click', () => startRound(world, 2));
  on('[data-worlds]', 'click', () => { tapSound(); worldsScreen(); });
  on('[data-book]', 'click', () => { tapSound(); stickersScreen(); });
  keyHandler = (e) => { if (e.key === 'Enter') { if (!chestOpen) open(); else startRound(world, opened ? 2 : lv); } };
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
        ${[[1, STICKERS], [2, STICKERS2]].map(([lv, set]) => `
          <div class="book-level">Level ${lv}${lv === 2 && !unlocked(p, t.id, 2) ? ' 🔒' : ''}</div>
          <div class="sticker-grid">
            ${set[t.id].map(([id]) => {
              const s = stickerById(id);
              return p.stickers[id] ? stickerHTML(s, false, p.stickers[id])
                : `<div class="sticker locked"><div class="sticker-face">${s.legendary ? '✨' : '❔'}</div><div class="sticker-name">${s.legendary ? 'Gold sticker' : '???'}</div></div>`;
            }).join('')}
          </div>`).join('')}`).join('')}
      <p class="foot-note">Finish a round to open a treasure chest and win a sticker. A perfect round can win a ✨gold✨ one!</p>
    </div>
  `, { scene: 'friends', cls: 'book' });
  bindTopbar(titleScreen);
}

function badgesScreen() {
  const p = profile();
  show(`
    ${topbar({ back: true, title: `🏅 Badges ${badgeCount(p)}/${BADGES.length}` })}
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
  const worldRows = THEMES.map((t) => `<tr><td>${t.icon} ${esc(t.name)}</td>${LEVELS.map((lv) => {
    const qs = byWorld(t.id, lv);
    const solved = qs.filter((q) => p.best[q.id] >= 1).length;
    return `<td>${unlocked(p, t.id, lv) ? `${solved}/${qs.length}` : '🔒'}</td>`;
  }).join('')}</tr>`).join('');
  const anyLocked = THEMES.some((t) => !unlocked(p, t.id, 2));
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
        <table class="kinds"><thead><tr><th>World</th><th>Level 1</th><th>Level 2</th></tr></thead><tbody>${worldRows}</tbody></table>
        <table class="kinds"><thead><tr><th>Type of question</th><th>Tried</th><th>3 stars</th></tr></thead><tbody>${rows}</tbody></table>
        ${tricky.length ? `<h3>Tricky ones to practise together</h3><ul class="tricky">${tricky.map((q) => `<li><span>${esc(q.t)}</span><b>${q.answer} ${esc(q.u)}</b><i>${p.history[q.id].wrong} wrong ${p.history[q.id].wrong === 1 ? 'try' : 'tries'}</i></li>`).join('')}</ul>` : ''}
      </div>
      <div class="panel">
        <h2>About the questions</h2>
        <p>${BANK.length} story problems at Norwegian 3rd grade level (3. trinn). <b>Level 1</b> (100): times tables up to 10, small two-digit × one-digit (like 12 × 2), sharing equally, and two-step problems (multiply, then add or take away a little). <b>Level 2</b> (105, opens when Level 1 of a world is all solved): a small step up, with 15 different kinds of story in every world, such as "times as many", "how many more", change from money, "how many groups of 8", and 23 × 3. No Level 2 question repeats the maths of another question.</p>
        <p>Every round starts easy and climbs. Questions she has not solved yet, or solved with help, come back first.</p>
        <p>Stars: ⭐⭐⭐ right first time, ⭐⭐ after a hint, ⭐ after solving it together. A wrong answer opens a picture hint, a second one walks through the steps. Nothing is ever lost.</p>
        <p>To add questions, edit <code>math-quest/src/questions.js</code> (Level 1) or <code>questions2.js</code> (Level 2) and run <code>npm run check:math</code>.</p>
      </div>
      <div class="panel">
        ${anyLocked ? `<p>Played Level 1 on another device? You can open every Level 2 here straight away.</p><button class="big-btn alt" data-unlock>🔓 Open all Level 2 worlds</button><br><br>` : ''}
        <button class="big-btn alt danger" data-reset>Reset ${esc(name)}'s progress</button>
      </div>
    </div>
  `, { scene: 'friends', cls: 'grownups' });
  bindTopbar(titleScreen);
  on('[data-unlock]', 'click', () => { p.unlockAll = true; persist(); SFX.pop(); grownupsScreen(); });
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
if (params.get('world')) startRound(params.get('world'), Number(params.get('lv')) || 1);
$('#loading').classList.add('hidden');

// expose a little for automated tests
window.__mq = {
  BANK, profile,
  get round() { return round; },
  preview(id) { const q = BANK.find((x) => x.id === id); round = { world: q.world, lv: q.lv, qs: [q], i: 0, results: [], starsWon: 0 }; showQuestion(); },
  worlds: () => worldsScreen(),
  hint: (id) => { const q = BANK.find((x) => x.id === id); showHint(q); },
  solution: (id) => { const q = BANK.find((x) => x.id === id); showSolution(q); },
};
