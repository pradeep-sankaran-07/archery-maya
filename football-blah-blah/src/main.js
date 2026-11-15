import * as THREE from 'three';
import { t, initLang, setLang, getLang } from './i18n.js';
import { SFX, unlockAudio, isMuted, setMuted, crowdStart, crowdStop } from './audio.js';
import { CHARACTERS, charById, KITS, MATCH_SECONDS, COINS, SHOP_ITEMS, pickSurprise, shuffle } from './data.js';
import { buildStadium } from './three/stadium.js';
import { Particles } from './three/effects.js';
import { buildPlayer, animatePlayer, buildPodium, buildTrophy, renderPortraits, blobShadow, TROPHY_COLORS } from './three/models.js';
import { Match } from './game/match.js';
import { Input, isTouch } from './game/input.js';
import { HL } from './game/constants.js';
import { fetchScores, submitScore } from './leaderboard.js';

initLang();

// ── DOM ─────────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const canvas = $('#three');
const screensEl = $('#screens');
const hudEl = $('#hud');
const labelsEl = $('#labels');
const toastsEl = $('#toasts');
const controlsEl = $('#controls');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Saved prefs ─────────────────────────────────────────────────────────
const PREF_KEY = 'football-maya.prefs.v1';
function loadPrefs() { try { return { hero: 'maya', theme: 'aladdin', role: 'striker', ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; } catch { return { hero: 'maya', theme: 'aladdin', role: 'striker' }; } }
function savePrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
const prefs = loadPrefs();

// ── Three.js ────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 900);
const particles = new Particles(scene);
let stadium = null;
let stadiumTheme = null;

function setTheme(theme) {
  if (stadiumTheme === theme) return;
  if (stadium) scene.remove(stadium.group);
  stadium = buildStadium(theme);
  scene.add(stadium.group);
  stadiumTheme = theme;
}

const isPortrait = () => window.innerHeight > window.innerWidth;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// Camera rig
const cam = { target: new THREE.Vector3(), pos: new THREE.Vector3(0, 20, 30), mode: 'orbit', orbitA: 0 };
const camFwd = new THREE.Vector3(0, 0, -1);
function camForward() { return camFwd; }

function updateCamera(dt) {
  const portrait = isPortrait();
  const desiredT = new THREE.Vector3();
  const desiredP = new THREE.Vector3();
  let fov = 40;
  if (cam.mode === 'orbit') {
    cam.orbitA += dt * 0.08;
    desiredT.set(0, 0, 0);
    const r = portrait ? 46 : 34;
    desiredP.set(Math.sin(cam.orbitA) * r, portrait ? 26 : 17, Math.cos(cam.orbitA) * r);
    fov = portrait ? 55 : 42;
  } else if (cam.mode === 'match' && match) {
    const f = match.focus();
    const celebrating = match.state === 'goal';
    if (!portrait) {
      desiredT.set(THREE.MathUtils.clamp(f.x, -13, 13), 0, THREE.MathUtils.clamp(f.z * 0.55, -5, 5));
      const zoom = celebrating ? 0.75 : 1;
      desiredP.set(desiredT.x, 10.5 * zoom, desiredT.z + 13 * zoom);
      fov = 40;
    } else {
      const ahead = match.role === 'goalie' ? 6 : 4;
      desiredT.set(THREE.MathUtils.clamp(f.x + ahead, -HL + 7, HL - 4), 0, THREE.MathUtils.clamp(f.z, -9, 9));
      const zoom = celebrating ? 0.75 : 1;
      desiredP.set(desiredT.x - 11 * zoom, 14 * zoom, desiredT.z);
      fov = 56;
    }
  } else if (cam.mode === 'podium') {
    desiredT.set(0, 1.9, 0);
    desiredP.set(Math.sin(cam.orbitA) * 2, portrait ? 4.5 : 3.6, portrait ? 17 : 11.5);
    cam.orbitA += dt * 0.3;
    fov = portrait ? 58 : 42;
  } else if (cam.mode === 'hero') {
    desiredT.set(0, 1.1, 0);
    desiredP.set(Math.sin(cam.orbitA) * 1.2, 1.8, portrait ? 6.5 : 4.6);
    cam.orbitA += dt * 0.4;
    fov = 42;
  }
  const k = cam.snap ? 1 : 1 - Math.exp(-dt * 3.5);
  cam.snap = false;
  cam.target.lerp(desiredT, k);
  cam.pos.lerp(desiredP, k);
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov += (fov - camera.fov) * Math.min(1, k * 2); camera.updateProjectionMatrix(); }
  camera.position.copy(cam.pos);
  camera.lookAt(cam.target);
  camFwd.set(cam.target.x - cam.pos.x, 0, cam.target.z - cam.pos.z).normalize();
}

