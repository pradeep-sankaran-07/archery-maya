/**
 * Procedural sound effects using Web Audio API.
 * No audio files needed — all SFX synthesized on demand.
 */
let ctx;
let masterGain;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur = 0.12, type = 'sine', vol = 0.5, sweep = 0) {
  const c = ensureCtx();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (sweep !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), c.currentTime + dur);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g); g.connect(masterGain);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

function noiseBurst(dur = 0.1, vol = 0.3, hpf = 600) {
  const c = ensureCtx();
  if (!c || muted) return;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const filt = c.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = hpf;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(filt); filt.connect(g); g.connect(masterGain);
  src.start();
}

export const SFX = {
  click() { blip(640, 0.07, 'square', 0.3); },
  select() { blip(540, 0.06, 'sine', 0.35); blip(820, 0.08, 'sine', 0.3); },
  shoot() { noiseBurst(0.08, 0.25, 1000); blip(320, 0.1, 'sawtooth', 0.18, -160); },
  hit() { blip(820, 0.06, 'triangle', 0.4); blip(420, 0.12, 'sine', 0.3); },
  bullseye() { blip(880, 0.1, 'triangle', 0.5); blip(1320, 0.14, 'sine', 0.4); blip(1760, 0.2, 'sine', 0.35); },
  coin() { blip(988, 0.06, 'sine', 0.3); blip(1318, 0.12, 'sine', 0.3); },
  correct() { blip(660, 0.08, 'sine', 0.4); blip(880, 0.1, 'sine', 0.4); blip(1175, 0.14, 'sine', 0.4); },
  wrong() { blip(220, 0.18, 'square', 0.3, -50); },
  jump() { blip(440, 0.08, 'sine', 0.3, 300); },
  damage() { blip(160, 0.2, 'sawtooth', 0.4, -40); },
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.4), i * 130));
  },
  bite() { noiseBurst(0.06, 0.3, 400); },
  swim() { blip(180, 0.18, 'sine', 0.18); },
  splash() { noiseBurst(0.18, 0.3, 500); },
};

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }
