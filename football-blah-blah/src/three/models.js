import * as THREE from 'three';

// ── Materials ───────────────────────────────────────────────────────────
let gradientMap = null;
function getGradient() {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}
const matCache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${opts.emissive || 0}|${opts.map ? opts.map.uuid : ''}|${opts.side || 0}|${opts.transparent ? opts.opacity : ''}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: getGradient(), ...opts });
  matCache.set(key, m);
  return m;
}

const SKIN = 0xf5c89a;
const SHOE = 0x22202a;

// Shared geometries (cheap to reuse across many players)
const G = {
  sphere: new THREE.SphereGeometry(1, 20, 14),
  sphereLo: new THREE.SphereGeometry(1, 12, 8),
  capsule: new THREE.CapsuleGeometry(1, 1, 4, 10),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  hairCap: new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
};

function mesh(geo, mat, sx = 1, sy = sx, sz = sx) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  return m;
}
/** Capsule spanning `len` (between sphere centres) with radius r, hanging down from origin. */
function limb(r, len, mat) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
  c.position.y = -len / 2;
  g.add(c);
  return g;
}

// ── People ──────────────────────────────────────────────────────────────
/**
 * Build a chunky cartoon footballer. Origin = between the feet, facing +Z.
 * Returns { root, inner, parts, height, isDog }.
 */
export function buildPlayer(char, kit, { goalie = false } = {}) {
  if (char.isPet) return buildDog(char, kit);
  const root = new THREE.Group();
  const inner = new THREE.Group(); // tilts/dives/jumps
  root.add(inner);

  const jersey = toon(goalie ? shade(kit.jersey, 0.78) : kit.jersey);
  const trim = toon(kit.trim);
  const shorts = toon(char.body);
  const skin = toon(SKIN);
  const hairM = toon(char.hair);
  const shoe = toon(SHOE);
  const sock = toon(goalie ? 0x222222 : kit.jersey);
  const black = toon(0x1a1420);

  // legs
  const hipY = 0.62;
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = limb(0.075, 0.42, sock);
    leg.position.set(side * 0.1, hipY, 0);
    const thigh = mesh(G.capsule, skin, 0.078, 0.08, 0.078);
    thigh.position.y = -0.14;
    leg.add(thigh);
    const boot = mesh(G.box, shoe, 0.13, 0.08, 0.22);
    boot.position.set(0, -0.56, 0.04);
    leg.add(boot);
    inner.add(leg);
    legs.push(leg);
  }
  // shorts
  const sh = mesh(G.cyl, shorts, 0.19, 0.17, 0.16);
  sh.position.y = 0.63;
  inner.add(sh);
  // torso
  const torso = mesh(G.capsule, jersey, 0.18, 0.2, 0.15);
  torso.position.y = 0.87;
  inner.add(torso);
  const band = mesh(G.cyl, trim, 0.185, 0.035, 0.155);
  band.position.y = 0.97;
  inner.add(band);
  // arms
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = limb(0.055, 0.28, jersey);
    arm.position.set(side * 0.24, 1.07, 0);
    arm.rotation.z = side * 0.12;
    const hand = mesh(G.sphereLo, goalie ? toon(0x2ecc71) : skin, goalie ? 0.09 : 0.06);
    hand.position.y = -0.36;
    arm.add(hand);
    inner.add(arm);
    arms.push(arm);
  }
  // head
  const head = new THREE.Group();
  head.position.y = 1.36;
  inner.add(head);
  const neck = mesh(G.cyl, skin, 0.06, 0.12, 0.06);
  neck.position.y = -0.17;
  head.add(neck);
  head.add(mesh(G.sphere, skin, 0.22));
  // hair
  if (char.isElder) {
    const tuftL = mesh(G.sphereLo, hairM, 0.07, 0.09, 0.09); tuftL.position.set(-0.2, 0.0, -0.02); head.add(tuftL);
    const tuftR = mesh(G.sphereLo, hairM, 0.07, 0.09, 0.09); tuftR.position.set(0.2, 0.0, -0.02); head.add(tuftR);
    const back = mesh(G.sphereLo, hairM, 0.19, 0.1, 0.12); back.position.set(0, 0.02, -0.14); head.add(back);
  } else {
    const cap = mesh(G.hairCap, hairM, 0.235, 0.24, 0.235);
    cap.position.set(0, 0.02, -0.015);
    cap.rotation.x = -0.25;
    head.add(cap);
    const fringe = mesh(G.sphereLo, hairM, 0.17, 0.06, 0.08);
    fringe.position.set(0.02, 0.13, 0.15);
    fringe.rotation.z = -0.15;
    head.add(fringe);
  }
  if (char.id === 'paati' || char.id === 'lola') {
    const bun = mesh(G.sphereLo, hairM, 0.09);
    bun.position.set(0, 0.2, -0.12);
    head.add(bun);
  }
  // face
  for (const side of [-1, 1]) {
    const eye = mesh(G.sphereLo, black, 0.032, 0.04, 0.02);
    eye.position.set(side * 0.08, 0.03, 0.205);
    head.add(eye);
    const glint = mesh(G.sphereLo, toon(0xffffff), 0.011);
    glint.position.set(side * 0.08 + 0.01, 0.045, 0.222);
    head.add(glint);
    const cheek = mesh(G.sphereLo, toon(0xff9eb5), 0.035, 0.025, 0.01);
    cheek.position.set(side * 0.13, -0.04, 0.18);
    head.add(cheek);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 6, 12, Math.PI), black);
  smile.position.set(0, -0.05, 0.205);
  smile.rotation.z = Math.PI;
  head.add(smile);
  if (char.isElder && (char.id === 'thatha' || char.id === 'lolo')) {
    for (const side of [-1, 1]) {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 14), black);
      g.position.set(side * 0.08, 0.03, 0.215);
      head.add(g);
    }
  }

  const scale = char.isAdult ? (char.isElder ? 1.12 : 1.2) : 0.92;
  root.scale.setScalar(scale);
  return {
    root, inner, isDog: false,
    parts: { legs, arms, head, torso },
    height: 1.6 * scale,
    headY: 1.36 * scale,
  };
}

function buildDog(char, kit) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  const fur = toon(char.body);
  const dark = toon(char.accent);
  const black = toon(0x1a1420);
  const vest = toon(kit.jersey);

  const body = mesh(G.capsule, fur, 0.2, 0.22, 0.2);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.45;
  inner.add(body);
  const jersey = mesh(G.cyl, vest, 0.215, 0.3, 0.215);
  jersey.rotation.x = Math.PI / 2;
  jersey.position.set(0, 0.46, 0.02);
  inner.add(jersey);
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0.32);
  inner.add(head);
  head.add(mesh(G.sphere, fur, 0.17));
  const snout = mesh(G.sphereLo, dark, 0.09, 0.07, 0.1);
  snout.position.set(0, -0.04, 0.15);
  head.add(snout);
  const nose = mesh(G.sphereLo, black, 0.035);
  nose.position.set(0, -0.01, 0.25);
  head.add(nose);
  for (const side of [-1, 1]) {
    const ear = mesh(G.sphereLo, dark, 0.05, 0.12, 0.03);
    ear.position.set(side * 0.15, -0.02, -0.02);
    ear.rotation.z = side * 0.3;
    head.add(ear);
    const eye = mesh(G.sphereLo, black, 0.028);
    eye.position.set(side * 0.07, 0.05, 0.14);
    head.add(eye);
  }
  const tongue = mesh(G.sphereLo, toon(0xff7a8a), 0.03, 0.01, 0.04);
  tongue.position.set(0, -0.1, 0.18);
  head.add(tongue);
  const legs = [];
  const legPos = [[-0.11, 0.2], [0.11, 0.2], [-0.11, -0.2], [0.11, -0.2]];
  for (const [x, z] of legPos) {
    const leg = limb(0.05, 0.2, fur);
    leg.position.set(x, 0.33, z);
    inner.add(leg);
    legs.push(leg);
  }
  const tail = limb(0.03, 0.2, fur);
  tail.position.set(0, 0.55, -0.3);
  tail.rotation.x = -2.2;
  inner.add(tail);
  return { root, inner, isDog: true, parts: { legs, arms: [], head, tail }, height: 0.95, headY: 0.72 };
}

/** Drive limb animation from a simple state object. Called every frame. */
export function animatePlayer(model, s, dt) {
  const p = model.parts;
  s.phase = (s.phase || 0) + dt * (4 + s.speed * 2.2);
  const run = Math.min(1, s.speed / 5);
  const swing = Math.sin(s.phase) * 0.9 * run;
  const inner = model.inner;
  inner.position.set(0, 0, 0);
  inner.rotation.set(0, 0, 0);

  if (model.isDog) {
    p.legs.forEach((l, i) => { l.rotation.x = Math.sin(s.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.6 : 0)) * 0.8 * run; });
    p.tail.rotation.z = Math.sin(s.phase * 2.5) * 0.6;
    inner.position.y = Math.abs(Math.sin(s.phase)) * 0.08 * run;
    if (s.kickT > 0) { inner.rotation.x = -0.4 * Math.sin((1 - s.kickT / 0.3) * Math.PI); }
    if (s.jumpY) inner.position.y += s.jumpY;
    if (s.celebrate > 0) { inner.position.y += Math.abs(Math.sin(s.celebrate * 9)) * 0.4; inner.rotation.y = s.celebrate * 8; }
    return;
  }

  const [legL, legR] = p.legs;
  const [armL, armR] = p.arms;
  legL.rotation.set(swing, 0, 0);
  legR.rotation.set(-swing, 0, 0);
  armL.rotation.set(-swing * 0.8, 0, -0.12);
  armR.rotation.set(swing * 0.8, 0, 0.12);
  inner.position.y = Math.abs(Math.cos(s.phase)) * 0.05 * run;
  inner.rotation.x = 0.12 * run;
  p.head.rotation.set(0, 0, 0);

  if (s.kickT > 0) {
    // 0.3 s kick: wind back then whip forward
    const k = 1 - s.kickT / 0.3;
    const a = k < 0.35 ? -k / 0.35 * 0.9 : -0.9 + (k - 0.35) / 0.65 * 2.4;
    legR.rotation.x = -a;
    armL.rotation.x = 0.6; armR.rotation.x = -0.6;
    inner.rotation.x = -0.1;
  }
  if (s.headerT > 0) {
    const k = 1 - s.headerT / 0.45;
    inner.position.y = Math.sin(k * Math.PI) * 0.5;
    p.head.rotation.x = k < 0.5 ? -0.5 : 0.6;
    armL.rotation.z = -0.9; armR.rotation.z = 0.9;
  }
  if (s.jumpY) inner.position.y += s.jumpY;
  if (s.flying) {
    // sit cross-legged-ish on the carpet / hang under balloons
    legL.rotation.x = -1.2; legR.rotation.x = -1.2;
    armL.rotation.set(0, 0, -2.6); armR.rotation.set(0, 0, 2.6);
    inner.rotation.x = 0;
  }
  if (s.holding) {
    armL.rotation.set(-1.3, 0, 0.25); armR.rotation.set(-1.3, 0, -0.25);
  }
  if (s.ready) { // goalie crouch, arms out
    armL.rotation.set(-0.5, 0, -0.9); armR.rotation.set(-0.5, 0, 0.9);
    inner.position.y -= 0.05;
  }
  if (s.diveT > 0) {
    const k = Math.min(1, 1 - s.diveT / 0.7);
    const lay = Math.min(1, k * 3);
    inner.rotation.z = -s.diveSide * 1.35 * lay;
    inner.position.y = Math.sin(Math.min(1, k * 2) * Math.PI) * 0.3 + 0.25 * lay;
    armL.rotation.set(0, 0, -2.9); armR.rotation.set(0, 0, 2.9);
  }
  if (s.throwT > 0) {
    const k = 1 - s.throwT / 0.4;
    armR.rotation.set(-3 + k * 3.5, 0, 0); armL.rotation.set(-3 + k * 3.5, 0, 0);
  }
  if (s.celebrate > 0) {
    inner.position.y += Math.abs(Math.sin(s.celebrate * 7)) * 0.45;
    armL.rotation.set(0, 0, -2.7 + Math.sin(s.celebrate * 14) * 0.3);
    armR.rotation.set(0, 0, 2.7 - Math.sin(s.celebrate * 14) * 0.3);
    legL.rotation.x = 0; legR.rotation.x = 0;
  }
  if (s.sad > 0) {
    p.head.rotation.x = 0.5; armL.rotation.set(0, 0, -0.05); armR.rotation.set(0, 0, 0.05);
  }
  if (s.flee > 0) {
    armL.rotation.set(-2.8, 0, -0.4); armR.rotation.set(-2.8, 0, 0.4);
  }
  if (s.dizzy > 0) {
    inner.rotation.z = Math.sin(s.dizzy * 10) * 0.25;
  }
}