// ── Labels over heads ───────────────────────────────────────────────────
const labelEls = new Map();
const projV = new THREE.Vector3();
function toScreen(v) {
  projV.copy(v).project(camera);
  return { x: (projV.x * 0.5 + 0.5) * window.innerWidth, y: (-projV.y * 0.5 + 0.5) * window.innerHeight, behind: projV.z > 1 };
}
function setPlayerLabels(players) {
  labelsEl.innerHTML = '';
  labelEls.clear();
  for (const p of players) {
    const el = document.createElement('div');
    el.className = 'plabel' + (p.human ? ' hero' : '');
    el.innerHTML = `${p.role === 'gk' ? '<span class="gk">🧤</span> ' : ''}${esc(p.char.name)}`;
    if (!p.human) el.style.borderBottom = `3px solid ${KITS[p.team === 0 ? 0 : S.opp].css}`;
    labelsEl.appendChild(el);
    labelEls.set(p, el);
  }
  itemLabel = null;
}
let itemLabel = null;
let itemLabelPos = null;
function updateLabels() {
  if (!match) return;
  for (const [p, el] of labelEls) {
    const s = toScreen(projV.set(p.pos.x, p.flyY + p.height + 0.3, p.pos.z));
    if (s.behind) { el.style.display = 'none'; continue; }
    el.style.display = '';
    el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -100%)`;
  }
  if (itemLabel && itemLabelPos) {
    const s = toScreen(itemLabelPos);
    itemLabel.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -100%)`;
  }
}

// ── Toasts, banners, coin pops ──────────────────────────────────────────
let toastTimer = null;
function toast(msg, ms = 2600) {
  toastsEl.querySelectorAll('.toast').forEach((e) => e.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastsEl.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}
let bannerTimer = null;
function banner({ big, small, ms = 2000, sad = false }) {
  toastsEl.querySelectorAll('.banner').forEach((e) => e.remove());
  const el = document.createElement('div');
  el.className = 'banner' + (sad ? ' sad' : '');
  el.innerHTML = `<div class="big">${esc(big)}</div>${small ? `<div class="small">${esc(small)}</div>` : ''}`;
  toastsEl.appendChild(el);
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.remove(), ms);
}
function coinPop(add, at) {
  const el = document.createElement('div');
  el.className = 'coin-pop';
  el.textContent = `+${add} kr`;
  let x = window.innerWidth - 70, y = 60;
  if (at) { const s = toScreen(at); x = s.x; y = s.y; }
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  toastsEl.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

// ── Screens ─────────────────────────────────────────────────────────────
function show(html, cls = 'dim') {
  screensEl.innerHTML = `<div class="screen ${cls}">${html}</div>`;
  const root = screensEl.firstElementChild;
  root.querySelectorAll('[data-act]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      unlockAudio();
      const fn = actions[el.dataset.act];
      if (fn) fn(el.dataset.arg, el);
    });
  });
  return root;
}
function clearScreen() { screensEl.innerHTML = ''; }

let portraits = {};
const portraitOf = (id) => portraits[id] || '';

// ── Cup state ───────────────────────────────────────────────────────────
const S = {
  hero: prefs.hero, theme: prefs.theme, role: prefs.role,
  teams: [], matchNo: 0, results: [], goals: {}, coins: 0, money: 0,
  prizes: [], cart: [], place: 3, trophyAttempt: 0, opp: 1, playerName: '', saved: false, matchStats: [],
};
let match = null;
let podium = null;
let showcase = null;
const input = new Input(controlsEl);
input.onPause = () => { if (match && match.state !== 'ended') actions.pause(); };

function teamName(i) {
  if (i === 0) return t('team.mine', { name: charById(S.hero).name });
  return t(`team.${S.theme}.${i === 1 ? 'a' : 'b'}`);
}

function buildCup() {
  const hero = charById(S.hero);
  const others = shuffle(CHARACTERS.filter((c) => c.id !== hero.id));
  const pick = () => others.shift() || CHARACTERS[(Math.random() * CHARACTERS.length) | 0];
  const notPet = () => { const i = others.findIndex((c) => !c.isPet); return i >= 0 ? others.splice(i, 1)[0] : pick(); };
  const mine = S.role === 'goalie' ? [hero, pick(), pick()] : [notPet(), hero, pick()];
  const a = [notPet(), pick(), pick()];
  const b = [notPet(), pick(), pick()];
  S.teams = [
    { idx: 0, kit: KITS[0], players: mine },
    { idx: 1, kit: KITS[1], players: a },
    { idx: 2, kit: KITS[2], players: b },
  ];
  S.matchNo = 0; S.results = []; S.goals = {}; S.coins = 0; S.money = 0; S.prizes = []; S.cart = []; S.trophyAttempt = 0; S.saved = false; S.matchStats = [];
}

function standings() {
  const rows = [0, 1, 2].map((i) => ({ i, pts: 0, gf: 0, ga: 0, played: 0 }));
  for (const r of S.results) {
    const A = rows[r.a], B = rows[r.b];
    A.gf += r.ga; A.ga += r.gb; B.gf += r.gb; B.ga += r.ga; A.played++; B.played++;
    if (r.ga > r.gb) A.pts += 3; else if (r.gb > r.ga) B.pts += 3; else { A.pts++; B.pts++; }
  }
  rows.sort((x, y) => (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf) || (x.i === 0 ? -1 : y.i === 0 ? 1 : 0));
  return rows;
}

function simulateOtherMatch() {
  const g = () => [0, 1, 1, 2, 2, 3][(Math.random() * 6) | 0];
  const ga = g(), gb = g();
  S.results.push({ a: 1, b: 2, ga, gb });
  const scorersOf = (team, n) => {
    const field = S.teams[team].players.slice(1);
    for (let i = 0; i < n; i++) {
      const c = field[(Math.random() * field.length) | 0];
      S.goals[c.id] = (S.goals[c.id] || 0) + 1;
    }
  };
  scorersOf(1, ga); scorersOf(2, gb);
  return { ga, gb };
}

