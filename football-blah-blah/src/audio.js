// All sounds are synthesized with Web Audio. No files to load.
let ctx = null;
let master = null;
let muted = false;
let crowd = null;
let noiseBuf = null;

const MUTE_KEY = 'football-maya.muted';
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* ignore */ }

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    // 2 s of white noise, reused by every noisy sound.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ }
  if (master) master.gain.value = m ? 0 : 0.5;
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.4, { sweep = 0, delay = 0, attack = 0.01, dest = null } = {}) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise(dur = 0.2, vol = 0.3, { type = 'bandpass', freq = 1000, q = 1, delay = 0, attack = 0.01, sweepTo = 0, dest = null } = {}) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(dest || master);
  src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
}

export const SFX = {
  click() { tone(660, 0.07, 'square', 0.15); },
  select() { tone(540, 0.07, 'sine', 0.3); tone(820, 0.1, 'sine', 0.28, { delay: 0.06 }); },
  // A proper "thwack": a low thump plus a mid "pock" you can hear on phone speakers.
  kick(power = 1) {
    tone(120, 0.16, 'sine', 0.7 * power, { sweep: -70 });
    tone(420, 0.07, 'triangle', 0.45 * power, { sweep: -220 });
    noise(0.05, 0.5 * power, { type: 'bandpass', freq: 1700, q: 0.9 });
    noise(0.12, 0.18 * power, { type: 'lowpass', freq: 700, delay: 0.01 });
  },
  pass() {
    tone(160, 0.1, 'sine', 0.45, { sweep: -70 });
    tone(520, 0.05, 'triangle', 0.25, { sweep: -200 });
    noise(0.04, 0.3, { type: 'bandpass', freq: 2000, q: 1 });
  },
  // soft foot-on-ball taps while dribbling
  touch(vol = 1) {
    tone(300 + Math.random() * 60, 0.05, 'triangle', 0.16 * vol, { sweep: -120 });
    noise(0.03, 0.12 * vol, { type: 'bandpass', freq: 1500 + Math.random() * 500, q: 1.2 });
  },
  net() { noise(0.55, 0.35, { type: 'bandpass', freq: 2600, q: 0.6, attack: 0.02, sweepTo: 900 }); tone(90, 0.25, 'sine', 0.3, { sweep: -30 }); },
  tackle() { tone(140, 0.09, 'sine', 0.45, { sweep: -60 }); noise(0.08, 0.3, { type: 'lowpass', freq: 1200 }); },
  header() { tone(260, 0.1, 'triangle', 0.4, { sweep: -120 }); tone(520, 0.06, 'sine', 0.2, { delay: 0.02 }); },
  bounce() { tone(110, 0.08, 'sine', 0.18, { sweep: -40 }); },
  post() { tone(1250, 0.5, 'triangle', 0.25); tone(1870, 0.4, 'sine', 0.12); },
  whistle(long = false) {
    if (!ctx || muted) return;
    const dur = long ? 0.9 : 0.35;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 2900;
    lfo.frequency.value = 38; lg.gain.value = 140;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.02);
    g.gain.setValueAtTime(0.22, t0 + dur - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); lfo.start(t0); o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
  },
  cheer() {
    crowdRoar(3.5);
    noise(2.6, 0.4, { type: 'bandpass', freq: 900, q: 0.6, attack: 0.25 });
    noise(2.2, 0.26, { type: 'bandpass', freq: 2200, q: 0.8, attack: 0.2, delay: 0.1 });
    for (let i = 0; i < 6; i++) tone(700 + Math.random() * 500, 0.25, 'triangle', 0.05, { delay: 0.2 + Math.random() * 1.2, sweep: 200 });
  },
  ooh() { noise(1.0, 0.22, { type: 'bandpass', freq: 500, q: 1.2, attack: 0.15, sweepTo: 300 }); },
  groan() { noise(0.9, 0.18, { type: 'bandpass', freq: 380, q: 1.5, attack: 0.1, sweepTo: 220 }); },
  goalJingle(theme) {
    const notes = theme === 'circus'
      ? [523, 659, 784, 659, 784, 1046]
      : [440, 554, 659, 740, 880, 1109];
    notes.forEach((f, i) => tone(f, 0.22, 'triangle', 0.28, { delay: i * 0.11 }));
    tone(notes[notes.length - 1] / 2, 0.8, 'sine', 0.2, { delay: notes.length * 0.11 });
  },
  sad() { [392, 349, 311].forEach((f, i) => tone(f, 0.3, 'triangle', 0.22, { delay: i * 0.2 })); },
  save() { tone(330, 0.1, 'square', 0.15); tone(660, 0.18, 'triangle', 0.3, { delay: 0.05 }); },
  catchBall() { tone(180, 0.1, 'sine', 0.4, { sweep: -60 }); },
  sparkle() { [1320, 1760, 2093, 2637].forEach((f, i) => tone(f, 0.18, 'sine', 0.15, { delay: i * 0.06 })); },
  power() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, 'triangle', 0.25, { delay: i * 0.07 }));
    noise(0.8, 0.15, { type: 'highpass', freq: 3000, attack: 0.1 });
  },
  whoosh() { noise(0.7, 0.35, { type: 'bandpass', freq: 400, q: 0.8, sweepTo: 2400, attack: 0.15 }); },
  superShot() { noise(0.6, 0.4, { type: 'bandpass', freq: 300, q: 0.7, sweepTo: 3000 }); tone(110, 0.5, 'sawtooth', 0.25, { sweep: 600 }); },
  roar() {
    tone(95, 0.9, 'sawtooth', 0.35, { sweep: -35, attack: 0.08 });
    noise(0.9, 0.35, { type: 'lowpass', freq: 700, attack: 0.08 });
  },
  trumpet() {
    tone(330, 0.7, 'sawtooth', 0.22, { sweep: 260, attack: 0.05 });
    tone(335, 0.7, 'square', 0.1, { sweep: 250, attack: 0.05 });
  },
  boom() { tone(70, 0.7, 'sine', 0.7, { sweep: -40 }); noise(0.6, 0.5, { type: 'lowpass', freq: 900 }); },
  coin() { tone(988, 0.07, 'sine', 0.25); tone(1318, 0.14, 'sine', 0.25, { delay: 0.06 }); },
  wrong() { tone(220, 0.2, 'square', 0.18, { sweep: -60 }); },
  fanfare() {
    [523, 523, 523, 698, 880, 1046].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.16, 'triangle', 0.3, { delay: [0, 0.15, 0.3, 0.45, 0.7, 0.95][i] }));
  },
  pop() { tone(500, 0.08, 'sine', 0.3, { sweep: 700 }); },
  fart() { tone(90, 0.5, 'sawtooth', 0.3, { sweep: -30 }); noise(0.5, 0.2, { type: 'lowpass', freq: 300 }); },
  drumroll(dur = 1.2) { for (let i = 0; i < dur * 22; i++) noise(0.05, 0.12, { type: 'bandpass', freq: 200, delay: i / 22 }); },
};

