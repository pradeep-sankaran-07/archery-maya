// Touch joystick + big buttons + keyboard, all feeding one simple state.
export const isTouch = (() => {
  try {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  } catch { return false; }
})();

export class Input {
  constructor(root) {
    this.root = root;
    this.keys = new Set();
    this.joy = { x: 0, y: 0, id: null };
    this.pressed = { kick: false, pass: false, power: false };
    this.held = { kick: false };
    this.enabled = false;
    this.onPause = null;
    this.usedJoystick = false;
    this.usedKick = false;

    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      const k = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(k.toLowerCase());
      if (!this.enabled) return;
      if (k === ' ' || k === 'j' || k === 'J') { this.pressed.kick = true; this.usedKick = true; this.flash('kick'); }
      if (k === 'Shift' || k === 'p' || k === 'P' || k === 'k' || k === 'K') { this.pressed.pass = true; this.flash('pass'); }
      if (k === 'e' || k === 'E' || k === 'Enter') { this.pressed.power = true; this.flash('power'); }
      if (k === 'Escape' && this.onPause) this.onPause();
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.key.toLowerCase()); });
    window.addEventListener('blur', () => { this.keys.clear(); this.resetJoy(); });
  }

  build() {
    this.root.innerHTML = '';
    const zone = document.createElement('div');
    zone.className = 'joy-zone';
    const base = document.createElement('div'); base.className = 'joy-base hidden';
    const knob = document.createElement('div'); knob.className = 'joy-knob hidden';
    zone.append(base, knob);
    this.root.appendChild(zone);
    this.zone = zone; this.base = base; this.knob = knob;
    const R = 55;
    const start = (e) => {
      if (!this.enabled || this.joy.id !== null) return;
      e.preventDefault();
      this.joy.id = e.pointerId;
      try { zone.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const r = zone.getBoundingClientRect();
      this.joy.cx = e.clientX; this.joy.cy = e.clientY;
      base.style.left = `${e.clientX - r.left}px`; base.style.top = `${e.clientY - r.top}px`;
      knob.style.left = base.style.left; knob.style.top = base.style.top;
      base.classList.remove('hidden'); knob.classList.remove('hidden');
      this.usedJoystick = true;
      if (this.hintJoy) { this.hintJoy.remove(); this.hintJoy = null; }
    };
    const move = (e) => {
      if (e.pointerId !== this.joy.id) return;
      e.preventDefault();
      let dx = e.clientX - this.joy.cx, dy = e.clientY - this.joy.cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      const r = zone.getBoundingClientRect();
      knob.style.left = `${this.joy.cx + dx - r.left}px`; knob.style.top = `${this.joy.cy + dy - r.top}px`;
      const m = Math.min(1, d / R);
      const dead = 0.15;
      if (m < dead) { this.joy.x = 0; this.joy.y = 0; return; }
      const s = (m - dead) / (1 - dead) / (m || 1);
      this.joy.x = (dx / R) * s; this.joy.y = (dy / R) * s;
      // full speed from ~70% push
      const len = Math.hypot(this.joy.x, this.joy.y);
      if (len > 0.7) { this.joy.x /= len; this.joy.y /= len; } else if (len > 0) { this.joy.x /= 0.7; this.joy.y /= 0.7; }
    };
    const end = (e) => {
      if (e.pointerId !== this.joy.id) return;
      this.resetJoy();
    };
    zone.addEventListener('pointerdown', start);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);

    this.btn = {};
    this.btn.kick = this.makeBtn('btn-kick', 'kick');
    this.btn.pass = this.makeBtn('btn-pass', 'pass');
    this.btn.power = this.makeBtn('btn-power', 'power');
    this.btn.power.classList.add('hidden');
  }

  makeBtn(cls, name) {
    const b = document.createElement('div');
    b.className = `ctl-btn ${cls}`;
    b.innerHTML = '<div class="ico"></div><div class="lbl"></div>' + (isTouch ? '' : '<div class="key"></div>');
    const down = (e) => {
      e.preventDefault();
      if (!this.enabled) return;
      this.pressed[name] = true;
      if (name === 'kick') { this.usedKick = true; if (this.hintKick) { this.hintKick.remove(); this.hintKick = null; } }
      b.classList.add('down');
    };
    const up = () => b.classList.remove('down');
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    this.root.appendChild(b);
    return b;
  }

  flash(name) {
    const b = this.btn && this.btn[name];
    if (!b) return;
    b.classList.add('down');
    setTimeout(() => b.classList.remove('down'), 120);
    if (name === 'kick' && this.hintKick) { this.hintKick.remove(); this.hintKick = null; }
  }

  setButton(name, { icon, label, key, cls, visible = true }) {
    const b = this.btn[name];
    if (!b) return;
    b.classList.toggle('hidden', !visible);
    if (!visible) return;
    const sig = `${icon}|${label}|${cls}|${key}`;
    if (b._sig === sig) return;
    b._sig = sig;
    b.querySelector('.ico').textContent = icon;
    b.querySelector('.lbl').textContent = label;
    const k = b.querySelector('.key');
    if (k) k.textContent = key || '';
    b.classList.remove('special', 'super');
    if (cls) b.classList.add(cls);
  }

  showHints({ joyText, kickText, keysHtml }) {
    this.clearHints();
    if (isTouch) {
      if (!this.usedJoystick) {
        this.hintJoy = document.createElement('div');
        this.hintJoy.className = 'joy-hint';
        this.hintJoy.innerHTML = `🕹️<br>${joyText}`;
        this.root.appendChild(this.hintJoy);
      }
      if (!this.usedKick) {
        this.hintKick = document.createElement('div');
        this.hintKick.className = 'btn-hint';
        this.hintKick.textContent = kickText;
        this.root.appendChild(this.hintKick);
      }
    } else {
      this.hintKeys = document.createElement('div');
      this.hintKeys.className = 'key-hint';
      this.hintKeys.innerHTML = keysHtml;
      this.root.appendChild(this.hintKeys);
      if (!this.usedKick) {
        this.hintKick = document.createElement('div');
        this.hintKick.className = 'btn-hint';
        this.hintKick.textContent = kickText;
        this.root.appendChild(this.hintKick);
      }
    }
  }
  clearHints() {
    for (const k of ['hintJoy', 'hintKick', 'hintKeys']) { if (this[k]) { this[k].remove(); this[k] = null; } }
  }

  resetJoy() {
    this.joy.id = null; this.joy.x = 0; this.joy.y = 0;
    if (this.base) { this.base.classList.add('hidden'); this.knob.classList.add('hidden'); }
  }

  /** Screen-space move vector: x right, y down, length 0..1 */
  move() {
    let x = this.joy.x, y = this.joy.y;
    const k = this.keys;
    let kx = 0, ky = 0;
    if (k.has('arrowleft') || k.has('a')) kx -= 1;
    if (k.has('arrowright') || k.has('d')) kx += 1;
    if (k.has('arrowup') || k.has('w')) ky -= 1;
    if (k.has('arrowdown') || k.has('s')) ky += 1;
    if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; }
    return { x, y };
  }

  take(name) {
    const v = this.pressed[name];
    this.pressed[name] = false;
    return v;
  }
  clear() { this.pressed.kick = this.pressed.pass = this.pressed.power = false; }

  setEnabled(on) {
    this.enabled = on;
    if (!on) { this.resetJoy(); this.clear(); }
  }
}