// ── Actions ─────────────────────────────────────────────────────────────
const actions = {
  title() { screenTitle(); },
  play() { SFX.select(); screenChars(); },
  pickChar(id) {
    S.hero = id; SFX.click();
    document.querySelectorAll('.char-tile').forEach((el) => el.classList.toggle('sel', el.dataset.arg === id));
    const btn = document.querySelector('[data-act="toWorld"]');
    if (btn) btn.textContent = t('char.go', { name: charById(id).name });
  },
  toWorld() { SFX.select(); prefs.hero = S.hero; savePrefs(prefs); screenWorld(); },
  pickWorld(w) { S.theme = w; prefs.theme = w; savePrefs(prefs); setTheme(w); SFX.select(); screenRole(); },
  pickRole(r) { S.role = r; prefs.role = r; savePrefs(prefs); SFX.select(); buildCup(); screenLineup(); },
  kickoff() { SFX.whistle(); startMatch(); },
  nextMatch() { SFX.select(); startMatch(); },
  toPodium() { SFX.fanfare(); screenPodium(); },
  openTrophy() { SFX.select(); screenTrophy(); },
  toLeaderboard() { SFX.select(); screenLeaderboard(); },
  lang() { setLang(getLang() === 'en' ? 'no' : 'en'); SFX.click(); screenTitle(); },
  sound() { setMuted(!isMuted()); if (!isMuted()) SFX.click(); screenTitle(); },
  board() { SFX.select(); screenBoardView(); },
  back(where) { SFX.click(); ({ title: screenTitle, chars: screenChars, world: screenWorld, role: screenRole })[where](); },
  pause() {
    if (!match || match.paused) return;
    match.paused = true;
    input.setEnabled(false);
    const el = show(`<div class="center-col"><div class="pause-card">
      <h2 class="heading" style="margin:0">⏸ ${t('pause.title')}</h2>
      <button class="btn big pulse" data-act="resume">${t('pause.resume')}</button>
      <button class="btn white" data-act="quit">${t('pause.quit')}</button></div></div>`);
    void el;
  },
  resume() { if (!match) return; clearScreen(); match.paused = false; input.setEnabled(true); },
  quit() { endMatchCleanup(); screenTitle(); },
};

// ── Screens ─────────────────────────────────────────────────────────────
function enterMenuMode() {
  cam.mode = 'orbit';
  hudEl.classList.add('hidden');
  controlsEl.classList.add('hidden');
  labelsEl.innerHTML = '';
  clearPodium();
  clearShowcase();
}

function screenTitle() {
  endMatchCleanup();
  enterMenuMode();
  setTheme(S.theme || 'aladdin');
  const other = getLang() === 'en' ? '🇳🇴' : '🇬🇧';
  show(`
    <div class="top-left row">
      <button class="btn white small lang-btn" data-act="lang" aria-label="language">${other}</button>
      <button class="btn white small lang-btn" data-act="sound" aria-label="sound">${isMuted() ? '🔇' : '🔊'}</button>
    </div>
    <div class="top-right"><button class="btn gold small" data-act="board">${t('title.leaderboard')}</button></div>
    <div class="center-col">
      <div class="title-logo">Football<br>Blah-Blah <span class="ball">⚽</span></div>
      <div class="subtitle">${t('title.sub')}</div>
      <button class="btn big pulse" data-act="play">${t('title.play')}</button>
      ${isTouch && isPortrait() ? `<div class="rotate-tip">${t('title.rotate')}</div>` : ''}
    </div>`, 'clear');
}

function screenChars() {
  const groups = ['Kids', 'Grown-ups', 'Pets'];
  const html = groups.map((g) => {
    const list = CHARACTERS.filter((c) => c.group === g);
    if (!list.length) return '';
    return `<div class="group-title">${t(`group.${g}`)}</div><div class="char-grid">${list.map((c) => `
      <div class="char-tile ${c.id === S.hero ? 'sel' : ''}" data-act="pickChar" data-arg="${c.id}">
        <img alt="" src="${portraitOf(c.id)}"><div class="nm">${esc(c.name)}</div></div>`).join('')}</div>`;
  }).join('');
  const el = show(`
    <div class="top-left"><button class="btn white small" data-act="back" data-arg="title">${t('back')}</button></div>
    <h2 class="heading">${t('char.heading')}</h2>
    <div class="char-wrap">${html}</div>
    <div class="sticky-bottom"><button class="btn big pulse" data-act="toWorld">${t('char.go', { name: esc(charById(S.hero).name) })}</button></div>`);
  const sel = el.querySelector('.char-tile.sel');
  if (sel && sel.scrollIntoView) setTimeout(() => sel.scrollIntoView({ block: 'center' }), 50);
}

function screenWorld() {
  show(`
    <div class="top-left"><button class="btn white small" data-act="back" data-arg="chars">${t('back')}</button></div>
    <div class="center-col">
      <h2 class="heading">${t('world.heading')}</h2>
      <div class="choices">
        <div class="choice aladdin ${S.theme === 'aladdin' ? 'sel' : ''}" data-act="pickWorld" data-arg="aladdin">
          <div class="emo">🧞</div><div class="ttl">${t('world.aladdin')}</div><div class="dsc">${t('world.aladdin.d')}</div></div>
        <div class="choice circus ${S.theme === 'circus' ? 'sel' : ''}" data-act="pickWorld" data-arg="circus">
          <div class="emo">🎪</div><div class="ttl">${t('world.circus')}</div><div class="dsc">${t('world.circus.d')}</div></div>
      </div>
    </div>`);
}