/** Stadium crowd during matches: a murmur that breathes, swells when the ball
 *  is near a goal, roars for goals, and claps along now and then. */
let crowdLevel = 0.25, roarUntil = 0;
export function crowdExcite(level) { crowdLevel = Math.max(0, Math.min(1, level)); }
function crowdRoar(sec) { if (ctx) roarUntil = ctx.currentTime + sec; }
export function crowdStart() {
  if (!ctx || crowd) return;
  const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(master);
  const layer = (freq, q, vol) => {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(0, Math.random() * 1.5);
    return { src, g, base: vol };
  };
  const layers = [layer(420, 0.7, 1.0), layer(1100, 0.9, 0.6), layer(2400, 1.2, 0.25)];
  let nextChant = ctx.currentTime + 8 + Math.random() * 8;
  const tick = () => {
    if (!crowd) return;
    const now = ctx.currentTime;
    const roar = now < roarUntil ? 1 : 0;
    const lvl = Math.max(crowdLevel, roar);
    // murmur breathes a little; louder and brighter when exciting
    const target = (0.06 + lvl * 0.16) * (0.85 + Math.random() * 0.3);
    bus.gain.setTargetAtTime(muted ? 0 : target, now, 0.35);
    layers[2].g.gain.setTargetAtTime(layers[2].base * (0.5 + lvl * 1.5), now, 0.4);
    if (now > nextChant && !roar) {
      clapChant(now + 0.1);
      nextChant = now + 16 + Math.random() * 14;
    }
  };
  const timer = setInterval(tick, 250);
  tick();
  crowd = { layers, bus, timer };
}
function clapChant(t0) {
  // "clap clap, clap-clap-clap" x2, many hands slightly out of sync
  const beats = [0, 0.42, 0.84, 1.05, 1.26];
  for (let r = 0; r < 2; r++) {
    for (const b of beats) {
      for (let h = 0; h < 7; h++) {
        noise(0.045, 0.05, { type: 'bandpass', freq: 1300 + Math.random() * 900, q: 1.4, delay: t0 - ctx.currentTime + r * 1.9 + b + Math.random() * 0.03 });
      }
    }
  }
}
export function crowdStop() {
  if (!crowd) return;
  clearInterval(crowd.timer);
  const c = crowd; crowd = null;
  try { c.bus.gain.setTargetAtTime(0, ctx.currentTime, 0.2); } catch { /* ignore */ }
  setTimeout(() => { c.layers.forEach((l) => { try { l.src.stop(); } catch { /* ignore */ } }); }, 800);
}