function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return c.getHex();
}

// ── Ball ────────────────────────────────────────────────────────────────
export const BALL_R = 0.2;
export function buildBall() {
  const W = 256, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  // Black patches centred on the 12 icosahedron vertices.
  const phi = (1 + Math.sqrt(5)) / 2;
  const verts = [[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0], [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi], [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]]
    .map(([x, y, z]) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; });
  for (let j = 0; j < H; j++) {
    const th = (j + 0.5) / H * Math.PI;
    for (let i = 0; i < W; i++) {
      const ph = (i + 0.5) / W * Math.PI * 2;
      const x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th);
      let best = -1;
      for (const v of verts) best = Math.max(best, v[0] * x + v[1] * y + v[2] * z);
      const ang = Math.acos(Math.min(1, best));
      const k = (j * W + i) * 4;
      let c = 250;
      if (ang < 0.3) c = 30;
      else if (ang < 0.33) c = 120;
      img.data[k] = c; img.data[k + 1] = c; img.data[k + 2] = c; img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 24, 16), new THREE.MeshToonMaterial({ map: tex, gradientMap: getGradient() }));
  return m;
}

// ── Blob shadow ─────────────────────────────────────────────────────────
let shadowTex = null;
export function blobShadow(size = 1) {
  if (!shadowTex) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 2, 32, 32, 31);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    shadowTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}

export function heroRing() {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.75, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  m.renderOrder = 2;
  return m;
}

export function arrowMarker(color = 0xffd23f) {
  const g = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(0.5, 0.9, 4), toon(color, { emissive: 0x553300 }));
  cone.rotation.x = Math.PI;
  g.add(cone);
  return g;
}

// ── Aladdin bits ────────────────────────────────────────────────────────
function patternTexture(draw, w = 256, h = 256) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCarpet() {
  const tex = patternTexture((c, w, h) => {
    c.fillStyle = '#7b1fa2'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c2185b'; c.fillRect(14, 14, w - 28, h - 28);
    c.strokeStyle = '#ffd54f'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20);
    c.lineWidth = 4; c.strokeRect(30, 30, w - 60, h - 60);
    c.fillStyle = '#ffd54f';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = 60 + i * 45, y = 70 + j * 58;
      c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x + 14, y); c.lineTo(x, y + 18); c.lineTo(x - 14, y); c.closePath(); c.fill();
    }
  });
  const geo = new THREE.PlaneGeometry(1.9, 1.2, 16, 6);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: getGradient(), side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  const group = new THREE.Group();
  group.add(m);
  const gold = toon(0xffd54f);
  for (const x of [-0.95, 0.95]) for (const z of [-0.6, 0.6]) {
    const tassel = mesh(G.cyl, gold, 0.03, 0.18, 0.03);
    tassel.position.set(x, -0.08, z);
    group.add(tassel);
  }
  const base = geo.attributes.position.array.slice();
  group.userData.wave = (time) => {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = base[i + 1] + Math.sin(base[i] * 3.2 + time * 7) * 0.06 + Math.sin(base[i + 2] * 4 + time * 5) * 0.03;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return group;
}

export function buildLamp() {
  const g = new THREE.Group();
  const gold = toon(0xffc94a, { emissive: 0x6b4a00 });
  const pts = [[0, 0], [0.18, 0.02], [0.22, 0.08], [0.3, 0.14], [0.28, 0.22], [0.12, 0.28], [0.08, 0.36], [0.1, 0.4], [0, 0.44]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), gold);
  g.add(body);
  const spout = mesh(new THREE.ConeGeometry(0.06, 0.45, 10), gold);
  spout.rotation.z = -1.1;
  spout.position.set(0.42, 0.24, 0);
  g.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI * 1.4), gold);
  handle.position.set(-0.3, 0.2, 0);
  handle.rotation.z = Math.PI * 0.35;
  g.add(handle);
  g.scale.setScalar(1.5);
  return g;
}