function screenRole() {
  show(`
    <div class="top-left"><button class="btn white small" data-act="back" data-arg="world">${t('back')}</button></div>
    <div class="center-col">
      <h2 class="heading">${t('role.heading')}</h2>
      <div class="choices">
        <div class="choice striker ${S.role === 'striker' ? 'sel' : ''}" data-act="pickRole" data-arg="striker">
          <div class="emo">⚽</div><div class="ttl">${t('role.striker')}</div><div class="dsc">${t('role.striker.d')}</div></div>
        <div class="choice goalie ${S.role === 'goalie' ? 'sel' : ''}" data-act="pickRole" data-arg="goalie">
          <div class="emo">🧤</div><div class="ttl">${t('role.goalie')}</div><div class="dsc">${t('role.goalie.d')}</div></div>
      </div>
    </div>`);
}

function teamCard(i) {
  const tm = S.teams[i];
  const rows = tm.players.map((c, k) => `
    <div class="pl ${c.id === S.hero && i === 0 ? 'you' : ''}"><img alt="" src="${portraitOf(c.id)}">
      <span>${esc(c.name)}${k === 0 ? ' 🧤' : ''}${c.id === S.hero && i === 0 ? ` ⭐ (${t('you')})` : ''}</span></div>`).join('');
  return `<div class="team-card ${i === 0 ? 'mine' : ''}" style="background:${tm.kit.css}"><div class="tn">${esc(teamName(i))}</div>${rows}</div>`;
}

function screenLineup() {
  setTheme(S.theme);
  show(`
    <div class="top-left"><button class="btn white small" data-act="back" data-arg="role">${t('back')}</button></div>
    <div class="center-col" style="max-width:940px">
      <h2 class="heading">${t('lineup.heading', { cup: t(`lineup.cup.${S.theme}`) })} ${S.theme === 'circus' ? '🎪' : '🪔'}</h2>
      <div class="subtitle">${t('lineup.sub')}</div>
      <div class="teams">${teamCard(0)}${teamCard(1)}${teamCard(2)}</div>
      <div class="vs">${t('lineup.match', { n: 1, a: esc(teamName(0)), b: esc(teamName(1)) })}</div>
      <div style="height:96px"></div>
    </div>
    <div class="sticky-bottom"><button class="btn big pulse" data-act="kickoff">${t('lineup.kickoff')}</button></div>`);
}