/** Gentle, cheerful background music for the menus (synthesized, loops). */
let music = null;
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// C – G – Am – F, then C – F – G – C
const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [60, 64, 67], [53, 57, 60], [55, 59, 62], [60, 64, 67]];
const ARP = [0, 1, 2, 1, 0, 2, 1, 2];
const MELODY = [ // one note per beat (-1 = rest), simple and sing-song
  76, 74, 72, 74, 74, 71, 67, -1, 72, 74, 76, 72, 77, 76, 74, -1,
  76, 79, 77, 76, 72, 74, 76, 77, 74, 72, 71, 74, 72, -1, -1, -1,
];
export function musicStart() {
  if (!ctx || music) return;
  const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(master);
  bus.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
  const spb = 60 / 100; // 100 bpm
  let step = 0; // eighth notes
  let nextT = ctx.currentTime + 0.15;
  const timer = setInterval(() => {
    if (!music || muted) { nextT = ctx.currentTime + 0.1; return; }
    while (nextT < ctx.currentTime + 0.35) {
      const bar = Math.floor(step / 8) % CHORDS.length;
      const ch = CHORDS[bar];
      const e = step % 8;
      const d = Math.max(0, nextT - ctx.currentTime);
      if (e === 0) {
        // soft pad + bass for the whole bar
        ch.forEach((n) => tone(NOTE(n), spb * 4, 'triangle', 0.022, { delay: d, attack: 0.25, dest: bus }));
        tone(NOTE(ch[0] - 12), spb * 1.8, 'triangle', 0.07, { delay: d, attack: 0.02, dest: bus });
      }
      if (e === 4) tone(NOTE(ch[0] - 12), spb * 1.8, 'triangle', 0.06, { delay: d, attack: 0.02, dest: bus });
      // plucky arpeggio
      tone(NOTE(ch[ARP[e]] + 12), spb * 0.45, 'sine', 0.035, { delay: d, attack: 0.005, dest: bus });
      // light shaker on the off-beats
      if (e % 2 === 1) noise(0.05, 0.012, { type: 'highpass', freq: 6000, delay: d, dest: bus });
      // melody on the beats
      if (e % 2 === 0) {
        const m = MELODY[(Math.floor(step / 2)) % MELODY.length];
        if (m > 0) tone(NOTE(m), spb * 0.9, 'triangle', 0.045, { delay: d, attack: 0.02, dest: bus });
      }
      step++;
      nextT += spb / 2;
    }
  }, 90);
  music = { bus, timer };
}
export function musicStop() {
  if (!music) return;
  const m = music; music = null;
  clearInterval(m.timer);
  try { m.bus.gain.setTargetAtTime(0, ctx.currentTime, 0.3); } catch { /* ignore */ }
  setTimeout(() => { try { m.bus.disconnect(); } catch { /* ignore */ } }, 1500);
}

/** For tests: what's playing right now. */
export function audioState() {
  return { ctx: ctx ? ctx.state : 'none', music: !!music, crowd: !!crowd, crowdLevel, muted };
}