export function buildTopHat() {
  const g = new THREE.Group();
  const black = toon(0x1c1830);
  const red = toon(0xe53935, { emissive: 0x400000 });
  const brim = mesh(G.cyl, black, 0.42, 0.04, 0.42);
  g.add(brim);
  const crown = mesh(G.cyl, black, 0.27, 0.5, 0.27);
  crown.position.y = 0.27;
  g.add(crown);
  const band = mesh(G.cyl, red, 0.275, 0.1, 0.275);
  band.position.y = 0.08;
  g.add(band);
  const star = mesh(new THREE.OctahedronGeometry(0.1), toon(0xffd54f, { emissive: 0x806000 }));
  star.position.set(0, 0.62, 0);
  g.add(star);
  g.scale.setScalar(1.4);
  return g;
}

export function lightBeam(color = 0xfff2a0) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.8, 12, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.position.y = 6;
  return m;
}

export function buildGenie() {
  const g = new THREE.Group();
  const blue = toon(0x4aa3ff);
  const gold = toon(0xffc94a, { emissive: 0x403000 });
  const black = toon(0x101018);
  // smoky tail
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(0.05 + Math.sin(t * Math.PI * 0.5) * 0.55, t * 1.6));
  }
  const tail = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), blue);
  g.add(tail);
  const chest = mesh(G.sphere, blue, 0.75, 0.62, 0.55);
  chest.position.y = 2.0;
  g.add(chest);
  const belt = mesh(G.cyl, toon(0xd32f2f), 0.6, 0.15, 0.48);
  belt.position.y = 1.55;
  g.add(belt);
  const head = new THREE.Group();
  head.position.y = 2.85;
  g.add(head);
  head.add(mesh(G.sphere, blue, 0.38, 0.42, 0.38));
  const topknot = mesh(new THREE.ConeGeometry(0.12, 0.6, 10), black);
  topknot.position.y = 0.6;
  head.add(topknot);
  const knot = mesh(G.sphereLo, gold, 0.08);
  knot.position.y = 0.35;
  head.add(knot);
  for (const side of [-1, 1]) {
    const eye = mesh(G.sphereLo, toon(0xffffff), 0.08, 0.1, 0.05);
    eye.position.set(side * 0.13, 0.08, 0.32);
    head.add(eye);
    const pupil = mesh(G.sphereLo, black, 0.04);
    pupil.position.set(side * 0.13, 0.08, 0.37);
    head.add(pupil);
    const ear = mesh(G.sphereLo, blue, 0.07, 0.12, 0.05);
    ear.position.set(side * 0.38, 0.05, 0);
    head.add(ear);
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12), gold);
    earring.position.set(side * 0.4, -0.12, 0);
    head.add(earring);
    // arms
    const arm = limb(0.13, 0.7, blue);
    arm.position.set(side * 0.7, 2.3, 0);
    arm.rotation.z = side * 0.6;
    arm.rotation.x = -0.8;
    const cuff = mesh(G.cyl, gold, 0.15, 0.12, 0.15);
    cuff.position.y = -0.75;
    arm.add(cuff);
    const hand = mesh(G.sphereLo, blue, 0.18);
    hand.position.y = -0.95;
    arm.add(hand);
    g.add(arm);
  }
  const grin = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 14, Math.PI), black);
  grin.position.set(0, -0.12, 0.33);
  grin.rotation.z = Math.PI;
  head.add(grin);
  const beard = mesh(new THREE.ConeGeometry(0.06, 0.25, 8), black);
  beard.position.set(0, -0.4, 0.22);
  beard.rotation.x = Math.PI;
  head.add(beard);
  return g;
}