// ── Match ───────────────────────────────────────────────────────────────
let hud = {};
function buildHud() {
  const opp = S.opp;
  hudEl.innerHTML = `
    <button class="hud-btn" id="pauseBtn" aria-label="pause">⏸</button>
    <div class="scoreboard">
      <span class="dot" style="background:${KITS[0].css}"></span><span class="tname">${esc(teamName(0))}</span>
      <span class="num" id="s0">0</span><span>–</span><span class="num" id="s1">0</span>
      <span class="tname">${esc(teamName(opp))}</span><span class="dot" style="background:${KITS[opp].css}"></span>
      <span class="clock" id="clock">1:20</span>
    </div>
    <div class="match-tag">${t('hud.match', { n: S.matchNo })}</div>
    <div class="coins" id="coins">🪙 0 kr</div>`;
  hudEl.querySelector('#pauseBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); actions.pause(); });
  hudEl.querySelector('#pauseBtn').style.pointerEvents = 'auto';
  hud = { s0: hudEl.querySelector('#s0'), s1: hudEl.querySelector('#s1'), clock: hudEl.querySelector('#clock'), coins: hudEl.querySelector('#coins'), lastClock: '' };
  hudEl.classList.remove('hidden');
}
function updateHud() {
  if (!match) return;
  const s = Math.ceil(match.timeLeft);
  const txt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (txt !== hud.lastClock) {
    hud.lastClock = txt;
    hud.clock.textContent = txt;
    hud.clock.classList.toggle('low', s <= 10 && match.state === 'play');
  }
}

function startMatch() {
  endMatchCleanup();
  S.matchNo++;
  S.opp = S.matchNo === 1 ? 1 : 2;
  setTheme(S.theme);
  clearScreen();
  clearPodium();
  clearShowcase();
  buildHud();
  input.build();
  controlsEl.classList.remove('hidden');
  const teams = [S.teams[0], S.teams[S.opp]];
  match = new Match({
    scene, particles, stadium, theme: S.theme, role: S.role, input, teams,
    duration: MATCH_SECONDS, firstMatch: S.matchNo === 1, camForward,
    onEvent: onMatchEvent,
  });
  setPlayerLabels(match.players);
  cam.mode = 'match';
  cam.snap = true;
  input.setEnabled(true);
  crowdStart();
  updateHud();
}

function onMatchEvent(type, data) {
  switch (type) {
    case 'toast': toast(data); break;
    case 'banner': banner(data); break;
    case 'score': hud.s0.textContent = data.score[0]; hud.s1.textContent = data.score[1]; break;
    case 'coins': hud.coins.textContent = `🪙 ${S.coins + data.total} kr`; coinPop(data.add, data.at); break;
    case 'hints':
      input.showHints({
        joyText: t('hint.joy'),
        kickText: S.role === 'goalie' ? t('hint.dive') : t('hint.kick'),
        keysHtml: S.role === 'goalie' ? t('hint.keysGoalie') : t('hint.keys'),
      });
      setTimeout(() => input.clearHints(), 12000);
      break;
    case 'itemLabel':
      if (itemLabel) { itemLabel.remove(); itemLabel = null; }
      if (data) {
        itemLabel = document.createElement('div');
        itemLabel.className = 'flabel';
        itemLabel.textContent = `${data.text} ✨`;
        labelsEl.appendChild(itemLabel);
        itemLabelPos = data.pos;
      }
      break;
    case 'ended': onMatchEnded(data); break;
    default: break;
  }
}

function onMatchEnded(res) {
  const opp = S.opp;
  S.results.push({ a: 0, b: opp, ga: res.score[0], gb: res.score[1] });
  for (const sc of res.scorers) if (sc.charId) S.goals[sc.charId] = (S.goals[sc.charId] || 0) + 1;
  S.coins += res.coins;
  S.matchStats.push(res);
  let other = null;
  if (S.matchNo === 1) other = simulateOtherMatch();
  crowdStop();
  input.setEnabled(false);
  input.clearHints();
  controlsEl.classList.add('hidden');
  screenCup(res, other);
}

function endMatchCleanup() {
  if (match) {
    match.dispose();
    match = null;
  }
  crowdStop();
  input.setEnabled(false);
  input.clearHints();
  controlsEl.classList.add('hidden');
  hudEl.classList.add('hidden');
  labelsEl.innerHTML = '';
  itemLabel = null;
  toastsEl.innerHTML = '';
}

function screenCup(res, other) {
  const [x, y] = res.score;
  const key = x > y ? 'win' : x === y ? 'draw' : 'loss';
  const rows = standings().map((r) => `
    <tr class="${r.i === 0 ? 'mine' : ''}"><td class="tn"><span class="dotc" style="background:${KITS[r.i].css}"></span>${esc(teamName(r.i))}</td>
    <td>${r.pts}</td><td>${r.gf}–${r.ga}</td></tr>`).join('');
  const last = S.matchNo >= 2;
  if (x > y) SFX.fanfare(); else if (x < y) SFX.sad();
  const el = show(`
    <div class="center-col" style="max-width:620px">
      <div class="msg-big">${t(`cup.yourResult.${key}`, { x, y })}</div>
      ${other ? `<div class="panel result-line" style="font-size:17px">${t('cup.otherMatch', { a: esc(teamName(1)), b: esc(teamName(2)), x: other.ga, y: other.gb })}</div>` : ''}
      <div class="panel">
        <div class="result-line">${last ? t('cup.final') : t('cup.after1')}</div>
        <table class="cup"><tr><th></th><th>${t('cup.pts')}</th><th>${t('cup.goals')}</th></tr>${rows}</table>
      </div>
      ${last ? `<button class="btn big pulse gold" data-act="toPodium">${t('cup.podium')}</button>`
        : `<div class="vs">${t('lineup.match', { n: 2, a: esc(teamName(0)), b: esc(teamName(2)) })}</div><button class="btn big pulse" data-act="nextMatch">${t('cup.next')}</button>`}
    </div>`);
  void el;
  cam.mode = 'orbit';
  labelsEl.innerHTML = '';
  if (match) { match.dispose(); match = null; }
  hudEl.classList.add('hidden');
}

// ── Podium ──────────────────────────────────────────────────────────────
function clearPodium() {
  if (!podium) return;
  scene.remove(podium.group);
  podium = null;
}

function screenPodium() {
  setTheme(S.theme);
  clearPodium();
  const st = standings();
  const place = st.findIndex((r) => r.i === 0) + 1;
  S.place = place;
  const group = new THREE.Group();
  const pod = buildPodium();
  group.add(pod);
  const actors = [];
  const xs = { 1: 0, 2: -3.4, 3: 3.4 };
  const hs = { 1: 1.2, 2: 0.8, 3: 0.5 };
  st.forEach((r, idx) => {
    const pl = idx + 1;
    const tm = S.teams[r.i];
    tm.players.forEach((c, k) => {
      const m = buildPlayer(c, tm.kit, { goalie: k === 0 });
      m.root.position.set(xs[pl] + (k - 1) * 1.0, hs[pl], 0.1 + (k === 1 ? 0.3 : 0));
      group.add(m.root);
      actors.push({ m, anim: { speed: 0, kickT: 0, headerT: 0, diveT: 0, celebrate: pl === 1 ? 0.01 + k * 0.3 : 0, sad: 0, jumpY: 0 }, pl, phase: k });
    });
    const tr = buildTrophy(pl);
    tr.scale.setScalar(pl === 1 ? 1.6 : 1.3);
    tr.position.set(xs[pl], hs[pl] + 2.4, 0.4);
    group.add(tr);
    actors.push({ trophy: tr, pl });
  });
  scene.add(group);
  podium = { group, actors, t: 0 };
  cam.mode = 'podium';
  cam.orbitA = 0;
  particles.confetti(0, 6, 0, 200, 5);

  // coins for the trophy + golden boot
  S.coins += COINS.trophy[place];
  const topN = Math.max(0, ...Object.values(S.goals));
  const tops = Object.keys(S.goals).filter((id) => S.goals[id] === topN && topN > 0);
  let boot = null;
  if (tops.length) boot = tops.includes(S.hero) ? S.hero : tops[0];
  if (boot === S.hero) S.coins += COINS.boot;
  S.money = S.coins;
  S.boot = boot;
  const heroGoals = S.goals[S.hero] || 0;
  S.prizes = [{ emoji: place === 1 ? '🏆' : place === 2 ? '🥈' : '🥉', name: t(`trophy.${['gold', 'silver', 'bronze'][place - 1]}`) }];
  if (heroGoals > 0) S.prizes.push({ emoji: '🏅', name: t('item.medal') });
  if (boot === S.hero) S.prizes.push({ emoji: '👟', name: t('item.goldboot') });

  const scorerList = Object.keys(S.goals).filter((id) => S.goals[id] > 0)
    .sort((a, b) => S.goals[b] - S.goals[a])
    .map((id) => `${id === S.hero ? '<b>' : ''}${esc(charById(id).name)} ${'⚽'.repeat(Math.min(S.goals[id], 6))}${id === S.hero ? '</b>' : ''}`).join(' &nbsp;•&nbsp; ');
  const you = place === 1 ? t('podium.youWon') : place === 2 ? t('podium.youSilver') : t('podium.youBronze');
  show(`
    <div class="podium-info">
      <div class="place-line">${you} ${place === 1 ? '🏆' : place === 2 ? '🥈' : '🥉'}</div>
      <div class="medals">
        ${st.map((r, i) => `${['🥇', '🥈', '🥉'][i]} ${esc(teamName(r.i))}`).join(' &nbsp; ')}<br>
        ${scorerList ? `${t('podium.medals')} ${scorerList}` : t('podium.noScorers')}<br>
        ${boot ? t('podium.boot', { name: esc(charById(boot).name), n: topN }) : ''}
        ${boot === S.hero ? `<br><b>${t('podium.bootYou')}</b>` : ''}
      </div>
      <button class="btn big pulse gold" data-act="openTrophy">${t('podium.open')}</button>
    </div>`, 'clear');
}

function updatePodium(dt) {
  if (!podium) return;
  podium.t += dt;
  for (const a of podium.actors) {
    if (a.trophy) {
      a.trophy.rotation.y += dt * 1.5;
      a.trophy.position.y += Math.sin(podium.t * 2 + a.pl) * 0.004;
      continue;
    }
    if (a.pl === 1) a.anim.celebrate += dt;
    animatePlayer(a.m, a.anim, dt);
    a.m.root.rotation.y = Math.sin(podium.t * 0.8 + a.phase) * 0.3;
  }
  if (Math.random() < dt * 1.5) particles.firework((Math.random() - 0.5) * 16, 7 + Math.random() * 3, -4 - Math.random() * 3);
}

// ── Trophy opening ──────────────────────────────────────────────────────
function trophySvg(place) {
  const col = '#' + TROPHY_COLORS[place].toString(16).padStart(6, '0');
  return `<svg class="trophy-svg" viewBox="0 0 200 230">
    <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <path d="M40 60 C 0 60, 5 120, 60 125" fill="none" stroke="${col}" stroke-width="12"/>
    <path d="M160 60 C 200 60, 195 120, 140 125" fill="none" stroke="${col}" stroke-width="12"/>
    <path d="M40 40 L160 40 L150 120 C 140 150, 60 150, 50 120 Z" fill="${col}" stroke="#3a1f5e" stroke-width="5"/>
    <path d="M40 40 L160 40 L150 120 C 140 150, 60 150, 50 120 Z" fill="url(#tg)"/>
    <rect x="88" y="145" width="24" height="35" fill="${col}" stroke="#3a1f5e" stroke-width="5"/>
    <rect x="55" y="178" width="90" height="40" rx="6" fill="#3a1f5e"/>
    <text x="100" y="206" text-anchor="middle" font-size="26" font-weight="700" fill="${col}" font-family="sans-serif">${place}</text>
    <g class="lid"><ellipse cx="100" cy="38" rx="64" ry="12" fill="${col}" stroke="#3a1f5e" stroke-width="5"/><circle cx="100" cy="22" r="10" fill="${col}" stroke="#3a1f5e" stroke-width="4"/></g>
  </svg>`;
}

function screenTrophy() {
  clearPodium();
  showHeroShowcase();
  const place = S.place;
  const el = show(`
    <div class="center-col">
      <div class="msg-big">${t(`trophy.${['gold', 'silver', 'bronze'][place - 1]}`)}</div>
      <div class="trophy-stage" id="trophy">${trophySvg(place)}<div class="surprise" id="surprise"></div></div>
      <div class="tap-me" id="tapme">${t('trophy.tap')}</div>
      <div id="trophyResult" class="center-col" style="gap:10px;margin:0"></div>
    </div>`);
  const stage = el.querySelector('#trophy');
  let opened = false;
  stage.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    unlockAudio();
    el.querySelector('#tapme').remove();
    stage.classList.add('shake');
    SFX.drumroll(1.0);
    setTimeout(() => {
      stage.classList.remove('shake');
      const item = pickSurprise(place, S.trophyAttempt);
      el.querySelector('#surprise').textContent = item.emoji;
      stage.classList.add('open');
      const res = el.querySelector('#trophyResult');
      if (item.id === 'diaper') {
        SFX.fart();
        S.prizes.push({ emoji: '🍼', name: t('item.diaper') });
        const can = S.money >= COINS.newTrophy;
        res.innerHTML = `
          <div class="msg-big">${t('trophy.diaper')}</div>
          <div class="subtitle">${t('trophy.diaperSub')}</div>
          <div class="row">
            <button class="btn gold" id="buyTrophy" ${can ? '' : 'disabled'}>${t('trophy.buy', { price: COINS.newTrophy })}</button>
            <button class="btn blue" id="againBtn">${t('trophy.again')}</button>
            <button class="btn" id="nextBtn">${t('trophy.next')}</button>
          </div>
          ${can ? '' : `<div class="subtitle" style="font-size:15px">${t('trophy.noMoney')}</div>`}`;
        res.querySelector('#buyTrophy').addEventListener('click', () => {
          if (S.money < COINS.newTrophy) return;
          S.money -= COINS.newTrophy;
          S.trophyAttempt++;
          SFX.coin();
          screenTrophy();
        });
        res.querySelector('#againBtn').addEventListener('click', () => {
          SFX.select();
          if (!S.saved) { submitScore(charById(S.hero).name, S.coins); S.saved = true; }
          buildCup();
          screenLineup();
        });
        res.querySelector('#nextBtn').addEventListener('click', () => { SFX.select(); screenLeaderboard(); });
      } else {
        SFX.fanfare();
        particles.confetti(0, 2.5, 0, 160, 4);
        S.prizes.push({ emoji: item.emoji, name: t(`item.${item.id}`) });
        res.innerHTML = `
          <div class="msg-big">${t('trophy.youGot', { item: `${item.emoji} ${t(`item.${item.id}`)}` })}</div>
          <button class="btn big pulse" id="nextBtn">${t('trophy.next')}</button>`;
        res.querySelector('#nextBtn').addEventListener('click', () => { SFX.select(); screenLeaderboard(); });
      }
    }, 1000);
  });
}

