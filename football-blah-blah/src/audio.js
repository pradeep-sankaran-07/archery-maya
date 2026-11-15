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

function tone(freq, dur = 0.12, type = 'sine', vol = 0.4, { sweep = 0, delay = 0, attack = 0.01 } = {}) {
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
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise(dur = 0.2, vol = 0.3, { type = 'bandpass', freq = 1000, q = 1, delay = 0, attack = 0.01, sweepTo = 0 } = {}) {
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
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
}

export const SFX = {
  click() { tone(660, 0.07, 'square', 0.15); },
  select() { tone(540, 0.07, 'sine', 0.3); tone(820, 0.1, 'sine', 0.28, { delay: 0.06 }); },
  kick(power = 1) {
    tone(150, 0.12, 'sine', 0.6 * power, { sweep: -90 });
    noise(0.06, 0.25 * power, { type: 'lowpass', freq: 1800 });
  },
  pass() { tone(200, 0.08, 'sine', 0.35, { sweep: -80 }); noise(0.04, 0.12, { type: 'lowpass', freq: 1500 }); },
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
    noise(2.2, 0.35, { type: 'bandpass', freq: 900, q: 0.6, attack: 0.25 });
    noise(1.8, 0.22, { type: 'bandpass', freq: 2200, q: 0.8, attack: 0.2, delay: 0.1 });
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

/** Soft looping crowd murmur during matches. */
export function crowdStart() {
  if (!ctx || crowd) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.5;
  const g = ctx.createGain(); g.gain.value = 0.045;
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
  crowd = { src, g };
}
export function crowdStop() {
  if (!crowd) return;
  try { crowd.src.stop(); } catch { /* ignore */ }
  crowd = null;
}