export function buildGenieHand() {
  const g = new THREE.Group();
  const blue = toon(0x4aa3ff);
  const palm = mesh(G.sphere, blue, 0.55, 0.7, 0.25);
  g.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = mesh(G.capsule, blue, 0.11, 0.25, 0.11);
    f.position.set(-0.36 + i * 0.24, 0.85, 0);
    g.add(f);
  }
  const thumb = mesh(G.capsule, blue, 0.12, 0.2, 0.12);
  thumb.position.set(0.62, 0.15, 0);
  thumb.rotation.z = -0.9;
  g.add(thumb);
  const cuff = mesh(G.cyl, toon(0xffc94a), 0.4, 0.2, 0.3);
  cuff.position.y = -0.75;
  g.add(cuff);
  return g;
}

function stripeTexture(c1, c2, n = 8, vertical = true) {
  return patternTexture((c, w, h) => {
    for (let i = 0; i < n; i++) {
      c.fillStyle = i % 2 ? c2 : c1;
      if (vertical) c.fillRect((i / n) * w, 0, w / n + 1, h);
      else c.fillRect(0, (i / n) * h, w, h / n + 1);
    }
  }, 128, 128);
}

export function buildTiger() {
  const g = new THREE.Group();
  const stripes = patternTexture((c, w, h) => {
    c.fillStyle = '#f08a24'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1a1010';
    for (let i = 0; i < 9; i++) {
      const y = 20 + i * 26;
      c.beginPath();
      for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x * 0.08 + i) * 6);
      for (let x = w; x >= 0; x -= 8) c.lineTo(x, y + 9 + Math.sin(x * 0.08 + i) * 6);
      c.fill();
    }
  });
  const orange = new THREE.MeshToonMaterial({ map: stripes, gradientMap: getGradient() });
  const plainOrange = toon(0xf08a24);
  const white = toon(0xfff5e6);
  const black = toon(0x1a1010);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.2, 6, 14), orange);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.95;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(0, 1.35, 1.05);
  g.add(head);
  head.add(mesh(G.sphere, plainOrange, 0.42, 0.38, 0.38));
  const muzzle = mesh(G.sphere, white, 0.24, 0.17, 0.2);
  muzzle.position.set(0, -0.1, 0.28);
  head.add(muzzle);
  const nose = mesh(G.sphereLo, toon(0xd06070), 0.07, 0.05, 0.05);
  nose.position.set(0, -0.02, 0.47);
  head.add(nose);
  for (const side of [-1, 1]) {
    const ear = mesh(G.sphereLo, plainOrange, 0.12, 0.13, 0.06);
    ear.position.set(side * 0.3, 0.3, 0);
    head.add(ear);
    const eye = mesh(G.sphereLo, toon(0x2e7d32), 0.06, 0.07, 0.04);
    eye.position.set(side * 0.16, 0.1, 0.32);
    head.add(eye);
    const pupil = mesh(G.sphereLo, black, 0.03, 0.05, 0.02);
    pupil.position.set(side * 0.16, 0.1, 0.355);
    head.add(pupil);
  }
  const legs = [];
  for (const [x, z] of [[-0.25, 0.6], [0.25, 0.6], [-0.25, -0.6], [0.25, -0.6]]) {
    const leg = limb(0.13, 0.55, plainOrange);
    leg.position.set(x, 0.8, z);
    const paw = mesh(G.sphereLo, white, 0.15, 0.1, 0.18);
    paw.position.y = -0.68;
    leg.add(paw);
    g.add(leg);
    legs.push(leg);
  }
  const tail = limb(0.06, 0.9, plainOrange);
  tail.position.set(0, 1.1, -0.95);
  tail.rotation.x = -2.3;
  g.add(tail);
  g.userData = { legs, tail, head };
  return g;
}