// ── Hero showcase (3D) ──────────────────────────────────────────────────
function clearShowcase() {
  if (!showcase) return;
  scene.remove(showcase.group);
  showcase = null;
}
function showHeroShowcase() {
  clearShowcase();
  const g = new THREE.Group();
  const m = buildPlayer(charById(S.hero), KITS[0]);
  g.add(m.root);
  const sh = blobShadow(1.4);
  g.add(sh);
  const tr = buildTrophy(S.place);
  tr.position.set(0, m.height + 0.45, 0.2);
  tr.scale.setScalar(0.8);
  g.add(tr);
  scene.add(g);
  showcase = { group: g, m, tr, anim: { speed: 0, kickT: 0, headerT: 0, diveT: 0, celebrate: 0.01, sad: 0, jumpY: 0 } };
  cam.mode = 'hero';
  cam.orbitA = 0;
}
function updateShowcase(dt) {
  if (!showcase) return;
  showcase.anim.celebrate += dt;
  animatePlayer(showcase.m, showcase.anim, dt);
  showcase.tr.rotation.y += dt * 1.5;
  showcase.tr.position.y = showcase.m.height + 0.45 + showcase.m.inner.position.y;
}

// ── Leaderboard ─────────────────────────────────────────────────────────
function boardRows(entries, me) {
  if (!entries.length) return `<div class="muted-note" style="padding:20px">${t('lb.empty')}</div>`;
  return entries.map((e, i) => `<div class="lb-row ${me && e.name === me ? 'me' : ''}"><span class="rk">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span><span class="nm">${esc(e.name)}</span><span class="sc">${e.score} kr</span></div>`).join('');
}

