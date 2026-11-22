// Sounds are synthesized with Web Audio (no files) and cheers are spoken
// with the browser's built-in voice (speechSynthesis).
import { settings } from './save.js';

let ctx = null;
let master = null;
let noiseBuf = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  // iOS only lets speech start from a tap: say nothing once to unlock it.
  if (!unlockAudio.spoke && 'speechSynthesis' in window) {
    unlockAudio.spoke = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch { /* ignore */ }
  }
}

const on = () => ctx && settings().sound;

function tone(freq, dur = 0.15, type = 'sine', vol = 0.3, { delay = 0, sweep = 0, attack = 0.01 } = {}) {
  if (!on()) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + sweep), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise(dur = 0.2, vol = 0.2, { type = 'bandpass', freq = 1000, q = 1, delay = 0, sweepTo = 0 } = {}) {
  if (!on()) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur + 0.05);
}

const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
const seq = (notes, step, type = 'triangle', vol = 0.25, len = 0.9) =>
  notes.forEach((m, i) => { if (m > 0) tone(N(m), step * len * (i === notes.length - 1 ? 3 : 1), type, vol, { delay: i * step }); });

export const SFX = {
  tap() { tone(660, 0.06, 'sine', 0.2); },
  key() { tone(520 + Math.random() * 80, 0.05, 'triangle', 0.18); },
  erase() { tone(400, 0.06, 'triangle', 0.15, { sweep: -150 }); },
  correct() {
    seq([72, 76, 79, 84], 0.08, 'triangle', 0.28);
    [2093, 2637, 3136].forEach((f, i) => tone(f, 0.2, 'sine', 0.08, { delay: 0.32 + i * 0.05 }));
  },
  streak() { seq([79, 83, 86, 91], 0.06, 'square', 0.12); },
  // Soft and friendly: a little "hmm?" not a buzzer.
  oops() { tone(392, 0.16, 'sine', 0.22, { sweep: 40 }); tone(330, 0.24, 'sine', 0.2, { delay: 0.16, sweep: -20 }); },
  star(i = 0) { tone(1318 + i * 220, 0.12, 'sine', 0.2); tone(1976 + i * 220, 0.18, 'sine', 0.12, { delay: 0.05 }); },
  whoosh() { noise(0.5, 0.25, { freq: 400, q: 0.8, sweepTo: 2600 }); },
  drumroll(sec = 1) { for (let i = 0; i < sec * 24; i++) noise(0.05, 0.08 + i / (sec * 24) * 0.1, { freq: 220, delay: i / 24 }); },
  chest() {
    noise(0.3, 0.3, { freq: 600, q: 0.7, sweepTo: 3000 });
    seq([60, 64, 67, 72, 76, 79, 84], 0.07, 'triangle', 0.22);
    [2637, 3136, 3520, 4186].forEach((f, i) => tone(f, 0.3, 'sine', 0.06, { delay: 0.5 + i * 0.07 }));
  },
  badge() { seq([67, 67, 67, 72, 76, 79], 0.12, 'square', 0.12); seq([55, 55, 55, 60, 64, 67], 0.12, 'triangle', 0.18); },
  fanfare() { seq([60, 64, 67, 72, -1, 67, 72], 0.13, 'triangle', 0.28); seq([48, 52, 55, 60, -1, 55, 60], 0.13, 'sawtooth', 0.06); },
  pop() { tone(420, 0.09, 'sine', 0.28, { sweep: 600 }); },
  // A little musical "hello" when you enter each world.
  jingle(world) {
    switch (world) {
      case 'lionking': // big drums and a sunrise call
        [0, 0.25, 0.5, 0.62, 0.75].forEach((d) => { tone(80, 0.3, 'sine', 0.5, { delay: d, sweep: -30 }); noise(0.1, 0.15, { type: 'lowpass', freq: 400, delay: d }); });
        seq([-1, -1, -1, -1, 69, 72, 76, 74], 0.14, 'triangle', 0.22);
        break;
      case 'mufasa': // warm horns
        seq([62, 69, 67, 74], 0.22, 'sawtooth', 0.07); seq([50, 57, 55, 62], 0.22, 'triangle', 0.2);
        break;
      case 'showman': // circus brass
        seq([67, 72, 76, 79, 76, 79, 84], 0.1, 'square', 0.1); seq([48, 55, 48, 55, 48, 55, 60], 0.1, 'triangle', 0.22);
        break;
      case 'aladdin': // desert scale
        seq([64, 65, 68, 69, 71, 72, 76], 0.1, 'triangle', 0.22);
        noise(0.6, 0.06, { type: 'highpass', freq: 5000, delay: 0.7 });
        break;
      case 'ducks': // stadium organ "charge!"
        seq([67, 72, 76, 79, -1, 76, 79], 0.11, 'square', 0.12);
        break;
      case 'rock': // power chord
        [40, 47, 52].forEach((m) => tone(N(m), 0.9, 'sawtooth', 0.12));
        [0, 0.15, 0.3].forEach((d) => noise(0.08, 0.2, { type: 'highpass', freq: 3000, delay: 0.5 + d }));
        break;
      default:
        seq([72, 74, 76, 79, 81, 84], 0.09, 'sine', 0.25);
    }
  },
};

// ── voice ──────────────────────────────────────────────────────

let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  if (!vs.length) return null;
  const pref = ['Samantha', 'Google UK English Female', 'Google US English', 'Karen', 'Moira', 'Tessa', 'Serena', 'Female', 'Zira', 'Aria', 'Jenny'];
  for (const p of pref) {
    const v = vs.find((x) => x.name.includes(p));
    if (v) return v;
  }
  return vs[0];
}
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
}

/** Say something out loud. `force` ignores the voice setting (read-aloud button). */
export function say(text, { force = false, rate = 1.0, pitch = 1.15 } = {}) {
  if (!('speechSynthesis' in window)) return;
  if (!force && !settings().voice) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    voice = voice || pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.rate = rate; u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function stopTalking() {
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch { /* ignore */ }
}