export function buildElephant() {
  const g = new THREE.Group();
  const grey = toon(0x9aa3ad);
  const pink = toon(0xf4a6b8);
  const black = toon(0x1a1420);
  const body = mesh(G.sphere, grey, 0.95, 0.85, 1.3);
  body.position.y = 1.6;
  g.add(body);
  const blanket = mesh(G.box, toon(0xd32f2f), 1.5, 0.12, 1.3);
  blanket.position.set(0, 2.42, 0);
  g.add(blanket);
  const trim = mesh(G.box, toon(0xffc94a, { emissive: 0x403000 }), 1.55, 0.06, 1.35);
  trim.position.set(0, 2.36, 0);
  g.add(trim);
  const head = new THREE.Group();
  head.position.set(0, 2.1, 1.25);
  g.add(head);
  head.add(mesh(G.sphere, grey, 0.62, 0.6, 0.55));
  for (const side of [-1, 1]) {
    const ear = mesh(G.sphere, grey, 0.08, 0.55, 0.45);
    ear.position.set(side * 0.62, 0.05, -0.15);
    ear.rotation.y = side * 0.4;
    head.add(ear);
    const inside = mesh(G.sphere, pink, 0.05, 0.42, 0.33);
    inside.position.set(side * 0.66, 0.05, -0.1);
    inside.rotation.y = side * 0.4;
    head.add(inside);
    const eye = mesh(G.sphereLo, black, 0.06);
    eye.position.set(side * 0.25, 0.15, 0.48);
    head.add(eye);
    const tusk = mesh(new THREE.ConeGeometry(0.06, 0.4, 8), toon(0xfffbe8));
    tusk.position.set(side * 0.2, -0.32, 0.4);
    tusk.rotation.x = 2.2;
    head.add(tusk);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.1, 0.45), new THREE.Vector3(0, -0.6, 0.7), new THREE.Vector3(0, -1.1, 0.75), new THREE.Vector3(0, -1.35, 0.95),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.13, 10, false), grey);
  head.add(trunk);
  const hat = mesh(new THREE.ConeGeometry(0.2, 0.45, 12), toon(0x7b1fa2));
  hat.position.set(0, 0.7, 0);
  head.add(hat);
  const pom = mesh(G.sphereLo, toon(0xffc94a), 0.08);
  pom.position.set(0, 0.95, 0);
  head.add(pom);
  const legs = [];
  for (const [x, z] of [[-0.5, 0.75], [0.5, 0.75], [-0.5, -0.75], [0.5, -0.75]]) {
    const leg = limb(0.28, 0.8, grey);
    leg.position.set(x, 1.25, z);
    g.add(leg);
    legs.push(leg);
  }
  const tail = limb(0.05, 0.6, grey);
  tail.position.set(0, 1.9, -1.25);
  tail.rotation.x = -0.4;
  g.add(tail);
  g.userData = { legs, tail, head };
  return g;
}

export function buildCannon() {
  const g = new THREE.Group();
  const tex = stripeTexture('#e53935', '#ffd54f', 10, false);
  const barrelMat = new THREE.MeshToonMaterial({ map: tex, gradientMap: getGradient() });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.4, 18), barrelMat);
  barrel.position.set(0, 1.2, 0);
  barrel.rotation.x = 0.8;
  g.add(barrel);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.08, 8, 18), toon(0xffd54f));
  rim.position.set(0, 1.2 + Math.cos(0.8) * 1.2, Math.sin(0.8) * 1.2);
  rim.rotation.x = 0.8 + Math.PI / 2;
  g.add(rim);
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 18), toon(0x5d3a1a));
    wheel.position.set(side * 0.65, 0.55, -0.2);
    wheel.rotation.y = Math.PI / 2;
    g.add(wheel);
    const hub = mesh(G.cyl, toon(0xffd54f), 0.12, 0.2, 0.12);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(side * 0.65, 0.55, -0.2);
    g.add(hub);
  }
  return g;
}

export function buildBalloons() {
  const g = new THREE.Group();
  const colors = [0xff5a5f, 0xffc94a, 0x4a90e2, 0x4caf50, 0xff7eb3, 0x8b5fbf];
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  colors.forEach((col, i) => {
    const a = (i / colors.length) * Math.PI * 2;
    const x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45, y = 1.5 + (i % 2) * 0.3;
    const b = mesh(G.sphere, toon(col), 0.32, 0.38, 0.32);
    b.position.set(x, y, z);
    g.add(b);
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y - 0.36, z)]);
    g.add(new THREE.Line(geo, lineMat));
  });
  return g;
}