function screenLeaderboard() {
  if (!showcase) showHeroShowcase();
  const defaultName = S.playerName || charById(S.hero).name;
  const el = show(`
    <h2 class="heading">${t('lb.title')}</h2>
    <div class="lb-wrap">
      <div class="panel center-col" style="margin:0;gap:10px">
        <div class="result-line">${t('lb.yourScore')}</div>
        <div class="score-big">${S.coins} kr</div>
        <div class="result-line" style="font-size:18px">${t('lb.typeName')}</div>
        <input class="name" id="nameIn" maxlength="16" value="${esc(defaultName)}" autocomplete="off" autocapitalize="words" spellcheck="false">
        <button class="btn big pulse" id="saveBtn">${t('lb.save')}</button>
      </div>
      <div class="panel"><div class="lb-list" id="lbList"><div class="muted-note">${t('lb.loading')}</div></div><div class="muted-note" id="lbNote"></div></div>
    </div>`);
  const list = el.querySelector('#lbList');
  const render = (entries, offline, me) => {
    list.innerHTML = boardRows(entries, me);
    el.querySelector('#lbNote').textContent = offline ? t('lb.offline') : '';
  };
  fetchScores(50).then(({ entries, offline }) => { if (list.isConnected) render(entries, offline); });
  const save = async () => {
    const name = (el.querySelector('#nameIn').value || '').trim() || charById(S.hero).name;
    S.playerName = name;
    if (!S.saved) { S.saved = true; await Promise.race([submitScore(name, S.coins), new Promise((r) => setTimeout(r, 1500))]); }
    SFX.coin();
    screenShop();
  };
  el.querySelector('#saveBtn').addEventListener('click', () => { unlockAudio(); save(); });
  el.querySelector('#nameIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
}

function screenBoardView() {
  const el = show(`
    <div class="top-left"><button class="btn white small" data-act="back" data-arg="title">${t('lb.back')}</button></div>
    <div class="center-col" style="max-width:560px">
      <h2 class="heading">${t('lb.title')}</h2>
      <div class="panel"><div class="lb-list" id="lbList"><div class="muted-note">${t('lb.loading')}</div></div><div class="muted-note" id="lbNote"></div></div>
    </div>`);
  fetchScores(50).then(({ entries, offline }) => {
    const list = el.querySelector('#lbList');
    if (!list || !list.isConnected) return;
    list.innerHTML = boardRows(entries, null);
    el.querySelector('#lbNote').textContent = offline ? t('lb.offline') : '';
  });
}

// ── Shop ────────────────────────────────────────────────────────────────
function screenShop() {
  const el = show(`
    <div class="shop-head"><h2 class="heading" style="margin:0">${t('shop.title')}</h2><div class="wallet" id="wallet">🪙 ${S.money} kr</div></div>
    <div class="shop-msg" id="shopMsg">${t('shop.tip')}</div>
    <div class="shop-grid" id="grid">${SHOP_ITEMS.map((it) => `
      <div class="item" data-id="${it.id}"><div class="e">${it.emoji}</div><div class="n">${t(`item.${it.id}`)}</div><div class="p">${it.price} kr</div></div>`).join('')}
    </div>
    <div class="sticky-bottom"><button class="btn big pulse" id="doneBtn">${t('shop.done')}</button></div>`);
  const refresh = () => {
    el.querySelector('#wallet').textContent = `🪙 ${S.money} kr`;
    el.querySelectorAll('.item').forEach((node) => {
      const it = SHOP_ITEMS.find((x) => x.id === node.dataset.id);
      const owned = S.cart.includes(it.id);
      node.classList.toggle('owned', owned);
      node.classList.toggle('cant', !owned && S.money < it.price);
    });
  };
  refresh();
  const msg = el.querySelector('#shopMsg');
  el.querySelector('#grid').addEventListener('click', (e) => {
    const node = e.target.closest('.item');
    if (!node) return;
    unlockAudio();
    const it = SHOP_ITEMS.find((x) => x.id === node.dataset.id);
    if (S.cart.includes(it.id)) {
      S.cart.splice(S.cart.indexOf(it.id), 1);
      S.money += it.price;
      SFX.click();
    } else if (S.money >= it.price) {
      S.cart.push(it.id);
      S.money -= it.price;
      SFX.coin();
      msg.textContent = `${it.emoji} ✓`;
    } else {
      SFX.wrong();
      node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
      msg.textContent = t('shop.need', { need: it.price - S.money });
    }
    refresh();
  });
  el.querySelector('#doneBtn').addEventListener('click', () => { SFX.select(); screenPrizes(); });
}

function screenPrizes() {
  if (!showcase) showHeroShowcase();
  const all = [...S.prizes, ...S.cart.map((id) => { const it = SHOP_ITEMS.find((x) => x.id === id); return { emoji: it.emoji, name: t(`item.${id}`) }; })];
  SFX.fanfare();
  particles.confetti(0, 3, 0, 200, 4);
  show(`
    <div class="center-col">
      <div class="msg-big">${t('prizes.title', { name: esc(S.playerName || charById(S.hero).name) })}</div>
      <div class="prize-grid">${all.map((p, i) => `<div class="prize" style="animation-delay:${i * 0.08}s"><div class="e">${p.emoji}</div><div class="n">${esc(p.name)}</div></div>`).join('')}</div>
      ${S.cart.length ? '' : `<div class="subtitle">${t('prizes.none')}</div>`}
      <button class="btn big pulse" data-act="title">${t('prizes.again')}</button>
    </div>`, 'clear');
}

// ── Main loop ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let acc = 0;
let timeScale = 1;
let elapsed = 0;
function frame() {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, clock.getDelta());
  elapsed += dt;
  if (match) {
    acc += dt * timeScale;
    const step = 1 / 60;
    let n = 0;
    while (acc >= step && n < 12 * timeScale) { match.update(step); acc -= step; n++; }
    if (n >= 12 * timeScale) acc = 0;
    updateHud();
  }
  updatePodium(dt);
  updateShowcase(dt);
  if (stadium) stadium.update(elapsed, dt);
  particles.update(dt);
  updateCamera(dt);
  updateLabels();
  renderer.render(scene, camera);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && match && match.state === 'play' && !match.paused) actions.pause();
});

// Prevent iOS pinch-zoom / double-tap zoom gestures.
document.addEventListener('gesturestart', (e) => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd < 300 && !(e.target && e.target.tagName === 'INPUT')) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// ── Boot ────────────────────────────────────────────────────────────────
function boot() {
  setTheme(S.theme || 'aladdin');
  // let the first frame paint, then make portraits
  requestAnimationFrame(() => {
    try { portraits = renderPortraits(CHARACTERS); } catch { portraits = {}; }
    $('#loading').classList.add('hidden');
    screenTitle();
  });
  frame();
}
boot();

// Test hooks (harmless in production)
window.__fb = {
  S, actions,
  get match() { return match; },
  setTimeScale(k) { timeScale = k; },
  screens: { screenTitle, screenChars, screenWorld, screenRole, screenLineup, screenPodium, screenTrophy, screenLeaderboard, screenShop, screenPrizes },
  startMatch, cam,
};