export function buildCircusNet() {
  const g = new THREE.Group();
  const tex = patternTexture((c, w, h) => {
    c.clearRect(0, 0, w, h);
    const cols = ['#ff5a5f', '#ffc94a', '#4caf50', '#4a90e2', '#8b5fbf'];
    c.lineWidth = 6;
    for (let i = 0; i <= 8; i++) {
      c.strokeStyle = cols[i % cols.length];
      c.beginPath(); c.moveTo(i * w / 8, 0); c.lineTo(i * w / 8, h); c.stroke();
      c.beginPath(); c.moveTo(0, i * h / 8); c.lineTo(w, i * h / 8); c.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1.2);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.3), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 }));
  net.position.y = 1.15;
  net.rotation.y = Math.PI / 2;
  g.add(net);
  for (const z of [-2.75, 2.75]) {
    const pole = mesh(G.cyl, toon(0xe53935), 0.08, 2.8, 0.08);
    pole.position.set(0, 1.4, z);
    g.add(pole);
    const star = mesh(new THREE.OctahedronGeometry(0.18), toon(0xffd54f, { emissive: 0x806000 }));
    star.position.set(0, 2.9, z);
    g.add(star);
  }
  return g;
}

// ── Trophy + podium ─────────────────────────────────────────────────────
export const TROPHY_COLORS = { 1: 0xffc94a, 2: 0xd9dde3, 3: 0xd08a4a };
export function buildTrophy(place = 1) {
  const g = new THREE.Group();
  const metal = toon(TROPHY_COLORS[place], { emissive: new THREE.Color(TROPHY_COLORS[place]).multiplyScalar(0.25) });
  const dark = toon(0x3a1f5e);
  const base = mesh(G.box, dark, 0.5, 0.18, 0.5);
  base.position.y = 0.09;
  g.add(base);
  const stem = mesh(G.cyl, metal, 0.06, 0.3, 0.06);
  stem.position.y = 0.33;
  g.add(stem);
  const pts = [[0.04, 0], [0.2, 0.05], [0.3, 0.2], [0.34, 0.45], [0.35, 0.55]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), metal);
  cup.position.y = 0.45;
  cup.material.side = THREE.DoubleSide;
  g.add(cup);
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 14, Math.PI), metal);
    h.position.set(side * 0.36, 0.75, 0);
    h.rotation.z = side * -Math.PI / 2;
    g.add(h);
  }
  return g;
}

export function buildPodium() {
  const g = new THREE.Group();
  const spec = [
    { place: 1, x: 0, h: 1.2, color: 0xffc94a },
    { place: 2, x: -3.4, h: 0.8, color: 0xd9dde3 },
    { place: 3, x: 3.4, h: 0.5, color: 0xd08a4a },
  ];
  for (const s of spec) {
    const tex = patternTexture((c, w, h) => {
      c.fillStyle = '#' + s.color.toString(16).padStart(6, '0'); c.fillRect(0, 0, w, h);
      c.fillStyle = '#3a1f5e'; c.font = 'bold 150px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(s.place), w / 2, h / 2 + 10);
    });
    const mats = [toon(s.color), toon(s.color), toon(s.color), toon(s.color), new THREE.MeshToonMaterial({ map: tex, gradientMap: getGradient() }), toon(s.color)];
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.3, s.h, 2.2), mats);
    b.position.set(s.x, s.h / 2, 0);
    g.add(b);
  }
  g.userData.spec = spec;
  return g;
}

// ── Portraits for menus ─────────────────────────────────────────────────
/** Render a little head-and-shoulders picture of each character to a data URL. */
export function renderPortraits(chars) {
  const out = {};
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch {
    return out;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(144, 144, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 2.2));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6);
  dl.position.set(2, 3, 4);
  scene.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  for (const c of chars) {
    // Each friend wears their own Archery Maya colours in the picture.
    const model = buildPlayer(c, { jersey: c.body, trim: c.accent });
    scene.add(model.root);
    model.root.rotation.y = 0.35;
    const h = model.isDog ? 0.7 : model.headY - 0.08;
    const dist = model.isDog ? 1.9 : 1.9 * (model.root.scale.x);
    cam.position.set(0.35, h + 0.15, dist);
    cam.lookAt(0, h - 0.05, 0);
    renderer.setClearColor(0x9bdcf2, 1);
    renderer.render(scene, cam);
    out[c.id] = renderer.domElement.toDataURL('image/png');
    scene.remove(model.root);
  }
  renderer.dispose();
  try { renderer.forceContextLoss(); } catch { /* ignore */ }
  return out;
}
